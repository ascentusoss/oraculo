// SPDX-License-Identifier: MIT
// @oraculo-disable tipo-literal-inline-complexo
// Justificativa: tipos locais usados internamente para parsing de caminhos
import fsSync from 'node:fs';
import path from 'node:path';

const _TOP_DIRS = new Set([
  'analistas',
  'arquitetos',
  'cli',
  'guardian',
  'nucleo',
  'relatorios',
  'tipos',
  'auto',
]);

const LEGACY_ALIAS_MAP = new Map<string, string>();

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}
function exists(p: string): boolean {
  try {
    return fsSync.existsSync(p);
  } catch {
    return false;
  }
}

function pathFromAlias(aliasSpec: string, srcRoot: string): string {
  const spec = aliasSpec.replace(/^@/, '');
  const parts = spec.split('/');
  const top = parts.shift();
  return path.join(srcRoot, top ?? '', parts.join('/'));
}

export function pickExtForAlias(aliasBase: string, srcRoot: string): string {
  const absTs = pathFromAlias(`${aliasBase}.ts`, srcRoot);
  const absJs = pathFromAlias(`${aliasBase}.js`, srcRoot);
  if (exists(absTs)) return `${aliasBase}.ts`;
  if (exists(absJs)) return `${aliasBase}.js`;
  return `${aliasBase}.ts`;
}

export function rewriteToAlias(
  spec: string,
  ctx: {
    fileAbs: string;
    scope?: string;
    withinScope?: string;
    srcRoot: string;
  },
): { changed: boolean; value: string } {
  const posixSpec = toPosix(spec);
  if (
    posixSpec.startsWith('@') ||
    /^([a-zA-Z]+:|node:|[a-zA-Z0-9_-]+)$/.test(posixSpec)
  ) {
    if (!posixSpec.startsWith('@')) return { changed: false, value: spec };
    const withoutExt = posixSpec.replace(/\.(ts|js|mjs|cjs|tsx|jsx)$/i, '');
    let mapped = LEGACY_ALIAS_MAP.get(withoutExt);
    if (!mapped && withoutExt.startsWith('@cli/src/')) mapped = withoutExt;
    if (mapped) {
      const withExt = pickExtForAlias(mapped, ctx.srcRoot);
      return { changed: true, value: withExt };
    }
    return { changed: false, value: spec };
  }
  return { changed: false, value: spec };
}

export function transformCodeForTests(
  code: string,
  ctx: {
    fileAbs: string;
    scope?: string;
    withinScope?: string;
    srcRoot: string;
  },
): { code: string; changed: boolean } {
  let changed = false;
  const rewrite = (spec: string) => rewriteToAlias(spec, ctx);

  code = code.replace(
    /(import\s+[^'"\n]+?from\s+)(["'])([^"']+?)\2/g,
    (m, p1, q, spec) => {
      const result = rewrite(spec);
      if (!result.changed) return m;
      changed = true;
      return `${p1}${q}${result.value}${q}`;
    },
  );

  code = code.replace(/(import\s*)(["'])([^"']+?)\2/g, (m, p1, q, spec) => {
    const result = rewrite(spec);
    if (!result.changed) return m;
    changed = true;
    return `${p1}${q}${result.value}${q}`;
  });

  code = code.replace(
    /(import\s*\()(\s*["'])([^"']+?)(["']\s*\))/g,
    (m, p1, q1, spec, q2) => {
      const result = rewrite(spec);
      if (!result.changed) return m;
      changed = true;
      return `${p1}${q1}${result.value}${q2}`;
    },
  );

  code = code.replace(
    /(vi\.(?:do)?mock\s*\()(\s*["'])([^"']+?)(["'])(\s*,?)/g,
    (m, p1, q1, spec, q2, comma = '') => {
      const result = rewrite(spec);
      if (!result.changed) return m;
      changed = true;
      return `${p1}${q1}${result.value}${q2}${comma}`;
    },
  );

  return { code, changed };
}
