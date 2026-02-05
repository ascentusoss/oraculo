// SPDX-License-Identifier: MIT

import type { MetricaExecucao, Ocorrencia } from '@';

export type EstadoIncrementalExecutor = {
  arquivos: Record<
    string,
    {
      hash: string;
      ocorrencias: Ocorrencia[];
      analistas?: Record<string, { ocorrencias: number; duracaoMs: number }>;
      reaproveitadoCount?: number;
    }
  >;
};

export type CacheValor = {
  mtimeMs: number;
  size: number;
  ast:
    | import('@babel/traverse').NodePath<import('@babel/types').Node>
    | undefined;
};

export type EstadoIncremental = {
  versao: number;
  arquivos: Record<
    string,
    {
      hash: string;
      ocorrencias: Ocorrencia[];
      analistas?: Record<string, { ocorrencias: number; duracaoMs: number }>;
      ultimaExecucaoMs?: number;
      reaproveitadoCount?: number;
    }
  >;
  estatisticas?: {
    totalReaproveitamentos?: number;
    totalArquivosProcessados?: number;
    ultimaDuracaoMs?: number;
  };
};

// MetricasGlobais agora vem de core/inquisidor.ts

export interface MetricasGlobaisExecutor {
  tempoAnaliseMs: number;
  tempoParsingMs: number;
  arquivosAnalisados: number;
  ocorrenciasEncontradas: number;
  astCacheHits: number;
  astCacheMiss: number;
}

export type RegistroHistorico = MetricaExecucao & { timestamp: number };
