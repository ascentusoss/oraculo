// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import {
  findQuickFixes,
  type PatternBasedQuickFix,
} from '@core/config/auto/fix-config.js';

import type {
  Analista,
  ConfiguracaoPontuacaoZelador,
  IntlComDisplayNames,
  Ocorrencia,
  ProblemaPontuacao,
} from '@';
import { criarOcorrencia } from '@';

  /* -------------------------- Helpers / Config -------------------------- */

// Constantes de limites e valores de threshold
const ASCII_EXTENDED_MIN = 128;
const LIMITE_CARACTERES_INCOMUNS_PADRAO = 10;
const ESPACAMENTO_CORRECAO_COUNT = 1;
const _CONTEXTO_TYPESCRIPT_LOOKBACK = 50;
const _CONTEXTO_TYPESCRIPT_LOOKAHEAD = 50;
const _MIN_CONFIANCA_ALTA = 80;
const CONFIANCA_UNICODE = 90;
const CONFIANCA_PONTUACAO = 95;
const CONFIANCA_ESPACAMENTO = 85;
const CONFIANCA_CARACTERES_INCOMUNS = 70;

const COMMON_REPLACEMENTS: Record<string, string> = {
  '\u201c': '"',
  '\u201d': '"',
  '\u2018': "'",
  '\u2019': "'",
  '\u2013': '-',
  '\u2014': '-',
  '\u00A0': ' ',
  '\u00B4': "'",
};

const REPEATABLE_TO_SINGLE = new Set([
  ',',
  '.',
  '!',
  '?',
  ':',
  ';',
  '-',
  '_',
  '*',
]);
const MULTI_PUNCT_RE = /([,\.!?:;_\-\*]){2,}/g;
const SPACE_BEFORE_PUNCT_RE = /\s+([,.:;!?])/g;
const NO_SPACE_AFTER_PUNCT_RE = /([,.:;!?])([^\s\)\]\}])/g;

const CONFIGURACAO_PADRAO: ConfiguracaoPontuacaoZelador = {
  normalizarUnicode: true,
  colapsarPontuacaoRepetida: true,
  corrigirEspacamento: true,
  balancearParenteses: false,
  detectarCaracteresIncomuns: true,
  limiteCaracteresIncomuns: LIMITE_CARACTERES_INCOMUNS_PADRAO,
};

function normalizeUnicode(input: string): { text: string; changed: boolean } {
  let normalized = input.normalize('NFKC');
  let changed = false;
  for (const [pattern, replacement] of Object.entries(COMMON_REPLACEMENTS)) {
    if (normalized.includes(pattern)) {
      normalized = normalized.split(pattern).join(replacement);
      changed = true;
    }
  }
  return { text: normalized, changed };
}

function collapseRepeatedPunct(s: string): {
  text: string;
  changed: boolean;
  count: number;
} {
  let count = 0;
  const text = s.replace(MULTI_PUNCT_RE, (m: string) => {
    count++;
    const ch = m[0];
    if (REPEATABLE_TO_SINGLE.has(ch)) return ch;
    return m;
  });
  return { text, changed: count > 0, count };
}

function fixSpacingAroundPunct(s: string): {
  text: string;
  changed: boolean;
  count: number;
} {
  const t1 = s.replace(SPACE_BEFORE_PUNCT_RE, '$1');
  const t2 = t1.replace(NO_SPACE_AFTER_PUNCT_RE, '$1 $2');
  const changed = s !== t2;
  const count = changed ? ESPACAMENTO_CORRECAO_COUNT : 0;
  return { text: t2, changed, count };
}

