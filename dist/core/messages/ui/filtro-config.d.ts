import type { AgrupamentoConfig, ConfigPrioridade, PrioridadeNivel } from '../../../types/index.js';
export type { AgrupamentoConfig, ConfigPrioridade, PrioridadeNivel };
export declare const PRIORIDADES: Record<string, ConfigPrioridade>;
export declare const AGRUPAMENTOS_MENSAGEM: AgrupamentoConfig[];
export declare function getPrioridade(tipo: string): ConfigPrioridade;
export declare function findAgrupamento(mensagem: string): AgrupamentoConfig | null;
export declare function ordenarPorPrioridade<T extends {
    prioridade?: PrioridadeNivel;
}>(problemas: T[]): T[];
export declare function contarPorPrioridade<T extends {
    prioridade?: PrioridadeNivel;
}>(problemas: T[]): Record<PrioridadeNivel, number>;
//# sourceMappingURL=filtro-config.d.ts.map