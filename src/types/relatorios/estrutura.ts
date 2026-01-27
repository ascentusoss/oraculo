// SPDX-License-Identifier: MIT
/**
 * Tipos para relatórios de estrutura
 */

/**
 * Item de alinhamento estrutural (diagnóstico)
 */
export interface AlinhamentoItemDiagnostico {
  arquivo: string;
  atual: string;
  ideal: string;
}
