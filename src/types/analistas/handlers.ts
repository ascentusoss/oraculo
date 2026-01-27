// SPDX-License-Identifier: MIT

export interface HandlerInfo {
  nome?: string;
  tipo?: 'comando' | 'evento' | 'query';
  parametros?: string[];
  descricao?: string;
  middleware?: boolean;
  path?: string;
  // Campos adicionais observados em runtime / analisadores
  func?: unknown; // referência ao nó/função original (Babel node) - mantenha unknown para evitar any
  bodyBlock?: { start?: number | null; end?: number | null; body?: unknown };
  isAnonymous?: boolean;
  params?: unknown[];
  totalParams?: number;
  node?: unknown;
}

export interface ComandoRegistro {
  id?: string;
  timestamp: string;
  handler?: HandlerInfo | undefined;
  payload?: unknown;
  // Campos runtime observados
  comandoNome?: string;
  node?: unknown;
  origemFramework?: string;
}
