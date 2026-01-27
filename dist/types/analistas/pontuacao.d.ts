export interface ConfiguracaoPontuacaoAnalista {
    pesoBase: number;
    multiplicadores: {
        complexidade?: number;
        cobertura?: number;
        documentacao?: number;
        performance?: number;
        seguranca?: number;
    };
    limiares: {
        minimo: number;
        maximo: number;
        critico: number;
    };
    ajustes?: Record<string, number>;
}
//# sourceMappingURL=pontuacao.d.ts.map