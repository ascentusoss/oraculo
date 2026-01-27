// SPDX-License-Identifier: MIT

type ErroUnknown = unknown;

function erroToMessage(erro: ErroUnknown): string {
  return erro instanceof Error ? erro.message : 'Erro desconhecido';
}

export const DetectorArquiteturaMessages = {
  padraoArquitetural: (
    padraoIdentificado: string | undefined,
    confianca: number,
  ) => `Padrão arquitetural: ${padraoIdentificado} (${confianca}% confiança)`,

  caracteristicas: (caracteristicas: string[]) =>
    `Características: ${caracteristicas.slice(0, 3).join(', ')}`,

  violacao: (violacao: string) => `Violação arquitetural: ${violacao}`,

  metricas: (acoplamento: number, coesao: number) =>
    `Métricas: Acoplamento=${(acoplamento * 100).toFixed(0)}%, Coesão=${(coesao * 100).toFixed(0)}%`,

  erroAnalisarArquitetura: (erro: ErroUnknown) =>
    `Erro ao analisar arquitetura: ${erroToMessage(erro)}`,
} as const;
