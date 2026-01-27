// SPDX-License-Identifier: MIT
/**
 * Sistema de configuração granular de regras
 * Suporta:
 * - Regras por arquivo/diretório (glob patterns)
 * - Overrides específicos
 * - Severidade customizada
 * - Exclusões por padrão de arquivo
 */

import { config } from '@core/config/config.js';
import { minimatch } from 'minimatch';

import type { RuleConfig, RuleOverride } from '@';

export type { RuleConfig, RuleOverride };

/**
 * Verifica se uma regra deve ser aplicada para um arquivo específico
 */
export function isRuleSuppressed(ruleName: string, filePath: string): boolean {
  // Normaliza o caminho do arquivo (remove ./ e normaliza barras)
  const normalizedPath = filePath.replace(/^\.\//, '').replace(/\\/g, '/');

  // 1. Verifica suppressRules globais (config antigo - compatibilidade)
  const configData = config as unknown as {
    suppressRules?: string[];
    rules?: Record<string, RuleConfig>;
    testPatterns?: { files?: string[]; allowAnyType?: boolean };
  };

  const suppressRules = configData.suppressRules;
  if (suppressRules?.includes(ruleName)) {
    return true;
  }

  // 2. Verifica config.rules (novo sistema)
  const ruleConfig = configData.rules?.[ruleName];
  if (ruleConfig) {
    // Verifica se severity é 'off'
    if (ruleConfig.severity === 'off') {
      return true;
    }

    // Verifica se arquivo está em exclude patterns
    if (ruleConfig.exclude) {
      for (const pattern of ruleConfig.exclude) {
        if (minimatch(normalizedPath, pattern, { dot: true })) {
          return true;
        }
      }
    }

    // Verifica allowTestFiles para arquivos de teste
    if (ruleConfig.allowTestFiles && isTestFile(normalizedPath, configData)) {
      return true;
    }
  }

  // 3. Verifica padrões de teste globais (para tipo-inseguro em testes)
  if (ruleName === 'tipo-inseguro' || ruleName === 'tipo-inseguro-any') {
    const testPatterns = configData.testPatterns;
    if (testPatterns?.allowAnyType && isTestFile(normalizedPath, configData)) {
      return true;
    }
  }

  return false;
} /**
 * Verifica se um arquivo é de teste baseado nos padrões configurados
 */
function isTestFile(
  filePath: string,
  configData: { testPatterns?: { files?: string[] } },
): boolean {
  const testPatterns = configData.testPatterns?.files || [
    '**/*.test.*',
    '**/*.spec.*',
    'test/**/*',
    'tests/**/*',
    '**/__tests__/**',
  ];

  return testPatterns.some((pattern) =>
    minimatch(filePath, pattern, { dot: true }),
  );
}

/**
 * Obtém a severidade configurada para uma regra
 */
export function getRuleSeverity(
  ruleName: string,
  filePath: string,
): 'error' | 'warning' | 'info' | undefined {
  const configData = config as unknown as {
    rules?: Record<string, RuleConfig>;
  };
  const ruleConfig = configData.rules?.[ruleName];

  if (!ruleConfig) {
    return undefined;
  }

  // Se regra está suprimida, retorna undefined
  if (isRuleSuppressed(ruleName, filePath)) {
    return undefined;
  }

  // Mapeia severidades
  if (ruleConfig.severity === 'error') return 'error';
  if (ruleConfig.severity === 'warning') return 'warning';
  if (ruleConfig.severity === 'info') return 'info';

  return undefined;
}

/**
 * Verifica se uma ocorrência deve ser suprimida baseado na configuração
 */
export function shouldSuppressOccurrence(
  tipo: string,
  filePath: string,
  _severity?: string,
): boolean {
  // Extrai o nome base da regra
  // tipo-inseguro-any -> tipo-inseguro
  // tipo-inseguro-any-assertion -> tipo-inseguro
  // tipo-inseguro-any-cast -> tipo-inseguro
  // tipo-inseguro-unknown -> tipo-inseguro
  const baseRuleName = tipo.replace(/-(any|unknown|assertion|cast).*$/, '');

  // Verifica supressão para regra base e variantes
  const rulesToCheck = [tipo, baseRuleName];

  return rulesToCheck.some((rule) => isRuleSuppressed(rule, filePath));
}
