import { ExcecoesMessages } from '../../../core/messages/core/excecoes-messages.js';
import { log, MENSAGENS_AUTOFIX } from '../../../core/messages/index.js';
export async function executarAutoFix(entries, options) {
    try {
        if (!options.silent) {
            const modoLabel = {
                conservative: 'conservador',
                balanced: 'balanceado',
                aggressive: 'agressivo',
            }[options.mode];
            if (options.dryRun) {
                console.log(`${MENSAGENS_AUTOFIX.iniciando(modoLabel)}`);
                console.log(MENSAGENS_AUTOFIX.dryRun);
            }
            else {
                console.log(MENSAGENS_AUTOFIX.iniciando(modoLabel));
            }
        }
        const timeout = options.timeout ?? (process.env.VITEST === 'true' ? 1000 : 60000);
        const resultado = await executarComTimeout(entries, options, timeout);
        if (!options.silent) {
            const { correcoesAplicadas } = resultado.stats;
            if (options.dryRun && resultado.stats.correcoesSugeridas > 0) {
                console.log(`Correções sugeridas: ${resultado.stats.correcoesSugeridas} em ${resultado.stats.arquivosAnalisados} arquivo(s)`);
            }
            else if (correcoesAplicadas > 0) {
                console.log(MENSAGENS_AUTOFIX.concluido(correcoesAplicadas, 0));
            }
            else {
                console.log(MENSAGENS_AUTOFIX.naoDisponivel);
            }
        }
        return resultado;
    }
    catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        if (!options.silent) {
            log.aviso(`${MENSAGENS_AUTOFIX.resultados.erroArquivo('', mensagem).split(':')[0]}: ${mensagem}`);
        }
        return {
            executado: false,
            mode: options.mode,
            dryRun: options.dryRun,
            stats: {
                arquivosAnalisados: 0,
                arquivosModificados: 0,
                correcoesAplicadas: 0,
                correcoesSugeridas: 0,
                correcoesPuladas: 0,
            },
        };
    }
}
async function executarComTimeout(entries, options, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(ExcecoesMessages.autoFixTimeout(timeoutMs)));
        }, timeoutMs);
        executarAutoFixInterno(entries, options)
            .then((resultado) => {
            clearTimeout(timer);
            resolve(resultado);
        })
            .catch((erro) => {
            clearTimeout(timer);
            reject(erro);
        });
    });
}
async function executarAutoFixInterno(entries, options) {
    const stats = {
        arquivosAnalisados: entries.length,
        arquivosModificados: 0,
        correcoesAplicadas: 0,
        correcoesSugeridas: 0,
        correcoesPuladas: 0,
    };
    return {
        executado: true,
        mode: options.mode,
        dryRun: options.dryRun,
        stats,
    };
}
export function formatarAutoFixParaJson(resultado) {
    return {
        executado: resultado.executado,
        mode: resultado.mode,
        dryRun: resultado.dryRun,
        stats: resultado.stats,
        ...(resultado.correcoesPorTipo && {
            correcoesPorTipo: resultado.correcoesPorTipo,
        }),
        ...(resultado.detalhes && { detalhes: resultado.detalhes }),
    };
}
export function calcularLimiarConfianca(mode) {
    const limiares = {
        conservative: 90,
        balanced: 75,
        aggressive: 50,
    };
    return limiares[mode];
}
export function deveAplicarCorrecao(confianca, limiar, mode) {
    if (mode === 'conservative') {
        return confianca >= limiar;
    }
    if (mode === 'balanced') {
        return confianca >= limiar * 0.9;
    }
    return confianca >= limiar * 0.75;
}
export function getExitCodeAutoFix(resultado) {
    if (!resultado.executado) {
        return 1;
    }
    if (resultado.dryRun) {
        return resultado.stats.correcoesSugeridas > 0 ? 0 : 0;
    }
    return resultado.stats.correcoesAplicadas >= 0 ? 0 : 1;
}
//# sourceMappingURL=auto-fix-handler.js.map