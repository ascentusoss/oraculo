// SPDX-License-Identifier: MIT
/**
 * Tipos para processamento de comandos de diagnóstico
 * Nota: OpcoesProcessamentoDiagnostico e ResultadoProcessamentoDiagnostico
 * estão em processamento-diagnostico.ts
 */

import type { Ocorrencia } from '../comum/ocorrencias.js';

/**
 * Opções básicas de diagnóstico
 */
export interface OpcoesDiagnosticoBase {
  target: string;
  include: string[];
  exclude: string[];
  verbose: boolean;
  export: boolean;
  exportFull: boolean;
  scanOnly: boolean;
}

/**
 * Resultado básico de diagnóstico
 */
export interface ResultadoDiagnosticoBase {
  sucesso: boolean;
  ocorrencias: Ocorrencia[];
  arquivosAnalisados: number;
  duracaoMs: number;
}

/**
 * Tipo para localização no estilo Babel (usado na normalização de ocorrências)
 */
export interface LocBabel {
  start?: { line?: number; column?: number };
  end?: { line?: number; column?: number };
}
