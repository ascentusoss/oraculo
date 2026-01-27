import type { Ocorrencia } from '../types/index.js';
import type { AsyncAnalysisOptions, AsyncAnalysisReport } from '../types/relatorios/async-analysis.js';
export declare function analisarAsyncPatterns(ocorrencias: Ocorrencia[], options?: AsyncAnalysisOptions): Promise<AsyncAnalysisReport>;
export declare function salvarRelatorioAsync(report: AsyncAnalysisReport, outputPath: string): Promise<void>;
export declare function executarAnaliseAsync(ocorrencias: Ocorrencia[], baseDir: string, options?: AsyncAnalysisOptions): Promise<void>;
//# sourceMappingURL=analise-async-patterns.d.ts.map