// SPDX-License-Identifier: MIT
/**
 * Tipos para detecção de contexto de projetos
 * Originalmente em: src/shared/contexto-projeto.ts
 */

export interface ContextoProjeto {
  isBot: boolean;
  isCLI: boolean;
  isWebApp: boolean;
  isLibrary: boolean;
  isTest: boolean;
  isConfig: boolean;
  isInfrastructure: boolean;
  frameworks: string[];
  linguagens: string[];
  arquetipo?: string;
}

export interface DetectarContextoOpcoes {
  arquivo: string;
  conteudo: string;
  relPath?: string;
  packageJson?: Record<string, unknown>;
}
