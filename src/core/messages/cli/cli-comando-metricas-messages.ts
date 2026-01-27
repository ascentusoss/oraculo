// SPDX-License-Identifier: MIT

import { ICONES_ACAO } from '../ui/icons.js';

export const CliComandoMetricasMessages = {
  linhaEmBranco: '',

  historicoExportado: (destino: string) =>
    `${ICONES_ACAO.export} Histórico de métricas exportado para ${destino}`,

  linhaExecucao: (
    timestampISO: string,
    totalArquivos: number,
    duracaoAnalise: string,
    duracaoParsing: string,
    cacheHits: number,
    cacheMiss: number,
  ) =>
    `- ${timestampISO} | arquivos=${totalArquivos} analise=${duracaoAnalise} parsing=${duracaoParsing} cache(h/m)=${cacheHits}/${cacheMiss}`,

  tituloTopAnalistas: (iconeInfo: string) =>
    `${iconeInfo} Top analistas (por tempo acumulado):`,

  linhaTopAnalista: (
    nome: string,
    total: string,
    media: string,
    execucoes: number,
    ocorrencias: number,
  ) =>
    `  • ${nome} total=${total} média=${media} exec=${execucoes} ocorr=${ocorrencias}`,

  medias: (mediaAnalise: string, mediaParsing: string) =>
    `\nMédias: análise=${mediaAnalise} parsing=${mediaParsing}`,
} as const;
