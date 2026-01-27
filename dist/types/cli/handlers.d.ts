import type { Pendencia } from '../index.js';
export interface CasoTipoInseguro {
    arquivo: string;
    linha?: number;
    tipo: 'tipo-inseguro-any' | 'tipo-inseguro-unknown';
    categoria: 'legitimo' | 'melhoravel' | 'corrigir';
    confianca: number;
    motivo: string;
    sugestao?: string;
    variantes?: string[];
    contexto?: string;
}
export interface FixTypesExportOptions {
    baseDir: string;
    casos: CasoTipoInseguro[];
    stats: {
        legitimo: number;
        melhoravel: number;
        corrigir: number;
        totalConfianca: number;
    };
    minConfidence: number;
    verbose: boolean;
}
export interface FixTypesExportResult {
    markdown: string;
    json: string;
    dir: string;
}
export interface GuardianBaselineCli {
    timestamp?: string;
    arquetipo?: string;
    confianca?: number;
    arquivos?: string[];
    [key: string]: unknown;
}
export interface GuardianExportOptions {
    baseDir: string;
    status: string;
    baseline?: GuardianBaselineCli;
    drift?: {
        alterouArquetipo: boolean;
        deltaConfidence?: number;
        arquivosNovos?: string[];
        arquivosRemovidos?: string[];
    };
    erros?: Array<{
        arquivo: string;
        mensagem: string;
    }>;
    warnings?: Array<{
        arquivo: string;
        mensagem: string;
    }>;
}
export interface GuardianExportResult {
    markdown: string;
    json: string;
    dir: string;
}
export interface ReestruturacaoExportOptions {
    baseDir: string;
    movimentos: Array<{
        de: string;
        para: string;
    } | {
        atual: string;
        ideal: string | null;
    }>;
    simulado: boolean;
    origem?: string;
    preset?: string;
    conflitos?: number;
}
export interface ReestruturacaoExportResult {
    markdown: string;
    json: string;
    dir: string;
}
export interface PodaExportOptions {
    baseDir: string;
    podados: Pendencia[];
    pendentes: Pendencia[];
    simulado: boolean;
}
export interface PodaExportResult {
    markdown: string;
    json: string;
    dir: string;
}
//# sourceMappingURL=handlers.d.ts.map