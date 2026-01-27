// SPDX-License-Identifier: MIT
import type {
  Analista,
  ConfiguracaoPontuacaoZelador,
  IntlComDisplayNames,
  Ocorrencia,
  ProblemaPontuacao,
} from '@';
import { criarOcorrencia } from '@';

// Constantes de limites e valores de threshold
const ASCII_EXTENDED_MIN = 128;
const LIMITE_CARACTERES_INCOMUNS_PADRAO = 10;
const ESPACAMENTO_CORRECAO_COUNT = 1;
const CONTEXTO_TYPESCRIPT_LOOKBACK = 50;
const CONTEXTO_TYPESCRIPT_LOOKAHEAD = 50;
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
// BRACKETS constants intentionally omitted to avoid unused-variable lint warnings

/**
 * Verifica se a posição está em contexto TypeScript onde ':' é sintaxe válida
 */
function isTypeScriptContext(src: string, index: number): boolean {
  const before = src.substring(
    Math.max(0, index - CONTEXTO_TYPESCRIPT_LOOKBACK),
    index,
  );
  const after = src.substring(
    index,
    Math.min(src.length, index + CONTEXTO_TYPESCRIPT_LOOKAHEAD),
  );

  // Contextos TypeScript válidos para ':' repetido ou próximo
  const tsPatterns = [
    /\?\s*:\s*$/, // Ternário: a ? b :
    /:\s*\?/, // Tipo opcional: prop?: string
    /\(\?\s*:\s*$/, // Non-capturing group: (?:
    /interface\s+\w+\s*{/, // Interface declaration
    /type\s+\w+\s*=/, // Type alias
    /<[^>]*$/, // Generics: Array<Type>
  ];

  // Verificar se está em contexto TypeScript
  return tsPatterns.some(
    (pattern) => pattern.test(before) || pattern.test(after),
  );
}

/**
 * Verifica se a posição está dentro de string ou comentário
 */
function isInStringOrComment(src: string, index: number): boolean {
  const before = src.substring(0, index);

  // Contar aspas para detectar se está em string
  const singleQuotes = (before.match(/'/g) || []).length;
  const doubleQuotes = (before.match(/"/g) || []).length;
  const backticks = (before.match(/`/g) || []).length;

  // Se número ímpar de aspas, está dentro de string
  if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
    return true;
  }

  // Verificar se está em comentário de linha
  const lastLineBreak = before.lastIndexOf('\n');
  const currentLine = before.substring(lastLineBreak + 1);
  if (currentLine.includes('//')) {
    return true;
  }

  // Verificar se está em comentário de bloco
  const lastBlockCommentStart = before.lastIndexOf('/*');
  const lastBlockCommentEnd = before.lastIndexOf('*/');
  if (lastBlockCommentStart > lastBlockCommentEnd) {
    return true;
  }

  return false;
}

const CONFIGURACAO_PADRAO: ConfiguracaoPontuacaoZelador = {
  normalizarUnicode: true,
  colapsarPontuacaoRepetida: true,
  corrigirEspacamento: true,
  balancearParenteses: false, // Heurístico arriscado para código
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
  let lastIndex = 0;
  const parts: string[] = [];

  MULTI_PUNCT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MULTI_PUNCT_RE.exec(s)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];
    const ch = matchStr[0];

    // 🛡️ PROTEÇÃO 1: Não modificar strings ou comentários
    if (isInStringOrComment(s, matchIndex)) {
      parts.push(s.substring(lastIndex, matchIndex + matchStr.length));
      lastIndex = matchIndex + matchStr.length;
      continue;
    }

    // 🛡️ PROTEÇÃO 2: Verificar contexto TypeScript antes de colapsar ':'
    if (ch === ':' && isTypeScriptContext(s, matchIndex)) {
      parts.push(s.substring(lastIndex, matchIndex + matchStr.length));
      lastIndex = matchIndex + matchStr.length;
      continue;
    }

    // Adicionar texto antes do match
    parts.push(s.substring(lastIndex, matchIndex));

    // Colapsar pontuação repetida
    if (REPEATABLE_TO_SINGLE.has(ch)) {
      parts.push(ch);
      count++;
    } else {
      parts.push(matchStr);
    }

    lastIndex = matchIndex + matchStr.length;
  }

  // Adicionar resto do texto
  parts.push(s.substring(lastIndex));

  const text = parts.join('');
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
  const count = changed ? ESPACAMENTO_CORRECAO_COUNT : 0; // Estimativa simples
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
            const intlApi = Intl as IntlComDisplayNames;
            const DisplayNamesCtor = intlApi.DisplayNames;
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

export const analistaPontuacao: Analista = {
  nome: 'pontuacao-fix',
  categoria: 'formatacao',
  descricao:
    'Detecta problemas de pontuação, caracteres estranhos e formatação de texto',

  test: (relPath: string): boolean => {
    // Aplicar a arquivos de texto/código
    return /\.(ts|js|tsx|jsx|mjs|cjs|md|txt|json)$/.test(relPath);
  },

  aplicar: (src: string, relPath: string): Ocorrencia[] => {
    if (!src) return [];

    const problemas = analisarTexto(src);
    const ocorrencias: Ocorrencia[] = [];

    for (const problema of problemas) {
      // Calcular linha aproximada
      const beforePos = src.substring(0, problema.posicao);
      const linha = beforePos.split('\n').length;

      // Criar contexto da linha
      const linhas = src.split('\n');
      const contexto = linhas[linha - 1] || '';

      const ocorrencia = criarOcorrencia({
        tipo: problema.tipo,
        nivel: (problema.confianca ?? 0) > 80 ? 'aviso' : 'info',
        mensagem: problema.descricao,
        relPath,
        linha,
      });

      // Adicionar campos extras
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
