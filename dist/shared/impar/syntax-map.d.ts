export type SyntaxInfo = {
    parser?: string;
    formatavel?: boolean;
};
export declare const syntaxMap: Record<string, SyntaxInfo>;
export declare function getSyntaxInfoForPath(relPath: string): SyntaxInfo | null;
//# sourceMappingURL=syntax-map.d.ts.map