import type { AutoFixConfig, PatternBasedQuickFix } from '../../../types/index.js';
export type { PatternBasedQuickFix };
export declare const quickFixRegistry: PatternBasedQuickFix[];
export declare function findQuickFixes(code: string, problemType?: string, config?: AutoFixConfig, filePath?: string): Array<PatternBasedQuickFix & {
    matches: RegExpMatchArray[];
}>;
export declare function applyQuickFix(code: string, fix: PatternBasedQuickFix, match: RegExpMatchArray): string;
//# sourceMappingURL=fix-config.d.ts.map