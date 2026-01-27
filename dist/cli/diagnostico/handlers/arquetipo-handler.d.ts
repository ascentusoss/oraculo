import type { ArquetipoOptions, ArquetipoResult, FileEntryWithAst } from '../../../types/index.js';
export type { ArquetipoOptions, ArquetipoResult };
export declare function executarDeteccaoArquetipos(entries: FileEntryWithAst[], baseDir: string, options: ArquetipoOptions): Promise<ArquetipoResult>;
export declare function formatarArquetiposParaJson(result: ArquetipoResult): Record<string, unknown>;
export declare function gerarSugestoesArquetipo(result: ArquetipoResult): string[];
//# sourceMappingURL=arquetipo-handler.d.ts.map