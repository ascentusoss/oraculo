// SPDX-License-Identifier: MIT
/**
 * 🎯 Validação e Normalização de Flags do Comando Diagnosticar
 *
 * Sistema robusto para:
 * - Validar flags e detectar conflitos
 * - Normalizar aliases e atalhos
 * - Aplicar defaults inteligentes
 * - Gerar avisos e sugestões contextuais
 */

import type {
  FlagsBrutas,
  FlagsNormalizadas,
  ModoAutoFix,
  ModoOperacao,
  ResultadoValidacao,
} from '@'; /**
 * Defaults seguros
 */
const DEFAULTS: FlagsNormalizadas = {
  mode: 'compact',
  output: {
    format: 'console',
    jsonAscii: false,
    export: false,
    exportFull: false,
    exportDir: 'relatorios',
  },
  filters: {
    include: [],
    exclude: [],
    includeTests: false,
    includeNodeModules: false,
  },
  performance: {
    fastMode: false,
  },
  autoFix: {
    enabled: false,
    mode: 'balanced',
    dryRun: false,
  },
  guardian: {
    enabled: false,
    fullScan: false,
    saveBaseline: false,
  },
  verbosity: {
    level: 'info',
    silent: false,
  },
  special: {
    listarAnalistas: false,
    criarArquetipo: false,
    salvarArquetipo: false,
  },
};

/**
 * Valida e normaliza flags do comando diagnosticar
 */
