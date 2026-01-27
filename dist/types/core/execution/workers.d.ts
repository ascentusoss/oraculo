import type { MetricaAnalista } from '../../analistas/metricas.js';
import type { Tecnica } from '../../comum/analistas.js';
import type { FileEntryWithAst } from '../../comum/file-entries.js';
import type { Ocorrencia } from '../../comum/ocorrencias.js';
import type { ContextoExecucao } from './ambiente.js';
export interface WorkerPoolOptions {
    maxWorkers?: number;
    batchSize?: number;
    timeoutMs?: number;
    enabled?: boolean;
}
export interface WorkerTask {
    files: FileEntryWithAst[];
    techniques: Tecnica[];
    context: ContextoExecucao;
    workerId: number;
}
export interface WorkerResult {
    workerId: number;
    occurrences: Ocorrencia[];
    metrics: MetricaAnalista[];
    processedFiles: number;
    errors: string[];
    duration: number;
}
//# sourceMappingURL=workers.d.ts.map