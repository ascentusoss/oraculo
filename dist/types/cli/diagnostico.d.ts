import type { Ocorrencia } from '../comum/ocorrencias.js';
export interface OpcoesDiagnosticoBase {
    target: string;
    include: string[];
    exclude: string[];
    verbose: boolean;
    export: boolean;
    exportFull: boolean;
    scanOnly: boolean;
}
export interface ResultadoDiagnosticoBase {
    sucesso: boolean;
    ocorrencias: Ocorrencia[];
    arquivosAnalisados: number;
    duracaoMs: number;
}
export interface LocBabel {
    start?: {
        line?: number;
        column?: number;
    };
    end?: {
        line?: number;
        column?: number;
    };
}
//# sourceMappingURL=diagnostico.d.ts.map