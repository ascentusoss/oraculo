import type { Node } from '/types';
import type { QuickFix, QuickFixResult } from '../../../types/index.js';
export declare const fixAnyToProperType: QuickFix;
export declare function fixAnyToProperTypeAsync(match: RegExpMatchArray, fullCode: string, filePath: string, ast: Node | null): Promise<QuickFixResult>;
//# sourceMappingURL=fix-any-to-proper-type.d.ts.map