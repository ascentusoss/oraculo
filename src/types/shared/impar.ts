// SPDX-License-Identifier: MIT

/**
 * Tipos para o módulo de formatação (formater.ts)
 */

export type FormatadorMinimoParser =
  | 'json'
  | 'markdown'
  | 'yaml'
  | 'code'
  | 'html'
  | 'css'
  | 'python'
  | 'php'
  | 'xml'
  | 'unknown';

export type FormatadorMinimoResultOk = {
  ok: true;
  parser: FormatadorMinimoParser;
  formatted: string;
  changed: boolean;
  reason?: string;
};

export type FormatadorMinimoResultError = {
  ok: false;
  parser: FormatadorMinimoParser;
  error: string;
};

export type FormatadorMinimoResult =
  | FormatadorMinimoResultOk
  | FormatadorMinimoResultError;

/**
 * Tipos para o módulo de otimização SVG (svgs.ts)
 */

export type SvgoMinimoMudanca =
  | 'remover-bom'
  | 'remover-xml-prolog'
  | 'remover-doctype'
  | 'remover-comentarios'
  | 'remover-metadata'
  | 'remover-defs-vazio'
  | 'remover-version'
  | 'remover-xmlns-xlink'
  | 'remover-enable-background'
  | 'colapsar-espacos-entre-tags'
  | 'normalizar-eol'
  | 'trim-final';

export type SvgoMinimoResult = {
  ok: true;
  data: string;
  changed: boolean;
  mudancas: SvgoMinimoMudanca[];
  originalBytes: number;
  optimizedBytes: number;
  warnings: string[];
};
