// SPDX-License-Identifier: MIT
import path from 'node:path';

import { config } from '@core/config/config.js';
import { log } from '@core/messages/index.js';
import { lerEstado, salvarEstado } from '@shared/persistence/persistencia.js';

import type { FileEntry, RegistroIntegridade } from '@';

import { gerarSnapshotDoConteudo } from './hash.js';

const DESTINO_PADRAO = path.join(config.STATE_DIR, 'integridade.json');

/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 */

export async function salvarRegistros(
  fileEntries: FileEntry[],
  destino: string = DESTINO_PADRAO,
): Promise<void> {
  const registros: RegistroIntegridade[] = [];

  for (const { relPath, content } of fileEntries) {
    if (!relPath || typeof content !== 'string' || !content.trim()) continue;
    const hash = gerarSnapshotDoConteudo(content);
    registros.push({ arquivo: relPath, hash });
  }

  const fs = await import('node:fs');
  await fs.promises.mkdir(path.dirname(destino), { recursive: true });
  await salvarEstado(destino, registros);
  log.sucesso(`??? Registro de integridade salvo em: ${destino}`);
}

/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 */

export async function carregarRegistros(
  caminho: string = DESTINO_PADRAO,
): Promise<RegistroIntegridade[]> {
  try {
    return await lerEstado<RegistroIntegridade[]>(caminho);
  } catch {
    log.aviso(`?? Nenhum registro encontrado em ${caminho}`);
    return [];
  }
}
