export interface QuickFix {
    id: string;
    title: string;
    description: string;
    pattern: RegExp;
    fix: (match: RegExpMatchArray, fullCode: string) => string;
    category: 'security' | 'performance' | 'style' | 'documentation';
    confidence: number;
    shouldApply?: (match: RegExpMatchArray, fullCode: string, lineContext: string, filePath?: string) => boolean;
}
//# sourceMappingURL=auto-fix.d.ts.map