function erroToMessage(erro) {
    return erro instanceof Error ? erro.message : 'Erro desconhecido';
}
export const DetectorConstrucoesSintaticasMessages = {
    identificadas: (mensagemFinal) => `Construções sintáticas identificadas: ${mensagemFinal}`,
    erroAnalisar: (erro) => `Erro ao analisar construções sintáticas: ${erroToMessage(erro)}`,
};
//# sourceMappingURL=detector-construcoes-sintaticas-messages.js.map