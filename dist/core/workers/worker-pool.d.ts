import type { ContextoExecucao, FileEntryWithAst, MetricaAnalista, Ocorrencia, Tecnica, WorkerPoolOptions, WorkerResult, WorkerTask } from '../../types/index.js';
export type { WorkerPoolOptions, WorkerResult, WorkerTask };
export declare class WorkerPool {
    private maxWorkers;
    private batchSize;
    private timeoutMs;
    private enabled;
    private activeWorkers;
    private results;
    private errors;
    constructor(options?: WorkerPoolOptions);
    processFiles(files: FileEntryWithAst[], techniques: Tecnica[], context: ContextoExecucao): Promise<{
        occurrences: Ocorrencia[];
        metrics: MetricaAnalista[];
        totalProcessed: number;
        duration: number;
    }>;
    private createBatches;
    private processGlobalTechniques;
    private processBatches;
    private processBatch;
    private processSequentially;
    private executeTechniqueWithTimeout;
    getStats(): {
        maxWorkers: number;
        batchSize: number;
        enabled: boolean;
        activeWorkers: number;
        completedWorkers: number;
        totalErrors: number;
        errors: string[];
    };
}
export declare function processarComWorkers(files: FileEntryWithAst[], techniques: Tecnica[], context: ContextoExecucao, options?: WorkerPoolOptions): Promise<{
    occurrences: Ocorrencia[];
    metrics: MetricaAnalista[];
    totalProcessed: number;
    duration: number;
}>;
//# sourceMappingURL=worker-pool.d.ts.map