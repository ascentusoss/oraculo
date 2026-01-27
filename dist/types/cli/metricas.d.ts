import type { MetricaAnalista, TopAnalista } from '../index.js';
export interface MetricaAnalistaLike {
    nome: string;
    duracaoMs: number;
    ocorrencias: number;
}
export interface MetricaExecucaoLike {
    totalArquivos: number;
    tempoParsingMs: number;
    tempoAnaliseMs: number;
    cacheAstHits: number;
    cacheAstMiss: number;
    analistas: MetricaAnalistaLike[];
}
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
    analistasTop?: {
        nome: string;
        duracaoMs: number;
        ocorrencias: number;
    }[];
    hashConteudo?: string;
}
export interface MetricaExecucao {
    totalArquivos?: number;
    tempoParsingMs?: number;
    tempoAnaliseMs?: number;
    cacheAstHits?: number;
    cacheAstMiss?: number;
    analistas?: MetricaAnalista[];
    topAnalistas?: TopAnalista[];
    tempoVarredura?: number;
    tempoAnalise?: number;
    tempoTotal?: number;
    arquivosProcessados?: number;
    ocorrenciasEncontradas?: number;
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
export interface ResultadoExecucao {
    ocorrencias: import('../index.js').Ocorrencia[];
    metricas: MetricaExecucao;
    estruturaIdentificada?: unknown;
    linguagens?: {
        total: number;
        extensoes: Record<string, number>;
    };
}
//# sourceMappingURL=metricas.d.ts.map