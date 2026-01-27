// SPDX-License-Identifier: MIT
/**
 * Tipos para sistema de correções automáticas
 */

import type { Ocorrencia } from '../comum/ocorrencias.js';

/**
 * Resultado de uma correção aplicada em um arquivo
 */
export interface CorrecaoResult {
  sucesso: boolean;
  arquivo: string;
  linhasModificadas: number;
  erro?: string;
}

/**
 * Configuração para aplicação de correções
 */
export interface CorrecaoConfig {
  dryRun: boolean;
  minConfianca: number;
  verbose: boolean;
  interactive: boolean;
}

/**
 * Resultado de análise estrutural para correções
 */
export interface ResultadoAnaliseEstrutural {
  sucesso: boolean;
  arquivosAnalisados: number;
  problemas: Ocorrencia[];
  sugestoes: string[];
}

// Re-exporta todos os tipos de type-safety (inclui ASTNode, CategorizacaoUnknown, etc)
export * from './corrections/type-safety.js';
