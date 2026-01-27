// SPDX-License-Identifier: MIT
/**
 * Tipos para processamento de filtros e opções da CLI
 */

/**
 * Tipo de linguagem/plataforma detectada (diferente de TipoProjeto que é arquitetura)
 */
export type TipoLinguagemProjeto =
  | 'typescript'
  | 'nodejs'
  | 'python'
  | 'java'
  | 'dotnet'
  | 'generico';

/**
 * Filtros processados após normalização
 */
export interface FiltrosProcessados {
  include?: string[];
  exclude?: string[];
  includeGroups: string[][];
  includeFlat: string[];
  excludePatterns: string[];
  incluiNodeModules?: boolean;
  tipoProjeto?: TipoLinguagemProjeto;
}

/**
 * Opções para processamento de filtros
 */
export interface OpcoesProcessamentoFiltros {
  verbose?: boolean;
  allowEmpty?: boolean;
  normalizePatterns?: boolean;
  include?: string[];
  exclude?: string[];
  forceIncludeNodeModules?: boolean;
  forceIncludeTests?: boolean;
}

/**
 * Flags globais aplicáveis em todos os comandos do Oráculo
 */
export interface OraculoGlobalFlags {
  silence?: boolean;
  verbose?: boolean;
  export?: boolean;
  dev?: boolean; // legado removido da CLI; mantido aqui apenas para compat de parse em tests antigos
  debug?: boolean;
  logEstruturado?: boolean;
  incremental?: boolean;
  meticas?: boolean;
  scanOnly?: boolean;
}

/**
 * Opções do comando fix-types
 */
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

/**
 * Modo de operação do diagnóstico (mutuamente exclusivo)
 */
export type ModoOperacao = 'compact' | 'full' | 'executive' | 'quick';

/**
 * Formato de saída
 */
export type FormatoSaida = 'console' | 'json' | 'markdown';

/**
 * Nível de log
 */
export type NivelLog = 'error' | 'warn' | 'info' | 'debug';

/**
 * Modo de auto-fix
 */
export type ModoAutoFix = 'conservative' | 'balanced' | 'aggressive';

/**
 * Flags normalizadas (estrutura consistente)
 */
export interface FlagsNormalizadas {
  // Modo de operação (apenas um ativo)
  mode: ModoOperacao;

  // Saída
  output: {
    format: FormatoSaida;
    jsonAscii: boolean;
    export: boolean;
    exportFull: boolean;
    exportDir: string;
  };

  // Filtros
  filters: {
    include: string[];
    exclude: string[];
    includeTests: boolean;
    includeNodeModules: boolean;
  };

  // Performance
  performance?: {
    fastMode: boolean;
  };

  // Auto-fix
  autoFix: {
    enabled: boolean;
    mode: ModoAutoFix;
    dryRun: boolean;
  };

  // Guardian
  guardian: {
    enabled: boolean;
    fullScan: boolean;
    saveBaseline: boolean;
  };

  // Verbosidade
  verbosity: {
    level: NivelLog;
    silent: boolean;
  };

  // Especiais
  special: {
    listarAnalistas: boolean;
    criarArquetipo: boolean;
    salvarArquetipo: boolean;
  };
}

/**
 * Flags brutas da CLI (antes da normalização)
 */
export interface FlagsBrutas {
  // Modos
  full?: boolean;
  executive?: boolean;
  quick?: boolean;

  // Saída
  json?: boolean;
  jsonAscii?: boolean;
  markdown?: boolean;
  export?: boolean;
  exportFull?: boolean;
  exportTo?: string;

  // Filtros
  include?: string[];
  exclude?: string[];
  onlySrc?: boolean;
  withTests?: boolean;
  withNodeModules?: boolean;

  // Auto-fix
  fix?: boolean;
  fixMode?: string;
  fixSafe?: boolean;
  fixAggressive?: boolean;
  dryRun?: boolean;
  showFixes?: boolean;
  autoFix?: boolean;
  autoFixMode?: string;
  autoFixConservative?: boolean;

  // Guardian
  guardian?: boolean;
  guardianCheck?: boolean;
  guardianFull?: boolean;
  guardianBaseline?: boolean;

  // Verbosidade
  logLevel?: string;
  quiet?: boolean;
  verbose?: boolean;
  silent?: boolean;

  // Especiais
  listarAnalistas?: boolean;
  criarArquetipo?: boolean;
  salvarArquetipo?: boolean;

  // Legacy (deprecadas)
  detalhado?: boolean;
  debug?: boolean;
  dev?: boolean;
} /**
 * Resultado de validação de flags
 */
export interface ResultadoValidacao {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: FlagsNormalizadas;
}

/**
 * Opções do comando otimizar-svg
 */
export interface OtimizarSvgOptions {
  dir?: string;
  write?: boolean;
  dry?: boolean;
  include?: string[];
  exclude?: string[];
}
