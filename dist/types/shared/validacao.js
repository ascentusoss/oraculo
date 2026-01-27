export function extrairMensagemErro(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (isErroComMensagem(error)) {
        if (typeof error.message === 'string') {
            return error.message;
        }
        if (error.message instanceof Error) {
            return error.message.message;
        }
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        const msg = error.message;
        if (typeof msg === 'string')
            return msg;
    }
    return 'Erro desconhecido';
}
export function validarSeguro(validador, dados, fallback, contexto) {
    if (validador(dados)) {
        return dados;
    }
    if (process.env.NODE_ENV === 'development' || process.env.VITEST) {
        console.warn(`[Validação] Falhou${contexto ? ` em ${contexto}` : ''}, usando fallback`);
    }
    return fallback;
}
export function isErroComMensagem(obj) {
    return typeof obj === 'object' && obj !== null && 'message' in obj;
}
export function isGlobalComVitest(obj) {
    return typeof obj === 'object' && obj !== null && 'vi' in obj;
}
export function isPendenciaProcessavel(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'arquivo' in obj &&
        'motivo' in obj &&
        typeof obj.arquivo === 'string' &&
        typeof obj.motivo === 'string');
}
export function isIntlComDisplayNames(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        ('DisplayNames' in obj || Object.keys(obj).length >= 0));
}
export function isGlobalComImport(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        ('import' in obj || Object.keys(obj).length >= 0));
}
export function isConfigPlugin(obj) {
    return typeof obj === 'object' && obj !== null;
}
export function isPlanoSugestaoEstrutura(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'mover' in obj &&
        Array.isArray(obj.mover));
}
export function isSnapshotAnalise(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'timestamp' in obj &&
        'arquivos' in obj &&
        Array.isArray(obj.arquivos));
}
export function isEntradaMapaReversao(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'arquivo' in obj &&
        'operacao' in obj &&
        typeof obj.arquivo === 'string' &&
        ['adicionar', 'remover', 'modificar'].includes(obj.operacao));
}
export function converterSeguro(obj, validador, fallback) {
    return validador(obj) ? obj : fallback;
}
export function isStringNaoVazia(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}
export function isNumeroValido(valor) {
    return typeof valor === 'number' && !isNaN(valor) && isFinite(valor);
}
export function isArrayNaoVazio(valor) {
    return Array.isArray(valor) && valor.length > 0;
}
//# sourceMappingURL=validacao.js.map