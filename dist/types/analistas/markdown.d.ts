export type MarkdownProblemaTipo = 'licenca-incompativel' | 'falta-proveniencia' | 'referencia-risco' | 'formato-invalido';
export type MarkdownSeveridade = 'critico' | 'alto' | 'medio' | 'baixo';
export interface MarkdownProblema {
    tipo: MarkdownProblemaTipo;
    descricao: string;
    severidade: MarkdownSeveridade;
    linha?: number;
    trecho?: string;
    sugestao?: string;
}
export interface MarkdownAnaliseArquivo {
    relPath: string;
    fullPath: string;
    problemas: MarkdownProblema[];
    temProveniencia: boolean;
    whitelisted: boolean;
    temRiscoOk: boolean;
}
export interface MarkdownLicensePatterns {
    incompativeis: RegExp[];
    cessaoDireitos: RegExp[];
    referenciasRisco: RegExp[];
}
export interface MarkdownWhitelistConfig {
    paths: string[];
    patterns: string[];
    dirs: string[];
}
export interface MarkdownDetectorOptions {
    checkProveniencia?: boolean;
    checkLicenses?: boolean;
    checkReferences?: boolean;
    whitelist?: MarkdownWhitelistConfig;
    headerLines?: number;
}
export interface MarkdownAnaliseStats {
    totalArquivos: number;
    arquivosComProblemas: number;
    semProveniencia: number;
    licencasIncompativeis: number;
    whitelistados: number;
    totalProblemas: number;
}
//# sourceMappingURL=markdown.d.ts.map