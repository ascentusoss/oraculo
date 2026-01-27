// SPDX-License-Identifier: MIT
/**
 * Tipos para sistema de Worker Pool
 */

import type { MetricaAnalista } from '../../analistas/metricas.js';
import type { Tecnica } from '../../comum/analistas.js';
import type { FileEntryWithAst } from '../../comum/file-entries.js';
import type { Ocorrencia } from '../../comum/ocorrencias.js';
import type { ContextoExecucao } from './ambiente.js';

/**
 * Opções de configuração do Worker Pool
 */
export interface WorkerPoolOptions {
  /** Número máximo de workers simultâneos (padrão: número de CPUs) */
  maxWorkers?: number;
  /** Tamanho do lote de arquivos por worker (padrão: 10) */
  batchSize?: number;
  /** Timeout por analista em ms (padrão: valor do config) */
  timeoutMs?: number;
  /** Se deve usar workers (padrão: true se disponível) */
  enabled?: boolean;
}

/**
 * Tarefa a ser executada por um worker
 */
export interface WorkerTask {
  files: FileEntryWithAst[];
  techniques: Tecnica[];
  context: ContextoExecucao;
  workerId: number;
}

/**
 * Resultado da execução de um worker
 */
export interface WorkerResult {
  workerId: number;
  occurrences: Ocorrencia[];
  metrics: MetricaAnalista[];
  processedFiles: number;
  errors: string[];
  duration: number;
}
