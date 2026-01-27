export type CssTreeLoc = {
    start?: {
        line?: number;
        column?: number;
    };
};
export type CssTreeChildrenList<T> = {
    getSize?: () => number;
    forEach?: (cb: (item: T) => void) => void;
};
export type CssTreeBlock<T> = {
    children?: CssTreeChildrenList<T>;
};
export type CssTreeNode = {
    type?: string;
    name?: unknown;
    prelude?: unknown;
    block?: CssTreeBlock<CssTreeNode>;
    loc?: CssTreeLoc;
    property?: unknown;
    value?: unknown;
    important?: unknown;
};
export type CssLintSeverity = 'warning' | 'error';
export type CssLintWarning = {
    rule: string;
    severity: CssLintSeverity;
    text: string;
    line?: number;
    column?: number;
};
export type CssDuplicateContext = {
    atruleStack?: Array<{
        name: string;
        prelude: string;
    }>;
    currentAtRule?: string;
    currentAtRulePrelude?: string;
};
//# sourceMappingURL=stylelint.d.ts.map