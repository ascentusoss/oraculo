export function isGuardianResult(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value !== 'object') {
        return false;
    }
    const obj = value;
    if (!('status' in obj)) {
        return false;
    }
    const status = obj.status;
    return (status === 'ok' || status === 'alteracoes-detectadas' || status === 'erro');
}
export function converterResultadoGuardian(resultado) {
    if (!resultado) {
        return null;
    }
    if (isGuardianResult(resultado)) {
        return resultado;
    }
    const status = resultado.status;
    if (status === 'ok' || status === 'baseline-aceito') {
        return {
            status: 'ok',
            baseline: {
                hash: '',
                timestamp: Date.now(),
                files: {},
            },
            message: resultado.detalhes?.join('; '),
        };
    }
    if (status === 'alteracoes-detectadas') {
        return {
            status: 'alteracoes-detectadas',
            baseline: {
                hash: '',
                timestamp: Date.now(),
                files: {},
            },
            violations: (resultado.detalhes || []).map((msg) => ({
                tipo: 'alteracao',
                mensagem: msg,
            })),
            message: resultado.detalhes?.join('; ') || 'Alterações detectadas',
        };
    }
    return null;
}
//# sourceMappingURL=resultado.js.map