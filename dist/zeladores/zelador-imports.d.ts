import type { ImportCorrecaoArquivo, ImportCorrecaoOptions } from '../types/index.js';
export declare function executarZeladorImports(targetDirs: string[], options?: Partial<ImportCorrecaoOptions>): Promise<ImportCorrecaoArquivo[]>;
export declare function gerarRelatorioCorrecoes(resultados: ImportCorrecaoArquivo[]): string;
export declare function corrigirImports(dirs?: string[], options?: Partial<ImportCorrecaoOptions>): Promise<void>;
//# sourceMappingURL=zelador-imports.d.ts.map