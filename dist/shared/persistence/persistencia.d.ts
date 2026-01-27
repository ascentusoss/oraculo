import type { SalvarBinarioFn, SalvarEstadoFn } from '../../types/index.js';
export declare function lerEstado<T = unknown>(caminho: string, padrao?: T): Promise<T>;
export declare let salvarEstado: SalvarEstadoFn;
export declare function lerArquivoTexto(caminho: string): Promise<string>;
export declare function salvarEstadoAtomico<T = unknown>(caminho: string, dados: T): Promise<void>;
export declare function salvarBinarioAtomico(caminho: string, dados: Buffer): Promise<void>;
export declare let salvarBinario: SalvarBinarioFn;
//# sourceMappingURL=persistencia.d.ts.map