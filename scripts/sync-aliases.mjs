#!/usr/bin/env node
// SPDX-License-Identifier: MIT

/**
 * Script para sincronizar configuração de aliases em todo o projeto
 * Atualiza automaticamente tsconfig.json, tsconfig.eslint.json e node loaders
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL, pathToFileURL as toURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function stripJsonComments(str) {
  return str.replace(/^\s*\/\/.*$/gm, '');
}

async function getAliasPaths(tool) {
  // Usa paths atuais como fonte única de verdade (menos acoplamento)
  const cfgPath = tool === 'eslint'
    ? join(projectRoot, 'tsconfig.eslint.json')
    : join(projectRoot, 'src', 'tsconfig.json');
  try {
    const content = await fs.readFile(cfgPath, 'utf-8');
    const json = JSON.parse(stripJsonComments(content));
    return json.compilerOptions?.paths ?? {};
  } catch {
    return {};
  }
}

/**
 * Atualiza tsconfig.json do src/
 */

async function updateSrcTsConfig() {
  const tsconfigPath = join(projectRoot, 'src', 'tsconfig.json');
  
  try {
    const content = await fs.readFile(tsconfigPath, 'utf-8');
    const config = JSON.parse(stripJsonComments(content));
    
    if (!config.compilerOptions) {
      config.compilerOptions = {};
    }
    
  // Manter paths atuais (fonte única) sem forçar opções problemáticas
  config.compilerOptions.paths = await getAliasPaths('typescript');
    // Garantir que arquivos de declaração sejam incluídos para a linguagem do VS Code
    const inc = Array.isArray(config.include) ? config.include : [];
    if (!inc.includes('**/*.d.ts')) inc.push('**/*.d.ts');
    config.include = inc;
    
    // Adicionar comentário explicativo
    const updatedContent = JSON.stringify(config, null, 2);
    const contentWithComment = 
      '// ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITAR MANUALMENTE\n' +
      '// Use "npm run sync-aliases" para atualizar os aliases\n' +
      updatedContent;
    
    await fs.writeFile(tsconfigPath, contentWithComment, 'utf-8');// console.log('✅ Atualizado: src/tsconfig.json'); // TODO: Remover antes da produção
  } catch (error) {
    console.error('❌ Erro ao atualizar src/tsconfig.json:', error);
  }
}

/**
 * Atualiza tsconfig.eslint.json da raiz
 */

async function updateEslintTsConfig() {
  const tsconfigPath = join(projectRoot, 'tsconfig.eslint.json');
  
  try {
    const content = await fs.readFile(tsconfigPath, 'utf-8');
    const config = JSON.parse(stripJsonComments(content));
    
    if (!config.compilerOptions) {
      config.compilerOptions = {};
    }
    
  // Reutilizar paths atuais
  config.compilerOptions.paths = await getAliasPaths('eslint');
    
    const updatedContent = JSON.stringify(config, null, 2);
    const contentWithComment = 
      '// ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITAR MANUALMENTE\n' +
      '// Use "npm run sync-aliases" para atualizar os aliases\n' +
      updatedContent;
    
    await fs.writeFile(tsconfigPath, contentWithComment, 'utf-8');// console.log('✅ Atualizado: tsconfig.eslint.json'); // TODO: Remover antes da produção
  } catch (error) {
    console.error('❌ Erro ao atualizar tsconfig.eslint.json:', error);
  }
}

/**
 * Atualiza src/node.loader.mjs
 */

async function updateSrcLoader() {
  const loaderPath = join(projectRoot, 'src', 'node.loader.mjs');
  
  const loaderContent = `// ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITAR MANUALMENTE
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
  '/tipos.js': 'tipos/tipos.ts',
  '/': 'nucleo/',
  '/': 'shared/',
  '/': 'analistas/',
  '/': 'arquitetos/',
  '/': 'zeladores/',
  '/': 'relatorios/',
  '/': 'guardian/',
  '/': 'cli/',
  '/': 'tipos/',
  '/': '',
  '@/': '',
};

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 *  {*} specifier - TODO: Descrever parâmetro

 *  {*} context - TODO: Descrever parâmetro

 *  {*} nextResolve - TODO: Descrever parâmetro

 *  {*} TODO: Descrever retorno

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
      shortCircuit: true
    };
  }

  // Se não conseguiu resolver, passa para o próximo
  return nextResolve(specifier, context);
}
`;

  try {
    await fs.writeFile(loaderPath, loaderContent, 'utf-8');// console.log('✅ Atualizado: src/node.loader.mjs'); // TODO: Remover antes da produção
  } catch (error) {
    console.error('❌ Erro ao atualizar src/node.loader.mjs:', error);
  }
}

/**
 * Atualiza tests/node.loader.mjs
 */

