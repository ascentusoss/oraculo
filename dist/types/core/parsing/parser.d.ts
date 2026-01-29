import type { File } from '/types';
export interface ParserBabelFileExtra extends File {
    oraculoExtra?: {
        lang: string;
        rawAst: unknown;
        metadata?: unknown;
    };
}
export type ParserFunc = (codigo: string, plugins?: string[]) => File | ParserBabelFileExtra | null;
export interface DecifrarSintaxeOpts {
    plugins?: string[];
    codigo?: string;
    relPath?: string;
    fullPath?: string;
    ignorarErros?: boolean;
    timeoutMs?: number;
}
//# sourceMappingURL=parser.d.ts.map