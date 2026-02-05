// SPDX-License-Identifier: MIT
import {
  AnalystOrigins,
  AnalystTypes,
  CssMessages,
  SeverityLevels,
} from '@core/messages/core/plugin-messages.js';
import {
  isLikelyIntentionalDuplicate,
  lintCssLikeStylelint,
} from '@shared/impar/stylelint.js';
import postcss, {
  type AtRule,
  type Container,
  type Declaration,
  type Root,
  type Rule,
  type Syntax,
} from 'postcss';
import postcssSass from 'postcss-sass';
import postcssScss from 'postcss-scss';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.ORACULO_DISABLE_PLUGIN_CSS === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

function warn(
  message: string,
  relPath: string,
  line?: number,
  nivelArg: (typeof SeverityLevels)[keyof typeof SeverityLevels] = SeverityLevels.warning,
): Msg {
  return criarOcorrencia({
    relPath,
    mensagem: message,
    linha: line,
    nivel: nivelArg,
    origem: AnalystOrigins.css,
    tipo: AnalystTypes.css,
  });
}

function collectCssIssues(src: string, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];
  const lines = src.split(/\n/);

  // Stack de blocos para não misturar propriedades de seletores/frames diferentes
  const stack: Array<{
    props: Record<string, { line: number; value: string }>;
    context?: 'font-face';
  }> = [];

  lines.forEach((lineText, idx) => {
    const line = idx + 1;
    const trimmed = lineText.trim();

    // Abre novos blocos antes de analisar propriedades da linha
    const opens = (trimmed.match(/\{/g) || []).length;
    for (let i = 0; i < opens; i++) {
      const ctx = /@font-face/i.test(trimmed) ? 'font-face' : undefined;
      stack.push({ props: {}, context: ctx });
    }

    const current = stack[stack.length - 1];
    if (current) {
      const propMatch = /^([a-zA-Z-]+)\s*:\s*([^;]+)?/.exec(trimmed);
      if (propMatch) {
        const prop = propMatch[1].toLowerCase();
        const value = (propMatch[2] || '').trim();
        const prev = current.props[prop];
        if (prev) {
          const ctx = current.context
            ? { currentAtRule: current.context }
            : undefined;
          if (isLikelyIntentionalDuplicate(prop, prev.value, value, ctx)) {
            // Duplicata legítima (fallback vendor, viewport, cor, etc)
          } else if (prev.value === value) {
            // Mesma propriedade, mesmo valor = erro claro
            ocorrencias.push(
              warn(CssMessages.duplicatePropertySame(prop), relPath, line),
            );
          } else {
            // Valores diferentes sem padrão claro = possível erro
            ocorrencias.push(
              warn(
                CssMessages.duplicatePropertyDifferent(prop, prev.value, value),
                relPath,
                line,
              ),
            );
          }
        } else {
          current.props[prop] = { line, value };
        }
      }
    }

    // !important
    if (/!important/.test(trimmed)) {
      ocorrencias.push(warn(CssMessages.importantUsage, relPath, line));
    }

    // @import/http
    if (/^@import\s+[^;]*http:\/\//i.test(trimmed)) {
      ocorrencias.push(warn(CssMessages.httpImport, relPath, line));
    }

    // url(http:)
    if (/url\(\s*['"]?http:\/\//i.test(trimmed)) {
      ocorrencias.push(warn(CssMessages.httpUrl, relPath, line));
    }

    // Fecha blocos depois de processar a linha
    const closes = (trimmed.match(/\}/g) || []).length;
    for (let i = 0; i < closes; i++) {
      if (stack.length) stack.pop();
    }
  });

  return ocorrencias;
}

function collectCssIssuesLikeStylelint(
  src: string,
  relPath: string,
): Msg[] | null {
  const warnings = lintCssLikeStylelint({ code: src, relPath });
  if (!warnings.length) return null;

  return warnings.map((w) => {
    const nivel =
      w.severity === 'error' ? SeverityLevels.error : SeverityLevels.warning;
    return warn(w.text, relPath, w.line, nivel);
  });
}

type CssRuleDecl = { prop: string; value: string };

function normalizeCssValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function canonicalizeDecls(decls: CssRuleDecl[]): {
  signature: string;
  count: number;
} {
  const map = new Map<string, string>();
  decls.forEach((d) => {
    const prop = d.prop.trim().toLowerCase();
    const value = normalizeCssValue(d.value);
    if (!prop || !value) return;
    // Mantém a última ocorrência; duplicatas já são tratadas em outra regra.
    map.set(prop, value);
  });
  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return {
    signature: sorted.map(([p, v]) => `${p}:${v}`).join(';'),
    count: sorted.length,
  };
}

function splitSimpleSelectors(selectorText: string): string[] {
  return selectorText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^(\.[A-Za-z0-9_-]+|#[A-Za-z0-9_-]+)$/.test(s));
}

function parseWithPostCssRoots(src: string, relPath: string): Root[] | null {
  const isScss = /\.scss$/i.test(relPath);
  const isSass = /\.sass$/i.test(relPath);
  const syntax: Syntax | undefined = isScss
    ? postcssScss
    : isSass
      ? postcssSass
      : undefined;

  try {
    // Importante: `postcss.parse(..., { syntax })` ignora `syntax`.
    // Para aplicar parser SCSS/SASS corretamente, usamos `postcss().process`.
    const result = postcss().process(src, {
      from: relPath,
      ...(syntax ? { syntax } : {}),
    });

    const rootUnknown: unknown = result.root;
    const rootAny = rootUnknown as
      | { type?: unknown; nodes?: unknown[] }
      | undefined;

    // Alguns parsers podem retornar `Document` (com múltiplos roots internos)
    if (
      rootAny &&
      rootAny.type === 'document' &&
      Array.isArray(rootAny.nodes)
    ) {
      const roots = rootAny.nodes.filter((n): n is Root => {
        const t = (n as { type?: unknown } | undefined)?.type;
        return t === 'root';
      });
      return roots.length ? roots : null;
    }

    // Caso padrão: um único Root
    return [result.root as unknown as Root];
  } catch {
    return null;
  }
}

function getNodeLine(
  node: { source?: { start?: { line?: number } } } | undefined,
): number | undefined {
  const line = node?.source?.start?.line;
  return typeof line === 'number' && Number.isFinite(line) ? line : undefined;
}

function formatAtRuleContext(n: AtRule): string {
  const name = String(n.name || '').toLowerCase();
  const params = String(n.params || '').trim();
  return `@${name}${params ? ` ${params}` : ''}`;
}

function normalizePropKey(prop: string): string {
  // Propriedades CSS são case-insensitive; custom properties são case-sensitive.
  return prop.startsWith('--') ? prop : prop.toLowerCase();
}

// Lista conhecida de propriedades CSS válidas (subset comum)
// Em produção, considere usar uma biblioteca como css-tree ou mdn-data
const KNOWN_CSS_PROPERTIES = new Set([
  // Layout
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-width',
  'border-style',
  'border-color',
  'box-sizing',
  'float',
  'clear',
  'overflow',
  'overflow-x',
  'overflow-y',
  'z-index',
  'visibility',

  // Flexbox
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-flow',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'order',

  // Grid
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-column',
  'grid-row',
  'grid-area',
  'gap',
  'row-gap',
  'column-gap',

  // Tipografia
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-decoration',
  'text-transform',
  'text-indent',
  'white-space',
  'word-break',
  'word-wrap',
  'color',
  'background',
  'background-color',
  'background-image',
  'background-repeat',
  'background-position',
  'background-size',

  // Outros comuns
  'cursor',
  'opacity',
  'transform',
  'transition',
  'animation',
  'list-style',
  'vertical-align',
  'text-overflow',
  'box-shadow',
  'border-radius',
  'outline',
  'content',
  'counter-reset',
  'counter-increment',
]);

function isValidCssProperty(prop: string): boolean {
  const normalized = prop.toLowerCase();
  // Permite propriedades custom (--*) e vendor (-webkit-*, -moz-*, etc.)
  if (normalized.startsWith('--') || normalized.startsWith('-')) {
    return true;
  }
  return KNOWN_CSS_PROPERTIES.has(normalized);
}

function detectCssHacks(value: string): string | null {
  // Detecta hacks comuns de CSS
  const hacks = [
    { pattern: /\\9/, name: 'backslash-9 hack' },
    { pattern: /_property/, name: 'underscore hack' },
    { pattern: /\*property/, name: 'star hack' },
    { pattern: /property\\\0\//, name: 'null byte hack' },
    { pattern: /expression\(/, name: 'IE expression' },
  ];

  for (const hack of hacks) {
    if (hack.pattern.test(value)) {
      return hack.name;
    }
  }
  return null;
}

function collectCssIssuesFromPostCssAst(root: Root, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];
  const seen = new Set<string>();
  const pushOnce = (m: Msg) => {
    const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
    if (seen.has(k)) return;
    seen.add(k);
    ocorrencias.push(m);
  };

  type Hit = { selector: string; line?: number };
  const byContextAndSignature = new Map<
    string,
    { declCount: number; hits: Hit[] }
  >();

  const visit = (
    container: Container,
    ctxAtRules: string[],
    ctxSelectors: string[],
  ) => {
    // 1) Duplicidade / !important / url(http:)
    const props: Record<string, { value: string; line?: number }> = {};
    const inFontFace = ctxAtRules.some((c) =>
      c.toLowerCase().startsWith('@font-face'),
    );

    container.nodes?.forEach((node) => {
      if (node.type === 'decl') {
        const decl = node as Declaration;
        const propRaw = String(decl.prop || '').trim();

        // SCSS variável: "$color: ..." (não é propriedade CSS)
        if (!propRaw || propRaw.startsWith('$')) {
          return;
        }

        const propKey = normalizePropKey(propRaw);
        const value = normalizeCssValue(
          `${String(decl.value || '')}${decl.important ? ' !important' : ''}`,
        );
        const line = getNodeLine(decl);

        const prev = props[propKey];
        if (prev) {
          const ctx = inFontFace
            ? { currentAtRule: 'font-face' as const }
            : undefined;
          if (isLikelyIntentionalDuplicate(propKey, prev.value, value, ctx)) {
            // duplicata intencional
          } else if (prev.value === value) {
            pushOnce(
              warn(CssMessages.duplicatePropertySame(propRaw), relPath, line),
            );
          } else {
            pushOnce(
              warn(
                CssMessages.duplicatePropertyDifferent(
                  propRaw,
                  prev.value,
                  value,
                ),
                relPath,
                line,
              ),
            );
          }
        }
        props[propKey] = { value, line };

        // Validação de propriedade inválida
        if (!isValidCssProperty(propRaw)) {
          pushOnce(warn(CssMessages.invalidProperty(propRaw), relPath, line));
        }

        // Detecta hacks CSS
        const hack = detectCssHacks(String(decl.value || ''));
        if (hack) {
          pushOnce(warn(CssMessages.cssHackDetected(hack), relPath, line));
        }

        if (decl.important) {
          pushOnce(warn(CssMessages.importantUsage, relPath, line));
        }

        if (/url\(\s*['"]?http:\/\//i.test(String(decl.value || ''))) {
          pushOnce(warn(CssMessages.httpUrl, relPath, line));
        }
      }
    });

    // 2) Unificação/centralização (apenas em regras com seletores simples)
    if (container.type === 'rule') {
      const rule = container as Rule;
      const selectorText = String(rule.selector || '');
      const simpleSelectors = splitSimpleSelectors(selectorText);
      if (simpleSelectors.length) {
        const decls: CssRuleDecl[] = [];
        rule.nodes?.forEach((n) => {
          if (n.type !== 'decl') return;
          const d = n as Declaration;
          const prop = String(d.prop || '').trim();
          if (!prop || prop.startsWith('$')) return;
          const value = `${String(d.value || '')}${d.important ? ' !important' : ''}`;
          decls.push({ prop, value });
        });

        // Detecta regras vazias
        if (decls.length === 0) {
          pushOnce(warn(CssMessages.emptyRule, relPath, getNodeLine(rule)));
        }

        const { signature, count } = canonicalizeDecls(decls);
        if (signature && count >= 3) {
          const ctxKey = [...ctxAtRules, ...ctxSelectors].join('|');
          const key = `${ctxKey}||${signature}`;
          const entry = byContextAndSignature.get(key) ?? {
            declCount: count,
            hits: [],
          };
          const line = getNodeLine(rule);
          simpleSelectors.forEach((sel) =>
            entry.hits.push({ selector: sel, line }),
          );
          byContextAndSignature.set(key, entry);
        }
      } else if (selectorText.trim()) {
        // Verifica seletor malformado (se não conseguiu dividir em seletores simples)
        try {
          // Tenta parsear o seletor com uma regex simples
          const invalidChars = /[{}[\]()]/;
          if (invalidChars.test(selectorText)) {
            pushOnce(
              warn(
                CssMessages.malformedSelector(selectorText.trim()),
                relPath,
                getNodeLine(rule),
              ),
            );
          }
        } catch {
          pushOnce(
            warn(
              CssMessages.malformedSelector(selectorText.trim()),
              relPath,
              getNodeLine(rule),
            ),
          );
        }
      }
    }

    // 3) Descer recursivamente para filhos (@rules e regras aninhadas)
    container.nodes?.forEach((node) => {
      if (node.type === 'atrule') {
        const at = node as AtRule;
        const name = String(at.name || '').toLowerCase();
        const line = getNodeLine(at);

        // @import http://...
        if (
          name === 'import' &&
          /^\s*(url\()?\s*['"]?http:\/\//i.test(String(at.params || ''))
        ) {
          pushOnce(warn(CssMessages.httpImport, relPath, line));
        }

        // Alguns at-rules tem bloco e nós internos; outros são só linha.
        if (at.nodes && at.nodes.length) {
          visit(at, [...ctxAtRules, formatAtRuleContext(at)], ctxSelectors);
        }
        return;
      }

      if (node.type === 'rule') {
        const r = node as Rule;
        // Contexto de nesting (SCSS): para regras filhas, adiciona o seletor do container atual
        // (não o seletor da regra filha), evitando misturar árvores de seletores diferentes.
        const nextSelectors =
          container.type === 'rule'
            ? [
                ...ctxSelectors,
                `sel ${String((container as Rule).selector || '').trim()}`,
              ]
            : ctxSelectors;
        visit(r, ctxAtRules, nextSelectors);
      }
    });
  };

  visit(root, [], []);

  for (const { declCount, hits } of byContextAndSignature.values()) {
    const selectors = [...new Set(hits.map((h) => h.selector))];
    if (selectors.length < 2) continue;
    const line = hits
      .map((h) => h.line)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      .sort((a, b) => a - b)[0];

    pushOnce(
      warn(CssMessages.unifySelectors(selectors, declCount), relPath, line),
    );
    const ids = selectors.filter((s) => s.startsWith('#'));
    ids.slice(0, 3).forEach((idSel) => {
      pushOnce(
        warn(
          CssMessages.idSelectorPreferClass(idSel),
          relPath,
          line,
          SeverityLevels.info,
        ),
      );
    });
  }

  return ocorrencias;
}

export const analistaCss = criarAnalista({
  nome: 'analista-css',
  categoria: 'estilo',
  descricao: 'Lint de CSS do Oráculo (com fallback heurístico).',
  global: false,
  test: (relPath: string): boolean => /\.(css|scss|sass)$/i.test(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;
    const isCss = /\.css$/i.test(relPath);

    const roots = parseWithPostCssRoots(src, relPath);
    const astIssues = roots
      ? roots.flatMap((r) => collectCssIssuesFromPostCssAst(r, relPath))
      : [];

    // Mantém regras stylelint-like para CSS puro (pipeline atual do Oráculo).
    const cssLint = isCss
      ? (collectCssIssuesLikeStylelint(src, relPath) ?? [])
      : [];

    const seen = new Set<string>();
    const merged: Msg[] = [];
    const pushOnce = (m: Msg) => {
      const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
      if (seen.has(k)) return;
      seen.add(k);
      merged.push(m);
    };
    cssLint.forEach(pushOnce);
    astIssues.forEach(pushOnce);

    if (merged.length) return merged;

    // Fallback: heurístico (útil quando o parser não aceita casos extremos/arquivos quebrados)
    const fallback = collectCssIssues(src, relPath);
    return fallback.length ? fallback : null;
  },
});

export default analistaCss;
