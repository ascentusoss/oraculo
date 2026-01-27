// SPDX-License-Identifier: MIT

import type { MetricaAnalista, TopAnalista } from '@';

/**
 * Métrica simplificada de analista (evita dependência circular)
 */
export interface MetricaAnalistaLike {
  nome: string;
  duracaoMs: number;
  ocorrencias: number;
}

/**
 * Métrica de execução simplificada (evita dependência circular)
 */
export interface MetricaExecucaoLike {
  totalArquivos: number;
  tempoParsingMs: number;
  tempoAnaliseMs: number;
  cacheAstHits: number;
  cacheAstMiss: number;
  analistas: MetricaAnalistaLike[];
}

/**
 * Snapshot de performance para baseline/comparação
 */
export interface SnapshotPerf {
  tipo: 'baseline';
  timestamp: string;
  commit?: string;
  node: string;
  totalArquivos?: number;
  tempoParsingMs?: number;
  tempoAnaliseMs?: number;
  cacheAstHits?: number;
  cacheAstMiss?: number;
  analistasTop?: { nome: string; duracaoMs: number; ocorrencias: number }[];
  hashConteudo?: string; // hash de métricas para identificação rápida
}

/**
 * Métricas de execução do processamento diagnóstico
 */
export interface MetricaExecucao {
  // Campos herdados dos analistas
  totalArquivos?: number;
  tempoParsingMs?: number;
  tempoAnaliseMs?: number;
  cacheAstHits?: number;
  cacheAstMiss?: number;
  analistas?: MetricaAnalista[];
  topAnalistas?: TopAnalista[];

  // Campos do processamento diagnóstico
  tempoVarredura?: number;
  tempoAnalise?: number;
  tempoTotal?: number;
  arquivosProcessados?: number;
  ocorrenciasEncontradas?: number;

  // Métricas v0.2.0
  workerPool?: {
    workersAtivos?: number;
    erros?: number;
    duracaoTotalMs?: number;
  };

  schemaVersion?: string;

  pontuacaoAdaptativa?: {
    fatorEscala?: number;
    modo?: string;
    bonusFramework?: number;
  };
}

/**
 * Estrutura de resultados da execução de análise
 */
export interface ResultadoExecucao {
  ocorrencias: import('@').Ocorrencia[];
  metricas: MetricaExecucao;
  estruturaIdentificada?: unknown;
  linguagens?: {
    total: number;
    extensoes: Record<string, number>;
  };
}
