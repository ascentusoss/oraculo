import type { ArquetipoDrift, ArquetipoPersonalizado, ContextoExecucao, ResultadoDeteccaoArquetipo, SnapshotEstruturaBaseline } from '../../types/index.js';
export declare function detectarArquetipos(contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>, baseDir: string, options?: {
    quiet?: boolean;
}): Promise<{
    candidatos: ResultadoDeteccaoArquetipo[];
    baseline?: SnapshotEstruturaBaseline;
    drift?: ArquetipoDrift;
    arquetipoPersonalizado?: ArquetipoPersonalizado | null;
}>;
//# sourceMappingURL=detector-arquetipos.d.ts.map