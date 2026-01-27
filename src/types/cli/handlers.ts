// SPDX-License-Identifier: MIT
/**
 * Tipos para handlers de exportação da CLI
 */

import type { Pendencia } from '@';

/* ================================
   FIX-TYPES HANDLER TYPES
   ================================ */

/**
 * Categorização de um caso de tipo inseguro
 */
export interface CasoTipoInseguro {
  arquivo: string;
  linha?: number;
  tipo: 'tipo-inseguro-any' | 'tipo-inseguro-unknown';
  categoria: 'legitimo' | 'melhoravel' | 'corrigir';
  confianca: number;
  motivo: string;
  sugestao?: string;
  variantes?: string[];
  contexto?: string;
}

/**
 * Opções para exportação de relatórios de fix-types
 */
export interface FixTypesExportOptions {
  /** Diretório base do projeto */
  baseDir: string;
  /** Casos categorizados */
  casos: CasoTipoInseguro[];
  /** Estatísticas gerais */
  stats: {
    legitimo: number;
    melhoravel: number;
    corrigir: number;
    totalConfianca: number;
  };
  /** Confiança mínima configurada */
  minConfidence: number;
  /** Modo verbose ativo */
  verbose: boolean;
}

/**
 * Resultado da exportação de fix-types
 */
export interface FixTypesExportResult {
  /** Caminho do relatório Markdown gerado */
  markdown: string;
  /** Caminho do relatório JSON gerado */
  json: string;
  /** Diretório onde foram salvos */
  dir: string;
}

/* ================================
   GUARDIAN HANDLER TYPES
   ================================ */

/**
 * Estrutura de Baseline do Guardian para processamento CLI
 */
export interface GuardianBaselineCli {
  timestamp?: string;
  arquetipo?: string;
  confianca?: number;
  arquivos?: string[];
  [key: string]: unknown;
}

/**
 * Opções para exportação de relatórios do Guardian
 */
export interface GuardianExportOptions {
  /** Diretório base do projeto */
  baseDir: string;
  /** Status do Guardian */
  status: string;
  /** Baseline (se disponível) */
  baseline?: GuardianBaselineCli;
  /** Drift detectado (se houver) */
  drift?: {
    alterouArquetipo: boolean;
    deltaConfidence?: number;
    arquivosNovos?: string[];
    arquivosRemovidos?: string[];
  };
  /** Erros encontrados */
  erros?: Array<{ arquivo: string; mensagem: string }>;
  /** Warnings encontrados */
  warnings?: Array<{ arquivo: string; mensagem: string }>;
}

/**
 * Resultado da exportação do Guardian
 */
export interface GuardianExportResult {
  /** Caminho do relatório Markdown gerado */
  markdown: string;
  /** Caminho do relatório JSON gerado */
  json: string;
  /** Diretório onde foram salvos */
  dir: string;
}

/* ================================
   REESTRUTURAÇÃO HANDLER TYPES
   ================================ */

/**
 * Opções para exportação de relatórios de reestruturação
 */
export interface ReestruturacaoExportOptions {
  /** Diretório base do projeto */
  baseDir: string;
  /** Movimentos a serem reportados (PlanoMoverItem[] ou MapaMoveItem[]) */
  movimentos: Array<
    { de: string; para: string } | { atual: string; ideal: string | null }
  >;
  /** Se é uma simulação (dry-run) ou aplicação real */
  simulado: boolean;
  /** Origem do plano (estrategista, heurístico, etc) */
  origem?: string;
  /** Preset usado (oraculo, node-community, ts-lib) */
  preset?: string;
  /** Número de conflitos detectados */
  conflitos?: number;
}

/**
 * Resultado da exportação de reestruturação
 */
export interface ReestruturacaoExportResult {
  /** Caminho do relatório Markdown gerado */
  markdown: string;
  /** Caminho do relatório JSON gerado */
  json: string;
  /** Diretório onde foram salvos */
  dir: string;
}

/* ================================
   PODA HANDLER TYPES
   ================================ */

/**
 * Opções para exportação de relatórios de poda
 */
export interface PodaExportOptions {
  /** Diretório base do projeto */
  baseDir: string;
  /** Arquivos podados/removidos */
  podados: Pendencia[];
  /** Arquivos pendentes de remoção */
  pendentes: Pendencia[];
  /** Se é uma simulação ou aplicação real */
  simulado: boolean;
}

/**
 * Resultado da exportação de poda
 */
export interface PodaExportResult {
  /** Caminho do relatório Markdown gerado */
  markdown: string;
  /** Caminho do relatório JSON gerado */
  json: string;
  /** Diretório onde foram salvos */
  dir: string;
}
