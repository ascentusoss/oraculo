function erroToMessage(erro) {
    return erro instanceof Error ? erro.message : 'Erro desconhecido';
}
export const DetectorAgregadosMessages = {
    problemasSegurancaResumo: (severidade, resumo, total) => `Problemas de segurança (${severidade}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,
    erroAnalisarSeguranca: (erro) => `Erro ao analisar segurança: ${erroToMessage(erro)}`,
    problemasPerformanceResumo: (impacto, resumo, total) => `Problemas de performance (${impacto}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,
    erroAnalisarPerformance: (erro) => `Erro ao analisar performance: ${erroToMessage(erro)}`,
    problemasDocumentacaoResumo: (prioridade, resumo, total) => `Problemas de documentação (${prioridade}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,
    erroAnalisarDocumentacao: (erro) => `Erro ao analisar documentação: ${erroToMessage(erro)}`,
    duplicacoesResumo: (tipo, resumo, total) => `Duplicações ${tipo}: ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,
    erroAnalisarDuplicacoes: (erro) => `Erro ao analisar duplicações: ${erroToMessage(erro)}`,
    problemasTesteResumo: (severidade, resumo, total) => `Problemas de teste (${severidade}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,
    erroAnalisarQualidadeTestes: (erro) => `Erro ao analisar qualidade de testes: ${erroToMessage(erro)}`,
};
//# sourceMappingURL=detector-agregados-messages.js.map