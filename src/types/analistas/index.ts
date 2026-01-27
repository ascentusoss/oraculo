// SPDX-License-Identifier: MIT
/**
 * @fileoverview Exportações centralizadas de tipos de analistas
 *
 * Re-exporta todos os tipos relacionados a analistas, detectores,
 * estrategistas e suas funcionalidades.
 */

// Markdown
export type {
  MarkdownAnaliseArquivo,
  MarkdownAnaliseStats,
  MarkdownDetectorOptions,
  MarkdownLicensePatterns,
  MarkdownProblema,
  MarkdownProblemaTipo,
  MarkdownSeveridade,
  MarkdownWhitelistConfig,
} from './markdown.js';

// Detectores
export type {
  AnaliseArquitetural,
  BlocoFuncao,
  ConstrucaoSintatica,
  DuplicacaoEncontrada,
  EstatisticasArquivo,
  ExportInfo,
  Fragilidade,
  ImportInfo,
  InterfaceInlineDetection,
  ProblemaDocumentacao,
  ProblemaFormatacao,
  ProblemaPerformance,
  ProblemaQualidade,
  ProblemaSeguranca,
  ProblemaTeste,
  ResultadoContexto,
  TipoFragilidade,
} from './detectores.js';

// Contexto (já exportado em detectores, mas mantido para compatibilidade)
export type {
  EvidenciaContexto,
  ResultadoDeteccaoContextual,
} from './contexto.js';

// Estrategistas
export type {
  ArquivoMeta,
  OpcoesPlanejamento,
  ResultadoEstrutural,
  ResultadoPlanejamento,
  SinaisProjetoAvancados,
} from './estrategistas.js';

// Correções
export type {
  ASTNode,
  CategorizacaoUnknown,
  CorrecaoConfig,
  CorrecaoResult,
  ResultadoAnaliseEstrutural,
} from './corrections.js';
