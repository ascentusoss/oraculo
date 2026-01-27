import type { IntegridadeStatus, ResultadoGuardian } from '../index.js';
export interface GuardianOptions {
    enabled: boolean;
    fullScan: boolean;
    saveBaseline: boolean;
    silent?: boolean;
}
export interface GuardianResultadoProcessamento {
    executado: boolean;
    resultado?: ResultadoGuardian;
    status?: IntegridadeStatus;
    drift?: number;
    temProblemas: boolean;
}
export interface ArquetipoOptions {
    enabled: boolean;
    salvar: boolean;
    timeout?: number;
    silent?: boolean;
}
export interface ArquetipoResult {
    executado: boolean;
    arquetipos?: Array<{
        tipo: string;
        confianca: number;
        caracteristicas?: string[];
    }>;
    principal?: {
        tipo: string;
        confianca: number;
    };
    salvo?: boolean;
    erro?: string;
}
export interface AutoFixOptions {
    mode: 'conservative' | 'balanced' | 'aggressive';
    dryRun: boolean;
    confidenceThreshold?: number;
    maxCorrecoesPorArquivo?: number;
    maxCorrecoesTotal?: number;
    silent: boolean;
    timeout?: number;
}
export interface AutoFixResult {
    executado: boolean;
    mode: 'conservative' | 'balanced' | 'aggressive';
    dryRun: boolean;
    stats: {
        arquivosAnalisados: number;
        arquivosModificados: number;
        correcoesAplicadas: number;
        correcoesSugeridas: number;
        correcoesPuladas: number;
    };
    correcoesPorTipo?: Record<string, number>;
    detalhes?: Array<{
        arquivo: string;
        tipo: string;
        linha?: number;
        mensagem: string;
        aplicada: boolean;
        confianca?: number;
    }>;
    erros?: string[];
    avisos?: string[];
    tempoExecucao?: number;
}
//# sourceMappingURL=diagnostico-handlers.d.ts.map