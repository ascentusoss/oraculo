export interface HandlerInfo {
    nome?: string;
    tipo?: 'comando' | 'evento' | 'query';
    parametros?: string[];
    descricao?: string;
    middleware?: boolean;
    path?: string;
    func?: unknown;
    bodyBlock?: {
        start?: number | null;
        end?: number | null;
        body?: unknown;
    };
    isAnonymous?: boolean;
    params?: unknown[];
    totalParams?: number;
    node?: unknown;
}
export interface ComandoRegistro {
    id?: string;
    timestamp: string;
    handler?: HandlerInfo | undefined;
    payload?: unknown;
    comandoNome?: string;
    node?: unknown;
    origemFramework?: string;
}
//# sourceMappingURL=handlers.d.ts.map