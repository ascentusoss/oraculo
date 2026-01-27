export type PrioridadeNivel = 'critica' | 'alta' | 'media' | 'baixa';
export interface ConfigPrioridade {
    prioridade: PrioridadeNivel;
    icone: string;
    descricao?: string;
}
export interface AgrupamentoConfig {
    padrao: RegExp;
    categoria: string;
    titulo: string;
    prioridade?: PrioridadeNivel;
    icone?: string;
    acaoSugerida?: string;
}
export interface MetadadosRelatorioEstendido {
    dataISO: string;
    duracao: number;
    totalArquivos: number;
    totalOcorrencias: number;
    manifestFile?: string;
    relatoriosDir?: string;
}
export interface FiltrosConfig {
    suppressRules?: string[];
    suppressByQuickFixId?: string[];
    suppressBySeverity?: Record<string, boolean>;
    suppressByPath?: string[];
    suppressByFilePattern?: string[];
}
//# sourceMappingURL=messages.d.ts.map