// SPDX-License-Identifier: MIT
/**
 * Exportações centralizadas de tipos de projeto
 */

// Detecção de tipo de projeto
export type {
  DiagnosticoProjeto,
  SinaisProjeto,
  TipoProjeto,
} from './deteccao.js';

// Contexto de projeto (movido de shared/)
export type { ContextoProjeto, DetectarContextoOpcoes } from './contexto.js';
