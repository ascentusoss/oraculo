// SPDX-License-Identifier: MIT
/**
 * Helpers para processamento de flags e opções CLI
 */

/**
 * Parseia categorias no formato "chave=valor"
 *
 * Converte array de strings no formato "categoria=destino" em um mapa.
 * Exemplo: ["controller=handlers", "model=entities"]
 * → { "controller": "handlers", "model": "entities" }
 *
 * @param categoria - Array de strings no formato "chave=valor"
 * @returns Mapa de categorias (chave minúscula → valor trimado)
 *
 * @example
 * ```typescript
 * const map = parsearCategorias(['Controller=handlers', 'Model=entities']);
 * // { "controller": "handlers", "model": "entities" }
 * ```
 */
export function parsearCategorias(
  categoria?: string[],
): Record<string, string> {
  const map: Record<string, string> = {};
  const itemList = Array.isArray(categoria) ? categoria : [];

  for (const p of itemList) {
    const [k, v] = String(p).split("=");
    if (!k || !v) continue;
    map[k.trim().toLowerCase()] = v.trim();
  }

  return map;
}
