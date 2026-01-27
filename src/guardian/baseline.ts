// SPDX-License-Identifier: MIT
import path from 'node:path';

import { lerEstado, salvarEstado } from '@shared/persistence/persistencia.js';

import { BASELINE_PATH } from './constantes.js';

/**
 * Representa o estado salvo de integridade de arquivos no baseline.
 * Mapeia caminho relativo de arquivo para hash (string).
 */
export type SnapshotBaseline = Record<string, string>;

/**
 * L� o baseline atual do sistema de integridade.
 * Retorna null se o arquivo n�o existir ou estiver malformado.
 */

export async function carregarBaseline(): Promise<SnapshotBaseline | null> {
  try {
    const json = await lerEstado<SnapshotBaseline>(BASELINE_PATH);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const entries = Object.entries(json as Record<string, unknown>).filter(
        ([k, v]) => typeof k === 'string' && typeof v === 'string',
      );
      return Object.fromEntries(entries) as SnapshotBaseline;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Salva um novo baseline de integridade em disco, sobrescrevendo qualquer estado anterior.
 */

export async function salvarBaseline(
  snapshot: SnapshotBaseline,
): Promise<void> {
  const fs = await import('node:fs');
  await fs.promises.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await salvarEstado(BASELINE_PATH, snapshot);
}
