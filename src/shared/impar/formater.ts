// SPDX-License-Identifier: MIT

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { XMLValidator } from 'fast-xml-parser';

import type { FormatadorMinimoParser, FormatadorMinimoResult } from '@';

import type { FormatterFn } from './formatter-registry.js';
import {
  getFormatterForPath,
  registerFormatter,
} from './formatter-registry.js';
import { getSyntaxInfoForPath } from './syntax-map.js';

// Re-exportar para compatibilidade com código existente
export type { FormatadorMinimoParser, FormatadorMinimoResult } from '@';

function normalizarFimDeLinha(code: string): string {
  return code.replace(/\r\n?/g, '\n');
}

function removerBom(code: string): string {
  return code.length > 0 && code.charCodeAt(0) === 0xfeff
    ? code.slice(1)
    : code;
}

function normalizarNewlinesFinais(code: string): string {
  // Mantém exatamente uma quebra de linha no final.
  const normalized = normalizarFimDeLinha(code);
  return `${normalized.replace(/\n+$/g, '')}\n`;
}

function removerEspacosFinaisPorLinha(code: string): string {
  return removerEspacosFinaisPorLinhaComProtecao(code);
}

function removerEspacosFinaisPorLinhaComProtecao(
  code: string,
  protectedLines?: ReadonlySet<number> | null,
): string {
  return code
    .split('\n')
    .map((l, idx) => {
      const lineNo = idx + 1;
      if (protectedLines && protectedLines.has(lineNo)) return l;
      return l.replace(/[ \t]+$/g, '');
    })
    .join('\n');
}

