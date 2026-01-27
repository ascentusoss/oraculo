import type { GuardianInfo, MetadadosRelatorioEstendido, ProblemaAgrupado } from '../../../types/index.js';
export type { MetadadosRelatorioEstendido };
export declare function gerarHeaderRelatorio(metadados: MetadadosRelatorioEstendido): string[];
export declare function gerarSecaoGuardian(guardian: GuardianInfo): string[];
export declare function gerarTabelaResumoTipos(tiposCount: Record<string, number>, limite?: number): string[];
export declare function gerarTabelaOcorrencias<T extends {
    relPath?: string;
    linha?: number;
    nivel?: string;
    mensagem?: string;
}>(ocorrencias: T[]): string[];
export declare function gerarSecaoProblemasAgrupados(titulo: string, problemas: ProblemaAgrupado[], mostrarExemplos?: boolean): string[];
export declare function gerarTabelaDuasColunas(dados: Array<[string, string | number]>, cabecalhos: [string, string]): string[];
export declare function gerarSecaoEstatisticas(stats: Record<string, string | number>): string[];
export declare function gerarFooterRelatorio(timestampISO?: string): string[];
export declare function escreverRelatorioMarkdown(outputPath: string, lines: string[]): Promise<void>;
//# sourceMappingURL=relatorio-templates.d.ts.map