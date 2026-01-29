// SPDX-License-Identifier: MIT
//  problema-documentacao
// Justificativa: types com any são propositais para tipagem genérica de wrappers
/**
 *  Tipos para funções de persistência e mocking de testes
 */

/**
 * Função de salvamento de estado
 */
export type SalvarEstadoFn = <T = unknown>(
  caminho: string,
  dados: T,
) => Promise<void>;

/**
 * Função de salvamento binário
 */
export type SalvarBinarioFn = (caminho: string, dados: Buffer) => Promise<void>;

/**
 * Função wrapper do Vitest para spy
 * Array genérico/rest params: captura qualquer assinatura de função
 */
// eslint-disable-next-line /no-explicit-any
export type VitestSpyWrapper<T extends (...args: any[]) => any> = (
  fn: T,
) => unknown;
