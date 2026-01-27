import type { LeitorRelatorioOptions } from '../../types/index.js';
export type { LeitorRelatorioOptions };
export declare function lerRelatorioVersionado<T = unknown>(options: LeitorRelatorioOptions): Promise<{
    sucesso: boolean;
    dados?: T;
    schema?: Record<string, unknown>;
    erro?: string;
    migrado?: boolean;
}>;
export declare function lerDadosRelatorio<T = unknown>(caminho: string): Promise<{
    sucesso: boolean;
    dados?: T;
    erro?: string;
}>;
export declare function verificarSchemaRelatorio(caminho: string): Promise<{
    valido: boolean;
    versao?: string;
    erros?: string[];
    erro?: string;
}>;
//# sourceMappingURL=leitor-relatorio.d.ts.map