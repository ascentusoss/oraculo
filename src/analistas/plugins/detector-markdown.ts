// SPDX-License-Identifier: MIT
/**
 * @fileoverview Detector de problemas em arquivos Markdown
 *
 * Verifica compliance de licenças, proveniência e referências em documentação.
 * Migrado de: scripts/scan-markdown.mjs
 * Data: 2025-11-02
 *
 * Funcionalidades:
 * - Detecta licenças incompatíveis (GPL, AGPL, CC-BY, etc)
 * - Verifica presença de aviso de proveniência
 * - Identifica referências de risco (Stack Overflow, cessão de direitos)
 * - Whitelist configurável para documentos de política
 */

import { promises as fs } from 'node:fs';

import { config } from '@core/config/config.js';
import { log } from '@core/messages/index.js';

import type { Ocorrencia } from '@';

import type {
  MarkdownAnaliseArquivo,
  MarkdownDetectorOptions,
  MarkdownLicensePatterns,
  MarkdownProblema,
  MarkdownWhitelistConfig,
} from '../../types/analistas/markdown.js';

/**
 * Padrões de licenças e cessões problemáticas
 */
const LICENSE_PATTERNS: MarkdownLicensePatterns = {
  incompativeis: [
    /\bGPL\b/i,
    /\bAGPL\b/i,
    /\bLGPL\b/i,
    /Creative\s+Commons/i,
    /\bCC-BY\b/i,
    /All\s+rights\s+reserved/i,
  ],
  cessaoDireitos: [
    /cess(?:ã|a)o\s+de\s+direitos/i,
    /transfer(?:ê|e)ncia\s+de\s+direitos/i,
  ],
  referenciasRisco: [
    /Stack\s*Overflow/i,
    /stackoverflow\.com/i,
    /\bassign\b/i,
    /\bcession\b/i,
  ],
};

/**
 * Whitelist padrão de arquivos
 */
const DEFAULT_WHITELIST: MarkdownWhitelistConfig = {
  paths: [
    '.github/copilot-instructions.md',
    'docs/POLICY-PROVENIENCIA.md',
    'docs/partials/AVISO-PROVENIENCIA.md',
  ],
  patterns: ['**/relatorios/**', 'docs/historico/**', 'tests/**', 'tmp*.md'],
  dirs: [
    'pre-public',
    'preview-oraculo',
    '.abandonados',
    '.deprecados',
    'relatorios',
  ],
};

/**
 * Cria regex combinado de todos os padrões de risco
 */
function createRiskRegex(): RegExp {
  const allPatterns = [
    ...LICENSE_PATTERNS.incompativeis,
    ...LICENSE_PATTERNS.cessaoDireitos,
    ...LICENSE_PATTERNS.referenciasRisco,
  ]
    .map((r) => r.source)
    .join('|');

  return new RegExp(allPatterns, 'i');
}

/**
 * Verifica se arquivo tem aviso de proveniência
 */
function hasProvenienciaHeader(content: string, headerLines = 30): boolean {
  const head = content.split(/\r?\n/).slice(0, headerLines).join('\n');
  return /Proveni[eê]ncia\s+e\s+Autoria/i.test(head);
}

/**
 * Verifica se arquivo está na whitelist
 */
