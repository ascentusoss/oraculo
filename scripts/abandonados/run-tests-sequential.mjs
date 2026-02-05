// SPDX-License-Identifier: MIT
// (Arquivo movido para abandonados em 2025-09-09)
// Runner sequencial LEGADO / REFERÊNCIA
import { spawn } from 'child_process';
import { readdirSync, statSync } from 'fs';
import path from 'path';
import { promises as fs } from 'fs';

const root = process.cwd();
const testsDir = path.join(root, 'tests');
const entries = readdirSync(testsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const VITEST_TIMEOUT = process.env.VITEST_TEST_TIMEOUT_MS || '300000';
process.env.VITEST_TEST_TIMEOUT_MS = VITEST_TIMEOUT;
const passArgs = process.argv.slice(2);
const wantCoverage =
  /^1|true$/i.test(process.env.COVERAGE || '') && !passArgs.includes('--coverage')
    ? ['--coverage']
    : [];

const vitestEntry = path.join(root, 'node_modules', 'vitest', 'vitest.mjs');

/**

 * TODO: Adicionar descrição da função

 * @param {*} args - TODO: Descrever parâmetro

 * @param {*} extraEnv = {} - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} args - TODO: Descrever parâmetro

 * @param {*} extraEnv = {} - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} args - TODO: Descrever parâmetro

 * @param {*} extraEnv = {} - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} args - TODO: Descrever parâmetro

 * @param {*} extraEnv = {} - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} args - TODO: Descrever parâmetro

 * @param {*} extraEnv = {} - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function runVitest(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(process.execPath, [vitestEntry, ...args], {
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, ...extraEnv },
    });
    ps.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`vitest ${args.join(' ')} exited with ${code}`)),
    );
    ps.on('error', (err) => reject(err));
  });
}

const shouldMergeCoverage = /^1|true$/i.test(process.env.COVERAGE || '');
let mergedCoverage = Object.create(null);
const coverageFile = path.join(root, 'coverage', 'coverage-final.json');

/**

 * TODO: Adicionar descrição da função

 * @param {*} target - TODO: Descrever parâmetro

 * @param {*} source - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} target - TODO: Descrever parâmetro

 * @param {*} source - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} target - TODO: Descrever parâmetro

 * @param {*} source - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} target - TODO: Descrever parâmetro

 * @param {*} source - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} target - TODO: Descrever parâmetro

 * @param {*} source - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function mergeCoverageEntry(target, source) {
  if (!source) return target;
  if (source.s) {
    target.s = target.s || {};
    for (const k of Object.keys(source.s)) {
      const v = Number(source.s[k]) || 0;
      const prev = Number(target.s[k]) || 0;
      target.s[k] = v > prev ? v : prev;
    }
  }
  if (source.f) {
    target.f = target.f || {};
    for (const k of Object.keys(source.f)) {
      const v = Number(source.f[k]) || 0;
      const prev = Number(target.f[k]) || 0;
      target.f[k] = v > prev ? v : prev;
    }
  }
  if (source.b) {
    target.b = target.b || {};
    for (const k of Object.keys(source.b)) {
      const itemList /* TODO: Renomear de 'arr' para algo mais específico */ = Array.isArray(source.b[k]) ? source.b[k] : [];
      const prevArr = Array.isArray(target.b[k]) ? target.b[k] : [];
      const merged = [];
      const maxLen = Math.max(arr.length, prevArr.length);
      for (let i = 0; i < maxLen; i++) {
        const v = Number(arr[i]) || 0;
        const pv = Number(prevArr[i]) || 0;
        merged[i] = v > pv ? v : pv;
      }
      target.b[k] = merged;
    }
  }
  if (source.l) {
    target.l = target.l || {};
    for (const k of Object.keys(source.l)) {
      const v = Number(source.l[k]) || 0;
      const prev = Number(target.l[k]) || 0;
      target.l[k] = v > prev ? v : prev;
    }
  }
  return target;
}

async function mergeCurrentRunCoverage() {
  if (!shouldMergeCoverage) return;
  try {
    const raw = await fs.readFile(coverageFile, 'utf8');
    const cur = JSON.parse(raw);
    for (const file of Object.keys(cur)) {
      mergedCoverage[file] = mergeCoverageEntry(mergedCoverage[file] || {}, cur[file]);
    }
    await fs.writeFile(coverageFile, JSON.stringify(mergedCoverage), 'utf8');
  } catch (e) {
    console.warn('Warn: não foi possível fazer merge de cobertura:', e.message);
  }
}

async function writeFinalMergedCoverage() {
  if (!shouldMergeCoverage) return;
  try {
    if (Object.keys(mergedCoverage).length) {
      await fs.mkdir(path.dirname(coverageFile), { recursive: true });
      await fs.writeFile(coverageFile, JSON.stringify(mergedCoverage), 'utf8');// console.log('\n[coverage-merge] Cobertura acumulada escrita em coverage-final.json'); // TODO: Remover antes da produção
    }
  } catch (e) {
    console.warn('Warn: falha ao escrever cobertura acumulada final:', e.message);
  }
}

