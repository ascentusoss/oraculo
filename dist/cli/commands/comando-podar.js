import { removerArquivosOrfaos } from '../../analistas/corrections/poda.js';
import { exportarRelatoriosPoda } from '../handlers/poda-exporter.js';
import { ExitCode, sair } from '../helpers/exit-codes.js';
import { expandIncludePatterns, processPatternList, } from '../helpers/pattern-helpers.js';
import chalk from '../../core/config/chalk-safe.js';
import { config } from '../../core/config/config.js';
import { iniciarInquisicao } from '../../core/execution/inquisidor.js';
import { CliComandoPodarMessages } from '../../core/messages/cli/cli-comando-podar-messages.js';
import { ICONES_DIAGNOSTICO, log, logSistema } from '../../core/messages/index.js';
import { Command } from 'commander';
export function comandoPodar(aplicarFlagsGlobais) {
    return new Command('podar')
        .description('Remove arquivos órfãos e lixo do repositório.')
        .option('-f, --force', 'Remove arquivos sem confirmação (CUIDADO!)', false)
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
        }
        catch (err) {
            log.erro(`Falha ao aplicar flags: ${err instanceof Error ? err.message : String(err)}`);
            sair(ExitCode.Failure);
            return;
        }
        log.info(chalk.bold(CliComandoPodarMessages.inicio));
        const baseDir = process.cwd();
        try {
            const includeListRaw = processPatternList(opts.include);
            const includeList = includeListRaw.length
                ? expandIncludePatterns(includeListRaw)
                : [];
            const excludeList = processPatternList(opts.exclude);
            if (includeList.length)
                config.CLI_INCLUDE_PATTERNS = includeList;
            if (excludeList.length)
                config.CLI_EXCLUDE_PATTERNS = excludeList;
            const { fileEntries } = await iniciarInquisicao(baseDir, {
                incluirMetadados: false,
            });
            const resultadoPoda = await removerArquivosOrfaos(fileEntries);
            if (resultadoPoda.arquivosOrfaos.length === 0) {
                log.sucesso(CliComandoPodarMessages.nenhumaSujeira(ICONES_DIAGNOSTICO.sucesso));
                await exportarRelatoriosPoda({
                    baseDir,
                    podados: [],
                    pendentes: [],
                    simulado: !opts.force,
                });
                return;
            }
            log.aviso(CliComandoPodarMessages.orfaosDetectados(resultadoPoda.arquivosOrfaos.length));
            resultadoPoda.arquivosOrfaos.forEach((file) => {
                log.info(CliComandoPodarMessages.linhaArquivoOrfao(file.arquivo));
            });
            if (!opts.force) {
                const readline = await import('node:readline/promises');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                const answer = await rl.question(chalk.yellow(CliComandoPodarMessages.confirmarRemocao));
                rl.close();
                if (answer.toLowerCase() !== 's') {
                    logSistema.podaCancelada();
                    return;
                }
            }
            if (opts.force) {
                await removerArquivosOrfaos(fileEntries);
                logSistema.podaConcluida();
                const podados = resultadoPoda.arquivosOrfaos.map((f) => ({
                    arquivo: f.arquivo,
                    motivo: f.referenciado ? 'inativo' : 'órfão',
                    detectedAt: Date.now(),
                    scheduleAt: Date.now(),
                }));
                await exportarRelatoriosPoda({
                    baseDir,
                    podados,
                    pendentes: [],
                    simulado: false,
                });
            }
        }
        catch (error) {
            const errMsg = typeof error === 'object' && error && 'message' in error
                ? error.message
                : String(error);
            log.erro(CliComandoPodarMessages.erroDurantePoda(errMsg));
            if (config.DEV_MODE)
                console.error(error);
            sair(ExitCode.Failure);
            return;
        }
    });
}
//# sourceMappingURL=comando-podar.js.map