function isWhitelisted(
  relPath: string,
  whitelist: MarkdownWhitelistConfig,
): boolean {
  const normalized = relPath.replace(/\\/g, '/');

  // Paths exatos
  if (
    whitelist.paths.some(
      (p: string) => normalized === p || normalized.endsWith(`/${p}`),
    )
  ) {
    return true;
  }

  // Diretórios
  if (whitelist.dirs.some((dir: string) => normalized.startsWith(`${dir}/`))) {
    return true;
  }

  // Patterns (simplificado - sem glob completo)
  for (const pattern of whitelist.patterns) {
    if (pattern.includes('**')) {
      const parts = pattern.split('**');
      if (
        parts.every((part: string) =>
          normalized.includes(part.replace(/\*/g, '')),
        )
      ) {
        return true;
      }
    } else if (pattern.startsWith('*')) {
      if (normalized.endsWith(pattern.substring(1))) {
        return true;
      }
    } else if (pattern.includes('*')) {
      const [prefix, suffix] = pattern.split('*');
      if (normalized.startsWith(prefix) && normalized.endsWith(suffix)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifica se tem marcador de risco aprovado
 */
function hasRiskReferenceMarker(content: string): boolean {
  return /<!--\s*RISCO_REFERENCIA_OK\s*-->/i.test(content);
}

function hasOraculoIgnoreMarker(content: string, key: string): boolean {
  // Ex.: <!-- oraculo-ignore: license-check -->
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `<!--\\s*oraculo-ignore\\s*:\\s*${escaped}\\s*-->`,
    'i',
  ).test(content);
}

function mergeWhitelist(
  base: MarkdownWhitelistConfig,
  override: Partial<MarkdownWhitelistConfig> | undefined,
  mode: 'merge' | 'replace',
): MarkdownWhitelistConfig {
  const o = override || {};
  if (mode === 'replace') {
    return {
      paths: Array.isArray(o.paths) ? o.paths : [],
      patterns: Array.isArray(o.patterns) ? o.patterns : [],
      dirs: Array.isArray(o.dirs) ? o.dirs : [],
    };
  }

  const uniq = (arr: string[]) => Array.from(new Set(arr.map(String)));
  const opaths = Array.isArray(o.paths) ? o.paths : [];
  const opatterns = Array.isArray(o.patterns) ? o.patterns : [];
  const odirs = Array.isArray(o.dirs) ? o.dirs : [];
  return {
    paths: uniq([...(base.paths || []), ...opaths]),
    patterns: uniq([...(base.patterns || []), ...opatterns]),
    dirs: uniq([...(base.dirs || []), ...odirs]),
  };
}

/**
 * Verifica se o único termo de risco é do aviso de proveniência
 */
function isBenignProvenienciaOnly(content: string): boolean {
  const rxCessao = /cess(?:ã|a)o\s+de\s+direitos/i;
  const rxOthers = new RegExp(
    [
      '\\bGPL\\b',
      '\\bAGPL\\b',
      '\\bLGPL\\b',
      'Creative\\s+Commons',
      '\\bCC-BY\\b',
      'Stack\\s*Overflow',
      'stackoverflow\\.com',
      'All\\s+rights\\s+reserved',
      'transfer(?:ê|e)ncia\\s+de\\s+direitos',
      '\\bassign\\b',
      '\\bcession\\b',
    ].join('|'),
    'i',
  );

  const hasCessao = rxCessao.test(content);
  const hasOthers = rxOthers.test(content);
  const hasAviso = /Proveni[eê]ncia\s+e\s+Autoria/i.test(content);

  return hasAviso && hasCessao && !hasOthers;
}

/**
 * Analisa um arquivo Markdown
 */
async function analisarArquivoMarkdown(
  fullPath: string,
  relPath: string,
  options: MarkdownDetectorOptions,
): Promise<MarkdownAnaliseArquivo> {
  const whitelist = options.whitelist || DEFAULT_WHITELIST;
  const problemas: MarkdownProblema[] = [];

  let content: string;
  try {
    content = await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    return {
      relPath,
      fullPath,
      problemas: [
        {
          tipo: 'formato-invalido',
          descricao: `Erro ao ler arquivo: ${(error as Error).message}`,
          severidade: 'medio',
        },
      ],
      temProveniencia: false,
      whitelisted: false,
      temRiscoOk: false,
    };
  }

  const whitelisted = isWhitelisted(relPath, whitelist);
  const temRiscoOk = hasRiskReferenceMarker(content);
  const temProveniencia = hasProvenienciaHeader(
    content,
    options.headerLines || 30,
  );
  const ignoreLicenseCheck = hasOraculoIgnoreMarker(content, 'license-check');

  // Verificar proveniência
  if (options.checkProveniencia !== false && !temProveniencia && !whitelisted) {
    problemas.push({
      tipo: 'falta-proveniencia',
      descricao:
        'Arquivo não possui aviso de Proveniência e Autoria nas primeiras linhas',
      severidade: 'alto',
      sugestao: 'Adicione o aviso usando scripts/add-disclaimer-md.js',
    });
  }

  // Verificar licenças e referências
  if (options.checkLicenses !== false || options.checkReferences !== false) {
    const riskRegex = createRiskRegex();
    const hasRisk = riskRegex.test(content);

    if (
      hasRisk &&
      !isBenignProvenienciaOnly(content) &&
      !whitelisted &&
      !temRiscoOk
    ) {
      // Identificar problemas específicos
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Verificar licenças incompatíveis
        if (options.checkLicenses !== false && !ignoreLicenseCheck) {
          for (const pattern of LICENSE_PATTERNS.incompativeis) {
            if (pattern.test(line)) {
              problemas.push({
                tipo: 'licenca-incompativel',
                descricao: `Licença potencialmente incompatível: ${pattern.source}`,
                severidade: 'critico',
                linha: i + 1,
                trecho: line.trim().substring(0, 100),
                sugestao:
                  'Verifique compatibilidade com licença MIT do projeto',
              });
            }
          }
        }

        // Verificar cessão de direitos
        if (options.checkReferences !== false) {
          for (const pattern of LICENSE_PATTERNS.cessaoDireitos) {
            if (pattern.test(line)) {
              problemas.push({
                tipo: 'referencia-risco',
                descricao: 'Referência a cessão de direitos detectada',
                severidade: 'alto',
                linha: i + 1,
                trecho: line.trim().substring(0, 100),
                sugestao: 'Verifique se não há implicações legais',
              });
            }
          }

          // Verificar referências externas
          for (const pattern of LICENSE_PATTERNS.referenciasRisco) {
            if (pattern.test(line)) {
              problemas.push({
                tipo: 'referencia-risco',
                descricao: `Referência externa detectada: ${pattern.source}`,
                severidade: 'medio',
                linha: i + 1,
                trecho: line.trim().substring(0, 100),
                sugestao:
                  'Adicione marcador <!-- RISCO_REFERENCIA_OK --> se referência for válida',
              });
            }
          }
        }
      }
    }
  }

  return {
    relPath,
    fullPath,
    problemas,
    temProveniencia,
    whitelisted,
    temRiscoOk,
  };
}

/**
 * Converte análise para ocorrências do Oráculo
 */
function converterParaOcorrencias(
  analise: MarkdownAnaliseArquivo,
): Ocorrencia[] {
  const ocorrencias: Ocorrencia[] = [];

  for (const problema of analise.problemas) {
    let nivel: 'erro' | 'aviso' | 'info';
    switch (problema.severidade) {
      case 'critico':
      case 'alto':
        nivel = 'erro';
        break;
      case 'medio':
        nivel = 'aviso';
        break;
      default:
        nivel = 'info';
    }

    ocorrencias.push({
      tipo: `markdown-${problema.tipo}`,
      nivel,
      mensagem: problema.descricao,
      relPath: analise.relPath,
      linha: problema.linha,
      contexto: problema.trecho,
      sugestao: problema.sugestao,
    });
  }

  return ocorrencias;
}

/**
 * Detector de problemas em Markdown
 */
export const detectorMarkdown = {
  nome: 'detector-markdown',
  categoria: 'documentacao',
  descricao: 'Detecta problemas de compliance em arquivos Markdown',

  test: (relPath: string): boolean => {
    return relPath.toLowerCase().endsWith('.md');
  },

  aplicar: async (
    src: string,
    relPath: string,
    _ast: unknown,
    fullPath?: string,
  ): Promise<Ocorrencia[]> => {
    if (!fullPath) {
      log.aviso(`detector-markdown: fullPath não fornecido para ${relPath}`);
      return [];
    }

    const cfg = (config as unknown as { detectorMarkdown?: unknown })
      .detectorMarkdown as
      | {
          checkProveniencia?: boolean;
          checkLicenses?: boolean;
          checkReferences?: boolean;
          headerLines?: number;
          whitelist?: Partial<MarkdownWhitelistConfig>;
          whitelistMode?: 'merge' | 'replace';
        }
      | undefined;

    const whitelistMode: 'merge' | 'replace' =
      cfg?.whitelistMode === 'replace' || cfg?.whitelistMode === 'merge'
        ? cfg.whitelistMode
        : 'merge';

    const options: MarkdownDetectorOptions = {
      checkProveniencia: cfg?.checkProveniencia ?? true,
      checkLicenses: cfg?.checkLicenses ?? true,
      checkReferences: cfg?.checkReferences ?? true,
      headerLines: typeof cfg?.headerLines === 'number' ? cfg.headerLines : 30,
      whitelist: mergeWhitelist(
        DEFAULT_WHITELIST,
        cfg?.whitelist,
        whitelistMode,
      ),
    };

    try {
      const analise = await analisarArquivoMarkdown(fullPath, relPath, options);
      return converterParaOcorrencias(analise);
    } catch (error) {
      log.erro(
        `Erro ao analisar Markdown ${relPath}: ${(error as Error).message}`,
      );
      return [];
    }
  },
};

/**
 * Exporta função de análise standalone para uso em outros módulos
 */
export { analisarArquivoMarkdown };
