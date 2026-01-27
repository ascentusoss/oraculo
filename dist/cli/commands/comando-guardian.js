import { executarGuardian as executarGuardianModular, } from '../diagnostico/handlers/guardian-handler.js';
import { ExitCode, sair } from '../helpers/exit-codes.js';
import { config } from '../../core/config/config.js';
import { iniciarInquisicao } from '../../core/execution/inquisidor.js';
import { CliComandoGuardianMessages } from '../../core/messages/cli/cli-comando-guardian-messages.js';
import { log, logGuardian } from '../../core/messages/index.js';
import { acceptNewBaseline } from '../../guardian/sentinela.js';
import { Command } from 'commander';
import { extrairMensagemErro, IntegridadeStatus } from '../../types/index.js';
export function comandoGuardian(aplicarFlagsGlobais) {
    return (new Command('guardian')
        .description('Gerencia e verifica a integridade do ambiente do Oráculo.')
        .allowUnknownOption(true)
        .allowExcessArguments(true)
        .option('-a, --accept-baseline', 'Aceita o baseline atual como o novo baseline de integridade')
        .option('-d, --diff', 'Mostra as diferenças entre o estado atual e o baseline')
        .option('--full-scan', 'Executa verificação sem aplicar GUARDIAN_IGNORE_PATTERNS (não persistir baseline)')
        .option('--json', 'Saída em JSON estruturado (para CI/integracoes)')
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
        const baseDir = process.cwd();
        let fileEntries = [];
        try {
            const resultadoInquisicao = await iniciarInquisicao(baseDir, {
                incluirMetadados: false,
            });
            fileEntries = resultadoInquisicao.fileEntries;
            const ignoradosOriginaisRaw = config.GUARDIAN_IGNORE_PATTERNS;
            const ignoradosOriginais = Array.isArray(ignoradosOriginaisRaw)
                ? [...ignoradosOriginaisRaw]
                : [];
            if (opts.fullScan) {
                config.GUARDIAN_IGNORE_PATTERNS = [];
                if (!opts.acceptBaseline) {
                    logGuardian.fullScanAviso();
                }
            }
            if (opts.acceptBaseline) {
                if (opts.fullScan) {
                    log.aviso(CliComandoGuardianMessages.baselineNaoPermitidoFullScan);
                    config.GUARDIAN_IGNORE_PATTERNS = ignoradosOriginais;
                    sair(ExitCode.Failure);
                    return;
                }
                logGuardian.aceitandoBaseline();
                await acceptNewBaseline(fileEntries);
                if (opts.json) {
                    console.log(JSON.stringify({
                        status: IntegridadeStatus.Aceito,
                        baseline: true,
                    }));
                }
                else {
                    logGuardian.baselineAceitoSucesso();
                }
            }
            else {
                const guardianOpts = {
                    enabled: true,
                    fullScan: Boolean(opts.fullScan),
                    saveBaseline: false,
                    silent: Boolean(opts.json),
                };
                const guardianResult = await executarGuardianModular(fileEntries.map((e) => ({
                    relPath: e.relPath,
                    fullPath: e.fullPath,
                    content: e.content,
                })), guardianOpts);
                if (opts.diff) {
                    if (guardianResult.drift && guardianResult.drift > 0) {
                        if (opts.json) {
                            console.log(JSON.stringify({
                                status: 'alteracoes-detectadas',
                                drift: guardianResult.drift,
                            }));
                        }
                        else {
                            logGuardian.diferencasDetectadas();
                            log.aviso(CliComandoGuardianMessages.diffMudancasDetectadas(guardianResult.drift));
                            log.aviso(CliComandoGuardianMessages.diffComoAceitarMudancas);
                        }
                        sair(ExitCode.Failure);
                        return;
                    }
                    else {
                        if (opts.json) {
                            console.log(JSON.stringify({ status: 'ok', drift: 0 }));
                        }
                        else {
                            logGuardian.integridadePreservada();
                        }
                    }
                }
                else {
                    const statusNorm = guardianResult.status || IntegridadeStatus.Ok;
                    switch (statusNorm) {
                        case IntegridadeStatus.Ok:
                            if (opts.json)
                                console.log(JSON.stringify({
                                    status: 'ok',
                                    cacheDiffHits: globalThis.__ORACULO_DIFF_CACHE_HITS__ || 0,
                                }));
                            else
                                logGuardian.integridadeOk();
                            break;
                        case IntegridadeStatus.Criado:
                            if (opts.json)
                                console.log(JSON.stringify({
                                    status: 'baseline-criado',
                                    cacheDiffHits: globalThis.__ORACULO_DIFF_CACHE_HITS__ || 0,
                                }));
                            else
                                logGuardian.baselineCriadoConsole();
                            log.aviso(CliComandoGuardianMessages.baselineCriadoComoAceitar);
                            break;
                        case IntegridadeStatus.Aceito:
                            if (opts.json)
                                console.log(JSON.stringify({
                                    status: 'baseline-aceito',
                                    cacheDiffHits: globalThis.__ORACULO_DIFF_CACHE_HITS__ || 0,
                                }));
                            else
                                logGuardian.baselineAtualizado();
                            break;
                        case IntegridadeStatus.AlteracoesDetectadas: {
                            if (opts.json) {
                                console.log(JSON.stringify({
                                    status: 'alteracoes-detectadas',
                                    temProblemas: guardianResult.temProblemas,
                                    drift: guardianResult.drift,
                                }));
                            }
                            else {
                                logGuardian.alteracoesSuspeitas();
                            }
                            sair(ExitCode.Failure);
                            return;
                        }
                    }
                }
            }
            if (opts.fullScan) {
                config.GUARDIAN_IGNORE_PATTERNS = ignoradosOriginais;
            }
        }
        catch (err) {
            logGuardian.erroGuardian(err.message ?? String(err));
            if (config.DEV_MODE) {
                console.error(extrairMensagemErro(err));
                if (err && typeof err === 'object' && 'stack' in err) {
                    console.error(err.stack);
                }
            }
            if (opts.json)
                console.log(JSON.stringify({
                    status: 'erro',
                    mensagem: extrairMensagemErro(err),
                }));
            sair(ExitCode.Failure);
            return;
        }
    }));
}
//# sourceMappingURL=comando-guardian.js.map