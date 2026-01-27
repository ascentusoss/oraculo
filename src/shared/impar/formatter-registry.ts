// SPDX-License-Identifier: MIT

import type { FormatadorMinimoResult } from './formater.js';

export type FormatterFn = (
  code: string,
  relPath: string,
) => FormatadorMinimoResult | Promise<FormatadorMinimoResult>;

const registry = new Map<string, FormatterFn>();

export function registerFormatter(ext: string, fn: FormatterFn): void {
  registry.set(ext.toLowerCase(), fn);
}

export function getFormatterForPath(relPath: string): FormatterFn | null {
  const p = (relPath || '').toLowerCase();
  for (const [ext, fn] of registry.entries()) {
    if (p.endsWith(ext)) return fn;
  }
  return null;
}
