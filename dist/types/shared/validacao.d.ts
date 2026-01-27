export type ErrorLike = Error | ErroComMensagem | {
    message: string;
};
export declare function extrairMensagemErro(error: unknown): string;
export interface ErroComMensagem {
    message: string | Error;
    name?: string;
    stack?: string;
    code?: string | number;
    cause?: Error;
}
export interface DisplayNamesAPI {
    of: (input: string) => string | undefined;
}
export interface DisplayNamesConstructor {
    new (locales: string[], options: {
        type: string;
    }): DisplayNamesAPI;
}
export interface IntlComDisplayNames {
    DisplayNames?: DisplayNamesConstructor;
    DateTimeFormat?: typeof Intl.DateTimeFormat;
    NumberFormat?: typeof Intl.NumberFormat;
    Collator?: typeof Intl.Collator;
}
export type ImportDinamico = (path: string) => Promise<unknown>;
export interface GlobalComImport {
    import?: ImportDinamico;
    require?: NodeRequire;
    process?: NodeJS.Process;
}
export type VitestMockFn<T = unknown> = {
    (...args: unknown[]): T;
    mockReturnValue: (value: T) => VitestMockFn<T>;
    mockResolvedValue: (value: T) => VitestMockFn<T>;
    mockImplementation: (fn: (...args: unknown[]) => T) => VitestMockFn<T>;
};
export interface GlobalComVitest {
    vi?: {
        fn?: <T = unknown>(implementation?: (...args: unknown[]) => T) => VitestMockFn<T>;
        mock?: (path: string, factory?: () => unknown) => void;
        spyOn?: <T extends object, K extends keyof T>(object: T, method: K) => VitestMockFn<T[K]>;
        clearAllMocks?: () => void;
        resetAllMocks?: () => void;
        restoreAllMocks?: () => void;
    };
    describe?: (name: string, fn: () => void) => void;
    it?: (name: string, fn: () => void | Promise<void>) => void;
    test?: (name: string, fn: () => void | Promise<void>) => void;
    expect?: unknown;
}
export interface PendenciaProcessavel {
    arquivo: string;
    motivo: string;
    detectedAt: number;
    scheduleAt: number;
    diasInativo?: number;
    categoria?: 'critico' | 'importante' | 'baixa-prioridade' | 'informativo';
    prioridade?: 'alta' | 'media' | 'baixa';
    status?: 'pendente' | 'processando' | 'concluido' | 'erro' | 'cancelado';
    tentativas?: number;
    ultimoErro?: string;
}
export interface ConfigPlugin {
    STRUCTURE_PLUGINS?: Array<{
        nome: string;
        habilitado?: boolean;
        config?: Record<string, unknown>;
    }>;
    pluginsPaths?: string[];
    autoload?: boolean;
}
export interface PlanoMoverItem {
    de: string;
    para: string;
    motivo?: string;
}
export interface PlanoSugestaoEstrutura {
    mover: PlanoMoverItem[];
    conflitos?: Array<{
        alvo: string;
        motivo: string;
    }>;
    resumo?: {
        total: number;
        zonaVerde: number;
        bloqueados: number;
    };
}
export interface SnapshotAnalise {
    timestamp: string;
    arquivos: string[];
    metricas: {
        totalArquivos?: number;
        totalLinhas?: number;
        complexidade?: number;
        [key: string]: unknown;
    };
    configuracao: {
        versao?: string;
        ambiente?: string;
        [key: string]: unknown;
    };
}
export interface EntradaMapaReversao {
    arquivo: string;
    operacao: 'adicionar' | 'remover' | 'modificar';
    timestamp: string;
    snapshot?: SnapshotAnalise;
    conteudoAnterior?: string;
    conteudoPosterior?: string;
    hash?: string;
}
export interface ContextoRelatorio {
    total: number;
    processados: number;
    erros: number;
    tempo?: number;
    avisos?: number;
    sucessos?: number;
    fase?: string;
    detalhes?: string;
}
export interface ErroValidacaoCombinacao {
    codigo: string;
    mensagem: string;
}
export declare function validarSeguro<T>(validador: (dados: unknown) => dados is T, dados: unknown, fallback: T, contexto?: string): T;
export declare function isErroComMensagem(obj: unknown): obj is ErroComMensagem;
export declare function isGlobalComVitest(obj: unknown): obj is GlobalComVitest;
export declare function isPendenciaProcessavel(obj: unknown): obj is PendenciaProcessavel;
export declare function isIntlComDisplayNames(obj: unknown): obj is IntlComDisplayNames;
export declare function isGlobalComImport(obj: unknown): obj is GlobalComImport;
export declare function isConfigPlugin(obj: unknown): obj is ConfigPlugin;
export declare function isPlanoSugestaoEstrutura(obj: unknown): obj is PlanoSugestaoEstrutura;
export declare function isSnapshotAnalise(obj: unknown): obj is SnapshotAnalise;
export declare function isEntradaMapaReversao(obj: unknown): obj is EntradaMapaReversao;
export declare function converterSeguro<T>(obj: unknown, validador: (dados: unknown) => dados is T, fallback: T): T;
export declare function isStringNaoVazia(valor: unknown): valor is string;
export declare function isNumeroValido(valor: unknown): valor is number;
export declare function isArrayNaoVazio<T>(valor: unknown): valor is T[];
//# sourceMappingURL=validacao.d.ts.map