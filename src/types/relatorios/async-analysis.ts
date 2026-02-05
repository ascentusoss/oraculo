// SPDX-License-Identifier: MIT
/**
 * @fileoverview Tipos para análise de padrões async/await
 *
 * Define estruturas para análise pós-diagnóstico de promises não tratadas,
 * agrupamento por criticidade e geração de relatórios de ação.
 */

/**
 * Nível de criticidade de uma promise não tratada
 */
export type AsyncCriticidade = 'critico' | 'alto' | 'medio' | 'baixo';

/**
 * Informações sobre promises não tratadas em um arquivo
 */
export interface AsyncIssuesArquivo {
  /** Ocorrências individuais detectadas */
  ocorrencias: Array<{
    linha?: number;
    mensagem: string;
    nivel: 'erro' | 'aviso' | 'info';
  }>;
  /** Nível de severidade mais alto encontrado */
  nivel: 'erro' | 'aviso' | 'info';
  /** Total de promises não tratadas (incluindo agregadas) */
  total: number;
  /** Criticidade calculada baseada em contexto */
  criticidade?: AsyncCriticidade;
}

/**
 * Categoria de código para agrupamento
 */
export type AsyncCategoria =
  | 'cli'
  | 'analistas'
  | 'core'
  | 'guardian'
  | 'auto'
  | 'outros';

/**
 * Estatísticas de uma categoria
 */
export interface AsyncCategoriaStats {
  /** Total de arquivos com issues */
  totalArquivos: number;
  /** Total de promises não tratadas */
  totalPromises: number;
}

/**
 * Arquivo ranqueado por criticidade
 */
export interface AsyncArquivoRanqueado {
  /** Caminho relativo do arquivo */
  arquivo: string;
  /** Total de promises não tratadas */
  total: number;
  /** Nível de severidade */
  nivel: 'erro' | 'aviso' | 'info';
  /** Criticidade calculada */
  criticidade?: AsyncCriticidade;
}

/**
 * Relatório completo de análise async
 */
export interface AsyncAnalysisReport {
  /** Timestamp da análise */
  timestamp: string;
  /** Total de issues encontradas */
  totalIssues: number;
  /** Total de arquivos afetados */
  totalFiles: number;
  /** Top arquivos mais problemáticos */
  topFiles: AsyncArquivoRanqueado[];
  /** Estatísticas por categoria */
  categorias: Record<AsyncCategoria, AsyncCategoriaStats>;
  /** Recomendações priorizadas */
  recomendacoes?: {
    criticos: string[];
    altos: string[];
    proximosPassos: string[];
  };
}

/**
 * Opções para análise async
 */
export interface AsyncAnalysisOptions {
  /** Número máximo de arquivos no top */
  topN?: number;
  /** Incluir recomendações detalhadas */
  includeRecomendacoes?: boolean;
  /** Filtrar por criticidade mínima */
  minCriticidade?: AsyncCriticidade;
}
