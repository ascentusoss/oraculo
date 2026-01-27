// SPDX-License-Identifier: MIT

export const PadroesUsoMessages = {
  varUsage: "Uso de 'var' detectado. Prefira 'let' ou 'const'.",
  letUsage: "Uso de 'let'. Considere 'const' se não houver reatribuição.",
  requireInTs: "Uso de 'require' em arquivo TypeScript. Prefira 'import'.",
  evalUsage:
    "Uso de 'eval' detectado. Evite por questões de segurança e performance.",
  moduleExportsInTs:
    "Uso de 'module.exports' ou 'exports' em arquivo TypeScript. Prefira 'export'.",
  withUsage:
    "Uso de 'with' detectado. Evite por questões de legibilidade e escopo.",
  anonymousFunction:
    'Função anônima detectada. Considere nomear funções para melhor rastreabilidade.',
  arrowAsClassMethod:
    'Arrow function usada como método de classe. Prefira método tradicional para melhor herança.',
  erroAnalise: (relPath: string, erro: string) =>
    `Falha ao analisar padrões de uso em ${relPath}: ${erro}`,
} as const;
