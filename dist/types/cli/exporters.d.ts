import type { Ocorrencia } from '../index.js';
import type { ArquetipoResult } from '../../cli/diagnostico/handlers/arquetipo-handler.js';
import type { AutoFixResult } from '../../cli/diagnostico/handlers/auto-fix-handler.js';
import type { GuardianResult } from '../../cli/diagnostico/handlers/guardian-handler.js';
export interface RelatorioJson {
    metadata: {
        timestamp: string;
        schemaVersion: string;
        modo: 'compact' | 'full' | 'executive' | 'quick';
        flags: string[];
        filtros?: {
            include?: string[];
            exclude?: string[];
            globalExclude?: string[];
        };
        oraculoVersion?: string;
        projectName?: string;
    };
    stats: {
        arquivosAnalisados: number;
        arquivosComProblemas: number;
        totalOcorrencias: number;
        porNivel: {
            erro: number;
            aviso: number;
            info: number;
        };
        porCategoria: Record<string, number>;
        tempoExecucao?: number;
        byRule?: Record<string, number>;
    };
    guardian?: GuardianResult;
    arquetipos?: ArquetipoResult;
    autoFix?: AutoFixResult;
    ocorrencias: Array<{
        arquivo: string;
        linha?: number;
        coluna?: number;
        nivel: 'erro' | 'aviso' | 'info';
        tipo: string;
        mensagem: string;
        contexto?: string;
    }>;
    linguagens?: {
        total: number;
        extensoes: Record<string, number>;
    };
    sugestoes?: string[];
}
export interface JsonExportOptions {
    escapeAscii: boolean;
    includeDetails: boolean;
    includeContext: boolean;
    compact: boolean;
    maxOcorrencias?: number;
}
export interface MarkdownExportOptions {
    includeToc: boolean;
    includeStats: boolean;
    includeGuardian: boolean;
    includeArquetipos: boolean;
    includeAutoFix: boolean;
    includeOcorrencias: boolean;
    agruparPorArquivo: boolean;
    maxOcorrencias?: number;
    titulo?: string;
    subtitulo?: string;
}
export interface DadosRelatorioMarkdown {
    metadata?: {
        timestamp: string;
        modo: string;
        flags: string[];
    };
    stats?: {
        arquivosAnalisados: number;
        arquivosComProblemas: number;
        totalOcorrencias: number;
        porNivel: {
            erro: number;
            aviso: number;
            info: number;
        };
        porCategoria: Record<string, number>;
        tempoExecucao?: number;
    };
    guardian?: GuardianResult;
    arquetipos?: ArquetipoResult;
    autoFix?: AutoFixResult;
    ocorrencias?: Ocorrencia[];
    linguagens?: {
        total: number;
        extensoes: Record<string, number>;
    };
    sugestoes?: string[];
}
export interface ShardingOptions {
    formato: 'json' | 'markdown';
    ocorrenciasPorShard: number;
    outputDir: string;
    prefixo: string;
    incluirIndice: boolean;
    incluirMetadataEmShards: boolean;
}
export interface ShardInfo {
    arquivo: string;
    caminho: string;
    indice: number;
    ocorrencias: number;
    range?: {
        inicio: number;
        fim: number;
    };
}
export interface ResultadoSharding {
    sucesso: boolean;
    shards: ShardInfo[];
    indice?: string;
    totalOcorrencias: number;
    stats: {
        shardsGerados: number;
        tamanhoMedio: number;
        tamanhoTotal: number;
    };
}
//# sourceMappingURL=exporters.d.ts.map