export declare function dedupeOcorrencias<T extends {
    relPath?: string;
    linha?: number;
    tipo?: string;
    mensagem?: string;
}>(arr: T[]): T[];
export declare function agruparAnalistas(analistas?: Array<Record<string, unknown>>): Array<{
    nome: string;
    duracaoMs: number;
    ocorrencias: number;
    execucoes: number;
    global: boolean;
}>;
//# sourceMappingURL=ocorrencias.d.ts.map