// SPDX-License-Identifier: MIT
/**
 * @fileoverview Tipos para configuração de aliases do Vitest
 */

/**
 * Alias de resolução de módulos do Vitest
 */
export interface VitestAlias {
  /** Padrão de busca (string ou RegExp) */
  find: string | RegExp;
  /** Caminho de substituição */
  replacement: string;
}
