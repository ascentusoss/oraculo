import type { FormatadorMinimoResult } from '../../types/index.js';
import type { FormatterFn } from './formatter-registry.js';
export type { FormatadorMinimoParser, FormatadorMinimoResult } from '../../types/index.js';
export declare function formatarPrettierMinimo(params: {
    code: string;
    relPath?: string;
}): FormatadorMinimoResult;
export declare function formatarComPrettierProjeto(params: {
    code: string;
    relPath: string;
    baseDir?: string;
}): Promise<FormatadorMinimoResult>;
export declare function getRegisteredFormatter(relPath: string): FormatterFn | null;
//# sourceMappingURL=formater.d.ts.map