// SPDX-License-Identifier: MIT
/**
 * Lint de CSS interno do Oráculo (inspirado em linters de CSS do ecossistema).
 *
 * Importante: este arquivo NÃO usa nem depende dos artefatos em /implis.
 * A pasta implis serve apenas como referência/"inspiração" de regras.
 */

import * as csstree from 'css-tree';

import type {
  CssDuplicateContext,
  CssLintSeverity,
  CssLintWarning,
  CssTreeNode,
} from '@';

// Re-export types for backward compatibility
export type { CssDuplicateContext, CssLintSeverity, CssLintWarning };

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function isLikelyHttpUrlLine(line: string): boolean {
  return /https?:\/\//i.test(line);
}

function hasHttpUrl(input: string): boolean {
  return /\bhttp:\/\//i.test(input);
}

function checkNoInvalidDoubleSlashComments(code: string): CssLintWarning[] {
  const out: CssLintWarning[] = [];
  const lines = code.split(/\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i] ?? '';
    const idx = line.indexOf('//');
    if (idx === -1) continue;
    if (isLikelyHttpUrlLine(line)) continue;

    out.push({
      rule: 'no-invalid-double-slash-comments',
      severity: 'warning',
      text: 'Comentário // detectado em CSS. CSS não suporta // (apenas /* */).',
      line: lineNo,
      column: idx + 1,
    });
  }

  return out;
}

