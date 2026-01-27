// SPDX-License-Identifier: MIT
/**
 * Tipos para configuração do Oráculo
 * Consolidação de: src/core/config/auto/*, src/core/config/*.ts
 */

/**
 * Configuração de auto-fix
 * Originalmente em: src/core/config/auto/auto-fix-config.ts
 */
export interface AutoFixConfig {
  // conservative|balanced|aggressive behavioral mode
  mode?: 'conservative' | 'balanced' | 'aggressive';
  // minimal confidence required (0-100)
  minConfidence?: number;
  // categories allowed
  allowedCategories?: (
    | 'security'
    | 'performance'
    | 'style'
    | 'documentation'
  )[];
  // file glob patterns to exclude
  excludePatterns?: string[];
  // function name patterns to exclude
  excludeFunctionPatterns?: string[];
  // max fixes per file
  maxFixesPerFile?: number;
  // create backup before modifying
  createBackup?: boolean;
  // validate after fix
  validateAfterFix?: boolean;
  // backwards compat: allowMutateFs and backupSuffix
  allowMutateFs?: boolean;
  backupSuffix?: string;
  conservative?: boolean;
}

/**
 * Pattern-based quick fix (usado internamente pelo fix-config)
 * Originalmente em: src/core/config/auto/fix-config.ts
 */
export interface PatternBasedQuickFix {
  id: string;
  title: string;
  description: string;
  pattern: RegExp;
  fix: (match: RegExpMatchArray, fullCode: string) => string;
  category: 'security' | 'performance' | 'style' | 'documentation';
  confidence: number;
  shouldApply?: (
    match: RegExpMatchArray,
    fullCode: string,
    lineContext: string,
    filePath?: string,
  ) => boolean;
}

/**
 * Resultado de validação
 * Originalmente em: src/core/config/auto/validacao.ts
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuração de pontuação para análise de arquétipos
 * Originalmente em: src/core/config/configuracao-pontuacao.ts
 */
export interface ConfiguracaoPontuacao {
  // Constantes base (podem ser ajustadas conforme feedback)
  PENALIDADE_MISSING_REQUIRED: number;
  PESO_OPTIONAL: number;
  PESO_REQUIRED: number;
  PESO_DEPENDENCIA: number;
  PESO_PATTERN: number;
  PENALIDADE_FORBIDDEN: number;

  // Fatores adaptativos
  FATOR_ESCALA_TAMANHO_MAX: number;
  FATOR_COMPLEXIDADE_MAX: number;
  FATOR_MATURIDADE_MAX: number;

  // Thresholds de decisão
  THRESHOLD_CONFIANCA_MINIMA: number;
  THRESHOLD_DIFERENCA_DOMINANTE: number;
  THRESHOLD_HIBRIDO_REAL: number;

  // Bônus e penalidades contextuais
  BONUS_COMPLETUDE_BASE: number;
  BONUS_ESPECIFICIDADE_MULTIPLIER: number;
  PENALIDADE_GENERICO_EXTREMA: number;

  // Ajustes baseados no tamanho do projeto
  AJUSTE_CONFIANCA_PROJETO_GRANDE: number;
  AJUSTE_CONFIANCA_PROJETO_PEQUENO: number;
  LIMITE_ARQUIVOS_GRANDE: number;
  LIMITE_ARQUIVOS_PEQUENO: number;

  // Sistema de maturidade
  LIMITE_FUNCOES_MATURIDADE: number;
  MULTIPLICADOR_MATURIDADE: number;
}

/**
 * Configuração de excludes padrão
 * Originalmente em: src/core/config/excludes-padrao.ts
 */
export interface ConfigExcludesPadrao {
  /** Padrões de exclusão padrão do sistema */
  padroesSistema: string[];
  /** Padrões recomendados para projetos Node.js */
  nodeJs: string[];
  /** Padrões recomendados para projetos TypeScript */
  typeScript: string[];
  /** Padrões recomendados para projetos Python */
  python: string[];
  /** Padrões recomendados para projetos Java */
  java: string[];
  /** Padrões recomendados para projetos .NET/C# */
  dotnet: string[];
  /** Padrões para ferramentas de desenvolvimento */
  ferramentasDev: string[];
  /** Padrões para sistemas de controle de versão */
  controleVersao: string[];
  /** Padrões para arquivos temporários e cache */
  temporarios: string[];
  /** Padrões para documentação e assets */
  documentacao: string[];
  /** Metadados da configuração */
  metadata: {
    versao: string;
    ultimaAtualizacao: string;
    descricao: string;
  };
}
