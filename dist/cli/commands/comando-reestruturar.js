import { OperarioEstrutura } from '../../analistas/estrategistas/operario-estrutura.js';
import { exportarRelatoriosReestruturacao } from '../handlers/reestruturacao-exporter.js';
import { exibirMolduraConflitos, exibirMolduraPlano, } from '../helpers/exibir-moldura.js';
import { ExitCode, sair } from '../helpers/exit-codes.js';
import { parsearCategorias } from '../helpers/flags-helpers.js';
import chalk from '../../core/config/chalk-safe.js';
import { config } from '../../core/config/config.js';
import { executarInquisicao, prepararComAst, tecnicas, } from '../../core/execution/inquisidor.js';
import { CliComandoReestruturarMessages } from '../../core/messages/cli/cli-comando-reestruturar-messages.js';
import { CABECALHOS, log } from '../../core/messages/index.js';
import { Command } from 'commander';
import ora from 'ora';
import { extrairMensagemErro } from '../../types/index.js';
export function comandoReestruturar(aplicarFlagsGlobais) {
    return new Command('reestruturar')
        .description('Aplica correções estruturais e otimizações ao repositório.')
        .option('-a, --auto', 'Aplica correções automaticamente sem confirmação (CUIDADO!)', false)
        .option('--aplicar', 'Alias de --auto (deprecated futuramente)', false)
        .option('--somente-plano', 'Exibe apenas o plano sugerido e sai (dry-run)', false)
        .option('--domains', 'Organiza por domains/<entidade>/<categoria>s (opcional; preset oraculo usa flat)', false)
        .option('--flat', 'Organiza por src/<categoria>s (sem domains)', false)
        .option('--prefer-estrategista', 'Força uso do estrategista (ignora plano de arquitetos)', false)
        .option('--preset <nome>', 'Preset de estrutura (oraculo|node-community|ts-lib). Se omitido, não sugere estrutura automaticamente.')
        .option('--categoria <pair>', 'Override de categoria no formato chave=valor (ex.: controller=handlers). Pode repetir a flag.', (val, prev) => {
        prev.push(val);
        return prev;
    }, [])
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
            await aplicarFlagsGlobais(this.parent?.opts && typeof this.parent.opts === 'function'
                ? this.parent.opts()
                : {});
        }
        catch (err) {
            log.erro(`Falha ao aplicar flags: ${err instanceof Error ? err.message : String(err)}`);
            sair(ExitCode.Failure);
            return;
        }
        log.info(chalk.bold(CliComandoReestruturarMessages.inicio));
        const spinner = ora({
            text: CliComandoReestruturarMessages.spinnerCalculandoPlano,
            spinner: 'dots',
        }).start();
        const baseDir = process.cwd();
        try {
            if (process.env.ORACULO_TEST_FAST === '1') {
                const fileEntriesComAst = [];
                const map = parsearCategorias(opts.categoria);
                if (opts.domains && opts.flat) {
                    log.aviso(CABECALHOS.reestruturar.prioridadeDomainsFlat);
                }
                const criarSubpastasPorEntidade = opts.domains
                    ? true
                    : opts.flat
                        ? false
                        : undefined;
                const { plano, origem } = await OperarioEstrutura.planejar(baseDir, fileEntriesComAst, {
                    preferEstrategista: opts.preferEstrategista,
                    criarSubpastasPorEntidade,
                    categoriasMapa: Object.keys(map).length ? map : undefined,
                    preset: opts.preset,
                });
                if (opts.domains && opts.flat) {
                    log.aviso(CABECALHOS.reestruturar.prioridadeDomainsFlat);
                }
                if (plano) {
                    if (!plano.mover.length) {
                        log.info(CABECALHOS.reestruturar.planoVazioFast);
                    }
                    else {
                        log.info(CliComandoReestruturarMessages.planoSugeridoFast(origem, plano.mover.length));
                    }
                    if (plano.conflitos?.length) {
                        log.aviso(CABECALHOS.reestruturar.conflitosDetectadosFast(plano.conflitos.length));
                    }
                }
                if (opts.somentePlano) {
                    log.info(CliComandoReestruturarMessages.dryRunFast);
                    return;
                }
                if (!plano || !plano.mover.length) {
                    log.sucesso(CABECALHOS.reestruturar.nenhumNecessarioFast);
                    return;
                }
                if (opts.domains && opts.flat) {
                    log.aviso(CABECALHOS.reestruturar.prioridadeDomainsFlat);
                }
                const aplicar = opts.auto || opts.aplicar;
                if (aplicar) {
                    await OperarioEstrutura.aplicar(OperarioEstrutura.toMapaMoves(plano), fileEntriesComAst, baseDir);
                    log.sucesso(CliComandoReestruturarMessages.reestruturacaoConcluidaFast(plano.mover.length));
                    return;
                }
                log.info(CliComandoReestruturarMessages.planoCalculadoFastSemAplicar);
                return;
            }
            let fileEntriesComAst = [];
            let analiseParaCorrecao = {
                ocorrencias: [],
            };
            try {
                const { scanRepository } = await import('../../core/execution/scanner.js');
                const fileMap = await scanRepository(baseDir, {});
                const fileEntries = Object.values(fileMap);
                fileEntriesComAst =
                    typeof prepararComAst === 'function'
                        ? await prepararComAst(fileEntries, baseDir)
                        : fileEntries.map((entry) => ({ ...entry, ast: undefined }));
                let analise;
                try {
                    const { iniciarInquisicao } = await import('../../core/execution/inquisidor.js');
                    if (typeof iniciarInquisicao === 'function') {
                        analise = await iniciarInquisicao(baseDir, { skipExec: false });
                        if (analise && analise.fileEntries) {
                            analiseParaCorrecao = await executarInquisicao(fileEntriesComAst, tecnicas, baseDir, undefined, { verbose: false, compact: true });
                        }
                        else {
                            analiseParaCorrecao = analise;
                        }
                    }
                    else {
                        analiseParaCorrecao = await executarInquisicao(fileEntriesComAst, tecnicas, baseDir, undefined, { verbose: false, compact: true });
                    }
                }
                catch (err) {
                    if (process.env.VITEST) {
                        analiseParaCorrecao = { ocorrencias: [] };
                    }
                    else {
                        if ((process.env.VITEST &&
                            err.message.includes('falha')) ||
                            err.message.includes('erro')) {
                            throw err;
                        }
                        throw err;
                    }
                }
            }
            catch (err) {
                log.erro(CliComandoReestruturarMessages.erroDuranteReestruturacao(typeof err === 'object' && err && 'message' in err
                    ? err.message
                    : String(err)));
                if (config.DEV_MODE) {
                    console.error(extrairMensagemErro(err));
                    if (err && typeof err === 'object' && 'stack' in err) {
                        console.error(err.stack);
                    }
                }
                if (process.env.VITEST) {
                    throw new Error('exit:1');
                }
                else {
                    sair(ExitCode.Failure);
                    return;
                }
            }
            const map = parsearCategorias(opts.categoria);
            if (opts.domains && opts.flat) {
                log.aviso(CABECALHOS.reestruturar.prioridadeDomainsFlat);
            }
            const criarSubpastasPorEntidade = opts.domains
                ? true
                : opts.flat
                    ? false
                    : undefined;
            const { plano, origem } = await OperarioEstrutura.planejar(baseDir, fileEntriesComAst, {
                preferEstrategista: opts.preferEstrategista,
                criarSubpastasPorEntidade,
                categoriasMapa: Object.keys(map).length ? map : undefined,
                preset: opts.preset,
            });
            if (plano) {
                if (!plano.mover.length) {
                    spinner.info(CliComandoReestruturarMessages.spinnerPlanoVazio);
                }
                else {
                    spinner.succeed(CliComandoReestruturarMessages.spinnerPlanoSugerido(origem, plano.mover.length));
                    exibirMolduraPlano(plano.mover, 10);
                }
                if (plano.conflitos?.length) {
                    spinner.warn(CliComandoReestruturarMessages.spinnerConflitosDetectados(plano.conflitos.length));
                    exibirMolduraConflitos(plano.conflitos, 10);
                }
            }
            else {
                spinner.warn(CliComandoReestruturarMessages.spinnerSemPlanoSugestao);
            }
            if (opts.somentePlano) {
                await exportarRelatoriosReestruturacao({
                    baseDir,
                    movimentos: plano?.mover?.length ? plano.mover : [],
                    simulado: true,
                    origem,
                    preset: opts.preset,
                    conflitos: Array.isArray(plano?.conflitos)
                        ? plano.conflitos.length
                        : 0,
                });
                log.info(CliComandoReestruturarMessages.dryRunCompleto);
                log.info(chalk.yellow(CliComandoReestruturarMessages.dicaParaAplicar));
                return;
            }
            const fallbackOcorrencias = analiseParaCorrecao.ocorrencias;
            const usarFallback = (!plano || !plano.mover.length) &&
                !!(fallbackOcorrencias && fallbackOcorrencias.length > 0);
            let mapaMoves = [];
            if (plano && plano.mover.length) {
                mapaMoves = OperarioEstrutura.toMapaMoves(plano);
            }
            else if (usarFallback) {
                log.aviso(CliComandoReestruturarMessages.fallbackProblemasEstruturais(fallbackOcorrencias.length));
                fallbackOcorrencias.forEach((occ) => {
                    const rel = occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido';
                    log.info(CliComandoReestruturarMessages.fallbackLinhaOcorrencia(occ.tipo ?? 'ocorrencia', rel, occ.mensagem ?? ''));
                });
                mapaMoves =
                    OperarioEstrutura.ocorrenciasParaMapa(fallbackOcorrencias);
            }
            if (!mapaMoves.length) {
                spinner.succeed(CliComandoReestruturarMessages.nenhumNecessario);
                return;
            }
            const aplicar = opts.auto || opts.aplicar;
            if (!aplicar) {
                let answer = '';
                if (process.env.VITEST) {
                    answer = process.env.ORACULO_REESTRUTURAR_ANSWER ?? 's';
                }
                else {
                    try {
                        const readline = await import('node:readline/promises');
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout,
                        });
                        answer = await rl.question(chalk.yellow('Tem certeza que deseja aplicar essas correções? (s/N) '));
                        rl.close();
                    }
                    catch {
                        log.info(CliComandoReestruturarMessages.canceladoErroPrompt);
                        if (process.env.VITEST) {
                            throw new Error('exit:1');
                        }
                        else {
                            sair(ExitCode.Failure);
                            return;
                        }
                    }
                }
                if (answer.trim().toLowerCase() !== 's') {
                    log.info(CliComandoReestruturarMessages.canceladoUseAuto);
                    if (process.env.VITEST) {
                        await new Promise((resolve) => setTimeout(resolve, 10));
                        throw new Error('exit:1');
                    }
                    return;
                }
            }
            spinner.start(CliComandoReestruturarMessages.spinnerAplicando);
            await OperarioEstrutura.aplicar(mapaMoves, fileEntriesComAst, baseDir);
            const frase = usarFallback
                ? 'correções aplicadas'
                : 'movimentos solicitados';
            spinner.succeed(CliComandoReestruturarMessages.reestruturacaoConcluida(mapaMoves.length, frase));
            await exportarRelatoriosReestruturacao({
                baseDir,
                movimentos: mapaMoves,
                simulado: false,
                origem,
                preset: opts.preset,
            });
        }
        catch (error) {
            try {
                ora().fail(CliComandoReestruturarMessages.falhaReestruturacao);
            }
            catch (err) {
                if (config.DEV_MODE) {
                    console.debug('Falha ao atualizar spinner:', err);
                }
                else {
                    log.aviso('Falha ao atualizar spinner durante reestruturação.');
                }
            }
            log.erro(CliComandoReestruturarMessages.erroDuranteReestruturacao(typeof error === 'object' && error && 'message' in error
                ? error.message
                : String(error)));
            if (config.DEV_MODE)
                console.error(error);
            if (process.env.VITEST) {
                return Promise.reject('exit:1');
            }
            else {
                sair(ExitCode.Failure);
                return;
            }
        }
    });
}
//# sourceMappingURL=comando-reestruturar.js.map