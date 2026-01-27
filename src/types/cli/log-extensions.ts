// SPDX-License-Identifier: MIT
/**
 * Extensões do módulo de log para suporte a recursos avançados
 */

/**
 * Interface para extensões do módulo de log
 */
export interface LogExtensions {
  fase?: (message: string) => void;
  simbolos?: {
    sucesso?: string;
    info?: string;
    aviso?: string;
    erro?: string;
  };
  calcularLargura?: (
    titulo: string,
    linhas: string[],
    larguraPadrao: number,
  ) => number | undefined;
  imprimirBloco?: (
    titulo: string,
    linhas: string[],
    estilo?: unknown,
    largura?: number,
  ) => void;
  debug?: (message: string) => void;
}
