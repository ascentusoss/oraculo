// SPDX-License-Identifier: MIT
/**
 * @fileoverview Exportações centralizadas de tipos da CLI
 */

// Options e Filtros
export type {
  FiltrosProcessados,
  FixTypesOptions,
  FlagsBrutas,
  FlagsNormalizadas,
  FormatoSaida,
  ModoAutoFix,
  ModoOperacao,
  NivelLog,
  OpcoesProcessamentoFiltros,
  OraculoGlobalFlags,
  OtimizarSvgOptions,
  ResultadoValidacao,
} from './options.js';

// Handlers
export type {
  CasoTipoInseguro,
  FixTypesExportOptions,
  FixTypesExportResult,
  GuardianBaselineCli as GuardianBaseline, // Alias para compatibilidade
  GuardianBaselineCli,
  GuardianExportOptions,
  GuardianExportResult,
  PodaExportOptions,
  PodaExportResult,
  ReestruturacaoExportOptions,
  ReestruturacaoExportResult,
} from './handlers.js';

// Exporters
export type {
  DadosRelatorioMarkdown,
  JsonExportOptions,
  MarkdownExportOptions,
  RelatorioJson,
  ResultadoSharding,
  ShardInfo,
  ShardingOptions,
} from './exporters.js';

// Diagnostico Handlers
export type {
  ArquetipoOptions,
  ArquetipoResult,
  AutoFixOptions,
  AutoFixResult,
  GuardianOptions,
  GuardianResultadoProcessamento,
} from './diagnostico-handlers.js';

// Diagnóstico Base
export type {
  LocBabel,
  OpcoesDiagnosticoBase,
  ResultadoDiagnosticoBase,
} from './diagnostico.js';

// Comandos CLI
export type {
  FormatarCommandOpts,
  FormatResult,
  OtimizarSvgCommandOpts,
  ParentWithOpts,
} from './comandos.js';

// Log Extensions
export type { LogExtensions } from './log-extensions.js';

// Processamento Diagnóstico (tipos completos)
export type {
  OpcoesProcessamentoDiagnostico,
  ResultadoProcessamentoDiagnostico,
} from './processamento-diagnostico.js';

// Métricas
export type {
  MetricaAnalistaLike,
  MetricaExecucao,
  MetricaExecucaoLike,
  SnapshotPerf,
} from './metricas.js';
