// SPDX-License-Identifier: MIT
import path from 'node:path';

import { config } from '@core/config/config.js';
import pLimit from 'p-limit';

import type { FileEntryWithAst, ResultadoEstrutural } from '@';

// Constantes para análise estrutural
export const CONCORRENCIA = Number(config.STRUCTURE_CONCURRENCY ?? 5);
export const CAMADAS: Record<string, string> = {
  ts: 'src',
  js: 'src',
  tsx: 'src',
  jsx: 'src',
  mjs: 'src',
  cjs: 'src',
  json: 'config',
  md: 'docs',
  yml: 'config',
  yaml: 'config',
  // Adicione mais mapeamentos conforme necessário
};

export async function analisarEstrutura(
  fileEntries: FileEntryWithAst[],
  _baseDir: string = process.cwd(),
): Promise<ResultadoEstrutural[]> {
  const limit = pLimit(CONCORRENCIA);

  const resultados = await Promise.all(
    fileEntries.map((entry) =>
      limit(() => {
        const rel = entry.relPath;
        // Normaliza para separador POSIX para evitar dependência de platform e necessidade de mock em testes
        const normalizado = rel.replace(/\\/g, '/');
        const atual = normalizado.split('/')[0] || '';
        let ideal: string | null = null;

        const matchDireta = Object.entries(CAMADAS).find(([, dir]) =>
          normalizado.startsWith(`${dir.replace(/\\/g, '/')}/`),
        );

        if (matchDireta) {
          ideal = matchDireta[1];
        } else {
          const nome = path.basename(rel);
          const [, tipo] = /\.([^.]+)\.[^.]+$/.exec(nome) ?? [];
          if (tipo && CAMADAS[tipo]) {
            ideal = CAMADAS[tipo];
          }
        }

        return { arquivo: rel, atual, ideal };
      }),
    ),
  );

  return resultados;
}

export { analisarEstrutura as alinhamentoEstrutural };
