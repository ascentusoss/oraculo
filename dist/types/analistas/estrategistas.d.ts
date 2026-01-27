export interface ArquivoMeta {
    relPath: string;
    padrao?: string;
    categoria?: string;
    sugestao?: string;
}
export interface SinaisProjetoAvancados {
    funcoes: number;
    imports: string[];
    variaveis: number;
    tipos: string[];
    classes: number;
    frameworksDetectados: string[];
    dependencias: string[];
    scripts: string[];
    pastasPadrao: string[];
    arquivosPadrao: string[];
    arquivosConfig: string[];
    padroesArquiteturais: string[];
    tecnologiasDominantes: string[];
    complexidadeEstrutura: 'baixa' | 'media' | 'alta';
    tipoDominante: string;
    detalhes?: {
        testRunner?: string;
        linter?: string;
        bundler?: string;
        ciProvider?: string;
    };
}
export interface ResultadoEstrutural {
    arquivo: string;
    ideal: string | null;
    atual: string;
    motivo?: string;
}
export interface OpcoesPlanejamento {
    preferEstrategista?: boolean;
    criarSubpastasPorEntidade?: boolean;
    preset?: string;
    categoriasMapa?: Record<string, string>;
}
export interface ResultadoPlanejamento {
    plano?: import('../estrutura/plano-estrutura.js').PlanoSugestaoEstrutura;
    origem: 'arquetipos' | 'estrategista' | 'nenhum';
}
//# sourceMappingURL=estrategistas.d.ts.map