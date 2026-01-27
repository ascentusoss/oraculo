export type SalvarEstadoFn = <T = unknown>(caminho: string, dados: T) => Promise<void>;
export type SalvarBinarioFn = (caminho: string, dados: Buffer) => Promise<void>;
export type VitestSpyWrapper<T extends (...args: any[]) => any> = (fn: T) => unknown;
//# sourceMappingURL=persistencia.d.ts.map