import type { ValidationResult } from '../../../types/index.js';
export type { ValidationResult };
export declare function validateJavaScriptSyntax(code: string): ValidationResult;
export declare function validateQuickFixResult(originalCode: string, fixedCode: string, fixId: string): ValidationResult;
export declare function isSafeToApplyFix(code: string, fixId: string, match: RegExpMatchArray): boolean;
//# sourceMappingURL=validacao.d.ts.map