function hasCssVar(value: string): boolean {
  return /\bvar\(/i.test(value);
}

function hasGradient(value: string): boolean {
  return /gradient/i.test(value);
}

function hasImageSet(value: string): boolean {
  return /image-set\(/i.test(value);
}

export function isLikelyIntentionalDuplicate(
  prop: string,
  prevValue: string,
  newValue: string,
  ctx?: CssDuplicateContext,
): boolean {
  const normalizedProp = prop.toLowerCase();

  // Fallbacks de viewport (100vh / 100dvh)
  if (
    /(100)?(vh|dvh|vw|dvw)/i.test(prevValue) ||
    /(100)?(vh|dvh|vw|dvw)/i.test(newValue)
  ) {
    return true;
  }

  // Fallback com var(); comum quando há valor default + CSS custom properties
  if (hasCssVar(prevValue) || hasCssVar(newValue)) {
    return true;
  }

  // Fallbacks de cor (rgb/rgba/hex)
  if (
    /(^#|rgb|hsl|color)/i.test(prevValue) &&
    /(^#|rgb|hsl|color)/i.test(newValue) &&
    prevValue !== newValue
  ) {
    return true;
  }

  const gradientPrev = hasGradient(prevValue);
  const gradientNew = hasGradient(newValue);

  // Fallbacks de gradient (ou cor -> gradient) são intencionais para browsers antigos
  const isBackgroundProp =
    normalizedProp === 'background' || normalizedProp === 'background-image';
  if (
    (gradientPrev && gradientNew && prevValue !== newValue) ||
    (isBackgroundProp && (gradientPrev || gradientNew))
  ) {
    return true;
  }

  // image-set() vs url() costuma ser fallback/resolução
  if (isBackgroundProp && (hasImageSet(prevValue) || hasImageSet(newValue))) {
    return true;
  }

  // Fallback de fontes em : múltiplos src são esperados
  const inFontFace = (ctx?.currentAtRule || '').toLowerCase() === 'font-face';
  if (inFontFace && normalizedProp === 'src') {
    return true;
  }

  // Propriedades com prefixos vendor (transform, animation, transition, etc)
  const vendorProp = normalizedProp.replace(/^(-webkit|-moz|-ms|-o)-/, '');
  if (vendorProp !== normalizedProp) {
    return true;
  }

  // Fallback de display entre flex e grid é suspeito mas não impossível
  if (
    normalizedProp === 'display' &&
    (prevValue === 'flex' || prevValue === 'grid') &&
    (newValue === 'flex' || newValue === 'grid')
  ) {
    return false;
  }

  return false;
}

export function lintCssLikeStylelint(opts: {
  code: string;
  relPath: string;
}): CssLintWarning[] {
  const code = opts.code;
  const warnings: CssLintWarning[] = [];

  if (!code.trim()) {
    warnings.push({
      rule: 'no-empty-source',
      severity: 'warning',
      text: 'Arquivo CSS vazio.',
      line: 1,
      column: 1,
    });
    return warnings;
  }

  warnings.push(...checkNoInvalidDoubleSlashComments(code));

  let ast: unknown;
  try {
    ast = csstree.parse(code, {
      filename: opts.relPath,
      positions: true,
      parseCustomProperty: true,
    });
  } catch (e) {
    warnings.push({
      rule: 'syntax-error',
      severity: 'error',
      text: `Erro de parse CSS: ${(e as Error).message}`,
    });
    return warnings;
  }

  const importSeen = new Set<string>();
  const selectorSeenByScope = new Set<string>();
  const keyframesSeen = new Set<string>();

  type AtRuleScope = { name: string; prelude: string };
  const atruleStack: AtRuleScope[] = [];

  function currentScopeKey(): string {
    if (!atruleStack.length) return '';
    return atruleStack
      .map((a) => {
        const p = a.prelude ? ` ${a.prelude}` : '';
        return `@${a.name}${p}`;
      })
      .join(' | ');
  }

  csstree.walk(ast as never, {
    enter: (node: CssTreeNode) => {
      //  duplicado
      if (
        node?.type === 'Atrule' &&
        String(node.name || '').toLowerCase() === 'import'
      ) {
        const prelude = node.prelude
          ? normalizeWhitespace(csstree.generate(node.prelude as never))
          : '';
        const key = prelude;
        if (key) {
          if (hasHttpUrl(key)) {
            warnings.push({
              rule: 'no-http-at-import-rules',
              severity: 'warning',
              text: ' via HTTP detectado; prefira HTTPS ou bundling local.',
              line: node.loc?.start?.line,
              column: node.loc?.start?.column,
            });
          }
          if (importSeen.has(key)) {
            warnings.push({
              rule: 'no-duplicate-at-import-rules',
              severity: 'warning',
              text: ` duplicado detectado (${key}).`,
              line: node.loc?.start?.line,
              column: node.loc?.start?.column,
            });
          } else {
            importSeen.add(key);
          }
        }
      }

      //  duplicado (colide animações)
      if (node?.type === 'Atrule') {
        const name = String(node.name || '').toLowerCase();
        const isKeyframes =
          name === 'keyframes' ||
          name === '-webkit-keyframes' ||
          name === '-moz-keyframes';
        if (isKeyframes) {
          const prelude = node.prelude
            ? normalizeWhitespace(csstree.generate(node.prelude as never))
            : '';
          const key = `${name}:${prelude}`;
          if (keyframesSeen.has(key)) {
            warnings.push({
              rule: 'no-duplicate-keyframes',
              severity: 'warning',
              text: `Declaração  duplicada detectada (${prelude}).`,
              line: node.loc?.start?.line,
              column: node.loc?.start?.column,
            });
          } else if (prelude) {
            keyframesSeen.add(key);
          }
        }
      }

      // Mantém contexto de //... para não marcar como duplicado
      // o mesmo seletor em escopos diferentes (padrão mobile-first).
      if (node?.type === 'Atrule' && node.block) {
        const name = String(node.name || '').toLowerCase();
        const prelude = node.prelude
          ? normalizeWhitespace(csstree.generate(node.prelude as never))
          : '';
        atruleStack.push({ name, prelude });
      }

      // Seletores duplicados (mesma regra aparecendo repetida no arquivo)
      if (node?.type === 'Rule' && node?.prelude) {
        const selector = normalizeWhitespace(
          csstree.generate(node.prelude as never),
        );
        if (selector) {
          const key = `${currentScopeKey()}||${selector}`;
          if (selectorSeenByScope.has(key)) {
            warnings.push({
              rule: 'no-duplicate-selectors',
              severity: 'warning',
              text: `Seletor duplicado detectado (${selector}). Considere consolidar regras.`,
              line: node.loc?.start?.line,
              column: node.loc?.start?.column,
            });
          } else {
            selectorSeenByScope.add(key);
          }
        }
      }

      // Bloco vazio
      if (
        (node?.type === 'Rule' || node?.type === 'Atrule') &&
        node?.block?.children
      ) {
        const children = node.block.children;
        const isEmpty =
          typeof children.getSize === 'function'
            ? children.getSize() === 0
            : false;
        if (isEmpty) {
          warnings.push({
            rule: 'block-no-empty',
            severity: 'warning',
            text: 'Bloco CSS vazio detectado.',
            line: node.loc?.start?.line,
            column: node.loc?.start?.column,
          });
        }
      }
    },
    leave: (node: CssTreeNode) => {
      if (node?.type === 'Atrule' && node.block) {
        atruleStack.pop();
      }
    },
  });

  // Duplicatas por bloco (declarações)
  const conflictProps = new Set(['display', 'position', 'float', 'clear']);
  const atruleStackForDecl: AtRuleScope[] = [];
  const declStack: Array<{
    nodeType: string;
    name?: string;
    prelude?: string;
    seen: Map<string, { value: string; line?: number; column?: number }>;
  }> = [];

  csstree.walk(ast as never, {
    enter: (node: CssTreeNode) => {
      if (node?.type === 'Atrule' && node.block) {
        const name = String(node.name || '').toLowerCase();
        const prelude = node.prelude
          ? normalizeWhitespace(csstree.generate(node.prelude as never))
          : '';
        atruleStackForDecl.push({ name, prelude });
      }

      if (
        (node?.type === 'Rule' || node?.type === 'Atrule') &&
        node.block?.children
      ) {
        const name =
          node.type === 'Atrule' ? String(node.name || '').toLowerCase() : '';
        const prelude =
          node.type === 'Atrule' && node.prelude
            ? normalizeWhitespace(csstree.generate(node.prelude as never))
            : '';
        declStack.push({
          nodeType: node.type,
          name,
          prelude,
          seen: new Map(),
        });
      }

      if (node?.type !== 'Declaration') return;

      const current = declStack[declStack.length - 1];
      const prop = String(node.property || '').toLowerCase();
      const value = node.value
        ? normalizeWhitespace(csstree.generate(node.value as never))
        : '';
      const loc = node.loc?.start;

      // !important
      if (node.important === true) {
        warnings.push({
          rule: 'declaration-no-important',
          severity: 'warning',
          text: 'Uso de !important detectado; prefira especificidade adequada.',
          line: loc?.line,
          column: loc?.column,
        });
      }

      // url(http://...)
      if (/\burl\(\s*['"]?http:\/\//i.test(value)) {
        warnings.push({
          rule: 'no-http-url',
          severity: 'warning',
          text: 'Recurso externo via HTTP em url(); prefira HTTPS.',
          line: loc?.line,
          column: loc?.column,
        });
      }

      if (!current) return;

      const prev = current.seen.get(prop);
      if (!prev) {
        current.seen.set(prop, { value, line: loc?.line, column: loc?.column });
        return;
      }

      const duplicateCtx: CssDuplicateContext = {
        atruleStack: [...atruleStackForDecl],
        currentAtRule: current.name,
        currentAtRulePrelude: current.prelude,
      };

      if (isLikelyIntentionalDuplicate(prop, prev.value, value, duplicateCtx))
        return;

      const same = prev.value === value;
      const isStructuralConflict = conflictProps.has(prop) && !same;
      warnings.push({
        rule: 'declaration-block-no-duplicate-properties',
        severity: same || isStructuralConflict ? 'error' : 'warning',
        text: same
          ? `Propriedade duplicada com valor idêntico (${prop}).`
          : `Propriedade duplicada (${prop}) com valores diferentes: "${prev.value}" vs "${value}".`,
        line: loc?.line,
        column: loc?.column,
      });
    },
    leave: (node: CssTreeNode) => {
      if (
        (node?.type === 'Rule' || node?.type === 'Atrule') &&
        node.block?.children
      ) {
        declStack.pop();
      }

      if (node?.type === 'Atrule' && node.block) {
        atruleStackForDecl.pop();
      }
    },
  });

  return warnings;
}
