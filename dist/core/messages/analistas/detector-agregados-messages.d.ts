type ErroUnknown = unknown;
export declare const DetectorAgregadosMessages: {
    readonly problemasSegurancaResumo: (severidade: string, resumo: string, total: number) => string;
    readonly erroAnalisarSeguranca: (erro: ErroUnknown) => string;
    readonly problemasPerformanceResumo: (impacto: string, resumo: string, total: number) => string;
    readonly erroAnalisarPerformance: (erro: ErroUnknown) => string;
    readonly problemasDocumentacaoResumo: (prioridade: string, resumo: string, total: number) => string;
    readonly erroAnalisarDocumentacao: (erro: ErroUnknown) => string;
    readonly duplicacoesResumo: (tipo: string, resumo: string, total: number) => string;
    readonly erroAnalisarDuplicacoes: (erro: ErroUnknown) => string;
    readonly problemasTesteResumo: (severidade: string, resumo: string, total: number) => string;
    readonly erroAnalisarQualidadeTestes: (erro: ErroUnknown) => string;
};
export {};
//# sourceMappingURL=detector-agregados-messages.d.ts.map