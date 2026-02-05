// ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITAR MANUALMENTE
// Use "npm run sync-aliases" para atualizar os aliases

/**
 * Loader ESM Universal - src/
 * Resolver autossuficiente com todas as funcionalidades integradas
 */
import { pathToFileURL } from 'node:url';
import { join, resolve as resolvePath, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';

// Mapeamento de aliases baseado no tsconfig.json
const aliases = {
  '@types/types.js': 'types/types.ts',
  '@nucleo/': 'nucleo/',
  '@shared/': 'shared/',
  '@analistas/': 'analistas/',
  '@arquitetos/': 'arquitetos/',
  '@zeladores/': 'zeladores/',
  '@relatorios/': 'relatorios/',
  '@guardian/': 'guardian/',
  '@cli/': 'cli/',
  '@types/': 'types/',
  '@src/': '',
  '@/': '',
};

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} specifier - TODO: Descrever parâmetro

 * @param {*} context - TODO: Descrever parâmetro

 * @param {*} nextResolve - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

export async function resolve(specifier, context, nextResolve) {
  // Se não é um alias, passa para o próximo resolver
  if (!specifier.startsWith('@')) {
    return nextResolve(specifier, context);
  }

  // Procura pelo alias correspondente
  let resolved = null;
  for (const [prefix, replacement] of Object.entries(aliases)) {
    if (specifier === prefix || specifier.startsWith(prefix)) {
      const remaining = specifier.slice(prefix.length);
      const newPath = replacement + remaining;

      // Determina o caminho base (assumindo que estamos em src/ ou dist/)
      const parentURL = context.parentURL;
      let basePath = '';

      if (parentURL) {
        const parentPath = new URL(parentURL).pathname;
        if (parentPath.includes('/dist/')) {
          basePath = resolvePath(parentPath.split('/dist/')[0], 'dist');
        } else if (parentPath.includes('/src/')) {
          basePath = resolvePath(parentPath.split('/src/')[0], 'src');
        } else {
          // Fallback para src/
          basePath = resolvePath(process.cwd(), 'src');
        }
      } else {
        basePath = resolvePath(process.cwd(), 'src');
      }

      const fullPath = join(basePath, newPath);

      // Tenta diferentes extensões
      const extensions = ['.js', '.ts', '.mjs', '.cjs'];
      let finalPath = fullPath;

      if (!existsSync(fullPath)) {
        let found = false;
        for (const ext of extensions) {
          const testPath = fullPath + ext;
          if (existsSync(testPath)) {
            finalPath = testPath;
            found = true;
            break;
          }
        }
        if (!found) {
          // Tenta como diretório com index
          for (const ext of extensions) {
            const testPath = join(fullPath, 'index' + ext);
            if (existsSync(testPath)) {
              finalPath = testPath;
              found = true;
              break;
            }
          }
        }
      }

      resolved = pathToFileURL(finalPath).href;
      break;
    }
  }

  if (resolved) {
    return {
      url: resolved,
      shortCircuit: true,
    };
  }

  // Se não conseguiu resolver, passa para o próximo
  return nextResolve(specifier, context);
}
