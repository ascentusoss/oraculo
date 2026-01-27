import type { Ocorrencia } from '../index.js';
export type PrioridadeNivel = 'critica' | 'alta' | 'media' | 'baixa';
export type { AsyncAnalysisOptions, AsyncAnalysisReport, AsyncArquivoRanqueado, AsyncCategoria, AsyncCategoriaStats, AsyncCriticidade, AsyncIssuesArquivo, } from './async-analysis.js';
export type { ConselhoContextoOracular } from './conselheiro.js';
export type { AlinhamentoItemDiagnostico } from './estrutura.js';
export type { FileEntryFragmentacao, FragmentOptions, Manifest, ManifestPart as ManifestPartFragmentacao, RelatorioCompleto as RelatorioCompletoFragmentacao, } from './fragmentacao.js';
export type { LeitorRelatorioOptions } from './leitor.js';
export * from './processamento.js';
export interface ProblemaAgrupado {
    categoria: string;
    prioridade: PrioridadeNivel;
    icone: string;
    titulo: string;
    quantidade: number;
    ocorrencias: Ocorrencia[];
    resumo: string;
    acaoSugerida?: string;
}
export interface EstatisticasResumo {
    totalOcorrencias: number;
    arquivosAfetados: number;
    problemasPrioritarios: number;
    problemasAgrupados: number;
}
export interface RelatorioResumo {
    problemasCriticos: ProblemaAgrupado[];
    problemasAltos: ProblemaAgrupado[];
    problemasOutros: ProblemaAgrupado[];
    estatisticas: EstatisticasResumo;
}
export interface ResumoExecutivo {
    problemasCriticos: number;
    problemasAltos: number;
    vulnerabilidades: number;
    quickFixes: number;
    recomendacao: 'verde' | 'amarelo' | 'vermelho';
    mensagem: string;
    detalhes: ProblemaAgrupado[];
}
export interface GeradorMarkdownOptions {
    manifestFile?: string;
    relatoriosDir?: string;
    ts?: string;
    hadFull?: boolean;
}
export interface MetadadosRelatorio {
    dataISO: string;
    duracao: number;
    totalArquivos: number;
    totalOcorrencias: number;
}
export interface GuardianInfo {
    status: string;
    timestamp: string;
    totalArquivos: string;
}
export interface MovimentoEstrutural {
    de: string;
    para: string;
}
export interface OpcoesRelatorioReestruturar {
    simulado?: boolean;
    origem?: string;
    preset?: string;
    conflitos?: number;
}
export interface OpcoesRelatorioPoda {
    simulado?: boolean;
}
export interface AlinhamentoItem {
    tipo: 'pasta' | 'arquivo';
    origem: string;
    destino: string;
    status: 'sugerido' | 'aplicado' | 'ignorado';
    razao?: string;
}
export interface ConselhoContexto {
    totalArquivos: number;
    totalOcorrencias: number;
    problemasCriticos: number;
    arquetipo?: string;
    linguagensPrincipais: string[];
}
export interface Conselho {
    categoria: 'seguranca' | 'qualidade' | 'performance' | 'manutencao' | 'arquitetura';
    prioridade: PrioridadeNivel;
    titulo: string;
    descricao: string;
    acoes: string[];
    recursos?: string[];
}
export interface RelatorioCompleto {
    resultado?: {
        ocorrencias?: Ocorrencia[];
        fileEntries?: Array<{
            relPath?: string;
            fullPath?: string;
            path?: string;
            content?: string;
            [k: string]: unknown;
        }>;
        [k: string]: unknown;
    };
    ocorrencias?: Ocorrencia[];
    fileEntries?: Array<{
        relPath?: string;
        fullPath?: string;
        path?: string;
        content?: string;
        [k: string]: unknown;
    }>;
    [k: string]: unknown;
}
export interface ManifestPart {
    file: string;
    items: number;
    sizeBytes: number;
    compressed?: boolean;
    [k: string]: unknown;
}
//# sourceMappingURL=index.d.ts.map