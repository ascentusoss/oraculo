export declare const CliExportersMessages: {
    readonly poda: {
        readonly relatoriosExportados: (dir: string) => string;
        readonly falhaExportar: (erroMensagem: string) => string;
    };
    readonly guardian: {
        readonly relatoriosExportadosTitulo: "[EXPORT] [DETAIL] Relatórios Guardian exportados:";
        readonly caminhoMarkdown: (caminhoMd: string) => string;
        readonly caminhoJson: (caminhoJson: string) => string;
        readonly falhaExportar: (erroMensagem: string) => string;
    };
    readonly fixTypes: {
        readonly relatoriosExportadosTitulo: "[EXPORT] [DETAIL] Relatórios de fix-types exportados:";
        readonly caminhoMarkdown: (caminhoMd: string) => string;
        readonly caminhoJson: (caminhoJson: string) => string;
        readonly falhaExportar: (erroMensagem: string) => string;
    };
    readonly reestruturacao: {
        readonly relatoriosExportados: (modoPrefixo: string, dir: string) => string;
        readonly falhaExportar: (modoPrefixo: string, erroMensagem: string) => string;
    };
};
//# sourceMappingURL=cli-exporters-messages.d.ts.map