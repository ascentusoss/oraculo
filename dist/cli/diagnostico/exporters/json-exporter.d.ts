import type { JsonExportOptions, Ocorrencia, RelatorioJson } from '../../../types/index.js';
export type { JsonExportOptions, RelatorioJson };
export declare function gerarRelatorioJson(dados: Partial<RelatorioJson>, options?: Partial<JsonExportOptions>): string;
export declare function validarJson(json: string): {
    valido: boolean;
    erro?: string;
};
export declare function criarMetadata(modo: RelatorioJson['metadata']['modo'], flags: string[], filtros?: RelatorioJson['metadata']['filtros']): RelatorioJson['metadata'];
export declare function criarStats(ocorrencias: Ocorrencia[]): RelatorioJson['stats'];
export declare function criarLinguagens(extensoes: Record<string, number>): RelatorioJson['linguagens'];
//# sourceMappingURL=json-exporter.d.ts.map