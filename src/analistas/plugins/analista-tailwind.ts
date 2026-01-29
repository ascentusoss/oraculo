// SPDX-License-Identifier: MIT
import {
  AnalystOrigins,
  AnalystTypes,
  SeverityLevels,
  TailwindMessages,
} from '/messages/core/plugin-messages.js';
import { createLineLookup } from '/helpers/line-lookup.js';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_TAILWIND === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

type ClassBlock = { text: string; line: number };

function extractBalancedBraces(
  src: string,
  braceStartIndex: number,
  maxLen = 8000,
): string | null {
  // braceStartIndex deve apontar para '{'
  if (braceStartIndex < 0 || braceStartIndex >= src.length) return null;
  if (src[braceStartIndex] !== '{') return null;

  let i = braceStartIndex + 1;
  let depth = 1;

  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let escaped = false;

  const endLimit = Math.min(src.length, braceStartIndex + maxLen);
  while (i < endLimit) {
    const ch = src[i];

    if (escaped) {
      escaped = false;
      i++;
      continue;
    }

    if (ch === '\\') {
      // escape dentro de strings
      if (inSingle || inDouble || inBacktick) {
        escaped = true;
      }
      i++;
      continue;
    }

    if (inSingle) {
      if (ch === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      i++;
      continue;
    }
    if (inBacktick) {
      // Nota: ignoramos completamente conteúdo de template literal
      // para não quebrar em '}' de interpolações `${...}`.
      if (ch === '`') inBacktick = false;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i++;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      i++;
      continue;
    }

    if (ch === '{') depth++;
    else if (ch === '}') depth--;

    if (depth === 0) {
      return src.slice(braceStartIndex + 1, i);
    }

    i++;
  }

  return null;
}

function sanitizeTemplateLiteralText(text: string): string {
  // Remove interpolações `${...}` para manter apenas a parte estática.
  return text.replace(/\$\{[\s\S]*?\}/g, ' ');
}

function normalizeClassText(text: string): string {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTernaryExpressionText(text: string): boolean {
  // Heurística: se há um '?' e ':' no trecho do atributo, trate como branches exclusivas.
  // Isso reduz falsos positivos de conflito entre classes mutuamente exclusivas.
  return /\?/.test(text) && /:/.test(text);
}

function extractStringLiterals(text: string): string[] {
  const out: string[] = [];

  for (const m of text.matchAll(/"([^"\\\n]|\\.)*"/g)) {
    out.push((m[0] ?? '').slice(1, -1));
  }
  for (const m of text.matchAll(/'([^'\\\n]|\\.)*'/g)) {
    out.push((m[0] ?? '').slice(1, -1));
  }
  for (const m of text.matchAll(/`([^`]*)`/g)) {
    out.push(sanitizeTemplateLiteralText((m[1] ?? '').toString()));
  }

  return out;
}

function extractClassBlocks(src: string): ClassBlock[] {
  const blocks: ClassBlock[] = [];

  const lineOf = createLineLookup(src).lineAt;

  const seen = new Set<string>();
  const pushBlock = (text: string, line: number) => {
    const normalized = normalizeClassText(text);
    if (!normalized) return;
    const key = `${line}|${normalized}`;
    if (seen.has(key)) return;
    seen.add(key);
    blocks.push({ text: normalized, line });
  };

  // HTML/JSX: class="..." / className="..." (string literal)
  for (const m of src.matchAll(/\bclass(Name)?\s*=\s*(["'])([^"']*)\2/gi)) {
    pushBlock(m[3] ?? '', lineOf(m.index));
  }

  // JSX: className={"..."} / className={'...'}
  for (const m of src.matchAll(
    /\bclass(Name)?\s*=\s*\{\s*(["'])([^"']*)\2\s*\}/gi,
  )) {
    pushBlock(m[3] ?? '', lineOf(m.index));
  }

  // JSX: className={`...${...}...`} (template literal)
  for (const m of src.matchAll(/\bclass(Name)?\s*=\s*\{\s*`([^`]*)`\s*\}/gi)) {
    pushBlock(sanitizeTemplateLiteralText(m[2] ?? ''), lineOf(m.index));
  }

  // JS: const x = `...` (casos raros, mas evita perder HTML em strings)
  for (const m of src.matchAll(/\bclass(Name)?\s*=\s*`([^`]*)`/gi)) {
    pushBlock(sanitizeTemplateLiteralText(m[2] ?? ''), lineOf(m.index));
  }

  // JSX: className={...} (expressões comuns: ternário, arrays/join, concat, cn(...), etc)
  // Mais robusto que regex simples: captura expressão com chaves balanceadas.
  for (const m of src.matchAll(/\bclass(Name)?\s*=\s*\{/gi)) {
    const idx = m.index ?? -1;
    if (idx < 0) continue;
    const braceIdx = idx + (m[0]?.length ?? 0) - 1;
    const expr = extractBalancedBraces(src, braceIdx);
    if (!expr) continue;

    const line = lineOf(idx);
    const literals = extractStringLiterals(expr)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!literals.length) continue;

    if (isTernaryExpressionText(expr)) {
      literals.forEach((s) => pushBlock(s, line));
      continue;
    }
    pushBlock(literals.join(' '), line);
  }

  // Astro: class:list={...}
  for (const m of src.matchAll(/\bclass:list\s*=\s*\{/gi)) {
    const idx = m.index ?? -1;
    if (idx < 0) continue;
    const braceIdx = idx + (m[0]?.length ?? 0) - 1;
    const expr = extractBalancedBraces(src, braceIdx);
    if (!expr) continue;

    const line = lineOf(idx);
    const literals = extractStringLiterals(expr)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!literals.length) continue;

    if (isTernaryExpressionText(expr)) {
      literals.forEach((s) => pushBlock(s, line));
      continue;
    }
    pushBlock(literals.join(' '), line);
  }

  // JSX/TS: helpers comuns (clsx/cn/twMerge/classNames/classnames)
  // Heurística simples (sem parser): extrai literais de string dentro da chamada.
  for (const m of src.matchAll(
    /\b(?:clsx|cn|twMerge|classNames|classnames)\s*\(([^)]*)\)/g,
  )) {
    const args = m[1] ?? '';
    const literals = extractStringLiterals(args)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!literals.length) continue;
    pushBlock(literals.join(' '), lineOf(m.index));
  }

  return blocks;
}

function hasTailwindTokens(src: string): boolean {
  const blocks = extractClassBlocks(src);
  if (!blocks.length) return false;

  const tokenRe =
    /\b(?:bg-|text-|m[trblxy]?-|p[trblxy]?-|flex|grid|gap-|space-|rounded|shadow|justify-|items-|w-|h-|min-w-|max-w-|min-h-|max-h-|inset-|top-|left-|right-|bottom-|z-|overflow-|cursor-|select-|border|ring|opacity-|font-|leading-|tracking-|transition|duration-|ease-|animate-|underline|no-underline|sr-only|not-sr-only|container)\S*/i;
  return blocks.some((b) => tokenRe.test(b.text));
}

function extractClasses(src: string): { token: string; line: number }[] {
  const results: { token: string; line: number }[] = [];
  for (const block of extractClassBlocks(src)) {
    const classes = block.text.split(/\s+/).filter(Boolean);
    classes.forEach((token) => results.push({ token, line: block.line }));
  }
  return results;
}

function splitVariants(token: string): { variants: string; base: string } {
  const parts = token.split(':').filter(Boolean);
  if (parts.length <= 1) return { variants: '', base: token };
  return {
    variants: parts.slice(0, -1).join(':'),
    base: parts[parts.length - 1],
  };
}

function propertyKey(token: string): string | null {
  // Respeita variantes (sm:, md:, dark:, hover:, etc.): conflitos só contam
  // dentro do mesmo "contexto" de variantes.
  const { variants, base } = splitVariants(token);

  // ícones/fontawesome ou tokens livres não são tratados como conflito
  if (/^(fa-|icon-)/.test(base)) return null;

  // padding/margin: não trate px + py como conflito (são eixos diferentes)
  const padMatch = /^(p[trblxy]?)(?:-|\[)/.exec(base);
  if (padMatch) return `${variants}|padding:${padMatch[1]}`;
  const marMatch = /^(m[trblxy]?)(?:-|\[)/.exec(base);
  if (marMatch) return `${variants}|margin:${marMatch[1]}`;

  const gapMatch = /^(gap(?:-[xy])?)(?:-|\[)/.exec(base);
  if (gapMatch) return `${variants}|gap:${gapMatch[1]}`;
  if (/^space-[xy]/.test(base)) return `${variants}|space`;

  // display
  if (/^(block|inline-block|inline|flex|grid|hidden)$/.test(base))
    return `${variants}|display`;

  // flex direction
  if (/^flex-(row|col)(-reverse)?$/.test(base))
    return `${variants}|flex-direction`;

  // align/justify
  if (/^justify-/.test(base)) return `${variants}|justify`;
  if (/^items-/.test(base)) return `${variants}|items`;

  // border radius
  if (/^rounded(?:-|\b|\[)/.test(base)) return `${variants}|rounded`;

  // shadow
  if (/^shadow(?:-|\b|\[)/.test(base)) return `${variants}|shadow`;

  // background + text (separa tamanho vs cor para reduzir ruído)
  if (/^bg-(?!opacity-)/.test(base)) return `${variants}|bg-color`;
  if (/^text-(xs|sm|base|lg|xl|\d+xl)$/.test(base))
    return `${variants}|text-size`;
  if (/^text-(black|white|transparent|current)$/.test(base))
    return `${variants}|text-color`;
  if (/^text-[a-z]+-\d{2,3}$/.test(base)) return `${variants}|text-color`;

  const groups: { re: RegExp; key: string }[] = [
    { re: /^w(?:-|\[)/, key: 'width' },
    { re: /^h(?:-|\[)/, key: 'height' },
    { re: /^min-w(?:-|\[)/, key: 'min-w' },
    { re: /^max-w(?:-|\[)/, key: 'max-w' },
    { re: /^min-h(?:-|\[)/, key: 'min-h' },
    { re: /^max-h(?:-|\[)/, key: 'max-h' },
    { re: /^(top|left|right|bottom)(?:-|\[)/, key: 'position' },
  ];

  const found = groups.find((g) => g.re.test(base));
  return found ? `${variants}|${found.key}` : null;
}

function warn(
  message: string,
  relPath: string,
  line?: number,
  nivel: (typeof SeverityLevels)[keyof typeof SeverityLevels] = SeverityLevels.warning,
): Msg {
  return criarOcorrencia({
    relPath,
    mensagem: message,
    linha: line,
    nivel,
    origem: AnalystOrigins.tailwind,
    tipo: AnalystTypes.tailwind,
  });
}

function collectTailwindIssues(src: string, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];
  // Importante: conflitos devem ser detectados por bloco de classes
  // (cada atributo class/className) e não no arquivo inteiro.
  const blocks = extractClassBlocks(src);
  for (const block of blocks) {
    const tokens = (block.text || '').split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;

    const line = block.line;
    const seen: Record<string, string[]> = {};
    for (const token of tokens) {
      const key = propertyKey(token);
      if (!key) continue;
      if (!seen[key]) seen[key] = [];
      seen[key].push(token);
    }

    for (const [key, list] of Object.entries(seen)) {
      const uniqTokens = [...new Set(list)];

      // Detect duplicated exact tokens within same block (redundant classes)
      const repeats = list.filter((t, i) => list.indexOf(t) !== i);
      for (const r of [...new Set(repeats)]) {
        ocorrencias.push(
          warn(TailwindMessages.repeatedClass(r), relPath, line),
        );
      }

      if (uniqTokens.length > 1) {
        // Mensagem: mostra a chave sem o prefixo de variantes para não poluir,
        // mas mantém as classes originais nos exemplos.
        const normalizedKey = key.includes('|')
          ? key.split('|').slice(1).join('|')
          : key;
        ocorrencias.push(
          warn(
            TailwindMessages.conflictingClasses(
              normalizedKey,
              uniqTokens.slice(0, 4),
            ),
            relPath,
            line,
          ),
        );

        // Detect variant conflicts for same property across multiple variants
        const propSuffix = normalizedKey;
        const variantsSet = new Set<string>();
        for (const k of Object.keys(seen)) {
          const parts = k.split('|');
          const varPart = parts.length > 1 ? parts[0] : '';
          const propPart = parts.length > 1 ? parts.slice(1).join('|') : k;
          if (propPart === propSuffix) variantsSet.add(varPart || 'base');
        }
        if (variantsSet.size > 1) {
          ocorrencias.push(
            warn(
              TailwindMessages.variantConflict(
                propSuffix,
                Array.from(variantsSet),
              ),
              relPath,
              line,
              SeverityLevels.suggestion,
            ),
          );
        }
      }
    }

    // Detect variant conflicts across properties even when each variant has unique token
    const propVariants: Record<string, Set<string>> = {};
    for (const k of Object.keys(seen)) {
      const parts = k.split('|');
      const varPart = parts.length > 1 ? parts[0] : '';
      const propPart = parts.length > 1 ? parts.slice(1).join('|') : k;
      if (!propVariants[propPart]) propVariants[propPart] = new Set();
      propVariants[propPart].add(varPart || 'base');
    }
    for (const [prop, vset] of Object.entries(propVariants)) {
      if (vset.size > 1) {
        ocorrencias.push(
          warn(
            TailwindMessages.variantConflict(prop, Array.from(vset)),
            relPath,
            line,
            SeverityLevels.suggestion,
          ),
        );
      }
    }
  }

  // Arbitrary values: sinalizar para revisão
  const safeArbitrary =
    /(var\()|(rgb\()|(hsl\()|(calc\()|url\(|linear-gradient|conic-gradient|radial-gradient|\d+(px|rem|em|%|vh|vw|ms|s|deg|fr)?\]|\d+\/\d+|\[--|^\d+\/\d+|\d+px|\d+rem|\d+em|\d+%|\d+deg|\d+fr/i;

  const allTokens = extractClasses(src);
  allTokens
    .filter(({ token }) => /\[.*\]/.test(token))
    .forEach(({ token, line }) => {
      const hasDangerousUrl =
        /\[.*url\(.+\).*\]/i.test(token) &&
        /javascript:|data:text\/html/i.test(token);
      if (hasDangerousUrl) {
        ocorrencias.push(
          warn(TailwindMessages.dangerousArbitraryValue(token), relPath, line),
        );
        return;
      }

      // Evita ruído: ignore vars, cores, gradientes, calc, unidades comuns, etc.
      if (safeArbitrary.test(token)) return;

      ocorrencias.push(
        warn(TailwindMessages.arbitraryValue(token), relPath, line),
      );
    });

  // Important usage detection (e.g., 'text-red-500!')
  allTokens
    .filter(({ token }) => /!$/.test(token) || /!\]/.test(token))
    .forEach(({ token, line }) => {
      ocorrencias.push(
        warn(
          TailwindMessages.importantUsage(token),
          relPath,
          line,
          SeverityLevels.suggestion,
        ),
      );
    });

  return ocorrencias;
}

export const analistaTailwind = criarAnalista({
  nome: 'analista-tailwind',
  categoria: 'estilo',
  descricao: 'Heurísticas leves de Tailwind.',
  global: false,
  test: (relPath: string): boolean =>
    /\.(jsx|tsx|js|ts|html|astro)$/i.test(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;
    if (!hasTailwindTokens(src)) return null;
    const msgs = collectTailwindIssues(src, relPath);
    return msgs.length ? msgs : null;
  },
});

export default analistaTailwind;
