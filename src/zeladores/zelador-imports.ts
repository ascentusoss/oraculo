// SPDX-License-Identifier: MIT
/**
 * Zelador de Imports
 *
 * Corrige automaticamente imports em arquivos TypeScript/JavaScript:
 * - Converte imports relativos para aliases (, , etc)
 * - Normaliza /<subpath> para /types
 * - Remove extensões .js desnecessárias em imports de tipos
 *
 * Migrado de:
 * - scripts/fix-alias-imports.mjs
 * - scripts/fix-tipos-imports.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { log } from '/messages/index.js';
import {
  ERROS_IMPORTS,
  gerarResumoImports,
  MENSAGENS_IMPORTS,
  PROGRESSO_IMPORTS,
} from '/messages/zeladores/zelador-messages.js';

import type {
  AliasConfig,
  ImportCorrecao,
  ImportCorrecaoArquivo,
  ImportCorrecaoOptions,
} from '@';

/**
 * Configuração padrão de aliases baseada em tsconfig.json
 */
const DEFAULT_ALIAS_CONFIG: AliasConfig = {
  '': './core',
  '': './analistas',
  '': './types',
  '': './shared',
  '': './cli',
  '': './guardian',
  '': './relatorios',
  '': './zeladores',
};

/**
 * Padrões de imports que devem ser corrigidos
 */
const PATTERNS = {
  // /types.js → /types
  tiposComExtensao: /\/types\.js\b/g,

  // Imports relativos que podem ser convertidos em aliases
  importRelativo: /from\s+(['"])(\.\.[\/\\].+?)\1/g,
};

/**
 * Caminha recursivamente por um diretório coletando arquivos
 */
async function* walkDirectory(dir: string): AsyncGenerator<string> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Pular node_modules, dist, coverage, etc
        if (['node_modules', 'dist', 'coverage', '.git'].includes(entry.name)) {
          continue;
        }
        yield* walkDirectory(fullPath);
      } else if (entry.isFile()) {
        // Apenas arquivos TS/JS/JSX/TSX
        if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
          yield fullPath;
        }
      }
    }
  } catch (error) {
    log.erro(ERROS_IMPORTS.lerDiretorio(dir, error));
  }
}

/**
 * Corrige imports de  com extensão .js ou subpaths
 */
