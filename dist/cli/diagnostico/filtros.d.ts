import type { FiltrosProcessados, OpcoesProcessamentoFiltros, TipoLinguagemProjeto } from '../../types/index.js';
export declare function processPatternListAchatado(raw: string[] | undefined): string[];
export declare function processPatternGroups(raw: string[] | undefined): string[][];
export declare function expandIncludes(list: string[]): string[];
export declare function detectarTipoProjeto(baseDir?: string): TipoLinguagemProjeto;
export declare function getDefaultExcludes(tipoProjeto?: TipoLinguagemProjeto): string[];
export declare function processarFiltros(opcoes: OpcoesProcessamentoFiltros): FiltrosProcessados;
export declare function aplicarFiltrosAoConfig(filtros: FiltrosProcessados): void;
export declare function configurarFiltros(opcoes: OpcoesProcessamentoFiltros): FiltrosProcessados;
//# sourceMappingURL=filtros.d.ts.map