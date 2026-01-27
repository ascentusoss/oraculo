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

/**
 * Converte uma string JSON (já gerada) em uma versão ASCII-only
 * substituindo todos os codepoints >= 0x80 por \uXXXX (pares substitutos
 * para codepoints fora do BMP).
 */
export function escapeJsonAscii(raw: string): string {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const cp = raw.codePointAt(i) as number;
    if (cp <= ASCII_MAX) {
      out += raw[i];
    } else if (cp <= BMP_MAX) {
      out += `\\u${cp.toString(16).padStart(HEX_PAD_LENGTH, '0')}`;
    } else {
      // fora do BMP: gerar pares substitutos
      const codePointOffset = cp - SUPPLEMENTARY_PLANE_OFFSET;
      const highSurrogate =
        HIGH_SURROGATE_BASE + (codePointOffset >> SURROGATE_SHIFT);
      const lowSurrogate =
        LOW_SURROGATE_BASE + (codePointOffset & SURROGATE_MASK);
      out += `\\u${highSurrogate.toString(16).padStart(HEX_PAD_LENGTH, '0')}\\u${lowSurrogate.toString(16).padStart(HEX_PAD_LENGTH, '0')}`;
      // pular o segundo code unit já consumido pelo codePointAt
      i++;
    }
  }
  return out;
}

/**
 * Stringifica um objeto em JSON. Por padrão emite UTF-8 (legível). Se
 * options.asciiOnly for true, converte o JSON resultante em ASCII-only
 * substituindo caracteres > 0x7F por \uXXXX.
 */
export function stringifyJsonEscaped(
  value: unknown,
  space: number = JSON_INDENT_DEFAULT,
  options?: { asciiOnly?: boolean },
): string {
  const raw = JSON.stringify(value, null, space);
  if (options && options.asciiOnly) return escapeJsonAscii(raw);
  return raw;
}
