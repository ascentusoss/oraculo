#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copia artefatos não-transpilados para dist (ex.: ESM loader)
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

/**

 * TODO: Adicionar descrição da função

 * @param {*} src - TODO: Descrever parâmetro

 * @param {*} dest - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} src - TODO: Descrever parâmetro

 * @param {*} dest - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} src - TODO: Descrever parâmetro

 * @param {*} dest - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} src - TODO: Descrever parâmetro

 * @param {*} dest - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} src - TODO: Descrever parâmetro

 * @param {*} dest - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

async function copy(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
  // console.log(`[copy] ${src} -> ${dest}`); // TODO: Remover antes da produção
}

async function main() {
  const root = process.cwd();
  const loaderSrc = path.join(root, 'src', 'node.loader.mjs');
  const loaderDest = path.join(root, 'dist', 'node.loader.mjs');
  try {
    await copy(loaderSrc, loaderDest);
  } catch (e) {
    console.warn('[copy] Aviso: não foi possível copiar node.loader.mjs:', e.message);
  }

  // Garantir que o executável CLI tenha permissões de execução
  const cliExecutable = path.join(root, 'dist', 'bin', 'index.js');
  try {
    await fs.chmod(cliExecutable, 0o755);
    console.log('[copy] Permissões de execução adicionadas ao CLI');
  } catch (e) {
    console.warn('[copy] Aviso: não foi possível definir permissões de execução:', e.message);
  }
}

main().catch((e) => {
  console.error('[copy] Falha ao copiar artefatos:', e);
  process.exit(1);
});
