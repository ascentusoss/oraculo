export type ImportCorrecaoTipo = 'relativo-para-alias' | 'tipos-extensao' | 'tipos-subpath' | 'alias-invalido';
export interface ImportCorrecao {
    tipo: ImportCorrecaoTipo | string;
    de: string;
    para: string;
    linha: number;
}
export interface ImportCorrecaoArquivo {
    arquivo: string;
    correcoes: ImportCorrecao[];
    modificado: boolean;
    erro?: string;
}
export interface ImportCorrecaoStats {
    arquivosProcessados: number;
    arquivosModificados: number;
    totalCorrecoes: number;
    porTipo: Record<string, number>;
    tempoMs: number;
}
export type AliasConfig = Record<string, string>;
export interface ImportCorrecaoOptions {
    projectRoot: string;
    dryRun?: boolean;
    verbose?: boolean;
    corrigirTipos?: boolean;
    corrigirRelativos?: boolean;
    aliasConfig?: AliasConfig;
    ignore?: string[];
}
//# sourceMappingURL=imports.d.ts.map