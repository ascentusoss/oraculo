export interface EvidenciaContexto {
    tipo: 'dependencia' | 'import' | 'export' | 'estrutura' | 'config' | 'script' | 'codigo' | string;
    valor: string;
    confianca: number;
    tecnologia?: string;
    origem?: string;
    localizacao?: string;
    detalhes?: Record<string, unknown>;
}
export interface ResultadoDeteccaoContextual {
    tecnologia?: string;
    contextoIdentificado?: string;
    confiancaTotal: number;
    evidencias: EvidenciaContexto[];
    sugestoesMelhoria?: string[];
    problemasDetectados?: string[];
    sinaisAdicionais?: string[];
}
//# sourceMappingURL=contexto.d.ts.map