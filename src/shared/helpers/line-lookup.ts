// SPDX-License-Identifier: MIT

export type LineLookup = {
  lineAt: (index?: number | null) => number;
};

/**
 * Cria uma função de consulta de linha (1-based) para um índice de string (0-based).
 * Otimiza casos com muitos `matchAll`/índices evitando `slice(0, i).split('\n')`.
 */
export function createLineLookup(src: string): LineLookup {
  const newlineIndexes: number[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10) newlineIndexes.push(i);
  }

  const lineAt = (index?: number | null): number => {
    if (!index || index <= 0) return 1;
    const i = Math.min(src.length, Math.max(0, index));

    // upper_bound: quantidade de '\n' com pos < i
    let lo = 0;
    let hi = newlineIndexes.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (newlineIndexes[mid] < i) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };

  return { lineAt };
}