function corrigirImportsTipos(conteudo: string): {
  conteudo: string;
  correcoes: ImportCorrecao[];
} {
  const correcoes: ImportCorrecao[] = [];
  let conteudoAtualizado = conteudo;

  // Corrigir /types.js → /types
  conteudoAtualizado = conteudoAtualizado.replace(
    PATTERNS.tiposComExtensao,
    (match, offset) => {
      correcoes.push({
        tipo: 'tipos-extensao',
        de: match,
        para: '/types',
        linha: conteudo.substring(0, offset).split('\n').length,
      });
      return '/types';
    },
  );

  // Corrigir /<subpath> → /types
  // Importante: não deve "corrigir" o que já está em /types (evita duplicar correções).
  const regex = /(['"])\/([^'"\n]+?)\1/g;
  conteudoAtualizado = conteudoAtualizado.replace(
    regex,
    (match, quote: string, subpath: string, offset: number) => {
      const normalized = String(subpath || '').trim();

      // Já correto: não gera correção nem altera texto.
      if (normalized === 'types') return match;

      // Caso ainda chegue aqui como types.js (por algum input estranho), não duplicar: trata como extensão.
      if (normalized === 'types.js') {
        const novoImport = `${quote}/types${quote}`;
        correcoes.push({
          tipo: 'tipos-extensao',
          de: match,
          para: novoImport,
          linha: conteudo.substring(0, offset).split('\n').length,
        });
        return novoImport;
      }

      const novoImport = `${quote}/types${quote}`;
      correcoes.push({
        tipo: 'tipos-subpath',
        de: match,
        para: novoImport,
        linha: conteudo.substring(0, offset).split('\n').length,
      });
      return novoImport;
    },
  );

  return { conteudo: conteudoAtualizado, correcoes };
}

/**
 * Detecta e corrige imports relativos que podem ser convertidos em aliases
 */
function corrigirImportsRelativos(
  conteudo: string,
  _filePath: string,
  _projectRoot: string,
  _aliasConfig: AliasConfig,
): { conteudo: string; correcoes: ImportCorrecao[] } {
  const correcoes: ImportCorrecao[] = [];
  const conteudoAtualizado = conteudo;

  // Implementação simplificada - não tenta converter relativos para aliases
  // pois requer análise de paths complexa. Foco apenas em  por enquanto.

  return { conteudo: conteudoAtualizado, correcoes };
}

/**
 * Processa um único arquivo corrigindo todos os imports
 */
async function processarArquivo(
  filePath: string,
  options: ImportCorrecaoOptions,
): Promise<ImportCorrecaoArquivo> {
  const resultado: ImportCorrecaoArquivo = {
    arquivo: path.relative(options.projectRoot, filePath),
    correcoes: [],
    modificado: false,
  };

  try {
    const conteudoOriginal = await fs.readFile(filePath, 'utf-8');
    let conteudoAtualizado = conteudoOriginal;

    // Aplicar correções de
    if (options.corrigirTipos !== false) {
      const { conteudo, correcoes } = corrigirImportsTipos(conteudoAtualizado);
      conteudoAtualizado = conteudo;
      resultado.correcoes.push(...correcoes);
    }

    // Aplicar correções de imports relativos
    if (options.corrigirRelativos !== false) {
      const { conteudo, correcoes } = corrigirImportsRelativos(
        conteudoAtualizado,
        filePath,
        options.projectRoot,
        options.aliasConfig || DEFAULT_ALIAS_CONFIG,
      );
      conteudoAtualizado = conteudo;
      resultado.correcoes.push(...correcoes);
    }

    // Escrever arquivo se houver mudanças
    if (conteudoAtualizado !== conteudoOriginal) {
      if (!options.dryRun) {
        await fs.writeFile(filePath, conteudoAtualizado, 'utf-8');
      }
      resultado.modificado = true;
    }
  } catch (error) {
    resultado.erro = error instanceof Error ? error.message : String(error);
  }

  return resultado;
}

/**
 * Executa o zelador de imports em um diretório
 */
export async function executarZeladorImports(
  targetDirs: string[],
  options: Partial<ImportCorrecaoOptions> = {},
): Promise<ImportCorrecaoArquivo[]> {
  const projectRoot = options.projectRoot || process.cwd();
  const fullOptions: ImportCorrecaoOptions = {
    projectRoot,
    dryRun: options.dryRun ?? false,
    verbose: options.verbose ?? false,
    corrigirTipos: options.corrigirTipos ?? true,
    corrigirRelativos: options.corrigirRelativos ?? false, // Desabilitado por padrão
    aliasConfig: options.aliasConfig || DEFAULT_ALIAS_CONFIG,
  };

  const resultados: ImportCorrecaoArquivo[] = [];

  for (const dir of targetDirs) {
    const fullPath = path.resolve(projectRoot, dir);

    try {
      await fs.access(fullPath);
    } catch {
      if (fullOptions.verbose) {
        log.aviso(PROGRESSO_IMPORTS.diretorioNaoEncontrado(dir));
      }
      continue;
    }

    for await (const filePath of walkDirectory(fullPath)) {
      const resultado = await processarArquivo(filePath, fullOptions);

      if (resultado.modificado || resultado.erro) {
        resultados.push(resultado);

        if (fullOptions.verbose) {
          if (resultado.modificado) {
            log.sucesso(
              PROGRESSO_IMPORTS.arquivoProcessado(
                resultado.arquivo,
                resultado.correcoes.length,
              ),
            );
          }
          if (resultado.erro) {
            log.erro(
              PROGRESSO_IMPORTS.arquivoErro(resultado.arquivo, resultado.erro),
            );
          }
        }
      }
    }
  }

  return resultados;
}

/**
 * Gera relatório de correções aplicadas
 */
export function gerarRelatorioCorrecoes(
  resultados: ImportCorrecaoArquivo[],
): string {
  const modificados = resultados.filter((r) => r.modificado);
  const comErro = resultados.filter((r) => r.erro);
  const totalCorrecoes = modificados.reduce(
    (sum, r) => sum + r.correcoes.length,
    0,
  );

  const linhas: string[] = [
    '# Relatório de Correções de Imports\n',
    `Arquivos processados: ${resultados.length}`,
    `Arquivos modificados: ${modificados.length}`,
    `Total de correções: ${totalCorrecoes}`,
    `Erros: ${comErro.length}\n`,
  ];

  if (modificados.length > 0) {
    linhas.push('## Arquivos Modificados\n');

    for (const resultado of modificados) {
      linhas.push(`### ${resultado.arquivo}`);
      linhas.push(`**Correções:** ${resultado.correcoes.length}\n`);

      const porTipo = resultado.correcoes.reduce(
        (acc: Record<string, number>, c: ImportCorrecao) => {
          acc[c.tipo] = (acc[c.tipo] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const [tipo, count] of Object.entries(porTipo)) {
        linhas.push(`- ${tipo}: ${count}`);
      }
      linhas.push('');
    }
  }

  if (comErro.length > 0) {
    linhas.push('## Erros\n');
    for (const resultado of comErro) {
      linhas.push(`- **${resultado.arquivo}**: ${resultado.erro}`);
    }
    linhas.push('');
  }

  return linhas.join('\n');
}

/**
 * Função principal para uso via CLI ou programático
 */
export async function corrigirImports(
  dirs: string[] = ['src', 'tests'],
  options: Partial<ImportCorrecaoOptions> = {},
): Promise<void> {
  log.fase?.(MENSAGENS_IMPORTS.titulo);
  console.log(); // linha vazia para espaçamento

  const resultados = await executarZeladorImports(dirs, {
    ...options,
    verbose: true,
  });

  const modificados = resultados.filter((r) => r.modificado);
  const totalCorrecoes = modificados.reduce(
    (sum, r) => sum + r.correcoes.length,
    0,
  );
  const comErro = resultados.filter((r) => r.erro);

  const resumo = gerarResumoImports({
    processados: resultados.length,
    modificados: modificados.length,
    totalCorrecoes,
    erros: comErro.length,
    dryRun: options.dryRun ?? false,
  });

  for (const linha of resumo) {
    if (linha === '') {
      console.log();
    } else if (linha.includes('✅')) {
      log.sucesso(linha);
    } else if (linha.includes('⚠️')) {
      log.aviso(linha);
    } else {
      log.info(linha);
    }
  }
}
