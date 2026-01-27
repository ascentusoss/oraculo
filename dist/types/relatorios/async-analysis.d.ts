export type AsyncCriticidade = 'critico' | 'alto' | 'medio' | 'baixo';
export interface AsyncIssuesArquivo {
    ocorrencias: Array<{
        linha?: number;
        mensagem: string;
        nivel: 'erro' | 'aviso' | 'info';
    }>;
    nivel: 'erro' | 'aviso' | 'info';
    total: number;
    criticidade?: AsyncCriticidade;
}
export type AsyncCategoria = 'cli' | 'analistas' | 'core' | 'guardian' | 'auto' | 'outros';
export interface AsyncCategoriaStats {
    totalArquivos: number;
    totalPromises: number;
}
export interface AsyncArquivoRanqueado {
    arquivo: string;
    total: number;
    nivel: 'erro' | 'aviso' | 'info';
    criticidade?: AsyncCriticidade;
}
export interface AsyncAnalysisReport {
    timestamp: string;
    totalIssues: number;
    totalFiles: number;
    topFiles: AsyncArquivoRanqueado[];
    categorias: Record<AsyncCategoria, AsyncCategoriaStats>;
    recomendacoes?: {
        criticos: string[];
        altos: string[];
        proximosPassos: string[];
    };
}
export interface AsyncAnalysisOptions {
    topN?: number;
    includeRecomendacoes?: boolean;
    minCriticidade?: AsyncCriticidade;
}
//# sourceMappingURL=async-analysis.d.ts.map