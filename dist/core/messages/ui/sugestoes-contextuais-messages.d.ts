export declare const SugestoesContextuaisMessages: {
    readonly arquetipoNaoIdentificado: "Não foi possível identificar um arquétipo específico. Considere adicionar mais estrutura ao projeto.";
    readonly projetoIdentificado: (tecnologia: string | undefined, confiancaPercent: number) => string;
    readonly evidenciaDependencia: (dependencia: string, tecnologia: string | undefined) => string;
    readonly evidenciaImport: (valor: string, localizacao: string | undefined) => string;
    readonly evidenciaCodigo: (localizacao: string | undefined) => string;
    readonly evidenciaEstrutura: (valor: string, tecnologia: string | undefined) => string;
    readonly tecnologiasAlternativas: (alternativas: string) => string;
    readonly erroAnaliseContextual: (erro: string) => string;
    readonly erroDuranteAnalise: "Erro durante análise contextual inteligente";
};
//# sourceMappingURL=sugestoes-contextuais-messages.d.ts.map