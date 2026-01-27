// SPDX-License-Identifier: MIT
/**
 * Convenções do projeto analisado (paths e utilitários).
 *
 * Objetivo: evitar hardcodes como "src/tipos" espalhados em detectores e correções.
 */

import path from 'node:path';

import { config } from './config.js';

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function trimSlashes(p: string): string {
  return p.replace(/^\/*/, '').replace(/\/*$/, '');
}

export function getTypesDirectoryRelPosix(): string {
  const raw = (
    config as unknown as { conventions?: { typesDirectory?: unknown } }
  ).conventions?.typesDirectory;
  const s = typeof raw === 'string' && raw.trim() ? raw.trim() : 'src/tipos';
  return trimSlashes(toPosix(s));
}

export function getTypesDirectoryDisplay(): string {
  const base = getTypesDirectoryRelPosix();
  return base.endsWith('/') ? base : `${base}/`;
}

export function isInsideTypesDirectory(relPath: string): boolean {
  const norm = trimSlashes(toPosix(relPath));
  const base = getTypesDirectoryRelPosix();
  return norm === base || norm.startsWith(`${base}/`);
}

export function buildTypesRelPathPosix(relInsideTypesDir: string): string {
  const base = getTypesDirectoryRelPosix();
  const inside = trimSlashes(toPosix(relInsideTypesDir));
  return inside ? `${base}/${inside}` : base;
}

/**
 * Constrói um path de filesystem (com separador do SO) para um arquivo dentro do diretório de tipos.
 *
 * Ex.: base 'app/types' + 'shared/user.ts' => 'app/types/shared/user.ts' (join do SO)
 */
export function buildTypesFsPath(relInsideTypesDir: string): string {
  const relPosix = buildTypesRelPathPosix(relInsideTypesDir);
  return path.join(...relPosix.split('/'));
}
