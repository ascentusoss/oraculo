// SPDX-License-Identifier: MIT
/**
 * 🎯 Sistema de Filtros para Diagnóstico
 *
 * Gerencia inclusão/exclusão de arquivos para análise
 * - Processa padrões glob
 * - Expande diretórios automaticamente
 * - Gerencia node_modules e outros padrões especiais
 * - Aplica precedência correta (CLI > config > defaults)
 */

import fs from 'node:fs';
import path from 'node:path';

import { config } from '/config/config.js';
import { mesclarConfigExcludes } from '/config/excludes-padrao.js';

import type {
  FiltrosProcessados,
  OpcoesProcessamentoFiltros,
  TipoLinguagemProjeto,
} from '@';

  /* -------------------------- PROCESSAMENTO DE PADRÕES -------------------------- */

/**
 * Processa lista de padrões achatada (vírgulas, espaços)
 *
 *
 * processPatternListAchatado(['src/**', 'tests, lib'])
 * // => ['src/**', 'tests', 'lib']
 */
export function processPatternListAchatado(
  raw: string[] | undefined,
): string[] {
  if (!raw || raw.length === 0) return [];

  return Array.from(
    new Set(
      raw
        .flatMap((r) => r.split(/[\s,]+/))
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

/**
 * Processa padrões em grupos (cada elemento da lista é um grupo)
 *
 *
 * processPatternGroups(['src/** tests/**', 'lib/**'])
 * // => [['src/**', 'tests/**'], ['lib/**']]
 */
export function processPatternGroups(raw: string[] | undefined): string[][] {
  if (!raw || raw.length === 0) return [];

  return raw
    .map((grupo) =>
      grupo
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .filter((g) => g.length > 0);
}

/**
 * Expande padrões de inclusão (adiciona variantes recursivas)
 *
 * Para padrões sem metacaracteres glob, adiciona:
 * - `pattern/**` (recursivo)
 * - `** /pattern/**` (se não tiver barra)
 *
 *
 * expandIncludes(['src', 'lib/*.ts'])
 * // => ['src', 'src/**', '** /src/**', 'lib/*.ts']
 */
export function expandIncludes(list: string[]): string[] {
  const META = /[\\*\?\{\}\[\]]/; // metacaracteres glob
  const out = new Set<string>();

  for (const p of list) {
    out.add(p);

    // Se não tem metacaracteres, é um diretório literal
    if (!META.test(p)) {
      // Remove barras terminais
      const normalized = p.replace(/[\\\/]+$/, '');

      // Adiciona variante recursiva
      out.add(`${normalized}/**`);

      // Se é nome simples (sem barra), adiciona busca em qualquer nível
      if (!p.includes('/') && !p.includes('\\')) {
        out.add(`**/${normalized}/**`);
      }
    }
  }

  return Array.from(out);
}

  /* -------------------------- DETECÇÃO DE TIPO DE PROJETO -------------------------- */

/**
 * Detecta tipo de projeto baseado em arquivos presentes
 */
export function detectarTipoProjeto(
  baseDir: string = process.cwd(),
): TipoLinguagemProjeto {
  try {
    // TypeScript
    if (
      fs.existsSync(path.join(baseDir, 'tsconfig.json')) &&
      fs.existsSync(path.join(baseDir, 'package.json'))
    ) {
      return 'typescript';
    }

    // Node.js
    if (fs.existsSync(path.join(baseDir, 'package.json'))) {
      return 'nodejs';
    }

    // Python
    if (
      fs.existsSync(path.join(baseDir, 'requirements.txt')) ||
      fs.existsSync(path.join(baseDir, 'pyproject.toml')) ||
      fs.existsSync(path.join(baseDir, 'setup.py'))
    ) {
      return 'python';
    }

    // Java
    if (
      fs.existsSync(path.join(baseDir, 'pom.xml')) ||
      fs.existsSync(path.join(baseDir, 'build.gradle')) ||
      fs.existsSync(path.join(baseDir, 'build.gradle.kts'))
    ) {
      return 'java';
    }

    // .NET
    const files = fs.readdirSync(baseDir);
    if (
      files.some((f) => f.endsWith('.csproj')) ||
      files.some((f) => f.endsWith('.sln'))
    ) {
      return 'dotnet';
    }

    return 'generico';
  } catch {
    return 'generico';
  }
}

  /* -------------------------- PADRÕES DE EXCLUSÃO -------------------------- */

/**
 * Obtém padrões de exclusão padrão baseados em configuração e tipo de projeto
 */
export function getDefaultExcludes(
  tipoProjeto?: TipoLinguagemProjeto,
): string[] {
  // Tenta obter do oraculo.config.json
  const configIncludeExclude = config.INCLUDE_EXCLUDE_RULES;

  if (configIncludeExclude?.globalExcludeGlob) {
    if (
      Array.isArray(configIncludeExclude.globalExcludeGlob) &&
      configIncludeExclude.globalExcludeGlob.length > 0
    ) {
      return Array.from(new Set(configIncludeExclude.globalExcludeGlob));
    }
  }

  // Fallback: usa padrões do sistema baseado no tipo de projeto
  const tipo = tipoProjeto || detectarTipoProjeto();
  return mesclarConfigExcludes(null, tipo);
}

  /* -------------------------- CONFIGURAÇÃO DE FILTROS -------------------------- */

/**
 * Processa e aplica filtros CLI
 *
 * Precedência:
 * 1. CLI --exclude (máxima)
 * 2. oraculo.config.json
 * 3. Padrões do sistema (fallback)
 */
export function processarFiltros(
  opcoes: OpcoesProcessamentoFiltros,
): FiltrosProcessados {
  const tipoProjeto = detectarTipoProjeto();

  // Processar includes
  const includeGroups = processPatternGroups(opcoes.include);
  const includeFlat = includeGroups.flat();
  const includeExpanded = expandIncludes(includeFlat);

  // Processar excludes
  const excludeFlat = processPatternListAchatado(opcoes.exclude);

  // Determinar padrões de exclusão finais
  let excludePatterns: string[];
  if (excludeFlat.length > 0) {
    // CLI tem precedência
    excludePatterns = excludeFlat;
  } else {
    // Usar defaults do config ou sistema
    excludePatterns = getDefaultExcludes(tipoProjeto);
  }

  // Verificar se node_modules deve ser incluído
  let incluiNodeModules = opcoes.forceIncludeNodeModules || false;
  if (includeFlat.some((p) => /node_modules/.test(p))) {
    incluiNodeModules = true;
  }

  // Remover node_modules dos excludes se explicitamente incluído
  if (incluiNodeModules) {
    excludePatterns = excludePatterns.filter((p) => !/node_modules/.test(p));
  }

  // Processar flag de testes
  if (opcoes.forceIncludeTests && !includeFlat.some((p) => /tests?/.test(p))) {
    includeExpanded.push('tests/**', 'test/**', '**/*.test.*', '**/*.spec.*');
  }

  return {
    includeGroups,
    includeFlat: includeExpanded,
    excludePatterns,
    incluiNodeModules,
    tipoProjeto,
  };
}

/**
 * Aplica filtros processados ao config global
 */
export function aplicarFiltrosAoConfig(filtros: FiltrosProcessados): void {
  // Configurar includes
  if (filtros.includeFlat.length > 0) {
    config.CLI_INCLUDE_GROUPS = filtros.includeGroups;
    config.CLI_INCLUDE_PATTERNS = filtros.includeFlat;
  } else {
    config.CLI_INCLUDE_GROUPS = [];
    config.CLI_INCLUDE_PATTERNS = [];
  }

  // Configurar excludes
  config.CLI_EXCLUDE_PATTERNS = filtros.excludePatterns;
}

/**
 * API simplificada: processa e aplica filtros em uma única chamada
 */
export function configurarFiltros(
  opcoes: OpcoesProcessamentoFiltros,
): FiltrosProcessados {
  const filtros = processarFiltros(opcoes);
  aplicarFiltrosAoConfig(filtros);
  return filtros;
}
