export const InquisidorMessages = {
    parseAstNaoGerada: 'Erro de parsing: AST não gerada (código possivelmente inválido).',
    parseErro: (erro) => `Erro de parsing: ${erro}`,
    parseErrosAgregados: (quantidade) => `Erros de parsing agregados: ${quantidade} ocorrências suprimidas neste arquivo (exibe 1).`,
    falhaGerarAst: (relPath, erro) => `Falha ao gerar AST para ${relPath}: ${erro}`,
};
//# sourceMappingURL=inquisidor-messages.js.map