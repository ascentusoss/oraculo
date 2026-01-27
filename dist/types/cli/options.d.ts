export type TipoLinguagemProjeto = 'typescript' | 'nodejs' | 'python' | 'java' | 'dotnet' | 'generico';
export interface FiltrosProcessados {
    include?: string[];
    exclude?: string[];
    includeGroups: string[][];
    includeFlat: string[];
    excludePatterns: string[];
    incluiNodeModules?: boolean;
    tipoProjeto?: TipoLinguagemProjeto;
}
export interface OpcoesProcessamentoFiltros {
    verbose?: boolean;
    allowEmpty?: boolean;
    normalizePatterns?: boolean;
    include?: string[];
    exclude?: string[];
    forceIncludeNodeModules?: boolean;
    forceIncludeTests?: boolean;
}
export interface OraculoGlobalFlags {
    silence?: boolean;
    verbose?: boolean;
    export?: boolean;
    dev?: boolean;
    debug?: boolean;
    logEstruturado?: boolean;
    incremental?: boolean;
    meticas?: boolean;
    scanOnly?: boolean;
}
export interface FixTypesOptions {
    dryRun?: boolean;
    target?: string;
    confidence?: number;
    verbose?: boolean;
    interactive?: boolean;
    export?: boolean;
    include?: string[];
    exclude?: string[];
}
export type ModoOperacao = 'compact' | 'full' | 'executive' | 'quick';
export type FormatoSaida = 'console' | 'json' | 'markdown';
export type NivelLog = 'error' | 'warn' | 'info' | 'debug';
export type ModoAutoFix = 'conservative' | 'balanced' | 'aggressive';
export interface FlagsNormalizadas {
    mode: ModoOperacao;
    output: {
        format: FormatoSaida;
        jsonAscii: boolean;
        export: boolean;
        exportFull: boolean;
        exportDir: string;
    };
    filters: {
        include: string[];
        exclude: string[];
        includeTests: boolean;
        includeNodeModules: boolean;
    };
    performance?: {
        fastMode: boolean;
    };
    autoFix: {
        enabled: boolean;
        mode: ModoAutoFix;
        dryRun: boolean;
    };
    guardian: {
        enabled: boolean;
        fullScan: boolean;
        saveBaseline: boolean;
    };
    verbosity: {
        level: NivelLog;
        silent: boolean;
    };
    special: {
        listarAnalistas: boolean;
        criarArquetipo: boolean;
        salvarArquetipo: boolean;
    };
}
export interface FlagsBrutas {
    full?: boolean;
    executive?: boolean;
    quick?: boolean;
    json?: boolean;
    jsonAscii?: boolean;
    markdown?: boolean;
    export?: boolean;
    exportFull?: boolean;
    exportTo?: string;
    include?: string[];
    exclude?: string[];
    onlySrc?: boolean;
    withTests?: boolean;
    withNodeModules?: boolean;
    fix?: boolean;
    fixMode?: string;
    fixSafe?: boolean;
    fixAggressive?: boolean;
    dryRun?: boolean;
    showFixes?: boolean;
    autoFix?: boolean;
    autoFixMode?: string;
    autoFixConservative?: boolean;
    guardian?: boolean;
    guardianCheck?: boolean;
    guardianFull?: boolean;
    guardianBaseline?: boolean;
    logLevel?: string;
    quiet?: boolean;
    verbose?: boolean;
    silent?: boolean;
    listarAnalistas?: boolean;
    criarArquetipo?: boolean;
    salvarArquetipo?: boolean;
    detalhado?: boolean;
    debug?: boolean;
    dev?: boolean;
}
export interface ResultadoValidacao {
    valid: boolean;
    errors: string[];
    warnings: string[];
    normalized: FlagsNormalizadas;
}
export interface OtimizarSvgOptions {
    dir?: string;
    write?: boolean;
    dry?: boolean;
    include?: string[];
    exclude?: string[];
}
//# sourceMappingURL=options.d.ts.map