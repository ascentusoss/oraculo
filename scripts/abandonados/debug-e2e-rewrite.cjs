// SPDX-License-Identifier: MIT
const { mkdtempSync, writeFileSync, existsSync, mkdirSync, readFileSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');
const { spawnSync } = require('child_process');

/**


 * TODO: Adicionar descrição da função


 *  {*} TODO: Descrever retorno


 */


/**


 * TODO: Adicionar descrição da função


 *  {*} TODO: Descrever retorno


 */


/**


 * TODO: Adicionar descrição da função


 *  {*} TODO: Descrever retorno


 */


/**


 * TODO: Adicionar descrição da função


 *  {*} TODO: Descrever retorno


 */


/**


 * TODO: Adicionar descrição da função


 *  {*} TODO: Descrever retorno


 */


/**


 * Descreve a função garantirBuild


 *  {*} Descrever retorno


 */


/**


 * Descreve a função garantirBuild


 *  {*} Descrever retorno


 */


function garantirBuild() {
  const cliPath = resolve('dist/bin/index.js');
  if (!existsSync(cliPath)) {// console.log('building...'); // TODO: Remover antes da produção
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
  }
  return cliPath;
}

(async () => {
  const cliPath = garantirBuild();
  const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-move-'));// console.log('tempDir', tempDir); // TODO: Remover antes da produção
  writeFileSync(
    join(tempDir, 'oraculo.config.json'),
    JSON.stringify({ STRUCTURE_AUTO_FIX: true }, null, 2),
    'utf-8',
  );
  writeFileSync(
    join(tempDir, 'package.json'),
    JSON.stringify({ name: 'proj-e2e-rewrite', version: '1.0.0', type: 'module' }, null, 2),
    'utf-8',
  );
  mkdirSync(join(tempDir, 'src'));
  mkdirSync(join(tempDir, 'src', 'utils'));
  writeFileSync(join(tempDir, 'src', 'utils', 'a.ts'), 'export const A=1;', 'utf-8');
  writeFileSync(
    join(tempDir, 'src', 'pedido.controller.ts'),
    "import { A } from '../../src/cli/utils/a';\nexport const ctrl=()=>A;\n",
    'utf-8',
  );

  const { pathToFileURL } = require('url');
  const distLoader = resolve('dist', 'node.loader.mjs');
  const srcLoader = resolve('src', 'node.loader.mjs');
  const loaderPath = existsSync(distLoader) ? distLoader : srcLoader;
  const loader = pathToFileURL(loaderPath).href;// console.log('using loader URL:', loader); // TODO: Remover antes da produção
  const args = [
    '--loader',
    loader,
    cliPath,
    'reestruturar',
    '--auto',
    '--domains',
    '--prefer-estrategista',
    '--silence',
  ];
  console.log('running:', process.execPath, args.join(' '));
  const proc = spawnSync(process.execPath, args, { cwd: tempDir, encoding: 'utf-8' });// console.log('status', proc.status); // TODO: Remover antes da produção// console.log('stdout:\n', proc.stdout); // TODO: Remover antes da produção// console.log('stderr:\n', proc.stderr); // TODO: Remover antes da produção
  if (proc.error) console.log('error:', proc.error);
})();
