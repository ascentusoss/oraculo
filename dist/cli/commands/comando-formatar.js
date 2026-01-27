import path from 'node:path';
import { ExitCode, sair } from '../helpers/exit-codes.js';
import { processPatternList } from '../helpers/pattern-helpers.js';
import { configurarFiltros } from '../processing/filters.js';
import chalk from '../../core/config/chalk-safe.js';
import { config } from '../../core/config/config.js';
import { scanRepository } from '../../core/execution/scanner.js';
import { log } from '../../core/messages/index.js';
import { formatarComPrettierProjeto, formatarPrettierMinimo, } from '../../shared/impar/formater.js';
import { salvarEstado } from '../../shared/persistence/persistencia.js';
import { Command } from 'commander';
import micromatch from 'micromatch';
function isFormatavel(relPath) {
    return /\.(json|md|markdown|ya?ml|ts|tsx|js|jsx|mjs|cjs|html?|css|py|xml|php)$/i.test(relPath);
}
function detectaNodeModulesExplicito(includeGroups, includeFlat) {
    const all = [...includeFlat, ...includeGroups.flat()];
    return all.some((p) => /(^|\/)node_modules(\/|$)/.test(String(p || '')));
}
export function comandoFormatar(aplicarFlagsGlobais) {
    return new Command('formatar')
        .description('Aplica a formatação interna estilo Oráculo (whitespace, seções, finais de linha)')
        .option('--check', 'Apenas verifica se arquivos precisariam de formatação (default)', true)
        .option('--write', 'Aplica as mudanças no filesystem', false)
        .option('--engine <engine>', 'Motor de formatação: auto|interno|prettier (auto tenta usar Prettier do projeto e cai no interno)', 'auto')
        .option('--include <padrao>', 'Glob pattern a INCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)', (val, prev) => {
        prev.push(val);
        return prev;
    }, [])
        .option('--exclude <padrao>', 'Glob pattern a EXCLUIR adicionalmente (pode repetir a flag ou usar vírgulas / espaços)', (val, prev) => {
        prev.push(val);
        return prev;
    }, [])
        .action(async function (opts) {
        try {
            await aplicarFlagsGlobais(this.parent && typeof this.parent.opts === 'function'
                ? this.parent.opts()
                : {});
            const write = Boolean(opts.write);
            const check = write ? false : Boolean(opts.check ?? true);
            const engineRaw = String(opts.engine || process.env.ORACULO_FORMAT_ENGINE || 'auto').trim();
            const engine = engineRaw === 'interno' ||
                engineRaw === 'prettier' ||
                engineRaw === 'auto'
                ? engineRaw
                : 'auto';
            const includeList = processPatternList(opts.include);
            const excludeList = processPatternList(opts.exclude);
            const includeGroupsRaw = [];
            const incluiNodeModules = detectaNodeModulesExplicito(includeGroupsRaw, includeList);
            configurarFiltros(includeGroupsRaw, includeList, excludeList, incluiNodeModules);
            const baseDir = process.cwd();
            const result = {
                total: 0,
                formataveis: 0,
                mudaram: 0,
                erros: 0,
                arquivosMudaram: [],
            };
            log.info(chalk.bold('🧽 FORMATAR'));
            if (config.SCAN_ONLY) {
                log.aviso('SCAN_ONLY ativo; o comando formatar precisa ler conteúdo.');
            }
            const fileMap = await scanRepository(baseDir, {
                includeContent: true,
                filter: (relPath) => {
                    return isFormatavel(relPath);
                },
            });
            const entries = Object.values(fileMap);
            result.total = entries.length;
            for (const e of entries) {
                const relPath = e.relPath;
                if (excludeList.length && micromatch.isMatch(relPath, excludeList)) {
                    continue;
                }
                if (includeList.length) {
                    const matchGlob = micromatch.isMatch(relPath, includeList);
                    const matchExact = includeList.some((p) => String(p).trim() === relPath);
                    if (!matchGlob && !matchExact)
                        continue;
                }
                const src = typeof e.content === 'string' ? e.content : '';
                const res = engine === 'interno'
                    ? formatarPrettierMinimo({ code: src, relPath })
                    : engine === 'prettier'
                        ? await formatarComPrettierProjeto({
                            code: src,
                            relPath,
                            baseDir,
                        })
                        : (() => {
                            return formatarComPrettierProjeto({
                                code: src,
                                relPath,
                                baseDir,
                            });
                        })();
                const resolved = engine === 'auto'
                    ? await (async () => {
                        const r = await res;
                        if (!r.ok)
                            return r;
                        if (r.parser !== 'unknown')
                            return r;
                        return formatarPrettierMinimo({ code: src, relPath });
                    })()
                    : await Promise.resolve(res);
                if (!resolved.ok) {
                    result.erros++;
                    log.erro(`Falha ao formatar ${relPath}: ${resolved.error}`);
                    continue;
                }
                if (resolved.parser === 'unknown') {
                    continue;
                }
                result.formataveis++;
                if (!resolved.changed) {
                    continue;
                }
                result.mudaram++;
                result.arquivosMudaram.push(relPath);
                if (write) {
                    const abs = path.resolve(baseDir, relPath);
                    await salvarEstado(abs, resolved.formatted);
                }
            }
            if (result.erros > 0) {
                log.erro(`Erros: ${result.erros}`);
                sair(ExitCode.Failure);
                return;
            }
            if (check) {
                if (result.mudaram > 0) {
                    log.aviso(`Encontrados ${result.mudaram} arquivo(s) que precisam de formatação. Use --write para aplicar.`);
                    sair(ExitCode.Failure);
                    return;
                }
                log.sucesso('Tudo formatado.');
                sair(ExitCode.Ok);
                return;
            }
            if (result.mudaram > 0) {
                log.sucesso(`Formatados ${result.mudaram} arquivo(s).`);
            }
            else {
                log.info('Nenhuma mudança necessária.');
            }
            sair(ExitCode.Ok);
        }
        catch (err) {
            log.erro(`Falha ao formatar: ${err instanceof Error ? err.message : String(err)}`);
            sair(ExitCode.Failure);
        }
    });
}
//# sourceMappingURL=comando-formatar.js.map