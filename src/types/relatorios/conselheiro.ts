// SPDX-License-Identifier: MIT
/**
 * Tipos para o conselheiro oracular
 */

/**
 * Contexto para emissão de conselhos oráculo
 */
export interface ConselhoContextoOracular {
  hora?: number;
  arquivosParaCorrigir?: number;
  arquivosParaPodar?: number;
  totalOcorrenciasAnaliticas?: number;
  integridadeGuardian?: string;
}
