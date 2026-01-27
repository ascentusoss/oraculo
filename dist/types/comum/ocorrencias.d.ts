export type OcorrenciaNivel = 'erro' | 'aviso' | 'info' | 'sucesso';
export interface OcorrenciaBase {
    mensagem: string;
    relPath: string;
    tipo?: string;
    nivel?: string | OcorrenciaNivel;
    linha?: number;
    coluna?: number;
    origem?: string;
    arquivo?: string;
}
export interface OcorrenciaAnalista extends OcorrenciaBase {
    tipo: string;
    nivel?: OcorrenciaNivel;
}
export interface OcorrenciaErroAnalista extends OcorrenciaAnalista {
    tipo: 'ERRO_ANALISTA';
    stack?: string;
}
export interface OcorrenciaComplexidadeFuncao extends OcorrenciaAnalista {
    tipo: 'FUNCAO_COMPLEXA';
    linhas?: number;
    parametros?: number;
    aninhamento?: number;
    limites?: {
        maxLinhas?: number;
        maxParametros?: number;
        maxAninhamento?: number;
    };
}
export interface OcorrenciaParseErro extends OcorrenciaAnalista {
    tipo: 'PARSE_ERRO';
    detalhe?: string;
    trecho?: string;
}
export interface OcorrenciaGenerica extends OcorrenciaAnalista {
    [k: string]: unknown;
}
export type Ocorrencia = OcorrenciaBase | OcorrenciaAnalista | OcorrenciaErroAnalista | OcorrenciaComplexidadeFuncao | OcorrenciaParseErro | OcorrenciaGenerica;
export type SeveridadeTexto = 'info' | 'aviso' | 'risco' | 'critico';
export declare function criarOcorrencia(base: Pick<OcorrenciaBase, 'mensagem' | 'relPath'> & Partial<OcorrenciaBase>): OcorrenciaBase;
export declare function ocorrenciaErroAnalista(data: {
    mensagem: string;
    relPath: string;
    stack?: string;
    origem?: string;
}): OcorrenciaErroAnalista;
export declare function ocorrenciaFuncaoComplexa(data: {
    mensagem: string;
    relPath: string;
    linhas?: number;
    parametros?: number;
    aninhamento?: number;
    limites?: {
        maxLinhas?: number;
        maxParametros?: number;
        maxAninhamento?: number;
    };
    origem?: string;
}): OcorrenciaComplexidadeFuncao;
export declare function ocorrenciaParseErro(data: {
    mensagem: string;
    relPath: string;
    detalhe?: string;
    trecho?: string;
    origem?: string;
    linha?: number;
    coluna?: number;
}): OcorrenciaParseErro;
//# sourceMappingURL=ocorrencias.d.ts.map