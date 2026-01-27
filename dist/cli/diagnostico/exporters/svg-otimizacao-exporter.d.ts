import type { FileEntryWithAst } from '../../../types/index.js';
export type SvgCandidate = {
    relPath: string;
    dir: string;
    originalBytes: number;
    optimizedBytes: number;
    savedBytes: number;
    mudancas: string[];
    temViewBox: boolean;
};
export type SvgExportResult = {
    outputPath: string;
    totalArquivos: number;
    totalEconomiaBytes: number;
};
export declare function exportarRelatorioSvgOtimizacao(params: {
    entries: FileEntryWithAst[];
    relatoriosDir: string;
    ts: string;
}): Promise<SvgExportResult>;
//# sourceMappingURL=svg-otimizacao-exporter.d.ts.map