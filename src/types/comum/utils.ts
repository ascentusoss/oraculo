// SPDX-License-Identifier: MIT

// Pequeno utilitário de tipo para isBabelNode esperado por alguns analisadores.
export interface BabelNode {
  type: string;
  [key: string]: unknown;
}

//  tipo-inseguro-unknown
// Justificativa: função é um type guard; aceita `unknown` e valida com checagem runtime.
export function isBabelNode(obj: unknown): obj is BabelNode {
  // Implementação de runtime fica em src/ ou em utilitários reais.
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).type === 'string'
  );
}

export type Contador = Record<string, number>;

export interface Estatisticas {
  requires: Contador;
  consts: Contador;
  exports: Contador;
  vars: Contador;
  lets: Contador;
  evals: Contador;
  withs: Contador;
}

export type ComandoOraculo =
  | 'diagnosticar'
  | 'guardian'
  | 'podar'
  | 'reestruturar'
  | 'atualizar';
