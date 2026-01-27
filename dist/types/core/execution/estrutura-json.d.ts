import type { ArquetipoDrift, ResultadoDeteccaoArquetipo, SnapshotEstruturaBaseline } from '../../index.js';
export interface EstruturaIdentificadaJson {
    melhores: ResultadoDeteccaoArquetipo[];
    baseline: SnapshotEstruturaBaseline | null;
    drift: ArquetipoDrift;
}
//# sourceMappingURL=estrutura-json.d.ts.map