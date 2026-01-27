export interface AutoFixConfig {
    mode?: 'conservative' | 'balanced' | 'aggressive';
    minConfidence?: number;
    allowedCategories?: ('security' | 'performance' | 'style' | 'documentation')[];
    excludePatterns?: string[];
    excludeFunctionPatterns?: string[];
    maxFixesPerFile?: number;
    createBackup?: boolean;
    validateAfterFix?: boolean;
    allowMutateFs?: boolean;
    backupSuffix?: string;
    conservative?: boolean;
}
export interface PatternBasedQuickFix {
    id: string;
    title: string;
    description: string;
    pattern: RegExp;
    fix: (match: RegExpMatchArray, fullCode: string) => string;
    category: 'security' | 'performance' | 'style' | 'documentation';
    confidence: number;
    shouldApply?: (match: RegExpMatchArray, fullCode: string, lineContext: string, filePath?: string) => boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ConfiguracaoPontuacao {
    PENALIDADE_MISSING_REQUIRED: number;
    PESO_OPTIONAL: number;
    PESO_REQUIRED: number;
    PESO_DEPENDENCIA: number;
    PESO_PATTERN: number;
    PENALIDADE_FORBIDDEN: number;
    FATOR_ESCALA_TAMANHO_MAX: number;
    FATOR_COMPLEXIDADE_MAX: number;
    FATOR_MATURIDADE_MAX: number;
    THRESHOLD_CONFIANCA_MINIMA: number;
    THRESHOLD_DIFERENCA_DOMINANTE: number;
    THRESHOLD_HIBRIDO_REAL: number;
    BONUS_COMPLETUDE_BASE: number;
    BONUS_ESPECIFICIDADE_MULTIPLIER: number;
    PENALIDADE_GENERICO_EXTREMA: number;
    AJUSTE_CONFIANCA_PROJETO_GRANDE: number;
    AJUSTE_CONFIANCA_PROJETO_PEQUENO: number;
    LIMITE_ARQUIVOS_GRANDE: number;
    LIMITE_ARQUIVOS_PEQUENO: number;
    LIMITE_FUNCOES_MATURIDADE: number;
    MULTIPLICADOR_MATURIDADE: number;
}
export interface ConfigExcludesPadrao {
    padroesSistema: string[];
    nodeJs: string[];
    typeScript: string[];
    python: string[];
    java: string[];
    dotnet: string[];
    ferramentasDev: string[];
    controleVersao: string[];
    temporarios: string[];
    documentacao: string[];
    metadata: {
        versao: string;
        ultimaAtualizacao: string;
        descricao: string;
    };
}
//# sourceMappingURL=config.d.ts.map