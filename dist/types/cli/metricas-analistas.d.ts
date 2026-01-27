export interface MetricaAnalistaBruta {
    nome: string;
    categoria?: string;
    ocorrencias: number;
    duracaoMs: number;
    execucoes?: number;
    erros?: number;
    status?: 'sucesso' | 'erro' | 'timeout';
}
export interface MetricaAnalistaAgrupada {
    nome: string;
    categoria?: string;
    ocorrencias: number;
    duracaoMs: number;
    execucoes: number;
    erros: number;
    mediaMs: number;
}
export interface TopAnalistaProcessado {
    nome: string;
    totalMs: number;
    mediaMs: number;
    execucoes: number;
    ocorrencias: number;
}
export interface ResultadoExecucaoComMetricas {
    metricas?: {
        analistas?: MetricaAnalistaBruta[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
export interface MetricasFinaisProcessadas {
    analistas: MetricaAnalistaAgrupada[];
    topAnalistas?: TopAnalistaProcessado[];
    [key: string]: unknown;
}
//# sourceMappingURL=metricas-analistas.d.ts.map