// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { grafoDependencias } from '@analistas/detectores/detector-dependencias.js';
import { config } from '@core/config/config.js';
import { isInsideSrc } from '@core/config/paths.js';
import { scanRepository } from '@core/execution/scanner.js';
import { minimatch } from 'minimatch';

import type { ArquivoFantasma, FileMap } from '@';

const EXTENSOES_ALVO = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];

// Janela de inatividade mínima para considerar fantasma (default mais conservador)
const INATIVIDADE_DIAS = Number(process.env.GHOST_DAYS) || 45;
const MILIS_POR_DIA = 86_400_000;

// Padrões de entrypoints comuns que NÃO devem ser considerados órfãos
const ENTRYPOINT_PATTERNS = [
  /^(src\/)?index\.(ts|js|tsx|jsx|mjs|cjs)$/i,
  /^(src\/)?main\.(ts|js|tsx|jsx|mjs|cjs)$/i,
  /^(src\/)?server\.(ts|js|tsx|jsx|mjs|cjs)$/i,
  /^(src\/)?app\.(ts|js|tsx|jsx|mjs|cjs)$/i,
  /^(src\/)?cli\.(ts|js|tsx|jsx|mjs|cjs)$/i,
  /(^|\/)bin\/[^/]+\.(ts|js|mjs|cjs)$/i,
  /\/index\.(ts|js|tsx|jsx|mjs|cjs)$/i,
  /config\.(ts|js|cjs|mjs)$/i,
  /\.config\.(ts|js|cjs|mjs)$/i,
  /\.d\.ts$/i,
];

/**
 * Verifica se o arquivo é de teste usando a configuração centralizada
 */
function isTestFileFromConfig(relPath: string): boolean {
  const testConfig = (
    config as unknown as { testPatterns?: { files?: string[] } }
  ).testPatterns;
  const patterns = testConfig?.files || [
    '**/*.test.*',
    '**/*.spec.*',
    'test/**/*',
    'tests/**/*',
    '**/__tests__/**',
  ];
  const normalized = relPath.replace(/\\/g, '/');
  return patterns.some((p) => minimatch(normalized, p, { dot: true }));
}

/**
 * Verifica se é um entrypoint conhecido (bin, cli, main, index, etc.)
 */
function isEntrypoint(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  return ENTRYPOINT_PATTERNS.some((p) => p.test(normalized));
}

/**
 * Verifica se o arquivo está sendo referenciado por outro arquivo no grafo
 */
function estaSendoReferenciado(
  relPath: string,
  grafo: Map<string, Set<string>>,
): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  // Variações que podem existir no grafo (com/sem extensão, etc.)
  const variations = new Set<string>([normalized]);
  const ext = path.posix.extname(normalized);
  if (ext) {
    variations.add(normalized.slice(0, -ext.length));
  }
  // Adiciona variações com extensões comuns
  const base = ext ? normalized.slice(0, -ext.length) : normalized;
  for (const e of ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs']) {
    variations.add(base + e);
  }

  for (const dependencias of grafo.values()) {
    for (const dep of dependencias) {
      const depNorm = dep.replace(/\\/g, '/');
      if (variations.has(depNorm)) return true;
    }
  }
  return false;
}

/**
 * Verifica se o arquivo importa outros (é um consumidor, não apenas consumido)
 */
function importaOutros(
  relPath: string,
  grafo: Map<string, Set<string>>,
): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  for (const [chave, deps] of grafo.entries()) {
    if (chave.replace(/\\/g, '/') === normalized && deps.size > 0) {
      return true;
    }
  }
  return false;
}

export async function detectarFantasmas(
  baseDir: string = process.cwd(),
): Promise<{ total: number; fantasmas: ArquivoFantasma[] }> {
  const fileMap: FileMap = await scanRepository(baseDir);
  const agora = Date.now();
  const fantasmas: ArquivoFantasma[] = [];

  // Verifica se a config permite excluir testes da checagem de órfãos
  const testConfig = (
    config as unknown as { testPatterns?: { excludeFromOrphanCheck?: boolean } }
  ).testPatterns;
  const excludeTestsFromOrphan = testConfig?.excludeFromOrphanCheck !== false; // default true

  for (const entrada of Object.values(fileMap)) {
    const { relPath, fullPath } = entrada;
    const ext = path.extname(relPath).toLowerCase();

    if (!EXTENSOES_ALVO.includes(ext)) continue;

    // 1. Ignora arquivos de teste (usando config centralizada)
    if (excludeTestsFromOrphan && isTestFileFromConfig(relPath)) {
      continue;
    }

    // 2. Ignora entrypoints conhecidos
    if (isEntrypoint(relPath)) {
      continue;
    }

    try {
      const stat = await fs.stat(fullPath);
      const diasInativo = Math.floor((agora - stat.mtimeMs) / MILIS_POR_DIA);

      // Se o grafo ainda não foi populado (execução isolada da poda), não arrisca classificar
      if (grafoDependencias.size === 0) continue;

      const referenciado = estaSendoReferenciado(relPath, grafoDependencias);

      // 3. Arquivo que importa outros não é órfão (é um consumidor/entrypoint)
      if (importaOutros(relPath, grafoDependencias)) {
        continue;
      }

      // 4. Proteção extra para arquivos dentro de src/
      if (isInsideSrc(relPath)) {
        // Arquivos recentes (menos de 7 dias) não são marcados como órfãos
        if (diasInativo < 7) continue;
      }

      // 5. Heurística final: somente é fantasma se (não referenciado) E (inativo acima do limiar)
      if (!referenciado && diasInativo > INATIVIDADE_DIAS) {
        fantasmas.push({ arquivo: relPath, referenciado, diasInativo });
      }
    } catch {
      // Silenciosamente ignora arquivos inacessíveis
    }
  }

  return {
    total: fantasmas.length,
    fantasmas,
  };
}