function matchMarkdownFence(
  line: string,
): { ch: '`' | '~'; len: number; rest: string } | null {
  // CommonMark: fence pode ter info string na abertura, mas o fechamento não
  // pode ter nada além de whitespace após os ticks/tiles.
  const trimmedLeft = line.replace(/^\s+/, '');
  const m = trimmedLeft.match(/^([`~])\1{2,}/);
  if (!m) return null;
  const ch = (m[1] ?? '`') as '`' | '~';
  const len = (m[0] ?? '').length;
  const rest = trimmedLeft.slice(len);
  return { ch, len, rest };
}

function isMarkdownFenceCloser(
  match: { ch: '`' | '~'; len: number; rest: string },
  fenceChar: '`' | '~' | null,
  fenceLen: number,
): boolean {
  return (
    fenceChar !== null &&
    match.ch === fenceChar &&
    match.len >= fenceLen &&
    match.rest.trim() === ''
  );
}

function isJsTsFile(relPath?: string): boolean {
  const rp = (relPath ?? '').toLowerCase();
  return (
    rp.endsWith('.ts') ||
    rp.endsWith('.tsx') ||
    rp.endsWith('.cts') ||
    rp.endsWith('.mts') ||
    rp.endsWith('.js') ||
    rp.endsWith('.jsx') ||
    rp.endsWith('.mjs') ||
    rp.endsWith('.cjs')
  );
}

function getProtectedLinesFromTemplateLiterals(
  code: string,
  relPath: string,
): Set<number> | null {
  // Protege conteúdo de template literals (backticks) contra transforms line-based.
  // Isso evita quebrar strings multilinha que pareçam comentários/divisores.
  try {
    const req = createRequire(import.meta.url);
    const parser = req('@babel/parser') as {
      parse: (src: string, opts: Record<string, unknown>) => unknown;
    };

    const rp = (relPath ?? '').toLowerCase();
    const plugins: string[] = [
      'importMeta',
      'dynamicImport',
      'topLevelAwait',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'classStaticBlock',
      'optionalChaining',
      'nullishCoalescingOperator',
      'numericSeparator',
      'logicalAssignment',
      'privateIn',
      'objectRestSpread',
      'decorators-legacy',
    ];

    const isTs =
      rp.endsWith('.ts') ||
      rp.endsWith('.tsx') ||
      rp.endsWith('.cts') ||
      rp.endsWith('.mts');
    const isJsx = rp.endsWith('.jsx') || rp.endsWith('.tsx');
    if (isTs) plugins.push('typescript');
    if (isJsx) plugins.push('jsx');

    const ast = parser.parse(code, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins,
    });

    const protectedLines = new Set<number>();
    const seen = new Set<object>();

    const isObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null;

    const walk = (node: unknown) => {
      if (!isObject(node)) return;
      if (seen.has(node as object)) return;
      seen.add(node as object);

      const anyNode = node as Record<string, unknown>;
      if (anyNode.type === 'TemplateLiteral') {
        const loc = anyNode.loc as
          | { start: { line: number }; end: { line: number } }
          | undefined;
        if (loc?.start?.line && loc?.end?.line) {
          for (let ln = loc.start.line; ln <= loc.end.line; ln++) {
            protectedLines.add(ln);
          }
        }
      }

      for (const k of Object.keys(anyNode)) {
        if (k === 'loc' || k === 'start' || k === 'end') continue;
        const v = anyNode[k];
        if (Array.isArray(v)) {
          for (const item of v) walk(item);
          continue;
        }
        if (isObject(v)) {
          const child = v as Record<string, unknown>;
          if (typeof child.type === 'string') walk(child);
        }
      }
    };

    walk(ast);
    return protectedLines.size > 0 ? protectedLines : null;
  } catch {
    return null;
  }
}

function limitarLinhasEmBranco(
  code: string,
  maxConsecutivas = 2,
  protectedLines?: ReadonlySet<number> | null,
): { code: string; changed: boolean } {
  const lines = normalizarFimDeLinha(code).split('\n');
  const out: string[] = [];
  let consecutivas = 0;
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const lineNo = i + 1;
    if (protectedLines && protectedLines.has(lineNo)) {
      out.push(line);
      consecutivas = 0;
      continue;
    }
    const isBlank = line.trim() === '';
    if (isBlank) {
      consecutivas += 1;
      if (consecutivas > maxConsecutivas) {
        changed = true;
        continue;
      }
    } else {
      consecutivas = 0;
    }
    out.push(line);
  }

  return { code: out.join('\n'), changed };
}

function assegurarLinhaVaziaAposTitulosMarkdown(code: string): {
  code: string;
  changed: boolean;
} {
  const lines = normalizarFimDeLinha(code).split('\n');
  const out: string[] = [];
  let changed = false;

  let inFence = false;
  let fenceChar: '`' | '~' | null = null;
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    const fence = matchMarkdownFence(line);
    if (!inFence && fence) {
      inFence = true;
      fenceChar = fence.ch;
      fenceLen = fence.len;
      out.push(line);
      continue;
    }

    if (inFence && fence && isMarkdownFenceCloser(fence, fenceChar, fenceLen)) {
      inFence = false;
      fenceChar = null;
      fenceLen = 0;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    out.push(line);

    const ehHeading = /^#{1,6}\s+\S/.test(line.trim());
    const proxima = lines[i + 1];
    const precisaEspaco =
      ehHeading && proxima !== undefined && proxima.trim() !== '';
    if (precisaEspaco) {
      out.push('');
      changed = true;
    }
  }

  return { code: out.join('\n'), changed };
}

function stripDiacritics(input: string): string {
  // Remove acentos sem alterar espaçamento; útil para info string de cercas (```èxemplo -> ```exemplo)
  return input
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .normalize('NFC');
}

function normalizarCercasMarkdown(code: string): {
  code: string;
  changed: boolean;
} {
  const lines = normalizarFimDeLinha(code).split('\n');
  let changed = false;
  const out = lines.map((line) => {
    // Corrige erro comum de teclado: "``è" como se fosse "```".
    const typo = line.match(/^(\s*)``è(.*)$/);
    if (typo) {
      const prefix = typo[1] ?? '';
      const after = typo[2] ?? '';
      const normalized = `${prefix}\`\`\`${after}`;
      if (normalized !== line) changed = true;
      return normalized;
    }

    const m = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (!m) return line;
    const prefix = m[1] ?? '';
    const fence = m[2] ?? '';
    const afterFence = m[3] ?? '';

    // Não adiciona/remover espaços após a cerca; só normaliza o primeiro token da info string.
    const info = afterFence.match(/^(\s*)(\S+)(.*)$/);
    if (!info) return line;
    const lead = info[1] ?? '';
    const token = info[2] ?? '';
    const tail = info[3] ?? '';

    // Só mexe no token se houver diacríticos (ou não-ASCII). Mantém resto intacto.
    const shouldNormalizeToken = /[^\x00-\x7F]/.test(token);
    if (!shouldNormalizeToken) return line;

    const normalizedToken = stripDiacritics(token);
    const normalized = `${prefix}${fence}${lead}${normalizedToken}${tail}`;
    if (normalized !== line) changed = true;
    return normalized;
  });
  return { code: out.join('\n'), changed };
}

function corrigirHtmlInlineEmMarkdown(text: string): {
  text: string;
  changed: boolean;
} {
  let changed = false;

  const fixed = text.replace(/<[^>\n]+>/g, (tag) => {
    if (tag.startsWith('<!--') || tag.startsWith('<!')) return tag;
    let t = tag;
    t = t.replace(/^<\s+/, '<').replace(/^<\/\s+/, '</');
    t = t.replace(/\s+\/>$/, '/>').replace(/\s+>$/, '>');
    // Normaliza fechamento com espaço: </ div> -> </div>
    t = t.replace(/^<\/\s+/, '</');
    if (t !== tag) changed = true;
    return t;
  });

  return { text: fixed, changed };
}

function corrigirEnfaseMarkdown(text: string): {
  text: string;
  changed: boolean;
} {
  let changed = false;
  let out = text;

  const apply = (re: RegExp, replacer: string) => {
    const next = out.replace(re, replacer);
    if (next !== out) changed = true;
    out = next;
  };

  // Casos explícitos do pedido:
  // - **exemplo*** -> **exemplo**
  // - *exemplo**  -> *exemplo*
  // Sem inserir espaços e sem atravessar quebras de linha.
  apply(/\*\*([^\s*][^*\n]*?)\*\*\*(?!\*)/g, '**$1**');
  apply(/(^|[^*])\*([^\s*][^*\n]*?)\*\*(?!\*)/g, '$1*$2*');
  apply(/(^|[^*])\*([^\s*][^*\n]*?)\*\*\*(?!\*)/g, '$1*$2*');

  return { text: out, changed };
}

function corrigirMarkdownInlineForaDeCodigo(code: string): {
  code: string;
  changed: boolean;
} {
  const lines = normalizarFimDeLinha(code).split('\n');
  const out: string[] = [];
  let changed = false;

  let inFence = false;
  let fenceChar: '`' | '~' | null = null;
  let fenceLen = 0;

  const processOutsideCodeSpans = (text: string): string => {
    // Tokeniza code spans por runs de backticks e não altera dentro deles.
    let i = 0;
    let acc = '';
    while (i < text.length) {
      const tickStart = text.indexOf('`', i);
      if (tickStart === -1) {
        const chunk = text.slice(i);
        let next = chunk;
        const e = corrigirEnfaseMarkdown(next);
        next = e.text;
        const h = corrigirHtmlInlineEmMarkdown(next);
        next = h.text;
        if (next !== chunk) changed = true;
        acc += next;
        break;
      }

      const chunk = text.slice(i, tickStart);
      let next = chunk;
      const e = corrigirEnfaseMarkdown(next);
      next = e.text;
      const h = corrigirHtmlInlineEmMarkdown(next);
      next = h.text;
      if (next !== chunk) changed = true;
      acc += next;

      let runEnd = tickStart;
      while (runEnd < text.length && text[runEnd] === '`') runEnd++;
      const run = text.slice(tickStart, runEnd);

      const closeIndex = text.indexOf(run, runEnd);
      if (closeIndex === -1) {
        // Sem fechamento; preserva o resto como está.
        acc += text.slice(tickStart);
        break;
      }

      acc += text.slice(tickStart, closeIndex + run.length);
      i = closeIndex + run.length;
    }
    return acc;
  };

  for (const line of lines) {
    const fence = matchMarkdownFence(line);
    if (!inFence && fence) {
      inFence = true;
      fenceChar = fence.ch;
      fenceLen = fence.len;
      out.push(line);
      continue;
    }

    if (inFence && fence && isMarkdownFenceCloser(fence, fenceChar, fenceLen)) {
      inFence = false;
      fenceChar = null;
      fenceLen = 0;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    out.push(processOutsideCodeSpans(line));
  }

  return { code: out.join('\n'), changed };
}

function limitarLinhasEmBrancoMarkdown(
  code: string,
  maxConsecutivas = 2,
): { code: string; changed: boolean } {
  const lines = normalizarFimDeLinha(code).split('\n');
  const out: string[] = [];
  let consecutivas = 0;
  let changed = false;

  let inFence = false;
  let fenceChar: '`' | '~' | null = null;
  let fenceLen = 0;

  for (const line of lines) {
    const fence = matchMarkdownFence(line);
    if (!inFence && fence) {
      inFence = true;
      fenceChar = fence.ch;
      fenceLen = fence.len;
      consecutivas = 0;
      out.push(line);
      continue;
    }

    if (inFence && fence && isMarkdownFenceCloser(fence, fenceChar, fenceLen)) {
      inFence = false;
      fenceChar = null;
      fenceLen = 0;
      consecutivas = 0;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    const isBlank = line.trim() === '';
    if (isBlank) {
      consecutivas += 1;
      if (consecutivas > maxConsecutivas) {
        changed = true;
        continue;
      }
    } else {
      consecutivas = 0;
    }
    out.push(line);
  }

  return { code: out.join('\n'), changed };
}

function normalizarSeparadoresDeSecao(
  code: string,
  opts: { relPath?: string; protectedLines?: ReadonlySet<number> | null } = {},
): { code: string; changed: boolean } {
  const lines = normalizarFimDeLinha(code).split('\n');
  const out: string[] = [];
  let changed = false;

  const specialTitlesBySymbol: Record<string, string> = {
    FormatadorMessages: 'MENSAGENS FORMATADOR (MIN)',
    SvgMessages: 'MENSAGENS SVG (OTIMIZAÇÃO)',
  };

  const toUpperTitle = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;

    const withSpaces = trimmed
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const upper = withSpaces.toUpperCase();

    return upper
      .replace(/\bHTML\b/g, 'HTML')
      .replace(/\bCSS\b/g, 'CSS')
      .replace(/\bXML\b/g, 'XML')
      .replace(/\bSVG\b/g, 'SVG');
  };

  const inferTitleFromNextSymbol = (fromIndex: number): string | null => {
    for (
      let j = fromIndex + 1;
      j < Math.min(lines.length, fromIndex + 35);
      j++
    ) {
      const l = (lines[j] ?? '').trim();
      if (!l) continue;
      if (l.startsWith('//')) continue;
      if (l.startsWith('/*')) continue;

      const m = l.match(
        /^(?:export\s+)?(?:const|function|class|interface|type)\s+([A-Za-z_$][\w$]*)\b/,
      );
      if (!m) continue;

      const symbol = m[1] ?? '';
      if (!symbol) continue;

      const special = specialTitlesBySymbol[symbol];
      if (special) return special;

      if (symbol.endsWith('Messages')) {
        const base = symbol.slice(0, -'Messages'.length);
        const baseTitle = toUpperTitle(base);
        return baseTitle ? `MENSAGENS ${baseTitle}` : 'MENSAGENS';
      }

      return toUpperTitle(symbol);
    }

    const relPath = (opts.relPath ?? '').toLowerCase();
    if (relPath.includes('/messages/') || relPath.includes('messages'))
      return 'MENSAGENS';
    return null;
  };

  const parseNovoSeparadorComMarcacao = (
    line: string,
  ): { titulo: string | null } | null => {
    // Formato legado aceito (compat): /* -------------------------- substituir por titulo (opcionalmente com um título embutido) -------------------------- */
    const m = line.match(
      /^\s*\/\*\s*-{10,}\s*substituir\s+por\s+titulo\s+@oraculo-secao(?:\((.+?)\))?\s*-{10,}\s*\*\/\s*$/i,
    );
    if (!m) return null;
    const raw = (m[1] ?? '').trim();
    return { titulo: raw ? raw : null };
  };

  const isSeparadorSemTitulo = (line: string): boolean => {
    // Ex.: /* -------------------------- substituir por titulo -------------------------- */
    // Ex.: /* -------------------------- - -------------------------- */
    return (
      /^\s*\/\*\s*-{10,}\s*substituir\s+por\s+titulo\s*-{10,}\s*\*\/\s*$/i.test(
        line,
      ) ||
      /^\s*\/\*\s*-{10,}\s*-\s*-{10,}\s*\*\/\s*$/.test(line) ||
      /^\s*\/\*\s*-{10,}\s*@oraculo-secao\s*-{10,}\s*\*\/\s*$/i.test(line)
    );
  };

  const buildSeparatorWithTitle = (title: string): string => {
    return `  /* -------------------------- ${title} -------------------------- */`;
  };

  const isDivider = (line: string): boolean =>
    /^\s*\/\/\s*(?:[=\-_*]){8,}\s*$/.test(line) ||
    /^\s*\/\*\s*(?:[=\-_*]){8,}\s*\*\/\s*$/.test(line);

  const extractTitleFromLineComment = (line: string): string | null => {
    const m = line.match(/^\s*\/\/\s*(.+?)\s*$/);
    if (!m) return null;
    const t = m[1].trim();
    if (!t) return null;
    // ignora divisores e comentários "vazios"
    if (/^(?:[=\-_*]){5,}$/.test(t)) return null;
    return t;
  };

  const extractTitleFromBlockComment = (line: string): string | null => {
    const m = line.match(/^\s*\/\*\s*(.+?)\s*\*\/\s*$/);
    if (!m) return null;
    const t = m[1].trim();
    if (!t) return null;
    if (/^(?:[=\-_*]){5,}$/.test(t)) return null;
    return t;
  };

  const extractTitleFromSingleLine = (line: string): string | null => {
    // Ex.: // ======= TITULO =======
    const m = line.match(
      /^\s*\/\/\s*(?:[=\-_*]){5,}\s*(.+?)\s*(?:[=\-_*]){5,}\s*$/,
    );
    if (!m) return null;
    const t = m[1].trim();
    return t ? t : null;
  };

  const extractTitleFromSingleBlockLine = (line: string): string | null => {
    // Ex.: /* ======= TITULO ======= */
    const m = line.match(
      /^\s*\/\*\s*(?:[=\-_*]){5,}\s*(.+?)\s*(?:[=\-_*]){5,}\s*\*\/\s*$/,
    );
    if (!m) return null;
    const t = m[1].trim();
    return t ? t : null;
  };

  const buildSeparator = (originalTitle: string): string =>
    buildSeparatorWithTitle(originalTitle);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const lineNo = i + 1;
    if (opts.protectedLines && opts.protectedLines.has(lineNo)) {
      out.push(line);
      continue;
    }

    // Caso -1: separador placeholder (sem título) -> tenta inferir pelo contexto.
    if (isSeparadorSemTitulo(line)) {
      const inferred = inferTitleFromNextSymbol(i);
      if (inferred) {
        out.push(buildSeparatorWithTitle(inferred));
        changed = true;
      } else {
        out.push(line);
      }
      continue;
    }

    // Caso 0: separador já no formato novo com marcação; promover para título correto.
    const novo = parseNovoSeparadorComMarcacao(line);
    if (novo) {
      if (novo.titulo) {
        out.push(buildSeparatorWithTitle(novo.titulo));
        changed = true;
      } else {
        const inferred = inferTitleFromNextSymbol(i);
        if (inferred) {
          out.push(buildSeparatorWithTitle(inferred));
          changed = true;
        } else {
          out.push(line);
        }
      }
      continue;
    }

    // Caso 1: bloco de 3 linhas
    // // ======
    // // TITULO
    // // ======
    if (
      isDivider(line) &&
      i + 2 < lines.length &&
      isDivider(lines[i + 2] ?? '')
    ) {
      if (
        opts.protectedLines &&
        (opts.protectedLines.has(i + 1) ||
          opts.protectedLines.has(i + 2) ||
          opts.protectedLines.has(i + 3))
      ) {
        out.push(line);
        continue;
      }
      const middle = lines[i + 1] ?? '';
      const title =
        extractTitleFromLineComment(middle) ??
        extractTitleFromBlockComment(middle);
      if (title) {
        out.push(buildSeparator(title));
        i += 2;
        changed = true;
        continue;
      }
    }

    // Caso 2: linha única com título centralizado
    const singleLine = extractTitleFromSingleLine(line);
    const singleBlock = extractTitleFromSingleBlockLine(line);
    const single = singleLine ?? singleBlock;
    if (single) {
      out.push(buildSeparator(single));
      changed = true;
      continue;
    }

    out.push(line);
  }

  return { code: out.join('\n'), changed };
}

function formatarCodeMinimo(
  code: string,
  opts: {
    normalizarSeparadoresDeSecao?: boolean;
    relPath?: string;
    parser?: FormatadorMinimoParser;
  } = {},
): FormatadorMinimoResult {
  const normalized = normalizarFimDeLinha(removerBom(code));
  const protectedLines =
    opts.relPath && isJsTsFile(opts.relPath)
      ? getProtectedLinesFromTemplateLiterals(normalized, opts.relPath)
      : null;

  const semEspacosFinais = removerEspacosFinaisPorLinhaComProtecao(
    normalized,
    protectedLines,
  );
  const shouldNormalizeSeparators = opts.normalizarSeparadoresDeSecao ?? true;
  const { code: maybeSeparadores, changed: changedSeparators } =
    shouldNormalizeSeparators
      ? normalizarSeparadoresDeSecao(semEspacosFinais, {
          relPath: opts.relPath,
          protectedLines,
        })
      : { code: semEspacosFinais, changed: false };
  const { code: semBlanks, changed: changedBlanks } = limitarLinhasEmBranco(
    maybeSeparadores,
    2,
    protectedLines,
  );
  const formatted = normalizarNewlinesFinais(semBlanks);

  const baseline = normalizarNewlinesFinais(normalized);
  const changed = formatted !== baseline;
  return {
    ok: true,
    parser: opts.parser ?? 'code',
    formatted,
    changed,
    reason: changedSeparators
      ? 'normalizacao-separadores'
      : changedBlanks
        ? 'limpeza-linhas-em-branco'
        : 'normalizacao-basica',
  };
}

function formatarJsonMinimo(code: string): FormatadorMinimoResult {
  try {
    // Normalizar entrada: remover BOM, normalizar line endings
    const normalizedInput = normalizarFimDeLinha(removerBom(code));

    // Parsear JSON
    const parsed = JSON.parse(normalizedInput) as unknown;

    // Formatar com 2 espaços de indentação + newline final
    const formatted = normalizarNewlinesFinais(JSON.stringify(parsed, null, 2));

    // Comparar contra entrada normalizada (com newline final consistente)
    // Isso evita falsos positivos por diferença de line endings ou BOM
    const normalizedForComparison = normalizarNewlinesFinais(normalizedInput);
    const changed = formatted !== normalizedForComparison;

    return { ok: true, parser: 'json', formatted, changed };
  } catch (err) {
    return {
      ok: false,
      parser: 'json',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function formatarMarkdownMinimo(code: string): FormatadorMinimoResult {
  const normalized = normalizarFimDeLinha(code);
  const trimmed = removerEspacosFinaisPorLinha(normalized);
  const { code: cercasNormalizadas, changed: changedFences } =
    normalizarCercasMarkdown(trimmed);
  const { code: markdownCorrigido, changed: changedInline } =
    corrigirMarkdownInlineForaDeCodigo(cercasNormalizadas);
  const { code: comEspacoTitulos, changed: changedHeadings } =
    assegurarLinhaVaziaAposTitulosMarkdown(markdownCorrigido);
  const { code: semBlanks, changed: changedBlanks } =
    limitarLinhasEmBrancoMarkdown(comEspacoTitulos, 2);
  const formatted = normalizarNewlinesFinais(semBlanks);
  return {
    ok: true,
    parser: 'markdown',
    formatted,
    changed: formatted !== normalizarNewlinesFinais(normalized),
    reason:
      changedFences || changedInline || changedHeadings || changedBlanks
        ? 'estilo-oraculo-markdown'
        : 'normalizacao-basica',
  };
}

function formatarYamlMinimo(code: string): FormatadorMinimoResult {
  const normalized = normalizarFimDeLinha(code);
  const trimmed = removerEspacosFinaisPorLinha(normalized);
  const { code: semBlanks, changed: changedBlanks } = limitarLinhasEmBranco(
    trimmed,
    2,
  );
  const formatted = normalizarNewlinesFinais(semBlanks);
  return {
    ok: true,
    parser: 'yaml',
    formatted,
    changed: formatted !== normalizarNewlinesFinais(normalized),
    reason: changedBlanks ? 'estilo-oraculo-yaml' : 'normalizacao-basica',
  };
}

function tokenizeXml(
  src: string,
): Array<{ kind: 'tag' | 'text'; value: string }> {
  // Mantém comentários/CDATA/PI/DOCTYPE como "tag" para não serem alterados.
  const re =
    /(<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\/?[^>\n]+?>)/gi;

  const out: Array<{ kind: 'tag' | 'text'; value: string }> = [];
  let last = 0;
  for (const m of src.matchAll(re)) {
    const start = m.index ?? -1;
    if (start < 0) continue;
    if (start > last) out.push({ kind: 'text', value: src.slice(last, start) });
    out.push({ kind: 'tag', value: m[0] ?? '' });
    last = start + (m[0]?.length ?? 0);
  }
  if (last < src.length) out.push({ kind: 'text', value: src.slice(last) });
  return out;
}

function normalizeXmlTagToken(tag: string): { tag: string; changed: boolean } {
  // Não mexe em comentários, CDATA, DOCTYPE/declarações e PI.
  if (tag.startsWith('<!--') || tag.startsWith('<![CDATA['))
    return { tag, changed: false };
  if (tag.startsWith('<?')) return { tag, changed: false };
  if (tag.startsWith('<!')) return { tag, changed: false };

  let out = tag;
  const original = tag;

  // Normaliza espaços imediatamente após "<" e "</".
  out = out.replace(/^<\s+/, '<');
  out = out.replace(/^<\/\s+/, '</');

  // Remove espaços antes de ">" e de "/>".
  out = out.replace(/\s+\/>$/, '/>');
  out = out.replace(/\s+>$/, '>');

  // Colapsa múltiplos espaços fora de aspas dentro da tag.
  let buf = '';
  let inQuote: '"' | "'" | null = null;
  let prevWasSpace = false;

  for (let i = 0; i < out.length; i++) {
    const ch = out[i] ?? '';
    if (inQuote) {
      buf += ch;
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch as '"' | "'";
      buf += ch;
      prevWasSpace = false;
      continue;
    }
    if (/\s/.test(ch)) {
      if (!prevWasSpace) {
        buf += ' ';
        prevWasSpace = true;
      }
      continue;
    }
    prevWasSpace = false;
    buf += ch;
  }

  out = buf;

  // Garante que não exista espaço após "<" ou "</" novamente (pós-colapso).
  out = out.replace(/^<\s+/, '<');
  out = out.replace(/^<\/\s+/, '</');

  // Remove espaço antes do fechamento após colapso.
  out = out.replace(/\s+\/>$/, '/>');
  out = out.replace(/\s+>$/, '>');

  return { tag: out, changed: out !== original };
}

function hasXmlMixedContent(
  tokens: Array<{ kind: 'tag' | 'text'; value: string }>,
): boolean {
  for (const t of tokens) {
    if (t.kind !== 'text') continue;
    // Se existe texto não-whitespace entre tags, indentação pode alterar semântica.
    if (/[\S]/.test(t.value)) return true;
  }
  return false;
}

function prettyPrintXmlIfSafe(xml: string): { xml: string; changed: boolean } {
  const tokens = tokenizeXml(xml);
  if (hasXmlMixedContent(tokens)) return { xml, changed: false };

  let changed = false;
  let indent = 0;
  const indentStr = (n: number) => '  '.repeat(Math.max(0, n));

  const outLines: string[] = [];

  const pushLine = (line: string) => {
    if (!line) return;
    outLines.push(line);
  };

  for (const tok of tokens) {
    if (tok.kind === 'text') {
      // texto é só whitespace aqui; ignoramos e reconstruímos.
      continue;
    }

    const raw = tok.value.trim();
    if (!raw) continue;

    const isClosing = /^<\//.test(raw);
    const isSelfClosing = /\/>$/.test(raw);
    const isDecl = /^<\?xml\b/i.test(raw) || /^<\?/.test(raw);
    const isDoctype = /^<!DOCTYPE\b/i.test(raw);
    const isComment = /^<!--/.test(raw);
    const isCdata = /^<!\[CDATA\[/.test(raw);

    if (isClosing) indent = Math.max(0, indent - 1);

    const line = `${indentStr(indent)}${raw}`;
    pushLine(line);

    if (
      !isClosing &&
      !isSelfClosing &&
      !isDecl &&
      !isDoctype &&
      !isComment &&
      !isCdata
    ) {
      indent += 1;
    }
  }

  const out = `${outLines.join('\n').trimEnd()}\n`;
  if (out !== xml) changed = true;
  return { xml: out, changed };
}

function formatarXmlMinimo(code: string): FormatadorMinimoResult {
  const normalized = normalizarFimDeLinha(removerBom(code));
  const semEspacosFinais = removerEspacosFinaisPorLinha(normalized);

  // 1) Correções seguras de tags (sem tocar em CDATA/comentários)
  const tokens = tokenizeXml(semEspacosFinais);
  let changedTokens = false;
  const rebuilt = tokens
    .map((t) => {
      if (t.kind === 'text') return t.value;
      const r = normalizeXmlTagToken(t.value);
      if (r.changed) changedTokens = true;
      return r.tag;
    })
    .join('');

  // 2) Se ficar válido e sem mixed content, aplica pretty-print.
  let pretty = rebuilt;
  let changedPretty = false;
  const valid = XMLValidator.validate(pretty);
  if (valid === true) {
    const pp = prettyPrintXmlIfSafe(pretty);
    pretty = pp.xml;
    changedPretty = pp.changed;
  } else {
    // Mesmo inválido, ao menos normaliza newline final.
    pretty = `${pretty.trimEnd()}\n`;
  }

  const formatted = normalizarNewlinesFinais(pretty);
  const baseline = normalizarNewlinesFinais(normalized);
  return {
    ok: true,
    parser: 'xml',
    formatted,
    changed: formatted !== baseline,
    reason: changedPretty
      ? 'xml-pretty'
      : changedTokens
        ? 'xml-normalizacao-tags'
        : 'normalizacao-basica',
  };
}

export function formatarPrettierMinimo(params: {
  code: string;
  relPath?: string;
}): FormatadorMinimoResult {
  const relPath = (params.relPath ?? '').toLowerCase();
  const code = params.code;

  const temComentariosJsonc = (src: string): boolean => {
    const normalized = normalizarFimDeLinha(src);
    return /(^|\n)\s*\/\//.test(normalized) || /(^|\n)\s*\/\*/.test(normalized);
  };

  if (relPath.endsWith('.json')) {
    // Alguns arquivos .json do ecossistema TS usam comentários (JSONC), ex.: tsconfig*.json.
    // Nesses casos, não tentamos parsear como JSON; apenas normalizamos whitespace.
    if (temComentariosJsonc(code)) {
      return formatarCodeMinimo(code, {
        normalizarSeparadoresDeSecao: false,
        relPath,
      });
    }
    return formatarJsonMinimo(code);
  }
  if (relPath.endsWith('.md') || relPath.endsWith('.markdown')) {
    return formatarMarkdownMinimo(code);
  }
  if (relPath.endsWith('.yml') || relPath.endsWith('.yaml')) {
    return formatarYamlMinimo(code);
  }

  if (
    relPath.endsWith('.ts') ||
    relPath.endsWith('.tsx') ||
    relPath.endsWith('.cts') ||
    relPath.endsWith('.mts') ||
    relPath.endsWith('.js') ||
    relPath.endsWith('.jsx') ||
    relPath.endsWith('.mjs') ||
    relPath.endsWith('.cjs')
  ) {
    // Para JS/TS, normalizamos separadores de seção (inclui formatos legados).
    return formatarCodeMinimo(code, {
      normalizarSeparadoresDeSecao: true,
      relPath,
    });
  }

  if (relPath.endsWith('.html') || relPath.endsWith('.htm')) {
    return formatarCodeMinimo(code, {
      normalizarSeparadoresDeSecao: false,
      parser: 'html',
    });
  }

  if (relPath.endsWith('.xml')) {
    return formatarXmlMinimo(code);
  }

  if (relPath.endsWith('.css')) {
    return formatarCodeMinimo(code, {
      normalizarSeparadoresDeSecao: true,
      parser: 'css',
    });
  }

  if (relPath.endsWith('.py')) {
    return formatarCodeMinimo(code, {
      normalizarSeparadoresDeSecao: false,
      parser: 'python',
    });
  }

  if (relPath.endsWith('.php')) {
    return formatarCodeMinimo(code, {
      normalizarSeparadoresDeSecao: false,
      parser: 'php',
    });
  }

  return {
    ok: true,
    parser: 'unknown',
    formatted: code,
    changed: false,
  };
}

type PrettierApi = {
  format: (
    code: string,
    options: Record<string, unknown>,
  ) => string | Promise<string>;
  resolveConfig: (
    filePath: string,
    options?: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
};

const prettierCache = new Map<string, Promise<PrettierApi | null>>();

async function carregarPrettierDoProjeto(
  baseDir: string,
): Promise<PrettierApi | null> {
  const base = baseDir || process.cwd();
  const cached = prettierCache.get(base);
  if (cached) return cached;

  const loader = (async (): Promise<PrettierApi | null> => {
    const tryImportPrettier = async (
      resolved: string,
    ): Promise<PrettierApi | null> => {
      try {
        const mod = (await import(resolved)) as unknown as {
          default?: unknown;
        };
        const api = (
          mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod
        ) as PrettierApi | undefined;
        if (
          !api ||
          typeof api.format !== 'function' ||
          typeof api.resolveConfig !== 'function'
        ) {
          return null;
        }
        return api;
      } catch {
        return null;
      }
    };

    const tryResolveFrom = async (
      req: NodeRequire,
    ): Promise<PrettierApi | null> => {
      try {
        const resolved = req.resolve('prettier');
        return await tryImportPrettier(resolved);
      } catch {
        return null;
      }
    };

    // 1) Resolve a partir do projeto-alvo (comportamento atual).
    try {
      const projectPkg = path.join(base, 'package.json');
      if (fs.existsSync(projectPkg)) {
        const api = await tryResolveFrom(createRequire(projectPkg));
        if (api) return api;
      }
    } catch {
      // ignora
    }

    // 2) Fallback: tenta resolver do contexto do Oráculo (útil em dev, monorepos, etc.).
    {
      const api = await tryResolveFrom(createRequire(import.meta.url));
      if (api) return api;
    }

    // 3) Fallback: bundle local em feedback/prettier (quando existe no workspace).
    // Mantém isso “best effort” para não mudar comportamento em instalações normais.
    const feedbackDir =
      process.env.ORACULO_PRETTIER_FEEDBACK_DIR ||
      path.join(base, 'feedback', 'prettier');
    const feedbackPkg = path.join(feedbackDir, 'package.json');
    if (fs.existsSync(feedbackPkg)) {
      const candidates = [
        path.join(feedbackDir, 'index.mjs'),
        path.join(feedbackDir, 'index.cjs'),
      ];
      for (const p of candidates) {
        if (!fs.existsSync(p)) continue;
        const api = await tryImportPrettier(p);
        if (api) return api;
      }
    }

    return null;
  })();

  prettierCache.set(base, loader);
  return loader;
}

function inferPrettierParser(relPath?: string, code?: string): string | null {
  const info = getSyntaxInfoForPath(relPath ?? '');
  if (!info) return null;
  if (!info.formatavel) return null;

  const rp = (relPath ?? '').toLowerCase();
  if (rp.endsWith('.json')) {
    const src = code ?? '';
    const normalized = normalizarFimDeLinha(src);
    const temComentarios =
      /(^|\n)\s*\/\//.test(normalized) || /(^|\n)\s*\/\*/.test(normalized);
    return temComentarios ? 'jsonc' : 'json';
  }

  return info.parser ?? null;
}

export async function formatarComPrettierProjeto(params: {
  code: string;
  relPath: string;
  baseDir?: string;
}): Promise<FormatadorMinimoResult> {
  const baseDir = params.baseDir || process.cwd();
  const relPath = params.relPath;
  const absPath = path.resolve(baseDir, relPath);

  const prettier = await carregarPrettierDoProjeto(baseDir);
  if (!prettier) {
    return {
      ok: true,
      parser: 'unknown',
      formatted: params.code,
      changed: false,
      reason: 'prettier-nao-disponivel',
    };
  }

  const parser = inferPrettierParser(relPath, params.code);
  if (!parser) {
    return {
      ok: true,
      parser: 'unknown',
      formatted: params.code,
      changed: false,
      reason: 'prettier-parser-desconhecido',
    };
  }

  try {
    const resolvedConfig = await prettier.resolveConfig(absPath, {
      editorconfig: true,
    });

    // Heurística: quando o projeto NÃO define `singleQuote`, inferimos a preferência
    // a partir do conteúdo do arquivo para evitar que o formatador troque o estilo
    // de aspas inesperadamente (ex.: converta ' para " ou vice-versa).
    const inferSingleQuoteFromCode = (src: string): boolean => {
      try {
        // Conta ocorrências de aspas simples e duplas fora de comentários/string parsing
        // Heurística simples: conta totais brutos (suficiente para maioria dos casos).
        const singles = (src.match(/'/g) || []).length;
        const doubles = (src.match(/"/g) || []).length;
        return singles > doubles;
      } catch {
        return false;
      }
    };

    const options: Record<string, unknown> = {
      ...(resolvedConfig || {}),
      filepath: absPath,
      parser,
    };

    // Se o projeto não especificou explicitamente `singleQuote`, aplicar inferência
    if (
      !resolvedConfig ||
      !Object.prototype.hasOwnProperty.call(resolvedConfig, 'singleQuote')
    ) {
      if (parser === 'babel' || parser === 'typescript') {
        options.singleQuote = inferSingleQuoteFromCode(params.code);
      }
    }

    const out = await prettier.format(params.code, options);
    const formatted = String(out);
    return {
      ok: true,
      parser: 'code',
      formatted,
      changed: formatted !== params.code,
      reason: 'prettier-projeto',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, parser: 'code', error: msg };
  }
}

// Registrar formatadores padrão — facilita extensão futura e evita que o motor
// Prettier seja invocado para arquivos que temos handlers dedicados.
registerFormatter('.json', (code, _relPath) => formatarJsonMinimo(code));
registerFormatter('.md', (code, _relPath) => formatarMarkdownMinimo(code));
registerFormatter('.markdown', (code, _relPath) =>
  formatarMarkdownMinimo(code),
);
registerFormatter('.yml', (code, _relPath) => formatarYamlMinimo(code));
registerFormatter('.yaml', (code, _relPath) => formatarYamlMinimo(code));
registerFormatter('.xml', (code, _relPath) => formatarXmlMinimo(code));
registerFormatter('.html', (code, _relPath) =>
  formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'html',
  }),
);
registerFormatter('.htm', (code, _relPath) =>
  formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'html',
  }),
);
registerFormatter('.css', (code, _relPath) =>
  formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: true,
    parser: 'css',
  }),
);
registerFormatter('.py', (code, _relPath) =>
  formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'python',
  }),
);
registerFormatter('.php', (code, _relPath) =>
  formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'php',
  }),
);
registerFormatter('.svg', (code, _relPath) => formatarXmlMinimo(code));
registerFormatter('.java', (code, _relPath) =>
  formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: true,
    parser: 'code',
  }),
);

// Antes de delegar ao Prettier no fluxo "auto/prettier", verificamos se existe
// um formatador registrado. Essa função auxilia o comando `formatar`.
export function getRegisteredFormatter(relPath: string): FormatterFn | null {
  return getFormatterForPath(relPath);
}
