export interface ResultadoGuardian {
    status: IntegridadeStatus;
    detalhes?: string[];
    baselineModificado?: boolean;
}
export declare enum IntegridadeStatus {
    Criado = "baseline-criado",
    Aceito = "baseline-aceito",
    Ok = "ok",
    AlteracoesDetectadas = "alteracoes-detectadas"
}
export interface GuardianErrorDetails {
    tipo: string;
    mensagem: string;
    arquivos?: string[];
    hash?: string;
    esperado?: string;
    encontrado?: string;
}
export declare class GuardianError extends Error {
    detalhes: GuardianErrorDetails | GuardianErrorDetails[];
    constructor(erros: GuardianErrorDetails | GuardianErrorDetails[]);
}
export interface SnapshotArquivo {
    hash: string;
    linhas: number;
    amostra: string;
}
export interface ComparacaoSnapshot {
    removidos: string[];
    adicionados: string[];
    alterados: string[];
}
export interface ResultadoVerificacao {
    corrompidos: string[];
    verificados: number;
}
//# sourceMappingURL=integridade.d.ts.map