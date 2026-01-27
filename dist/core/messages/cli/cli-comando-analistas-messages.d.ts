export declare const CliComandoAnalistasMessages: {
    readonly fastModeTitulo: "\n?? Analistas registrados (FAST MODE):\n";
    readonly fastModeTotalZero: "\nTotal: 0";
    readonly docMdTitulo: "CABECALHOS.analistas.mdTitulo";
    readonly docGeradoEm: (iso: string) => string;
    readonly docTabelaHeader: "| Nome | Categoria | Descrição | Limites |";
    readonly docTabelaSeparador: "| ---- | --------- | --------- | ------- |";
    readonly docLinhaAnalista: (nome: string, categoria: string, descricao: string, limitesStr: string) => string;
    readonly docGerada: (destinoDoc: string) => string;
    readonly jsonExportado: (destino: string) => string;
    readonly titulo: "\n?? Analistas registrados:\n";
    readonly linhaAnalista: (nome: string, categoria: string, descricao?: string) => string;
    readonly tituloComIcone: (iconeInfo: string) => string;
    readonly total: (n: number) => string;
};
//# sourceMappingURL=cli-comando-analistas-messages.d.ts.map