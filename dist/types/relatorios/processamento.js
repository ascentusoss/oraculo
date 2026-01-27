export function isPendenciaProcessavel(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'arquivo' in obj &&
        'motivo' in obj &&
        typeof obj.arquivo === 'string' &&
        typeof obj.motivo === 'string');
}
//# sourceMappingURL=processamento.js.map