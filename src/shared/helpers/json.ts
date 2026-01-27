// SPDX-License-Identifier: MIT
/**
 * Utilidades de JSON: escape Unicode e stringificação segura para consumidores legados.
 *
 * Regras:
 * - Converte qualquer caractere fora do ASCII básico em sequências \uXXXX.
 * - Para caracteres fora do BMP, emite pares substitutos (dois \uXXXX).
 * - Mantém caracteres ASCII intactos.
 */

// Constantes Unicode e BMP
const ASCII_MAX = 0x7f;
const BMP_MAX = 0xffff;
const SUPPLEMENTARY_PLANE_OFFSET = 0x10000;
const HIGH_SURROGATE_BASE = 0xd800;
const LOW_SURROGATE_BASE = 0xdc00;
const SURROGATE_SHIFT = 10;
const SURROGATE_MASK = 0x3ff;
const HEX_PAD_LENGTH = 4;
const JSON_INDENT_DEFAULT = 2;

/**
 * Escapa caracteres não-ASCII para sequências \uXXXX, incluindo pares substitutos.
 */

export function escapeNonAscii(s: string): string {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === null || cp <= ASCII_MAX) {
      out += ch;
    } else if (cp <= BMP_MAX) {
      out += `\\u${cp.toString(16).padStart(HEX_PAD_LENGTH, '0')}`;
    } else {
      // caracteres fora do BMP -> pares substitutos
      const codePointOffset = cp - SUPPLEMENTARY_PLANE_OFFSET;
      const highSurrogate =
        HIGH_SURROGATE_BASE + (codePointOffset >> SURROGATE_SHIFT);
      const lowSurrogate =
        LOW_SURROGATE_BASE + (codePointOffset & SURROGATE_MASK);
      out += `\\u${highSurrogate.toString(16).padStart(HEX_PAD_LENGTH, '0')}`;
      out += `\\u${lowSurrogate.toString(16).padStart(HEX_PAD_LENGTH, '0')}`;
    }
  }
  return out;
}

/**
 * Stringifica um objeto em JSON aplicando escapeNonAscii em todos os strings do objeto.
 * Normaliza possíveis double-escapes ("\\uXXXX" -> "\uXXXX").
 */

export function stringifyJsonEscaped(
  value: unknown,
  space: number = JSON_INDENT_DEFAULT,
): string {
  const replacer = (_key: string, v: unknown) =>
    typeof v === 'string' ? escapeNonAscii(v) : v;
  const raw = JSON.stringify(value, replacer, space);
  // JSON.stringify pode escapar as barras invertidas inseridas pelo replacer
  // (\\u -> \u). Normalizamos para os consumidores que esperam \uXXXX.
  return raw.replace(/\\\\u/g, '\\u');
}
