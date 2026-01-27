// SPDX-License-Identifier: MIT

import type { Pendencia } from '../zeladores/poda.js';

/**
 * Tipos específicos para relatórios e processamento de pendências
 * Evita Record<string, unknown> genérico
 */

/**
 * Objeto de pendência processável com campos dinâmicos
 */
export interface PendenciaProcessavel extends Pendencia {
  diasInativo?: number;
  categoria?: string;
  prioridade?: string;
  status?: string;
  [key: string]: unknown; // permite campos adicionais dinâmicos
}

/**
 * Contexto de processamento de relatório
 */
export interface ContextoRelatorio {
  total: number;
  processados: number;
  erros: number;
  tempo?: number;
  [key: string]: unknown;
}

/**
 * Type guard para verificar se objeto é uma pendência processável
 */
export function isPendenciaProcessavel(
  obj: unknown,
): obj is PendenciaProcessavel {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'arquivo' in obj &&
    'motivo' in obj &&
    typeof (obj as PendenciaProcessavel).arquivo === 'string' &&
    typeof (obj as PendenciaProcessavel).motivo === 'string'
  );
}
