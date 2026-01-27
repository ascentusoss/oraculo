function erroToMessage(erro) {
    return erro instanceof Error ? erro.message : 'Erro desconhecido';
}
export const DetectorArquiteturaMessages = {
    padraoArquitetural: (padraoIdentificado, confianca) => `Padrão arquitetural: ${padraoIdentificado} (${confianca}% confiança)`,
    caracteristicas: (caracteristicas) => `Características: ${caracteristicas.slice(0, 3).join(', ')}`,
    violacao: (violacao) => `Violação arquitetural: ${violacao}`,
    metricas: (acoplamento, coesao) => `Métricas: Acoplamento=${(acoplamento * 100).toFixed(0)}%, Coesão=${(coesao * 100).toFixed(0)}%`,
    erroAnalisarArquitetura: (erro) => `Erro ao analisar arquitetura: ${erroToMessage(erro)}`,
};
//# sourceMappingURL=detector-arquitetura-messages.js.map