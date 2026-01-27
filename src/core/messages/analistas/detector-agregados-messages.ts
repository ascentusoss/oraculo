// SPDX-License-Identifier: MIT

type ErroUnknown = unknown;

function erroToMessage(erro: ErroUnknown): string {
  return erro instanceof Error ? erro.message : 'Erro desconhecido';
}

export const DetectorAgregadosMessages = {
  problemasSegurancaResumo: (
    severidade: string,
    resumo: string,
    total: number,
  ) =>
    `Problemas de segurança (${severidade}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,

  erroAnalisarSeguranca: (erro: ErroUnknown) =>
    `Erro ao analisar segurança: ${erroToMessage(erro)}`,

  problemasPerformanceResumo: (
    impacto: string,
    resumo: string,
    total: number,
  ) =>
    `Problemas de performance (${impacto}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,

  erroAnalisarPerformance: (erro: ErroUnknown) =>
    `Erro ao analisar performance: ${erroToMessage(erro)}`,

  problemasDocumentacaoResumo: (
    prioridade: string,
    resumo: string,
    total: number,
  ) =>
    `Problemas de documentação (${prioridade}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,

  erroAnalisarDocumentacao: (erro: ErroUnknown) =>
    `Erro ao analisar documentação: ${erroToMessage(erro)}`,

  duplicacoesResumo: (tipo: string, resumo: string, total: number) =>
    `Duplicações ${tipo}: ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,

  erroAnalisarDuplicacoes: (erro: ErroUnknown) =>
    `Erro ao analisar duplicações: ${erroToMessage(erro)}`,

  problemasTesteResumo: (severidade: string, resumo: string, total: number) =>
    `Problemas de teste (${severidade}): ${resumo}${total > 3 ? ` (+${total - 3} mais)` : ''}`,

  erroAnalisarQualidadeTestes: (erro: ErroUnknown) =>
    `Erro ao analisar qualidade de testes: ${erroToMessage(erro)}`,
} as const;
