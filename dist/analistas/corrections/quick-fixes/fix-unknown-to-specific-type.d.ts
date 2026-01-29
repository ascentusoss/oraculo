import type { Node } from '/types';
import type { QuickFix, QuickFixResult } from '../../../types/index.js';
export declare const fixUnknownToSpecificType: QuickFix;
export declare function fixUnknownToSpecificTypeAsync(match: RegExpMatchArray, fullCode: string, filePath: string, ast: Node | null): Promise<QuickFixResult>;
//# sourceMappingURL=fix-unknown-to-specific-type.d.ts.map