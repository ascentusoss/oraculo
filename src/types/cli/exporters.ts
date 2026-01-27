// SPDX-License-Identifier: MIT
/**
 * Tipos para exportadores de relatórios (JSON, Markdown, Sharded)
 */

import type { Ocorrencia } from '@';

import type { ArquetipoResult } from '../../cli/diagnostico/handlers/arquetipo-handler.js';
import type { AutoFixResult } from '../../cli/diagnostico/handlers/auto-fix-handler.js';
import type { GuardianResult } from '../../cli/diagnostico/handlers/guardian-handler.js';

/* ================================
   JSON EXPORTER TYPES
   ================================ */

/**
 * Estrutura completa do relatório JSON
 */
export interface RelatorioJson {
  /** Metadata do relatório */
  metadata: {
    /** Timestamp ISO 8601 */
    timestamp: string;
    /** Versão do schema */
    schemaVersion: string;
    /** Modo de execução */
    modo: 'compact' | 'full' | 'executive' | 'quick';
    /** Flags ativas */
    flags: string[];
    /** Configuração de filtros */
    filtros?: {
      include?: string[];
      exclude?: string[];
      globalExclude?: string[];
    };
    /** Versão do Oráculo */
    oraculoVersion?: string;
    /** Nome do projeto */
    projectName?: string;
  };

  /** Estatísticas gerais */
  stats: {
    /** Total de arquivos analisados */
    arquivosAnalisados: number;
    /** Arquivos com problemas */
    arquivosComProblemas: number;
    /** Total de ocorrências */
    totalOcorrencias: number;
    /** Breakdown por nível */
    porNivel: {
      erro: number;
      aviso: number;
      info: number;
    };
    /** Breakdown por categoria */
    porCategoria: Record<string, number>;
    /** Tempo de execução em ms */
    tempoExecucao?: number;
    /** Breakdown por regra (tipo) */
    byRule?: Record<string, number>;
  };

  /** Resultado do Guardian (se executado) */
  guardian?: GuardianResult;

  /** Resultado da detecção de arquetipos (se executado) */
  arquetipos?: ArquetipoResult;

  /** Resultado do auto-fix (se executado) */
  autoFix?: AutoFixResult;

  /** Lista de ocorrências */
  ocorrencias: Array<{
    arquivo: string;
    linha?: number;
    coluna?: number;
    nivel: 'erro' | 'aviso' | 'info';
    tipo: string;
    mensagem: string;
    contexto?: string;
  }>;

  /** Linguagens detectadas */
  linguagens?: {
    total: number;
    extensoes: Record<string, number>;
  };

  /** Sugestões contextuais */
  sugestoes?: string[];
}

/**
 * Options para exportação JSON
 */
export interface JsonExportOptions {
  /** Escapar caracteres não-ASCII como \uXXXX */
  escapeAscii: boolean;

  /** Incluir detalhes completos das ocorrências */
  includeDetails: boolean;

  /** Incluir contexto de código nas ocorrências */
  includeContext: boolean;

  /** Compactar JSON (sem indentação) */
  compact: boolean;

  /** Limitar número de ocorrências */
  maxOcorrencias?: number;
}

/* ================================
   MARKDOWN EXPORTER TYPES
   ================================ */

/**
 * Options para exportação Markdown
 */
export interface MarkdownExportOptions {
  /** Incluir índice (table of contents) */
  includeToc: boolean;

  /** Incluir seção de estatísticas */
  includeStats: boolean;

  /** Incluir seção do Guardian */
  includeGuardian: boolean;

  /** Incluir seção de arquetipos */
  includeArquetipos: boolean;

  /** Incluir seção de auto-fix */
  includeAutoFix: boolean;

  /** Incluir tabela de ocorrências */
  includeOcorrencias: boolean;

  /** Agrupar ocorrências por arquivo */
  agruparPorArquivo: boolean;

  /** Limitar número de ocorrências */
  maxOcorrencias?: number;

  /** Título do relatório */
  titulo?: string;

  /** Subtítulo/descrição */
  subtitulo?: string;
}

/**
 * Dados para geração do relatório Markdown
 */
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
    porNivel: { erro: number; aviso: number; info: number };
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

/* ================================
   SHARDED EXPORTER TYPES
   ================================ */

/**
 * Options para fragmentação
 */
export interface ShardingOptions {
  /** Formato dos shards: 'json' | 'markdown' */
  formato: 'json' | 'markdown';

  /** Número máximo de ocorrências por shard */
  ocorrenciasPorShard: number;

  /** Diretório de saída */
  outputDir: string;

  /** Prefixo dos arquivos */
  prefixo: string;

  /** Incluir índice consolidado */
  incluirIndice: boolean;

  /** Incluir metadados em cada shard */
  incluirMetadataEmShards: boolean;
}

/**
 * Informações sobre um shard gerado
 */
export interface ShardInfo {
  /** Nome do arquivo */
  arquivo: string;

  /** Caminho completo */
  caminho: string;

  /** Índice do shard (0-based) */
  indice: number;

  /** Número de ocorrências neste shard */
  ocorrencias: number;

  /** Range de linhas (se aplicável) */
  range?: {
    inicio: number;
    fim: number;
  };
}

/**
 * Resultado da fragmentação
 */
export interface ResultadoSharding {
  /** Sucesso da operação */
  sucesso: boolean;

  /** Informações sobre os shards gerados */
  shards: ShardInfo[];

  /** Arquivo de índice (se gerado) */
  indice?: string;

  /** Total de ocorrências fragmentadas */
  totalOcorrencias: number;

  /** Estatísticas */
  stats: {
    shardsGerados: number;
    tamanhoMedio: number;
    tamanhoTotal: number;
  };
}
