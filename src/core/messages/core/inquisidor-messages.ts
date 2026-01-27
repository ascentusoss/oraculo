// SPDX-License-Identifier: MIT

export const InquisidorMessages = {
  parseAstNaoGerada:
    'Erro de parsing: AST não gerada (código possivelmente inválido).',
  parseErro: (erro: string) => `Erro de parsing: ${erro}`,
  parseErrosAgregados: (quantidade: number) =>
    `Erros de parsing agregados: ${quantidade} ocorrências suprimidas neste arquivo (exibe 1).`,

  falhaGerarAst: (relPath: string, erro: string) =>
    `Falha ao gerar AST para ${relPath}: ${erro}`,
} as const;