export function validateAndNormalizeFlags(
  opts: FlagsBrutas,
): ResultadoValidacao {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalized: FlagsNormalizadas = JSON.parse(JSON.stringify(DEFAULTS));

  /* -------------------------- 1. MODO DE OPERAÇÃO (mutuamente exclusivo) -------------------------- */
  const modesAtivos = [
    opts.full && 'full',
    opts.executive && 'executive',
    opts.quick && 'quick',
  ].filter(Boolean) as string[];
  // Trust compiler: reduz falsos positivos quando TS/ESLint não reportam erros
  if ((opts as unknown as Record<string, unknown>)['trustCompiler']) {
    (normalized as unknown as Record<string, unknown>)['special'] = {
      ...(normalized.special || {}),
      // sinaliza modo de confiança do compilador para pipeline
      // será checado em processamento-diagnostico
      trustCompiler: true,
    } as unknown as FlagsNormalizadas['special'] & { trustCompiler: boolean };
  }
  if ((opts as unknown as Record<string, unknown>)['verifyCycles']) {
    (normalized as unknown as Record<string, unknown>)['special'] = {
      ...(normalized.special || {}),
      verifyCycles: true,
    } as unknown as FlagsNormalizadas['special'] & { verifyCycles: boolean };
  }

  if (modesAtivos.length > 1) {
    errors.push(
      `Conflito: apenas um modo pode ser ativo (${modesAtivos.join(', ')})`,
    );
  } else if (modesAtivos.length === 1) {
    normalized.mode = modesAtivos[0] as ModoOperacao;
  }

  /* -------------------------- 2. FORMATO DE SAÍDA -------------------------- */
  const formatosAtivos = [
    opts.json && 'json',
    opts.markdown && 'markdown',
  ].filter(Boolean) as string[];

  if (formatosAtivos.length > 1) {
    errors.push(
      `Conflito: apenas um formato pode ser ativo (${formatosAtivos.join(', ')})`,
    );
  } else if (formatosAtivos.length === 1) {
    normalized.output.format = formatosAtivos[0] as 'json' | 'markdown';
  }

  // JSON ASCII escaping
  if (opts.jsonAscii) {
    normalized.output.jsonAscii = true;
  }

  // Export
  if (opts.export) {
    normalized.output.export = true;
  }
  if (opts.exportFull) {
    normalized.output.exportFull = true;
    normalized.output.export = true; // exportFull implica export
  }
  if (opts.exportTo) {
    normalized.output.exportDir = opts.exportTo;
  }

  /* -------------------------- 3. FILTROS -------------------------- */
  if (opts.include && opts.include.length > 0) {
    normalized.filters.include = opts.include;
  }
  if (opts.exclude && opts.exclude.length > 0) {
    normalized.filters.exclude = opts.exclude;
  }
  if ((opts as unknown as Record<string, unknown>)['excludeTests']) {
    normalized.filters.exclude = [
      ...normalized.filters.exclude,
      '**/*.test.*',
      '**/*.spec.*',
      'tests/**',
      'test/**',
      '**/__tests__/**',
    ];
  }
  if (opts.withTests) {
    normalized.filters.includeTests = true;
  }
  if (opts.withNodeModules) {
    normalized.filters.includeNodeModules = true;
  }

  // onlySrc é exclusivo com include customizado
  if (opts.onlySrc && normalized.filters.include.length > 0) {
    warnings.push('--only-src será ignorado porque --include foi especificado');
  } else if (opts.onlySrc) {
    normalized.filters.include = ['src/**'];
  }

  /* -------------------------- 4. AUTO-FIX -------------------------- */
  if (opts.fix || opts.autoFix) {
    normalized.autoFix.enabled = true;
  }

  // Modo de auto-fix (prioridade: autoFixMode > fixMode > flags individuais)
  let modoAutoFix: ModoAutoFix | undefined;

  if (opts.autoFixMode) {
    modoAutoFix = opts.autoFixMode as ModoAutoFix;
  } else if (opts.fixMode) {
    modoAutoFix = opts.fixMode as ModoAutoFix;
  } else if (opts.autoFixConservative || opts.fixSafe) {
    modoAutoFix = 'conservative';
  } else if (opts.fixAggressive) {
    modoAutoFix = 'aggressive';
  }

  if (modoAutoFix) {
    const validModes: ModoAutoFix[] = [
      'conservative',
      'balanced',
      'aggressive',
    ];
    if (validModes.includes(modoAutoFix)) {
      normalized.autoFix.mode = modoAutoFix;
    } else {
      warnings.push(
        `Modo de auto-fix inválido: ${modoAutoFix}. Usando 'balanced'.`,
      );
    }
  }

  // Dry run
  if (opts.dryRun) {
    normalized.autoFix.dryRun = true;
  }

  /* -------------------------- 5. GUARDIAN -------------------------- */
  if (opts.guardian || opts.guardianCheck) {
    normalized.guardian.enabled = true;
  }
  if (opts.guardianFull) {
    normalized.guardian.fullScan = true;
    normalized.guardian.enabled = true; // fullScan implica enabled
  }
  if (opts.guardianBaseline) {
    normalized.guardian.saveBaseline = true;
    normalized.guardian.enabled = true; // saveBaseline implica enabled
  }

  /* -------------------------- 6. VERBOSIDADE -------------------------- */
  /* -------------------------- 7. PERFORMANCE -------------------------- */
  if ((opts as unknown as Record<string, unknown>)['fast']) {
    (normalized as unknown as Record<string, unknown>)['performance'] = {
      fastMode: true,
    };
  }
  const verbosidadeAtiva = [
    opts.silent && 'silent',
    opts.quiet && 'quiet',
    opts.verbose && 'verbose',
  ].filter(Boolean) as string[];

  if (verbosidadeAtiva.length > 1) {
    warnings.push(
      `Conflito de verbosidade: ${verbosidadeAtiva.join(', ')}. Usando última.`,
    );
  }

  if (opts.silent) {
    normalized.verbosity.silent = true;
    normalized.verbosity.level = 'error';
  } else if (opts.quiet) {
    normalized.verbosity.level = 'warn';
  } else if (opts.verbose || opts.debug) {
    normalized.verbosity.level = 'debug';
  } else if (opts.logLevel) {
    const validLevels: Array<'error' | 'warn' | 'info' | 'debug'> = [
      'error',
      'warn',
      'info',
      'debug',
    ];
    const level = opts.logLevel as 'error' | 'warn' | 'info' | 'debug';
    if (validLevels.includes(level)) {
      normalized.verbosity.level = level;
    } else {
      warnings.push(`Nível de log inválido: ${opts.logLevel}. Usando 'info'.`);
    }
  }

  /* -------------------------- 8. ESPECIAIS -------------------------- */
  if (opts.listarAnalistas) {
    normalized.special.listarAnalistas = true;
  }
  if (opts.criarArquetipo) {
    normalized.special.criarArquetipo = true;
  }
  if (opts.salvarArquetipo) {
    normalized.special.salvarArquetipo = true;
    normalized.special.criarArquetipo = true; // salvar implica criar
    warnings.push(
      '--salvar-arquetipo implica --criar-arquetipo (será ativado)',
    );
  }

  /* -------------------------- RESULTADO -------------------------- */

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized,
  };
}

/**
 * Gera sugestões contextuais baseadas nas flags ativas
 */
export function gerarSugestoes(flags: FlagsNormalizadas): string[] {
  const sugestoes: string[] = [];

  // Modo
  if (flags.mode === 'compact') {
    sugestoes.push(
      '💡 Use --full para relatório detalhado com todas as informações',
    );
  } else if (flags.mode === 'executive') {
    sugestoes.push('👔 Modo executivo: mostrando apenas problemas críticos');
  }

  // Export
  if (!flags.output.export && flags.output.format === 'json') {
    sugestoes.push('💡 Combine --json com --export para salvar o relatório');
  }

  // Auto-fix
  if (flags.autoFix.enabled && !flags.autoFix.dryRun) {
    sugestoes.push(
      '⚠️  Auto-fix ativo! Use --dry-run para simular sem modificar arquivos',
    );
  }

  // Guardian
  if (!flags.guardian.enabled) {
    sugestoes.push(
      '🛡️  Guardian desativado. Use --guardian para verificar integridade',
    );
  }

  // Filtros
  if (flags.filters.include.length === 0) {
    sugestoes.push(
      '📂 Analisando todo o projeto. Use --include para focar em diretórios específicos',
    );
  }

  return sugestoes;
}
