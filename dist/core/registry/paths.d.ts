export declare const PROJECT_ROOT: string;
export declare const ORACULO_DIRS: {
    readonly STATE: string;
    readonly METRICS_HISTORY: string;
    readonly REPORTS: string;
    readonly PERF: string;
};
export declare const ORACULO_FILES: {
    readonly CONFIG: string;
    readonly CONFIG_SAFE: string;
    readonly GUARDIAN_BASELINE: string;
    readonly ESTRUTURA_BASELINE: string;
    readonly ESTRUTURA_ARQUETIPO: string;
    readonly MAPA_REVERSAO: string;
    readonly REGISTRO_VIGIA: string;
    readonly METRICAS_HISTORICO: string;
    readonly GUARDIAN_BASELINE_LEGACY: string;
    readonly ESTRUTURA_BASELINE_LEGACY: string;
    readonly ESTRUTURA_ARQUETIPO_LEGACY_ROOT: string;
};
export declare const REPORT_PATTERNS: {
    readonly DIAGNOSTICO: (timestamp: string) => string;
    readonly SUMMARY_JSON: (timestamp: string) => string;
    readonly ASYNC_ANALYSIS: string;
    readonly PERF_BASELINE: (timestamp: string) => string;
    readonly PERF_DIFF: string;
};
export declare const MIGRATION_MAP: {
    readonly [ORACULO_FILES.GUARDIAN_BASELINE_LEGACY]: string;
    readonly [ORACULO_FILES.ESTRUTURA_BASELINE_LEGACY]: string;
    readonly [ORACULO_FILES.ESTRUTURA_ARQUETIPO_LEGACY_ROOT]: string;
};
export declare function resolveFilePath(newPath: string): string;
export type OraculoFilePath = (typeof ORACULO_FILES)[keyof typeof ORACULO_FILES];
export type OraculoDirPath = (typeof ORACULO_DIRS)[keyof typeof ORACULO_DIRS];
//# sourceMappingURL=paths.d.ts.map