function detectUncommonChars(
  text: string,
  limite?: number,
): ProblemaPontuacao[] {
  const issues: ProblemaPontuacao[] = [];
  for (
    let i = 0;
    i < text.length && issues.length < (limite ?? Infinity);
    i++
  ) {
    const ch = text[i];
    const code = ch.codePointAt(0) ?? 0;
    if (code >= ASCII_EXTENDED_MIN) {
      const name = (() => {
        try {
          if (typeof Intl !== 'undefined') {
            const maybe = Intl as IntlComDisplayNames;
            const DisplayNamesCtor = maybe.DisplayNames;
            if (DisplayNamesCtor) {
              const displayNames = new DisplayNamesCtor(['en'], {
                type: 'language',
              });
              return typeof displayNames.of === 'function'
                ? (displayNames.of(ch) ?? '')
                : '';
            }
          }
          return '';
        } catch {
          return '';
        }
      })();
      issues.push({
        tipo: 'caracteres-incomuns',
        posicao: i,
        comprimento: 1,
        descricao: `Caractere incomum: ${ch} (${name || ch})`,
        sugestao: 'Considere substituir por equivalente ASCII',
        confianca: CONFIANCA_CARACTERES_INCOMUNS,
      });
    }
  }
  return issues;
}

function analisarTexto(
  src: string,
  config: ConfiguracaoPontuacaoZelador = CONFIGURACAO_PADRAO,
): ProblemaPontuacao[] {
  const problemas: ProblemaPontuacao[] = [];

  if (config.normalizarUnicode) {
    const norm = normalizeUnicode(src);
    if (norm.changed) {
      problemas.push({
        tipo: 'unicode-invalido',
        posicao: 0,
        comprimento: src.length,
        descricao: 'Texto contém caracteres Unicode que podem ser normalizados',
        sugestao: 'Aplicar normalização Unicode NFKC',
        confianca: CONFIANCA_UNICODE,
      });
    }
  }

  if (config.colapsarPontuacaoRepetida) {
    const collapsed = collapseRepeatedPunct(src);
    if (collapsed.changed) {
      problemas.push({
        tipo: 'pontuacao-repetida',
        posicao: 0,
        comprimento: src.length,
        descricao: `Encontrados ${collapsed.count} casos de pontuação repetida`,
        sugestao: 'Colapsar pontuação repetida para caracteres únicos',
        confianca: CONFIANCA_PONTUACAO,
      });
    }
  }

  if (config.corrigirEspacamento) {
    const spacing = fixSpacingAroundPunct(src);
    if (spacing.changed) {
      problemas.push({
        tipo: 'espacamento-incorreto',
        posicao: 0,
        comprimento: src.length,
        descricao: `Encontrados ${spacing.count} problemas de espaçamento em pontuação`,
        sugestao: 'Corrigir espaçamento antes/depois de pontuação',
        confianca: CONFIANCA_ESPACAMENTO,
      });
    }
  }

  if (config.detectarCaracteresIncomuns) {
    const uncommon = detectUncommonChars(
      src,
      config.limiteCaracteresIncomuns ?? undefined,
    );
    problemas.push(...uncommon);
  }

  return problemas;
}

function mapearCategoriaNivel(
  category: PatternBasedQuickFix['category'],
): 'info' | 'aviso' | 'erro' {
  switch (category) {
    case 'security':
      return 'erro';
    case 'performance':
      return 'aviso';
    case 'style':
    case 'documentation':
      return 'info';
    default:
      return 'info';
  }
}

function calcularLinha(
  src: string,
  posOrIndex: number | undefined,
  match?: RegExpMatchArray,
): number {
  if (typeof posOrIndex === 'number') {
    const before = src.substring(0, posOrIndex);
    return before.split('\n').length;
  }
  // fallback: try to compute from match.index
  if (match) {
    const idx = (match as RegExpMatchArray & { index?: number }).index;
    if (typeof idx === 'number') {
      const before = src.substring(0, idx);
      return before.split('\n').length;
    }
  }
  return 1;
}

  /* -------------------------- analistaQuickFixes -------------------------- */

