type ErroUnknown = unknown;
export declare const DetectorArquiteturaMessages: {
    readonly padraoArquitetural: (padraoIdentificado: string | undefined, confianca: number) => string;
    readonly caracteristicas: (caracteristicas: string[]) => string;
    readonly violacao: (violacao: string) => string;
    readonly metricas: (acoplamento: number, coesao: number) => string;
    readonly erroAnalisarArquitetura: (erro: ErroUnknown) => string;
};
export {};
//# sourceMappingURL=detector-arquitetura-messages.d.ts.map