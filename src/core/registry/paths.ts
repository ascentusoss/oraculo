// SPDX-License-Identifier: MIT
/**
 * @fileoverview Gerenciamento centralizado de caminhos para arquivos JSON do Oráculo
 *
 * Este módulo define todos os caminhos de arquivos JSON usados pelo sistema,
 * evitando hardcoding espalhado e permitindo evolução consistente.
 *
 * Convenção de nomes:
 * - guardian.baseline.json: Snapshot de integridade do Guardian
 * - estrutura.baseline.json: Baseline da estrutura de diretórios
 * - estrutura.arquetipo.json: Arquétipo personalizado do repositório
 * - oraculo.config.json: Configuração do usuário (raiz do projeto)
 */

import path from 'node:path';

// Diretório base do projeto (raiz) - usa CWD quando executado pelo CLI
export const PROJECT_ROOT = process.cwd();

/**
 * Diretórios principais do Oráculo
 */
export const ORACULO_DIRS = {
  /** Diretório de estado interno (.oraculo/) */
  STATE: path.join(PROJECT_ROOT, '.oraculo'),

  /** Diretório de histórico de métricas (.oraculo/historico-metricas/) */
  METRICS_HISTORY: path.join(PROJECT_ROOT, '.oraculo', 'historico-metricas'),

  /** Diretório de relatórios (relatorios/) */
  REPORTS: path.join(PROJECT_ROOT, 'relatorios'),

  /** Diretório de performance baselines (docs/perf/) */
  PERF: path.join(PROJECT_ROOT, 'docs', 'perf'),
} as const;

/**
 * Arquivos JSON do sistema
 *
 * Categoria 1: Configuração (leitura usuário)
 * Categoria 2: Estado interno (leitura/escrita sistema)
 * Categoria 3: Relatórios (escrita sistema)
 */
export const ORACULO_FILES = {
  /* -------------------------- CONFIGURAÇÃO (raiz do projeto) -------------------------- */
  /** Configuração principal do usuário (oraculo.config.json) */
  CONFIG: path.join(PROJECT_ROOT, 'oraculo.config.json'),

  /** Configuração segura/alternativa (oraculo.config.safe.json) */
  CONFIG_SAFE: path.join(PROJECT_ROOT, 'oraculo.config.safe.json'),

  /* -------------------------- ESTADO INTERNO (.oraculo/) -------------------------- */
  /** Baseline de integridade do Guardian (.oraculo/guardian.baseline.json) */
  GUARDIAN_BASELINE: path.join(ORACULO_DIRS.STATE, 'guardian.baseline.json'),

  /** Baseline de estrutura de diretórios (.oraculo/estrutura.baseline.json) */
  ESTRUTURA_BASELINE: path.join(ORACULO_DIRS.STATE, 'estrutura.baseline.json'),

  /** Arquétipo personalizado do repo (.oraculo/estrutura.arquetipo.json) */
  ESTRUTURA_ARQUETIPO: path.join(
    ORACULO_DIRS.STATE,
    'estrutura.arquetipo.json',
  ),

  /** Mapa de reversão de estrutura (.oraculo/mapa-reversao.json) */
  MAPA_REVERSAO: path.join(ORACULO_DIRS.STATE, 'mapa-reversao.json'),

  /** Registros da Vigia Oculta (.oraculo/integridade.json) */
  REGISTRO_VIGIA: path.join(ORACULO_DIRS.STATE, 'integridade.json'),

  /** Histórico de métricas (.oraculo/historico-metricas/metricas-historico.json) */
  METRICAS_HISTORICO: path.join(
    ORACULO_DIRS.METRICS_HISTORY,
    'metricas-historico.json',
  ),

  /* -------------------------- ARQUIVOS LEGADOS (compatibilidade) -------------------------- */
  /** @deprecated Use GUARDIAN_BASELINE - baseline.json antigo */
  GUARDIAN_BASELINE_LEGACY: path.join(ORACULO_DIRS.STATE, 'baseline.json'),

  /** @deprecated Use ESTRUTURA_BASELINE - baseline-estrutura.json antigo */
  ESTRUTURA_BASELINE_LEGACY: path.join(
    ORACULO_DIRS.STATE,
    'baseline-estrutura.json',
  ),

  /** @deprecated Movido para .oraculo/ - oraculo.repo.arquetipo.json na raiz */
  ESTRUTURA_ARQUETIPO_LEGACY_ROOT: path.join(
    PROJECT_ROOT,
    'oraculo.repo.arquetipo.json',
  ),
} as const;

/**
 * Padrões de nomenclatura para relatórios dinâmicos
 */
export const REPORT_PATTERNS = {
  /** Relatório de diagnóstico (oraculo-diagnostico-{timestamp}.md) */
  DIAGNOSTICO: (timestamp: string) =>
    path.join(ORACULO_DIRS.REPORTS, `oraculo-diagnostico-${timestamp}.md`),

  /** Relatório JSON resumo (oraculo-relatorio-summary-{timestamp}.json) */
  SUMMARY_JSON: (timestamp: string) =>
    path.join(
      ORACULO_DIRS.REPORTS,
      `oraculo-relatorio-summary-${timestamp}.json`,
    ),

  /** Relatório de análise async (async-analysis-report.json) */
  ASYNC_ANALYSIS: path.join(ORACULO_DIRS.REPORTS, 'async-analysis-report.json'),

  /** Baseline de performance (docs/perf/baseline-{timestamp}.json) */
  PERF_BASELINE: (timestamp: string) =>
    path.join(ORACULO_DIRS.PERF, `baseline-${timestamp}.json`),

  /** Diff de performance (docs/perf/ultimo-diff.json) */
  PERF_DIFF: path.join(ORACULO_DIRS.PERF, 'ultimo-diff.json'),
} as const;

/**
 * Mapeia nomes legados para novos caminhos (migração automática)
 */
export const MIGRATION_MAP = {
  // Guardian: baseline.json → guardian.baseline.json
  [ORACULO_FILES.GUARDIAN_BASELINE_LEGACY]: ORACULO_FILES.GUARDIAN_BASELINE,

  // Estrutura: baseline-estrutura.json → estrutura.baseline.json
  [ORACULO_FILES.ESTRUTURA_BASELINE_LEGACY]: ORACULO_FILES.ESTRUTURA_BASELINE,

  // Arquétipo: oraculo.repo.arquetipo.json (raiz) → .oraculo/estrutura.arquetipo.json
  [ORACULO_FILES.ESTRUTURA_ARQUETIPO_LEGACY_ROOT]:
    ORACULO_FILES.ESTRUTURA_ARQUETIPO,
} as const;

/**
 * Retorna o caminho legado (se existir) ou o novo
 * @param newPath Caminho novo desejado
 * @returns Caminho do arquivo (prioriza legado se existir)
 */
export function resolveFilePath(newPath: string): string {
  // Verifica se há entrada no mapa de migração reverso
  const legacyPath = Object.entries(MIGRATION_MAP).find(
    ([_, target]) => target === newPath,
  )?.[0];

  return legacyPath || newPath;
}

/**
 * Tipo para caminhos de arquivos do Oráculo
 */
export type OraculoFilePath =
  (typeof ORACULO_FILES)[keyof typeof ORACULO_FILES];
export type OraculoDirPath = (typeof ORACULO_DIRS)[keyof typeof ORACULO_DIRS];
