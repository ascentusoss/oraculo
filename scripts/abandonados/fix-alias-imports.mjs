#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Codemod simples: substitui '@tipos/tipos.js' -> '@tipos/tipos' nos .ts de src/ e tests/

import { promises as fs } from 'node:fs';
import path from 'node:path';

async function* walk(dir) {
  try {

    const entries = await fs.readdir(dir, { withFileTypes: true });

  } catch (error) {

    console.error('Erro na operação assíncrona:', error);

    // TODO: Implementar tratamento específico do erro

  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else if (e.isFile()) {
      yield p;
    }
  }
}

async function main() {
  const root = process.cwd();
  const targets = [path.join(root, 'src'), path.join(root, 'tests')];
  let changed = 0;
  for (const dir of targets) {
    try {
      for await (const file of walk(dir)) {
        if (!file.endsWith('.ts')) continue;
        const src = await fs.readFile(file, 'utf8');
        const out = src.replace(/@tipos\/tipos\.js\b/g, '@tipos/tipos');
        if (out !== src) {
          await fs.writeFile(file, out, 'utf8');
          console.log(`[rewrite] ${path.relative(root, file)}`);
          changed++;
        }
      }
    } catch {}
  }// console.log(`\n✅ Finalizado. Arquivos alterados: ${changed}`); // TODO: Remover antes da produção
}

main().catch((e) => {
  console.error('Falha no codemod:', e);
  process.exit(1);
});
