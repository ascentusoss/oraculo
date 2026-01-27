export type NomeacaoEstilo = 'kebab' | 'dots' | 'camel';
export interface OpcoesEstrategista {
    preset?: string;
    raizCodigo?: string;
    criarSubpastasPorEntidade?: boolean;
    apenasCategoriasConfiguradas?: boolean;
    estiloPreferido?: NomeacaoEstilo;
    categoriasMapa?: Record<string, string>;
    ignorarPastas?: string[];
}
export interface ParseNomeResultado {
    entidade: string | null;
    categoria: string | null;
}
//# sourceMappingURL=estrutura.d.ts.map