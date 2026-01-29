#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Gera relatório de cobertura agregado por domínio/pasta a partir de coverage/coverage-final.json
// Uso: node scripts/coverage-per-dir.mjs [--json] [--sort=asc|desc] [--metric=lines]
// Domínios reconhecidos (multi-segmento) são priorizados; caso contrário usa o primeiro segmento após src/.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const COVERAGE_FILE = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
const EXCLUDE_PATH = path.resolve(process.cwd(), 'scripts', 'coverage-exclude.json');

const multiSegmentDomains = [
  'nucleo/constelacao',
  'zeladores/util',
  'analistas/javascript-typescript',
  'analistas/detectores',
  'analistas/estrategistas',
];

/**

 * TODO: Adicionar descrição da função

 *  {*} filePath - TODO: Descrever parâmetro

 *  {*} patterns - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} filePath - TODO: Descrever parâmetro

 *  {*} patterns - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} filePath - TODO: Descrever parâmetro

 *  {*} patterns - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} filePath - TODO: Descrever parâmetro

 *  {*} patterns - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} filePath - TODO: Descrever parâmetro

 *  {*} patterns - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

function matchesAnyPattern(filePath, patterns) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) return false;
  for (const p of patterns) {
    const pat = p.replace(/\\/g, '/');
    if (pat === filePath) return true;
    if (pat.endsWith('/**')) {
      const base = pat.slice(0, -3);
      if (filePath.startsWith(base)) return true;
    }
    if (pat.startsWith('**/')) {
      const suffix = pat.slice(3);
      if (filePath.endsWith(suffix)) return true;
    }
    if (pat.includes('*')) {
      const regex = new RegExp('^' + pat.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
      if (regex.test(filePath)) return true;
    }
  }
  return false;
}

/**

 * TODO: Adicionar descrição da função

 *  {*} cov - TODO: Descrever parâmetro

 *  {*} total - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} cov - TODO: Descrever parâmetro

 *  {*} total - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} cov - TODO: Descrever parâmetro

 *  {*} total - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} cov - TODO: Descrever parâmetro

 *  {*} total - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} cov - TODO: Descrever parâmetro

 *  {*} total - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

function pct(cov, total) {
  if (total === 0) return 100;
  return (cov / total) * 100;
}

function resolveDomain(relPath) {
  // relPath relativo a src/ (já normalizado)
  for (const d of multiSegmentDomains) {
    if (relPath.startsWith(d + '/')) return d;
    if (relPath === d) return d;
  }
  const first = relPath.split('/')[0];
  return first || relPath;
}

async function main() {
  let raw;
  try {
    raw = await fs.readFile(COVERAGE_FILE, 'utf8');
  } catch (e) {
    console.error('Falha ao ler coverage-final.json:', e.message);
    process.exit(2);
  }
  let excludePatterns = [];
  try {
    const exRaw = await fs.readFile(EXCLUDE_PATH, 'utf8');
    excludePatterns = JSON.parse(exRaw);
  } catch {}

  const processedData /* TODO: Renomear de 'data' para algo mais específico */ = JSON.parse(raw);
  const byDomain = Object.create(null);

  for (const absPath of Object.keys(data)) {
    const rel = absPath.replace(/\\/g, '/').split('/src/')[1];
    if (!rel) continue; // fora de src
    if (matchesAnyPattern(rel, excludePatterns)) continue;
    const domain = resolveDomain(rel);
    const entry = data[absPath];
    const bucket = (byDomain[domain] = byDomain[domain] || {
      files: 0,
      statements: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
    });
    bucket.files += 1;

    // statements
    if (entry.s) {
      const keys = Object.keys(entry.s);
      bucket.statements.total += keys.length;
      bucket.statements.covered += keys.filter((k) => Number(entry.s[k]) > 0).length;
    }
    // functions
    if (entry.f) {
      const keys = Object.keys(entry.f);
      bucket.functions.total += keys.length;
      bucket.functions.covered += keys.filter((k) => Number(entry.f[k]) > 0).length;
    }
    // branches
    if (entry.b) {
      for (const bkey of Object.keys(entry.b)) {
        const itemList /* TODO: Renomear de 'arr' para algo mais específico */ = entry.b[bkey];
        if (Array.isArray(arr)) {
          bucket.branches.total += arr.length;
          bucket.branches.covered += arr.filter((n) => Number(n) > 0).length;
        }
      }
    }
    // lines (prefer entry.l; fallback statements)
    if (entry.l) {
      const keys = Object.keys(entry.l);
      bucket.lines.total += keys.length;
      bucket.lines.covered += keys.filter((k) => Number(entry.l[k]) > 0).length;
    } else if (entry.s) {
      const keys = Object.keys(entry.s);
      bucket.lines.total += keys.length;
      bucket.lines.covered += keys.filter((k) => Number(entry.s[k]) > 0).length;
    }
  }

  // Monta objeto final com porcentagens
  const result = Object.entries(byDomain).map(([domain, m]) => {
    const toPct = (o) => ({ total: o.total, covered: o.covered, pct: Number(pct(o.covered, o.total).toFixed(2)) });
    return {
      domain,
      files: m.files,
      statements: toPct(m.statements),
      functions: toPct(m.functions),
      branches: toPct(m.branches),
      lines: toPct(m.lines),
    };
  });

  const metric = (process.argv.find((a) => a.startsWith('--metric=')) || '--metric=lines').split('=')[1];
  const sortOrder = (process.argv.find((a) => a.startsWith('--sort=')) || '--sort=asc').split('=')[1];
  result.sort((a, b) => {
    const av = a[metric]?.pct ?? 0;
    const bv = b[metric]?.pct ?? 0;
    return sortOrder === 'desc' ? bv - av : av - bv;
  });

  const asJson = process.argv.includes('--json');
  if (asJson) {
    console.log(JSON.stringify({ metric, sort: sortOrder, domains: result }, null, 2));
  } else {
    console.log(`Cobertura agregada por domínio (ordenado por ${metric} ${sortOrder}):`);
    for (const r of result) {
      console.log(
        `${r.domain.padEnd(30)} | files:${String(r.files).padStart(3)} | lines:${r.lines.pct.toFixed(2).padStart(6)}% | branches:${r.branches.pct.toFixed(2).padStart(6)}% | funcs:${r.functions.pct.toFixed(2).padStart(6)}% | stmts:${r.statements.pct.toFixed(2).padStart(6)}%`,
      );
    }
  }
}

main();
