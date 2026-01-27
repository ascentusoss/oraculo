import type { FormatadorMinimoResult } from './formater.js';
export type FormatterFn = (code: string, relPath: string) => FormatadorMinimoResult | Promise<FormatadorMinimoResult>;
export declare function registerFormatter(ext: string, fn: FormatterFn): void;
export declare function getFormatterForPath(relPath: string): FormatterFn | null;
//# sourceMappingURL=formatter-registry.d.ts.map