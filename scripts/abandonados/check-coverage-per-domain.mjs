#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Verifica cobertura por domínio (pastas agregadas) utilizando coverage-final.json.
// Thresholds definidos em coverage/coverage-domain-thresholds.json.
// Uso:
//   node scripts/check-coverage-per-domain.mjs            -> valida thresholds
//   node scripts/check-coverage-per-domain.mjs --json     -> saída JSON
//   node scripts/check-coverage-per-domain.mjs --update   -> atualiza thresholds (somente quando melhora)
// Política de atualização (--update): se pct atual > threshold + 2 então eleva threshold para floor(pct atual) - 1.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const COVERAGE_FILE = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
const THRESHOLDS_FILE = path.resolve(process.cwd(), 'coverage', 'coverage-domain-thresholds.json');
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

 * @param {*} filePath - TODO: Descrever parâmetro

 * @param {*} patterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} filePath - TODO: Descrever parâmetro

 * @param {*} patterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} filePath - TODO: Descrever parâmetro

 * @param {*} patterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} filePath - TODO: Descrever parâmetro

 * @param {*} patterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} filePath - TODO: Descrever parâmetro

 * @param {*} patterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

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
 * Calcula porcentagem baseada em contagem e total
 * @param {number} c - Contagem atual
 * @param {number} t - Total
 * @returns {number} Porcentagem (0-100)
 */
/**

 * TODO: Adicionar descrição da função

 * @param {*} c - TODO: Descrever parâmetro

 * @param {*} t - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} c - TODO: Descrever parâmetro

 * @param {*} t - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} c - TODO: Descrever parâmetro

 * @param {*} t - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} c - TODO: Descrever parâmetro

 * @param {*} t - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} c - TODO: Descrever parâmetro

 * @param {*} t - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function pct(c, t) { return t === 0 ? 100 : (c / t) * 100; }

/**
 * Resolve o domínio baseado no caminho relativo do arquivo
 * @param {string} relPath - Caminho relativo do arquivo
 * @returns {string} Nome do domínio identificado
 */

function resolveDomain(relPath) {
  for (const d of multiSegmentDomains) {
    if (relPath === d || relPath.startsWith(d + '/')) return d;
  }
  return relPath.split('/')[0] || relPath;
}

async function loadCoverage() {
  const raw = await fs.readFile(COVERAGE_FILE, 'utf8');
  return JSON.parse(raw);
}

async function loadExclude() {
  try { return JSON.parse(await fs.readFile(EXCLUDE_PATH, 'utf8')); } catch { return []; }
}

/**

 * TODO: Adicionar descrição da função

 * @param {*} data - TODO: Descrever parâmetro

 * @param {*} excludePatterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} data - TODO: Descrever parâmetro

 * @param {*} excludePatterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} data - TODO: Descrever parâmetro

 * @param {*} excludePatterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} data - TODO: Descrever parâmetro

 * @param {*} excludePatterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} data - TODO: Descrever parâmetro

 * @param {*} excludePatterns - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function aggregateDomains(data, excludePatterns) {
  const by = Object.create(null);
  for (const abs of Object.keys(data)) {
    const rel = abs.replace(/\\/g, '/').split('/src/')[1];
    if (!rel) continue;
    if (matchesAnyPattern(rel, excludePatterns)) continue;
    const domain = resolveDomain(rel);
    const entry = data[abs];
    const bucket = (by[domain] = by[domain] || {
      files: 0,
      statements: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
    });
    bucket.files++;
    if (entry.s) {
      const keys = Object.keys(entry.s);
      bucket.statements.total += keys.length;
      bucket.statements.covered += keys.filter((k) => Number(entry.s[k]) > 0).length;
    }
    if (entry.f) {
      const keys = Object.keys(entry.f);
      bucket.functions.total += keys.length;
      bucket.functions.covered += keys.filter((k) => Number(entry.f[k]) > 0).length;
    }
    if (entry.b) {
      for (const b of Object.keys(entry.b)) {
        const itemList /* TODO: Renomear de 'arr' para algo mais específico */ = entry.b[b];
        if (Array.isArray(arr)) {
          bucket.branches.total += arr.length;
          bucket.branches.covered += arr.filter((n) => Number(n) > 0).length;
        }
      }
    }
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
  return Object.entries(by).map(([domain, m]) => {
    const toPct = (o) => ({ total: o.total, covered: o.covered, pct: Number(pct(o.covered, o.total).toFixed(2)) });
    return { domain, files: m.files, statements: toPct(m.statements), functions: toPct(m.functions), branches: toPct(m.branches), lines: toPct(m.lines) };
  });
}

