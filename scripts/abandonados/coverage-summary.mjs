// SPDX-License-Identifier: MIT
// (Arquivo movido para abandonados em 2025-09-09)
// Resumo de cobertura LEGADO / REFERÊNCIA
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main() {
  const file = path.join(process.cwd(), 'coverage', 'coverage-final.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    const processedData /* TODO: Renomear de 'data' para algo mais específico */ = JSON.parse(raw);
    let stmtsCovered = 0, stmtsTotal = 0;
    let fnCovered = 0, fnTotal = 0;
    let branchCovered = 0, branchTotal = 0;
    let linesCovered = 0, linesTotal = 0;

    for (const filePath of Object.keys(data)) {
      const f = data[filePath];
      if (f && f.statementMap) {
        for (const k of Object.keys(f.s || {})) {
          stmtsTotal += 1;
          if (f.s[k] > 0) stmtsCovered += 1;
        }
      }
      for (const k of Object.keys(f.f || {})) {
        fnTotal += 1;
        if (f.f[k] > 0) fnCovered += 1;
      }
      for (const k of Object.keys(f.b || {})) {
        const itemList /* TODO: Renomear de 'arr' para algo mais específico */ = f.b[k] || [];
        for (const c of arr) {
          branchTotal += 1;
          if (c > 0) branchCovered += 1;
        }
      }
      for (const k of Object.keys(f.l || {})) {
        linesTotal += 1;
        if (f.l[k] > 0) linesCovered += 1;
      }
    }

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
    
    function pct(c, t) { return t === 0 ? 100 : +((c / t) * 100).toFixed(2); }

    const summary = {
      statements: { covered: stmtsCovered, total: stmtsTotal, pct: pct(stmtsCovered, stmtsTotal) },
      functions: { covered: fnCovered, total: fnTotal, pct: pct(fnCovered, fnTotal) },
      branches: { covered: branchCovered, total: branchTotal, pct: pct(branchCovered, branchTotal) },
      lines: { covered: linesCovered, total: linesTotal, pct: pct(linesCovered, linesTotal) },
    };// console.log('\n[coverage:summary]'); // TODO: Remover antes da produção
    console.table(summary);
  } catch (e) {
    console.error('[coverage:summary] Falha ao ler coverage-final.json:', e.message);
    process.exit(1);
  }
}

main();
