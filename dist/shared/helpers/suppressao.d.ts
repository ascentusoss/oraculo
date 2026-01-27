import type { RegrasSuprimidas, SupressaoInfo } from '../../types/index.js';
export type { RegrasSuprimidas, SupressaoInfo };
export declare function extrairSupressoes(src: string): RegrasSuprimidas;
export declare function isRegraSuprimida(regra: string, linha: number, supressoes: RegrasSuprimidas): boolean;
export declare function filtrarOcorrenciasSuprimidas<T extends {
    linha?: number;
    tipo?: string;
}>(ocorrencias: T[], nomeAnalista: string, src: string): T[];
//# sourceMappingURL=suppressao.d.ts.map