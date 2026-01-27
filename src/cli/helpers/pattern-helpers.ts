// SPDX-License-Identifier: MIT
/**
 * Helpers para processamento de padrões glob (include/exclude)
 */

/**
 * Processa lista de padrões raw (com vírgulas, espaços, duplicatas)
 *
 * Normaliza entrada de usuário removendo duplicatas e espaços vazios.
 * Aceita padrões separados por vírgulas ou espaços.
 *
 * @param raw - Array de strings raw do usuário
 * @returns Array normalizado sem duplicatas e vazio
 *
 * @example
 * ```typescript
 * processPatternList(['*.ts, *.js', '  *.md  '])
 * // ['*.ts', '*.js', '*.md']
 * ```
 */
export function processPatternList(raw: string[] | undefined): string[] {
  if (!raw || !raw.length) return [];

  return Array.from(
    new Set(
      raw
        .flatMap((r) => r.split(/[\s,]+/))
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

/**
 * Expande padrões de include adicionando variações glob
 *
 * Para padrões não-glob (sem metacaracteres), adiciona automaticamente:
 * - `pattern/**` - Todos os arquivos dentro
 * - `** /pattern/**` - Pattern em qualquer nível (se não tiver `/` ou `\`)
 *
 * @param list - Lista de padrões processados
 * @returns Lista expandida com variações
 *
 * @example
 * ```typescript
 * expandIncludePatterns(['src', '*.ts'])
 * // ['src', 'src/**', '** /src/**', '*.ts']
 * //        ^           ^
 * //        |           |
 * //    dentro de src  src em qualquer nível
 * ```
 */
export function expandIncludePatterns(list: string[]): string[] {
  const META = /[\\*\?\{\}\[\]]/;
  const out = new Set<string>();

  for (const p of list) {
    // Sempre adiciona o padrão original
    out.add(p);

    // Se não tem metacaracteres glob, expande
    if (!META.test(p)) {
      // Adiciona pattern/** (todos os arquivos dentro)
      const withoutTrailing = p.replace(/\\+$/, '').replace(/\/+$/, '');
      out.add(`${withoutTrailing}/**`);

      // Se não tem separador de caminho, adiciona **/pattern/** (qualquer nível)
      if (!p.includes('/') && !p.includes('\\')) {
        out.add(`**/${p}/**`);
      }
    }
  }

  return Array.from(out);
}
