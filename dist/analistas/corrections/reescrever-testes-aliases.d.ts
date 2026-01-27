export declare function pickExtForAlias(aliasBase: string, srcRoot: string): string;
export declare function rewriteToAlias(spec: string, ctx: {
    fileAbs: string;
    scope?: string;
    withinScope?: string;
    srcRoot: string;
}): {
    changed: boolean;
    value: string;
};
export declare function transformCodeForTests(code: string, ctx: {
    fileAbs: string;
    scope?: string;
    withinScope?: string;
    srcRoot: string;
}): {
    code: string;
    changed: boolean;
};
//# sourceMappingURL=reescrever-testes-aliases.d.ts.map