export const analistaQuickFixes: Analista = {
  nome: 'quick-fixes',
  categoria: 'melhorias',
  descricao: 'Detecta problemas comuns e oferece correções automáticas',

  test: (relPath: string): boolean => {
    // Inclui SVGs para permitir quick-fixes seguros (otimização e viewBox)
    return /\.(js|jsx|ts|tsx|mjs|cjs|svg)$/.test(relPath);
  },

  aplicar: (
    src: string,
    relPath: string,
    _ast: NodePath<Node> | null,
  ): Ocorrencia[] => {
    if (!src) return [];

    const ocorrencias: Ocorrencia[] = [];

    // Quick fixes gerais
    const quickFixes = findQuickFixes(src, undefined, undefined, relPath);

    // Quick fixes específicos por tipo de problema detectado
    const problemaTypes = [
      'unhandled-async',
      'console-log',
      'memory-leak',
      'dangerous-html',
      'eval-usage',
      'complex-regex',
    ];

    for (const problemType of problemaTypes) {
      const specificFixes = findQuickFixes(
        src,
        problemType,
        undefined,
        relPath,
      );
      quickFixes.push(...specificFixes);
    }

    // Remover duplicatas por ID
    const uniqueFixes = quickFixes.filter(
      (fix, index, arr) => arr.findIndex((f) => f.id === fix.id) === index,
    );

    for (const fixResult of uniqueFixes) {
      for (const match of fixResult.matches) {
        const linha = calcularLinha(src, match.index, match);

        const previewFix = fixResult.fix(match, src);
        const originalLine = src.split('\n')[linha - 1] || '';
        const fixedLine = previewFix.split('\n')[linha - 1] || '';

        const sugestao = [
          fixResult.description,
          '',
          `🔧 Correção sugerida:`,
          `❌ Antes: ${originalLine.trim()}`,
          `✅ Depois: ${fixedLine.trim()}`,
          '',
          `Confiança: ${fixResult.confidence}%`,
          `Categoria: ${fixResult.category}`,
          `ID do Fix: ${fixResult.id}`,
        ].join('\n');

        const nivel = mapearCategoriaNivel(fixResult.category);

        const ocorrencia = criarOcorrencia({
          tipo: 'auto-fix-disponivel',
          nivel,
          mensagem: `${fixResult.title}`,
          relPath,
          linha,
        });

        const ocorrenciaGenerica = ocorrencia as Ocorrencia & {
          sugestao?: string;
          quickFixId?: string;
          confidence?: number;
          category?: string;
          matchIndex?: number;
          matchLength?: number;
        };
        ocorrenciaGenerica.sugestao = sugestao;
        ocorrenciaGenerica.quickFixId = fixResult.id;
        ocorrenciaGenerica.confidence = fixResult.confidence;
        ocorrenciaGenerica.category = fixResult.category;
        ocorrenciaGenerica.matchIndex = match.index;
        ocorrenciaGenerica.matchLength = match[0].length;

        ocorrencias.push(ocorrencia);
      }
    }

    return ocorrencias;
  },
};

  /* -------------------------- analistaPontuacao -------------------------- */

export const analistaPontuacao: Analista = {
  nome: 'pontuacao-fix',
  categoria: 'formatacao',
  descricao:
    'Detecta problemas de pontuação, caracteres estranhos e formatação de texto',

  test: (relPath: string): boolean => {
    return /\.(ts|js|tsx|jsx|mjs|cjs|md|txt|json)$/.test(relPath);
  },

  aplicar: (src: string, relPath: string): Ocorrencia[] => {
    if (!src) return [];

    const problemas = analisarTexto(src);
    const ocorrencias: Ocorrencia[] = [];

    for (const problema of problemas) {
      const linha = calcularLinha(src, problema.posicao);

      const linhas = src.split('\n');
      const contexto = linhas[linha - 1] || '';

      const ocorrencia = criarOcorrencia({
        tipo: problema.tipo,
        nivel: (problema.confianca ?? 0) > 80 ? 'aviso' : 'info',
        mensagem: problema.descricao,
        relPath,
        linha,
      });

      const ocorrenciaExtendida = ocorrencia as Ocorrencia & {
        sugestao?: string;
        confianca?: number;
        contexto?: string;
      };
      ocorrenciaExtendida.sugestao = problema.sugestao;
      ocorrenciaExtendida.confianca = problema.confianca;
      ocorrenciaExtendida.contexto = contexto;

      ocorrencias.push(ocorrencia);
    }

    return ocorrencias;
  },
};

  /* -------------------------- Exports adicionais -------------------------- */

export const analistas: Analista[] = [analistaQuickFixes, analistaPontuacao];
