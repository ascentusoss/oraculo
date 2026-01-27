export interface ParentWithOpts {
    opts?: () => Record<string, unknown>;
}
export interface FormatResult {
    total: number;
    formataveis: number;
    mudaram: number;
    erros: number;
    arquivosMudaram: string[];
}
export interface FormatarCommandOpts {
    check?: boolean;
    write?: boolean;
    include?: string[];
    exclude?: string[];
    engine?: string;
}
export interface OtimizarSvgCommandOpts {
    check: boolean;
    write: boolean;
    include: string[];
    exclude: string[];
    verbose: boolean;
}
//# sourceMappingURL=comandos.d.ts.map