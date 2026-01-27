import type { Ocorrencia, ProblemaAgrupado, RelatorioResumo } from '../types/index.js';
export declare function processarRelatorioResumo(ocorrencias: Ocorrencia[], limitePrioridade?: number): RelatorioResumo;
export declare function gerarRelatorioMarkdownResumo(relatorioResumo: RelatorioResumo, outputPath: string): Promise<void>;
export declare function gerarResumoExecutivo(ocorrencias: Ocorrencia[]): {
    problemasCriticos: number;
    problemasAltos: number;
    vulnerabilidades: number;
    quickFixes: number;
    recomendacao: 'verde' | 'amarelo' | 'vermelho';
    mensagem: string;
    detalhes: ProblemaAgrupado[];
};
//# sourceMappingURL=filtro-inteligente.d.ts.map