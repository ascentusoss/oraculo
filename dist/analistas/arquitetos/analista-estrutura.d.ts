import type { FileEntryWithAst, ResultadoEstrutural } from '../../types/index.js';
export declare const CONCORRENCIA: number;
export declare const CAMADAS: Record<string, string>;
export declare function analisarEstrutura(fileEntries: FileEntryWithAst[], _baseDir?: string): Promise<ResultadoEstrutural[]>;
export { analisarEstrutura as alinhamentoEstrutural };
//# sourceMappingURL=analista-estrutura.d.ts.map