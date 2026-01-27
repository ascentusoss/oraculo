// SPDX-License-Identifier: MIT

export type RegraIncluiExclui = {
  include?: boolean;
  exclude?: boolean;
  patterns?: string[];
  custom?: (relPath: string, entry: import('node:fs').Dirent) => boolean;
};

// Configuração SIMPLIFICADA - apenas globalExcludeGlob é usado
export type ConfigIncluiExclui = {
  // ÚNICO campo usado - outros campos são ignorados
  globalExcludeGlob?: string[];

  // Campos OBSOLETOS - mantidos apenas para compatibilidade durante migração
  globalInclude?: string[];
  globalExclude?: string[];
  globalIncludeGlob?: string[];
  dirRules?: Record<string, RegraIncluiExclui>;
};

// Aliases para manter compatibilidade com nomes anteriores (inglês)
export type IncludeExcludeRule = RegraIncluiExclui;
export type IncludeExcludeConfig = ConfigIncluiExclui;
