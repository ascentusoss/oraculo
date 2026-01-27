// SPDX-License-Identifier: MIT

/**
 * Controle global do modo JSON para suprimir logs visuais.
 *
 * Quando --json está ativo, devemos produzir APENAS JSON puro no stdout,
 * sem logs INFO, SUCESSO, spinners, cores, ou qualquer outra saída visual.
 *
 * Isso é crítico para integração com CI/CD e ferramentas que parsam o JSON.
 */

let _jsonModeAtivo = false;

/**
 * Ativa o modo JSON (suprime todos os logs visuais)
 */
export function ativarModoJson(): void {
  _jsonModeAtivo = true;
}

/**
 * Desativa o modo JSON (restaura logs visuais)
 */
export function desativarModoJson(): void {
  _jsonModeAtivo = false;
}

/**
 * Verifica se o modo JSON está ativo
 */
export function isJsonMode(): boolean {
  return _jsonModeAtivo;
}

/**
 * Reseta o estado (útil para testes)
 */
export function resetJsonMode(): void {
  _jsonModeAtivo = false;
}
