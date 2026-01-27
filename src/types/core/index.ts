// SPDX-License-Identifier: MIT
/**
 * @fileoverview Exportações centralizadas de tipos do core
 */

// Auto-Fix (Corrections)
export type { QuickFix } from './corrections/auto-fix.js';

// Configuração
export type {
  AutoFixConfig,
  ConfigExcludesPadrao,
  ConfiguracaoPontuacao,
  PatternBasedQuickFix,
  ValidationResult,
} from './config/config.js';

// Mensagens
export type {
  AgrupamentoConfig,
  ConfigPrioridade,
  FiltrosConfig,
  MetadadosRelatorioEstendido,
  PrioridadeNivel,
} from './messages.js';

// Execution
export type {
  EstadoIncArquivo,
  MetricasGlobais,
  SimbolosLog,
} from './execution/inquisidor.js';
export type { MigrationResult } from './execution/registry.js';
export type { RelatorioComVersao, SchemaMetadata } from './execution/schema.js';
export type {
  WorkerPoolOptions,
  WorkerResult,
  WorkerTask,
} from './execution/workers.js';
