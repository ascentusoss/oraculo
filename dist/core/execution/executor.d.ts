import type { FileEntryWithAst, GuardianResult, MetricaExecucao, ResultadoInquisicao, Tecnica } from '../../types/index.js';
export declare function executarInquisicao(fileEntriesComAst: FileEntryWithAst[], tecnicas: Tecnica[], baseDir: string, guardianResultado: GuardianResult, opts?: {
    verbose?: boolean;
    compact?: boolean;
    fast?: boolean;
}): Promise<ResultadoInquisicao>;
export declare function registrarUltimasMetricas(metricas: MetricaExecucao | undefined): void;
//# sourceMappingURL=executor.d.ts.map