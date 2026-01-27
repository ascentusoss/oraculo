// SPDX-License-Identifier: MIT
/**
 * Helper centralizado para lógica de include/exclude dinâmica SIMPLIFICADA.
 *
 * REGRA: Apenas globalExcludeGlob é usado para configuração permanente.
 * CLI flags (--include/--exclude) sempre dominam.
 */
import type { Dirent } from 'node:fs';

import micromatch from 'micromatch';

import type { ConfigIncluiExclui } from '@';

/**
 * Avalia se um caminho deve ser incluído conforme config simplificada.
 * Hierarquia: CLI flags > globalExcludeGlob > inclui por padrão
 */
export function shouldInclude(
  relPath: string,
  entry: Dirent,
  config: ConfigIncluiExclui,
): boolean {
  // APENAS globalExcludeGlob é considerado - outros campos são ignorados
  if (
    Array.isArray(config.globalExcludeGlob) &&
    config.globalExcludeGlob.length > 0 &&
    micromatch.isMatch(relPath, config.globalExcludeGlob)
  ) {
    return false;
  }

  // Default: inclui se não excluído
  return true;
}
