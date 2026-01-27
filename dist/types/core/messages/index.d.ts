export interface CampoMensagem {
    label: string;
    descricao: string;
}
export interface SecaoMensagemComCampos {
    label: string;
    descricao: string;
    campos: Record<string, string>;
}
export interface JsonComMetadados<T> {
    _metadata: {
        schema: string;
        versao: string;
        geradoEm: string;
        descricao?: string;
    };
    dados: T;
}
export type ValorMensagem = string | CampoMensagem | SecaoMensagemComCampos;
//# sourceMappingURL=index.d.ts.map