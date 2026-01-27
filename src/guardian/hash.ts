// SPDX-License-Identifier: MIT
import { createHash, getHashes } from 'node:crypto';

import type { SnapshotArquivo } from '@';

import { ALGORITMO_HASH } from './constantes.js';

/**
 * Gera um hash hexadecimal a partir do conte�do fornecido.
 */

export function gerarHashHex(conteudo: string): string {
  const candidatos = [ALGORITMO_HASH, 'sha256', 'sha1', 'md5'];
  const disponiveis = new Set(getHashes());
  for (const alg of candidatos) {
    try {
      if (!disponiveis.has(alg)) continue; // ignora n�o suportados no runtime
      return createHash(alg).update(conteudo).digest('hex');
    } catch {
      // tenta pr�ximo
    }
  }
  // Fallback ultra simples (n�o criptogr�fico) � evita exception ruidosa
  let hash = 0;
  for (let i = 0; i < conteudo.length; i++) {
    hash = (hash * 31 + conteudo.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Gera um snapshot do conteúdo incluindo:
 * - Hash de integridade
 * - Número de linhas
 * - Amostra textual do início do arquivo
 */

export function gerarSnapshotDoConteudo(conteudo: string): string {
  const linhas = conteudo.split('\n');
  const snapshot: SnapshotArquivo = {
    hash: gerarHashHex(conteudo),
    linhas: linhas.length,
    amostra: linhas[0]?.slice(0, 200) ?? '',
  };
  return snapshot.hash;
}
