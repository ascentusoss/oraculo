export type RegraIncluiExclui = {
    include?: boolean;
    exclude?: boolean;
    patterns?: string[];
    custom?: (relPath: string, entry: import('node:fs').Dirent) => boolean;
};
export type ConfigIncluiExclui = {
    globalExcludeGlob?: string[];
    globalInclude?: string[];
    globalExclude?: string[];
    globalIncludeGlob?: string[];
    dirRules?: Record<string, RegraIncluiExclui>;
};
export type IncludeExcludeRule = RegraIncluiExclui;
export type IncludeExcludeConfig = ConfigIncluiExclui;
//# sourceMappingURL=filtros.d.ts.map