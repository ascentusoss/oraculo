// SPDX-License-Identifier: MIT
/**
 * Tipos para os comandos CLI
 */

/**
 * Tipo para acessar opções do comando parent
 */
export interface ParentWithOpts {
  opts?: () => Record<string, unknown>;
}

/**
 * Resultado de formatação
 */
export interface FormatResult {
  total: number;
  formataveis: number;
  mudaram: number;
  erros: number;
  arquivosMudaram: string[];
}

/**
 * Opções do comando formatar
 */
export interface FormatarCommandOpts {
  check?: boolean;
  write?: boolean;
  include?: string[];
  exclude?: string[];
  engine?: string;
}

/**
 * Opções do comando otimizar-svg
 */
export interface OtimizarSvgCommandOpts {
  check: boolean;
  write: boolean;
  include: string[];
  exclude: string[];
  verbose: boolean;
}
