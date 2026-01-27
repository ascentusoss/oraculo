// SPDX-License-Identifier: MIT

// SPDX-License-Identifier: MIT
// Merged auto-fix configuration: keep compatibility with both older
// AUTO_FIX_CONFIG_DEFAULTS and the newer DEFAULT_AUTO_FIX_CONFIG surface.

import type { AutoFixConfig } from '@';

// Re-exporta o tipo para compatibilidade
export type { AutoFixConfig };

export const DEFAULT_AUTO_FIX_CONFIG: AutoFixConfig = {
  mode: 'balanced',
  minConfidence: 75,
  allowedCategories: ['security', 'performance', 'style', 'documentation'],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/*.min.js',
    '**/src/nucleo/configuracao/**',
    '**/src/shared/persistence/**',
    '**/operario-estrutura.ts',
    '**/corretor-estrutura.ts',
    '**/mapa-reversao.ts',
    '**/quick-fix-registry.ts',
    '**/config.ts',
    '**/executor.ts',
  ],
  excludeFunctionPatterns: [
    'planejar',
    'aplicar',
    'corrigir',
    'executar',
    'processar',
    'salvar.*Estado',
    'ler.*Estado',
    'gerarPlano.*',
    'detectar.*',
    'analisar.*',
    'validar.*',
  ],
  maxFixesPerFile: 5,
  createBackup: true,
  validateAfterFix: true,
  // backwards compat defaults
  allowMutateFs: false,
  backupSuffix: '.local.bak',
  conservative: true,
};

export const CONSERVATIVE_AUTO_FIX_CONFIG: AutoFixConfig = {
  ...DEFAULT_AUTO_FIX_CONFIG,
  mode: 'conservative',
  minConfidence: 90,
  allowedCategories: ['security', 'performance'],
  maxFixesPerFile: 2,
  excludePatterns: [
    ...((DEFAULT_AUTO_FIX_CONFIG.excludePatterns as string[]) || []),
    '**/src/analistas/**',
    '**/src/arquitetos/**',
    '**/src/zeladores/**',
    '**/src/guardian/**',
    '**/src/cli/**',
  ],
};

export const AGGRESSIVE_AUTO_FIX_CONFIG: AutoFixConfig = {
  ...DEFAULT_AUTO_FIX_CONFIG,
  mode: 'aggressive',
  minConfidence: 60,
  maxFixesPerFile: 10,
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/*.min.js',
  ],
};

// Backwards compat constant name used elsewhere in the codebase
export const AUTO_FIX_CONFIG_DEFAULTS = DEFAULT_AUTO_FIX_CONFIG;

export default AUTO_FIX_CONFIG_DEFAULTS;

export function shouldExcludeFile(
  filePath: string,
  config: AutoFixConfig,
): boolean {
  if (!config || !config.excludePatterns) return false;
  return config.excludePatterns.some((pattern) => {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(regexPattern).test(filePath);
  });
}

export function shouldExcludeFunction(
  functionName: string,
  config: AutoFixConfig,
): boolean {
  if (!config || !config.excludeFunctionPatterns) return false;
  return config.excludeFunctionPatterns.some((pattern) =>
    new RegExp(pattern, 'i').test(functionName),
  );
}

export function isCategoryAllowed(
  category: string,
  config: AutoFixConfig,
): boolean {
  if (!config || !config.allowedCategories) return true;
  // allowedCategories is an array of known category strings - coerce to string[] for safe includes check
  return (config.allowedCategories as string[]).includes(category);
}

export function hasMinimumConfidence(
  confidence: number,
  config: AutoFixConfig,
): boolean {
  if (typeof config?.minConfidence !== 'number') return true;
  return confidence >= (config.minConfidence as number);
}

export function getAutoFixConfig(mode?: string): AutoFixConfig {
  switch (mode) {
    case 'conservative':
      return CONSERVATIVE_AUTO_FIX_CONFIG;
    case 'aggressive':
      return AGGRESSIVE_AUTO_FIX_CONFIG;
    case 'balanced':
    default:
      return DEFAULT_AUTO_FIX_CONFIG;
  }
}
