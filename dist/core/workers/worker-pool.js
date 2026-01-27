import * as os from 'node:os';
import * as path from 'node:path';
import { Worker } from 'node:worker_threads';
import { config } from '../config/config.js';
import { log } from '../messages/index.js';
import { ocorrenciaErroAnalista } from '../../types/index.js';
export class WorkerPool {
    maxWorkers;
    batchSize;
    timeoutMs;
    enabled;
    activeWorkers = 0;
    results = [];
    errors = [];
    constructor(options = {}) {
        const configuredMax = options.maxWorkers ?? config.WORKER_POOL_MAX_WORKERS ?? 0;
        this.maxWorkers =
            configuredMax > 0 ? configuredMax : Math.max(1, os.cpus().length);
        this.batchSize = options.batchSize ?? 10;
        let baseTimeout = options.timeoutMs ?? config.ANALISE_TIMEOUT_POR_ANALISTA_MS;
        const envCap = Number(process.env.ORACULO_MAX_ANALYST_TIMEOUT_MS) || 0;
        if (envCap > 0) {
            baseTimeout = Math.min(baseTimeout, envCap);
        }
        else if (process.env.NODE_ENV === 'production') {
            baseTimeout = Math.min(baseTimeout, 10000);
        }
        this.timeoutMs = baseTimeout;
        this.enabled = options.enabled ?? config.WORKER_POOL_ENABLED !== false;
        if (!this.enabled || !Worker) {
            this.enabled = false;
            log.info('Pool de workers desabilitado (Worker Threads não disponível)');
        }
    }
    async processFiles(files, techniques, context) {
        if (!this.enabled || files.length < this.batchSize) {
            return this.processSequentially(files, techniques, context);
        }
        const startTime = performance.now();
        const batches = this.createBatches(files);
        const nonGlobalTechniques = techniques.filter((t) => !t.global);
        log.info(`🚀 Iniciando processamento paralelo com ${this.maxWorkers} workers`);
        log.info(`📦 ${batches.length} lotes de até ${this.batchSize} arquivos cada`);
        const globalTechniques = techniques.filter((t) => t.global);
        if (globalTechniques.length > 0) {
            await this.processGlobalTechniques(globalTechniques, context);
        }
        await this.processBatches(batches, nonGlobalTechniques, context);
        const duration = performance.now() - startTime;
        const totalOccurrences = this.results.reduce((sum, r) => sum + r.occurrences.length, 0);
        const totalMetrics = this.results.flatMap((r) => r.metrics);
        log.info(`✅ Processamento paralelo concluído em ${Math.round(duration)}ms`);
        log.info(`📊 ${this.results.length} workers, ${files.length} arquivos, ${totalOccurrences} ocorrências`);
        return {
            occurrences: this.results.flatMap((r) => r.occurrences),
            metrics: totalMetrics,
            totalProcessed: files.length,
            duration,
        };
    }
    createBatches(files) {
        const batches = [];
        for (let i = 0; i < files.length; i += this.batchSize) {
            batches.push(files.slice(i, i + this.batchSize));
        }
        return batches;
    }
    async processGlobalTechniques(techniques, context) {
        for (const technique of techniques) {
            try {
                const startTime = performance.now();
                const result = await this.executeTechniqueWithTimeout(technique, '', '[global]', null, undefined, context);
                if (result) {
                    const occurrences = Array.isArray(result) ? result : [result];
                    this.results.push({
                        workerId: -1,
                        occurrences,
                        metrics: [
                            {
                                nome: technique.nome || 'global',
                                duracaoMs: performance.now() - startTime,
                                ocorrencias: occurrences.length,
                                global: true,
                            },
                        ],
                        processedFiles: 0,
                        errors: [],
                        duration: performance.now() - startTime,
                    });
                }
            }
            catch (error) {
                const err = error;
                this.errors.push(`Erro em técnica global '${technique.nome}': ${err.message}`);
                this.results.push({
                    workerId: -1,
                    occurrences: [
                        ocorrenciaErroAnalista({
                            mensagem: `Falha na técnica global '${technique.nome}': ${err.message}`,
                            relPath: '[execução global]',
                            origem: technique.nome,
                        }),
                    ],
                    metrics: [],
                    processedFiles: 0,
                    errors: [err.message],
                    duration: 0,
                });
            }
        }
    }
    async processBatches(batches, techniques, context) {
        const activePromises = new Set();
        for (let i = 0; i < batches.length; i++) {
            while (this.activeWorkers >= this.maxWorkers) {
                if (activePromises.size === 0)
                    break;
                await Promise.race(Array.from(activePromises));
            }
            const p = this.processBatch(batches[i], techniques, context, i);
            activePromises.add(p);
            p.then(() => activePromises.delete(p)).catch(() => activePromises.delete(p));
        }
        await Promise.all(Array.from(activePromises));
    }
    async processBatch(files, techniques, context, batchId) {
        this.activeWorkers++;
        try {
            const workerPath = path.join(__dirname, 'worker-executor.js');
            const avgSize = files.reduce((s, f) => s + (f.content ? f.content.length : 0), 0) /
                Math.max(1, files.length);
            const sizeMultiplier = 1 + Math.min(4, avgSize / 50000);
            const batchTimeoutMs = Math.max(1000, Math.min(this.timeoutMs, Math.floor(this.timeoutMs * sizeMultiplier)));
            const worker = new Worker(workerPath, {
                workerData: {
                    files,
                    techniques,
                    context,
                    workerId: batchId,
                    timeoutMs: batchTimeoutMs,
                },
            });
            const workerKillMs = Math.max(30000, this.timeoutMs * 2 || 30000);
            const adjustedKillMs = Math.max(1000, Math.min(workerKillMs, batchTimeoutMs + 1000));
            const result = await new Promise((resolve, reject) => {
                let settled = false;
                let killTimer = setTimeout(() => {
                    if (settled)
                        return;
                    settled = true;
                    try {
                        void worker.terminate();
                    }
                    catch {
                    }
                    try {
                        log.infoSemSanitizar(JSON.stringify({
                            event: 'worker_killed',
                            batchId,
                            adjustedKillMs,
                            reason: 'timeout',
                        }));
                    }
                    catch { }
                    reject(new Error(`Worker ${batchId} killed after ${adjustedKillMs}ms`));
                }, adjustedKillMs);
                worker.on('message', (msg) => {
                    const m = msg;
                    if (m && m['type'] === 'heartbeat') {
                        try {
                            if (killTimer)
                                clearTimeout(killTimer);
                        }
                        catch { }
                        killTimer = setTimeout(() => {
                            if (settled)
                                return;
                            settled = true;
                            try {
                                void worker.terminate();
                            }
                            catch { }
                            try {
                                log.infoSemSanitizar(JSON.stringify({
                                    event: 'worker_killed',
                                    batchId,
                                    adjustedKillMs,
                                    reason: 'heartbeat_timeout',
                                }));
                            }
                            catch { }
                            reject(new Error(`Worker ${batchId} killed after ${adjustedKillMs}ms (heartbeat timeout)`));
                        }, adjustedKillMs);
                        return;
                    }
                    if (settled)
                        return;
                    settled = true;
                    try {
                        if (killTimer)
                            clearTimeout(killTimer);
                    }
                    catch { }
                    try {
                        const workerId = typeof m['workerId'] === 'number'
                            ? m['workerId']
                            : batchId;
                        const occurrences = Array.isArray(m['occurrences'])
                            ? m['occurrences']
                            : Array.isArray(m['resultados'])
                                ? m['resultados']
                                : [];
                        const metrics = Array.isArray(m['metrics'])
                            ? m['metrics']
                            : [];
                        const processedFiles = typeof m['processedFiles'] === 'number'
                            ? m['processedFiles']
                            : files.length || 0;
                        const errors = Array.isArray(m['errors'])
                            ? m['errors'].map(String)
                            : m['erro']
                                ? [String(m['erro'])]
                                : [];
                        const duration = typeof m['duration'] === 'number' ? m['duration'] : 0;
                        const workerResult = {
                            workerId,
                            occurrences,
                            metrics,
                            processedFiles,
                            errors: errors,
                            duration,
                        };
                        resolve(workerResult);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                worker.on('error', (err) => {
                    if (settled)
                        return;
                    settled = true;
                    try {
                        if (killTimer)
                            clearTimeout(killTimer);
                    }
                    catch { }
                    reject(err);
                });
                worker.on('exit', (code) => {
                    if (settled)
                        return;
                    settled = true;
                    try {
                        if (killTimer)
                            clearTimeout(killTimer);
                    }
                    catch { }
                    if (code !== 0) {
                        try {
                            log.infoSemSanitizar(JSON.stringify({ event: 'worker_exit_nonzero', batchId, code }));
                        }
                        catch { }
                        reject(new Error(`Worker ${batchId} exited with code ${code}`));
                    }
                    else {
                        resolve({
                            workerId: batchId,
                            occurrences: [],
                            metrics: [],
                            processedFiles: files.length,
                            errors: [],
                            duration: 0,
                        });
                    }
                });
            });
            this.results.push(result);
        }
        catch (error) {
            const err = error;
            this.errors.push(`Erro no worker ${batchId}: ${err.message}`);
            this.results.push({
                workerId: batchId,
                occurrences: [
                    ocorrenciaErroAnalista({
                        mensagem: `Falha no worker ${batchId}: ${err.message}`,
                        relPath: `[worker-${batchId}]`,
                        origem: 'worker-pool',
                    }),
                ],
                metrics: [],
                processedFiles: 0,
                errors: [err.message],
                duration: 0,
            });
        }
        finally {
            this.activeWorkers--;
        }
    }
    async processSequentially(files, techniques, context) {
        const startTime = performance.now();
        const occurrences = [];
        const metrics = [];
        log.info('🔄 Usando processamento sequencial (workers desabilitados)');
        const globalTechniques = techniques.filter((t) => t.global);
        for (const technique of globalTechniques) {
            try {
                const result = await this.executeTechniqueWithTimeout(technique, '', '[global]', null, undefined, context);
                if (result) {
                    const occs = Array.isArray(result) ? result : [result];
                    occurrences.push(...occs);
                }
            }
            catch (error) {
                const err = error;
                occurrences.push(ocorrenciaErroAnalista({
                    mensagem: `Falha na técnica global '${technique.nome}': ${err.message}`,
                    relPath: '[execução global]',
                    origem: technique.nome,
                }));
            }
        }
        const nonGlobalTechniques = techniques.filter((t) => !t.global);
        for (const file of files) {
            for (const technique of nonGlobalTechniques) {
                if (technique.test && !technique.test(file.relPath))
                    continue;
                try {
                    const startTime = performance.now();
                    const result = await this.executeTechniqueWithTimeout(technique, file.content ?? '', file.relPath, file.ast && 'node' in file.ast ? file.ast : null, file.fullPath, context);
                    if (result) {
                        const occs = Array.isArray(result) ? result : [result];
                        occurrences.push(...occs);
                    }
                    const duration = performance.now() - startTime;
                    metrics.push({
                        nome: technique.nome || 'desconhecido',
                        duracaoMs: duration,
                        ocorrencias: Array.isArray(result) ? result.length : result ? 1 : 0,
                        global: false,
                    });
                }
                catch (error) {
                    const err = error;
                    occurrences.push(ocorrenciaErroAnalista({
                        mensagem: `Falha na técnica '${technique.nome}' para ${file.relPath}: ${err.message}`,
                        relPath: file.relPath,
                        origem: technique.nome,
                    }));
                }
            }
        }
        return {
            occurrences,
            metrics,
            totalProcessed: files.length,
            duration: performance.now() - startTime,
        };
    }
    async executeTechniqueWithTimeout(technique, content, relPath, ast, fullPath, context) {
        if (this.timeoutMs > 0) {
            let timer = null;
            const timeoutPromise = new Promise((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(`Timeout: analista '${technique.nome}' excedeu ${this.timeoutMs}ms`));
                }, this.timeoutMs);
            });
            const execPromise = technique.aplicar(content, relPath, ast, fullPath, context);
            try {
                return await Promise.race([execPromise, timeoutPromise]);
            }
            finally {
                if (timer)
                    clearTimeout(timer);
            }
        }
        else {
            return await technique.aplicar(content, relPath, ast, fullPath, context);
        }
    }
    getStats() {
        return {
            maxWorkers: this.maxWorkers,
            batchSize: this.batchSize,
            enabled: this.enabled,
            activeWorkers: this.activeWorkers,
            completedWorkers: this.results.length,
            totalErrors: this.errors.length,
            errors: this.errors,
        };
    }
}
export async function processarComWorkers(files, techniques, context, options) {
    const pool = new WorkerPool(options);
    return await pool.processFiles(files, techniques, context);
}
//# sourceMappingURL=worker-pool.js.map