import { MENSAGENS_GUARDIAN } from '../../../core/messages/core/diagnostico-messages.js';
import { logGuardian } from '../../../core/messages/log/log-helper.js';
import { scanSystemIntegrity } from '../../../guardian/sentinela.js';
import { IntegridadeStatus } from '../../../types/index.js';
export async function executarGuardian(entries, options) {
    if (!options.enabled) {
        return {
            executado: false,
            temProblemas: false,
        };
    }
    try {
        if (!options.silent) {
            logGuardian.info(MENSAGENS_GUARDIAN.iniciando);
            if (options.fullScan) {
                logGuardian.info(`  ${MENSAGENS_GUARDIAN.fullScan}`);
            }
            else {
                logGuardian.info(`  ${MENSAGENS_GUARDIAN.baseline}`);
            }
            if (options.saveBaseline) {
                logGuardian.info(`  ${MENSAGENS_GUARDIAN.saveBaseline}`);
            }
        }
        const resultado = await scanSystemIntegrity(entries, {
            suppressLogs: options.silent,
        });
        const status = resultado.status || IntegridadeStatus.Ok;
        const drift = resultado.detalhes?.length || 0;
        const temProblemas = status === IntegridadeStatus.AlteracoesDetectadas;
        if (!options.silent) {
            switch (status) {
                case IntegridadeStatus.Ok:
                    logGuardian.info(MENSAGENS_GUARDIAN.status.verde);
                    break;
                case IntegridadeStatus.AlteracoesDetectadas:
                    logGuardian.aviso(MENSAGENS_GUARDIAN.status.amarelo);
                    break;
                case IntegridadeStatus.Criado:
                case IntegridadeStatus.Aceito:
                    logGuardian.info(MENSAGENS_GUARDIAN.status.verde);
                    break;
            }
            if (drift > 0) {
                logGuardian.info(`  ${MENSAGENS_GUARDIAN.drift(drift)}`);
            }
        }
        return {
            executado: true,
            resultado,
            status,
            drift,
            temProblemas,
        };
    }
    catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        if (!options.silent) {
            logGuardian.aviso(`Erro no Guardian: ${mensagem}`);
        }
        return {
            executado: true,
            temProblemas: true,
        };
    }
}
export function formatarGuardianParaJson(result) {
    if (!result.executado) {
        return {
            executado: false,
            status: 'nao-verificado',
        };
    }
    return {
        executado: true,
        status: result.status || 'desconhecido',
        drift: result.drift || 0,
        temProblemas: result.temProblemas,
        detalhes: result.resultado
            ? {
                status: result.resultado.status,
                detalhes: result.resultado.detalhes,
                baselineModificado: result.resultado.baselineModificado,
            }
            : undefined,
    };
}
export function getExitCodeGuardian(result) {
    if (!result.executado || !result.status) {
        return 0;
    }
    switch (result.status) {
        case IntegridadeStatus.Ok:
        case IntegridadeStatus.Criado:
        case IntegridadeStatus.Aceito:
            return 0;
        case IntegridadeStatus.AlteracoesDetectadas:
            return 1;
        default:
            return 0;
    }
}
//# sourceMappingURL=guardian-handler.js.map