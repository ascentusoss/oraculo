// SPDX-License-Identifier: MIT
// (Arquivo movido para abandonados em 2025-09-09)
// Runner de testes "inteligente" (LEGADO / REFERÊNCIA):
// - No Windows, executa testes de forma sequencial por diretório para evitar RPC timeouts do Vitest
// - Em outras plataformas, roda Vitest normalmente
// - Fallback: se detectar erro "Timeout calling onTaskUpdate", reexecuta no modo sequencial

import { spawn } from 'node:child_process';
import path from 'node:path';

/**

 * TODO: Adicionar descrição da função

 *  {*} args - TODO: Descrever parâmetro

 *  {*} env = process.env - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} args - TODO: Descrever parâmetro

 *  {*} env = process.env - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} args - TODO: Descrever parâmetro

 *  {*} env = process.env - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} args - TODO: Descrever parâmetro

 *  {*} env = process.env - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} args - TODO: Descrever parâmetro

 *  {*} env = process.env - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

function runNode(args, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      shell: false,
      env,
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  if (!process.env.VITEST_TEST_TIMEOUT_MS) process.env.VITEST_TEST_TIMEOUT_MS = '300000';

  const isWin = process.platform === 'win32';
  const forceSequential = /^1|true$/i.test(process.env.VITEST_SEQUENTIAL || '');
  const passArgs = process.argv.slice(2);
  const wantCoverage =
    /^1|true$/i.test(process.env.COVERAGE || '') && !passArgs.includes('--coverage')
      ? ['--coverage']
      : [];

  const vitestEntry = path.join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');
  const runSequential = async () =>
    runNode(['./scripts/run-tests-sequential.mjs', ...passArgs, ...wantCoverage]);
  const runParallel = async () => runNode([vitestEntry, 'run', ...passArgs, ...wantCoverage]);

  if (isWin || forceSequential) {
    console.log('[test-smart] Executando no modo sequencial (Windows/forçado).');
    const code = await runSequential();
    process.exit(code);
  }

  console.log('[test-smart] Executando no modo paralelo padrão (Vitest run).');
  const code = await runParallel();
  if (code === 0) return process.exit(0);

  console.warn('[test-smart] Falha no modo paralelo. Fallback para execução sequencial...');
  const retry = await runSequential();
  process.exit(retry);
}

main().catch((e) => {
  console.error('Falha ao executar testes:', e?.message || e);
  process.exit(1);
});
