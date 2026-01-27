function erroToMessage(erro) {
    return erro instanceof Error ? erro.message : 'Erro desconhecido';
}
export const DetectorCodigoFragilMessages = {
    fragilidadesResumo: (severidade, resumo, detalhes) => `Fragilidades ${severidade}: ${resumo} | Detalhes: ${JSON.stringify(detalhes)}`,
    erroAnalisarCodigoFragil: (erro) => `Erro ao analisar código frágil: ${erroToMessage(erro)}`,
};
//# sourceMappingURL=detector-codigo-fragil-messages.js.map