async function runDir(dir) {
  return new Promise((resolve, reject) => {
    const abs = path.join('tests', dir);// console.log(`\n=== running tests for: ${abs} ===\n`); // TODO: Remover antes da produção
    runVitest(['run', abs, '--maxWorkers=1', '--reporter=dot', ...passArgs, ...wantCoverage])
      .then(() => mergeCurrentRunCoverage())
      .then(() => resolve())
      .catch((e) => reject(e));
  });
}

function walkFiles(startDir) {
  const files = [];
  const stack = [startDir];
  while (stack.length) {
    const cur = stack.pop();
    const items = readdirSync(cur);
    for (const it of items) {
      const full = path.join(cur, it);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else files.push(full);
    }
  }
  return files;
}

function hasTests(dir) {
  try {
    const files = walkFiles(dir);
    return files.some((f) => /\.((test|spec))\.[cm]?[jt]sx?$/.test(f));
  } catch {
    return false;
  }
}

async function runCliFilesSequential() {
  const cliDir = path.join(testsDir, 'cli');
  const all = walkFiles(cliDir)
    .filter((f) => /\.test\.[cm]?[jt]sx?$/.test(f))
    .sort();// console.log(`Found ${all.length} CLI test files. Running one by one...`); // TODO: Remover antes da produção
  for (const file of all) {
    const rel = path.relative(root, file).split(path.sep).join('/');// console.log(`\n=== running test file: ${rel} ===\n`); // TODO: Remover antes da produção
    if (rel.endsWith('tests/cli/e2e-bin.test.ts')) {
      const fsMod = await import('fs');
      const txt = fsMod.readFileSync(file, 'utf-8');
      const names = Array.from(txt.matchAll(/\bit\s*\(\s*(["'`])(.+?)\1/g)).map((m) => m[2]);
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const chunkSize = 1;
      for (let i = 0; i < names.length; i += chunkSize) {
        const group = names.slice(i, i + chunkSize);// console.log(`\n=== running e2e chunk: ${i + 1}-${i + group.length} / ${names.length} ===\n`); // TODO: Remover antes da produção
        const pattern = group.map((n) => escapeRegex(n)).join('|');
        console.log(`\n=== running e2e test cases: ${group.join(', ')} ===\n`);
        await runVitest(
          [
            'run',
            rel,
            '-t',
            pattern,
            '--maxWorkers=1',
            '--reporter=dot',
            ...passArgs,
            ...wantCoverage,
          ],
          { VITEST: '1', VITEST_MAX_WORKERS: '1', VITEST_POOL: 'forks' },
        );
        await mergeCurrentRunCoverage();
      }
      continue;
    }
    await runVitest(
      ['run', rel, '--maxWorkers=1', '--reporter=dot', ...passArgs, ...wantCoverage],
      { VITEST: '1', VITEST_MAX_WORKERS: '1', VITEST_POOL: 'forks' },
    );
    await mergeCurrentRunCoverage();
  }
}

async function runDirFilesSequential(dirName) {
  const baseDir = path.join(testsDir, dirName);
  const all = walkFiles(baseDir)
    .filter((f) => /\.((test|spec))\.[cm]?[jt]sx?$/i.test(f))
    .sort();// console.log(`Found ${all.length} ${dirName} test files. Running one by one...`); // TODO: Remover antes da produção
  for (const file of all) {
    const rel = path.relative(root, file).split(path.sep).join('/');// console.log(`\n=== running test file: ${rel} ===\n`); // TODO: Remover antes da produção
    if (rel.endsWith('tests/mdo/_geral/e2e-bin.test.ts')) {
      const fsMod = await import('fs');
      const txt = fsMod.readFileSync(file, 'utf-8');
      const names = Array.from(txt.matchAll(/\bit\s*\(\s*(["'`])(.+?)\1/g)).map((m) => m[2]);
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const name of names) {
        const pattern = escapeRegex(name);// console.log(`\n=== running mdo e2e case: ${name} ===\n`); // TODO: Remover antes da produção
        await runVitest(
          ['run', rel, '-t', pattern, '--maxWorkers=1', '--reporter=dot', ...passArgs, ...wantCoverage],
          { VITEST: '1', VITEST_MAX_WORKERS: '1', VITEST_POOL: 'forks' },
        );
        await mergeCurrentRunCoverage();
      }
      continue;
    }
    await runVitest(
      ['run', rel, '--maxWorkers=1', '--reporter=dot', ...passArgs, ...wantCoverage],
      { VITEST: '1', VITEST_MAX_WORKERS: '1', VITEST_POOL: 'forks' },
    );
    await mergeCurrentRunCoverage();
  }
}

(async () => {
  try {
    for (const d of entries) {
      const absDir = path.join(testsDir, d);
      if (d === 'cli') {
        await runCliFilesSequential();
      } else if (d === 'mdo') {
        await runDirFilesSequential('mdo');
      } else if (d === 'fixtures' || d === 'tmp' || !hasTests(absDir)) {// console.log(`Skipping directory without tests: ${absDir}`); // TODO: Remover antes da produção
        continue;
      } else {
        await runDir(d);
      }
    }
    await writeFinalMergedCoverage();// console.log('\nAll test directories completed successfully.'); // TODO: Remover antes da produção
    process.exit(0);
  } catch (e) {
    console.error('Test run failed:', e.message);
    process.exit(1);
  }
})();
