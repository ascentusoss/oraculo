export function aplicarSupressaoOcorrencias(ocorrencias, filtros) {
    if (!filtros) {
        return ocorrencias;
    }
    const filtradas = ocorrencias.filter((ocorrencia) => {
        const tipo = ocorrencia.tipo || '';
        const relPath = ocorrencia.relPath || '';
        const nivel = ocorrencia.nivel || '';
        const mensagem = ocorrencia.mensagem || '';
        if (filtros.suppressRules?.some((rule) => tipo.includes(rule) || mensagem.includes(rule))) {
            return false;
        }
        if (filtros.suppressBySeverity && filtros.suppressBySeverity[nivel]) {
            return false;
        }
        if (filtros.suppressByPath?.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(relPath);
        })) {
            return false;
        }
        if (filtros.suppressByFilePattern?.some((pattern) => {
            const fileName = relPath.split('/').pop() || '';
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(fileName);
        })) {
            return false;
        }
        return true;
    });
    return filtradas;
}
//# sourceMappingURL=filters.js.map