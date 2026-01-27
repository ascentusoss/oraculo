// SPDX-License-Identifier: MIT

type ErroUnknown = unknown;

type FragilidadesDetalhesArgs = {
  severidade: string;
  total: number;
  tipos: Record<string, number>;
  amostra: string[];
};

function erroToMessage(erro: ErroUnknown): string {
  return erro instanceof Error ? erro.message : 'Erro desconhecido';
}

export const DetectorCodigoFragilMessages = {
  fragilidadesResumo: (
    severidade: string,
    resumo: string,
    detalhes: FragilidadesDetalhesArgs,
  ) =>
    `Fragilidades ${severidade}: ${resumo} | Detalhes: ${JSON.stringify(detalhes)}`,

  erroAnalisarCodigoFragil: (erro: ErroUnknown) =>
    `Erro ao analisar código frágil: ${erroToMessage(erro)}`,
} as const;
