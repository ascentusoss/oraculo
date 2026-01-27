import type { CssDuplicateContext, CssLintSeverity, CssLintWarning } from '../../types/index.js';
export type { CssDuplicateContext, CssLintSeverity, CssLintWarning };
export declare function isLikelyIntentionalDuplicate(prop: string, prevValue: string, newValue: string, ctx?: CssDuplicateContext): boolean;
export declare function lintCssLikeStylelint(opts: {
    code: string;
    relPath: string;
}): CssLintWarning[];
//# sourceMappingURL=stylelint.d.ts.map