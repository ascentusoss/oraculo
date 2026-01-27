// SPDX-License-Identifier: MIT
import { ARQUETIPOS } from '@analistas/estrategistas/arquetipos-defs.js';
import { scoreArquetipo } from '@analistas/pontuadores/pontuador.js';

import type { ResultadoDeteccaoArquetipo } from '@';

/**
 * Detector especializado para projetos Node.js/TypeScript
 * Retorna lista de candidatos de arquétipo com score/confiança
 */

export function detectarArquetipoNode(
  arquivos: string[],
): ResultadoDeteccaoArquetipo[] {
  const temPackage = arquivos.some((a) => a.endsWith('package.json'));
  const ehNode = temPackage;
  if (!ehNode) return [];

  const candidatos = ARQUETIPOS.map((def) =>
    scoreArquetipo(def, arquivos),
  ).filter((r) => r.score > 0);

  return candidatos;
}
