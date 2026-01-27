import type { Pendencia } from '../zeladores/poda.js';
export interface PendenciaProcessavel extends Pendencia {
    diasInativo?: number;
    categoria?: string;
    prioridade?: string;
    status?: string;
    [key: string]: unknown;
}
export interface ContextoRelatorio {
    total: number;
    processados: number;
    erros: number;
    tempo?: number;
    [key: string]: unknown;
}
export declare function isPendenciaProcessavel(obj: unknown): obj is PendenciaProcessavel;
//# sourceMappingURL=processamento.d.ts.map