async function updateTestsLoader() {
  const loaderPath = join(projectRoot, 'tests', 'node.loader.mjs');
  
  const loaderContent = `// ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITAR MANUALMENTE
// Use "npm run sync-aliases" para atualizar os aliases

/**
 * Loader ESM Universal - tests/
 * Resolver autossuficiente com todas as funcionalidades integradas
 */
import { pathToFileURL } from 'node:url';
import { join, resolve as resolvePath, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';

// Mapeamento de aliases baseado no tsconfig.json
const aliases = {
  '/tipos.js': '../src/tipos/tipos.ts',
  '/': '../src/nucleo/',
  '/': '../src/shared/',
  '/': '../src/analistas/',
  '/': '../src/arquitetos/',
  '/': '../src/zeladores/',
  '/': '../src/relatorios/',
  '/': '../src/guardian/',
  '/': '../src/cli/',
  '/': '../src/tipos/',
  '/': '../src/',
  '@/': '../src/',
};

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
      
      // Determina o caminho base para testes (sempre relativo a tests/)
      const parentURL = context.parentURL;
      let basePath = '';
      
      if (parentURL) {
        const parentPath = new URL(parentURL).pathname;
        if (parentPath.includes('/tests/')) {
          basePath = resolvePath(parentPath.split('/tests/')[0], 'tests');
        } else {
          // Fallback para tests/
          basePath = resolvePath(process.cwd(), 'tests');
        }
      } else {
        basePath = resolvePath(process.cwd(), 'tests');
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
      shortCircuit: true
    };
  }

  // Se não conseguiu resolver, passa para o próximo
  return nextResolve(specifier, context);
}
`;

  try {
    await fs.writeFile(loaderPath, loaderContent, 'utf-8');// console.log('✅ Atualizado: tests/node.loader.mjs'); // TODO: Remover antes da produção
  } catch (error) {
    console.error('❌ Erro ao atualizar tests/node.loader.mjs:', error);
  }
}

/**
 * Gera documentação dos aliases
 */

async function generateAliasDocumentation() {
  const docPath = join(projectRoot, 'docs', 'ALIASES.md');
  const tsPaths = await getAliasPaths('typescript');
  const aliasList = Object.keys(tsPaths).map(k => k.replace(/\*$/, ''));
  
  const docContent = `# Sistema de Aliases do Oráculo

> **ARQUIVO GERADO AUTOMATICAMENTE**  
> Use \`npm run sync-aliases\` para atualizar

## Visão Geral

O Oráculo utiliza um sistema centralizado de aliases TypeScript para simplificar imports e manter consistência em todo o projeto.

## Aliases Disponíveis

${aliasList.map((alias) => 
  `### \`${alias}\`
- **Caminho (tsconfig)**: ${(tsPaths[alias + '*'] || []).join(', ')}
- **Exemplo**: \`import { func } from '${alias}exemplo';\``
).join('\n\n')}

## Como Usar

### Em Arquivos TypeScript
\`\`\`typescript
// ✅ Correto - usar aliases
import { executar } from '/executor';
import { analisarPadroes } from '/javascript-typescript/analista-padroes-uso';
import { salvarEstado } from '/persistence/persistencia';

// ❌ Incorreto - imports relativos longos  
import { executar } from '../../../nucleo/executor';
\`\`\`

### Em Testes
\`\`\`typescript
// ✅ Correto - mesmos aliases funcionam nos testes
import { describe, it, expect } from 'vitest';
import { JavaPlugin } from '/plugins/java/java-plugin';
\`\`\`

## Configuração Automática

O sistema sincroniza automaticamente:

- ✅ \`src/tsconfig.json\` - Paths para desenvolvimento  
- ✅ \`tsconfig.eslint.json\` - Paths para ESLint
- ✅ \`src/node.loader.mjs\` - Loader ESM para src/
- ✅ \`tests/node.loader.mjs\` - Loader ESM para testes
- ✅ \`vitest.config.ts\` - Aliases para Vitest

## Adicionando Novos Aliases

1. Edite \`src/shared/alias-config.ts\`
2. Execute \`npm run sync-aliases\`
3. Os arquivos de configuração serão atualizados automaticamente

### Exemplo:
\`\`\`typescript
// Em src/shared/alias-config.ts
export const ALIASES: AliasConfig[] = [
  // ...aliases existentes...
  {
    alias: '/',
    srcPath: 'novo-modulo/',
    description: 'Descrição do novo módulo'
  }
];
\`\`\`

## Scripts Disponíveis

- \`npm run sync-aliases\` - Sincronizar configuração de aliases
- \`npm run validate-aliases\` - Validar consistência dos aliases

## Troubleshooting

### Erro "Cannot resolve module"
1. Verifique se executou \`npm run sync-aliases\`
2. Reinicie o TypeScript server (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")
3. Verifique se o alias está definido em \`alias-config.ts\`

### Imports não funcionam em testes
1. Certifique-se de que \`tests/node.loader.mjs\` foi atualizado
2. Execute testes com \`--loader\` flag se necessário
3. Verifique se \`TESTS_LOADER_BASE\` está configurado corretamente
`;

  try {
    await fs.writeFile(docPath, docContent, 'utf-8');// console.log('✅ Gerado: docs/ALIASES.md'); // TODO: Remover antes da produção
  } catch (error) {
    console.error('❌ Erro ao gerar documentação:', error);
  }
}

/**
 * Função principal
 */

async function main() {// console.log('🔄 Sincronizando configuração de aliases...\n'); // TODO: Remover antes da produção
  await Promise.all([
    updateSrcTsConfig(),
    updateEslintTsConfig(),
    updateSrcLoader(),
    updateTestsLoader(),
    generateAliasDocumentation()
  ]);// console.log('\n✅ Sincronização concluída!'); // TODO: Remover antes da produção// console.log('\n💡 Próximos passos:'); // TODO: Remover antes da produção// console.log('   1. Reinicie o TypeScript server no VS Code'); // TODO: Remover antes da produção// console.log('   2. Execute os testes para validar: npm test'); // TODO: Remover antes da produção// console.log('   3. Verifique a documentação: docs/ALIASES.md'); // TODO: Remover antes da produção
}

// Executar se chamado diretamente
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(console.error);
}

export { main as syncAliases };