async function loadThresholds(currentDomains) {
  try {
    const raw = await fs.readFile(THRESHOLDS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    // gera thresholds iniciais (floor dos pct atuais)
    const base = {};
    for (const d of currentDomains) {
      base[d.domain] = {
        lines: Math.floor(d.lines.pct),
        branches: Math.floor(d.branches.pct),
        functions: Math.floor(d.functions.pct),
        statements: Math.floor(d.statements.pct),
      };
    }
    await fs.mkdir(path.dirname(THRESHOLDS_FILE), { recursive: true });
    await fs.writeFile(THRESHOLDS_FILE, JSON.stringify(base, null, 2), 'utf8');
    // console.log('Thresholds iniciais gerados em coverage-domain-thresholds.json'); // TODO: Remover antes da produção
    return base;
  }
}

/**

 * TODO: Adicionar descrição da função

 * @param {*} domains - TODO: Descrever parâmetro

 * @param {*} thresholds - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} domains - TODO: Descrever parâmetro

 * @param {*} thresholds - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} domains - TODO: Descrever parâmetro

 * @param {*} thresholds - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} domains - TODO: Descrever parâmetro

 * @param {*} thresholds - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} domains - TODO: Descrever parâmetro

 * @param {*} thresholds - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function maybeUpdateThresholds(domains, thresholds) {
  let mutated = false;
  for (const d of domains) {
    const cur = thresholds[d.domain] || (thresholds[d.domain] = { lines: 0, branches: 0, functions: 0, statements: 0 });
    for (const key of ['lines', 'branches', 'functions', 'statements']) {
      const pctVal = d[key].pct;
      if (pctVal > cur[key] + 2) { // só sobe se melhorou >2 pontos
        const newVal = Math.min(100, Math.max(cur[key] + 1, Math.floor(pctVal) - 1));
        if (newVal > cur[key]) {
          cur[key] = newVal;
          mutated = true;
        }
      }
    }
  }
  return mutated;
}

async function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes('--json');
  const doUpdate = args.includes('--update');
  const coverage = await loadCoverage();
  const exclude = await loadExclude();
  const domains = aggregateDomains(coverage, exclude).sort((a, b) => a.domain.localeCompare(b.domain));
  const thresholds = await loadThresholds(domains);

  const failures = [];
  for (const d of domains) {
    const th = thresholds[d.domain];
    if (!th) continue; // ignorado
    for (const key of ['lines', 'branches', 'functions', 'statements']) {
      if (d[key].pct + 1e-9 < th[key]) { // precisa ajustar - tolerância flutuante
        failures.push({ domain: d.domain, metric: key, pct: d[key].pct, threshold: th[key] });
      }
    }
  }

  if (doUpdate) {
    const improved = maybeUpdateThresholds(domains, thresholds);
    if (improved) {
      await fs.writeFile(THRESHOLDS_FILE, JSON.stringify(thresholds, null, 2), 'utf8');
      // console.log('Thresholds atualizados (melhorias detectadas).'); // TODO: Remover antes da produção
    } else {
      // console.log('Nenhuma melhoria relevante para atualizar thresholds.'); // TODO: Remover antes da produção
    }
  }

  if (wantJson) {
    const out = { thresholds, domains, failures };
    console.log(JSON.stringify(out, null, 2));
  } else {// console.log('Cobertura por domínio:'); // TODO: Remover antes da produção
    for (const d of domains) {
      const th = thresholds[d.domain];
      const line = `${d.domain.padEnd(30)} | L ${d.lines.pct.toFixed(2)}% (>=${th.lines}) | B ${d.branches.pct.toFixed(2)}% (>=${th.branches}) | F ${d.functions.pct.toFixed(2)}% (>=${th.functions}) | S ${d.statements.pct.toFixed(2)}% (>=${th.statements})`;// console.log(line); // TODO: Remover antes da produção
    }
    if (failures.length) {
      console.error('\nFalhas de domínio:');
      for (const f of failures) {
        console.error(` - ${f.domain} ${f.metric} ${f.pct.toFixed(2)}% < threshold ${f.threshold}%`);
      }
      process.exit(1);
    } else {// console.log('\nDomain gate passed.'); // TODO: Remover antes da produção
    }
  }
}

main().catch((e) => {
  console.error('Erro na verificação de cobertura por domínio:', e.message);
  process.exit(2);
});
