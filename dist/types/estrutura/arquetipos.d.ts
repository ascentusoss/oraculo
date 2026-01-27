import type { PlanoSugestaoEstrutura } from '../index.js';
export interface ArquetipoEstruturaDef {
    nome: string;
    descricao: string;
    requiredDirs?: string[];
    optionalDirs?: string[];
    forbiddenDirs?: string[];
    rootFilesAllowed?: string[];
    dependencyHints?: string[];
    filePresencePatterns?: string[];
    pesoBase?: number;
}
export interface ArquetipoPersonalizado {
    nome: string;
    descricao?: string;
    arquetipoOficial: string;
    estruturaPersonalizada: {
        diretorios: string[];
        arquivosChave: string[];
        padroesNomenclatura?: Record<string, string>;
    };
    melhoresPraticas?: {
        recomendado?: string[];
        evitar?: string[];
        notas?: string[];
    };
    metadata?: {
        criadoEm: string;
        versao: string;
        notasUsuario?: string;
    };
}
export interface ArquetipoDeteccaoAnomalia {
    path: string;
    motivo: string;
    sugerido?: string;
}
export interface ResultadoDeteccaoArquetipo {
    nome: string;
    descricao: string;
    score: number;
    confidence: number;
    matchedRequired: string[];
    missingRequired: string[];
    matchedOptional: string[];
    dependencyMatches: string[];
    filePatternMatches: string[];
    forbiddenPresent: string[];
    anomalias: ArquetipoDeteccaoAnomalia[];
    planoSugestao?: PlanoSugestaoEstrutura;
    sugestaoPadronizacao?: string;
    explicacaoSimilaridade?: string;
    candidatoExtra?: string;
}
//# sourceMappingURL=arquetipos.d.ts.map