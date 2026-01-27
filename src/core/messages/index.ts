// SPDX-License-Identifier: MIT
/**
 * Sistema de Mensagens Centralizado do Oráculo
 *
 * Este módulo centraliza TODAS as mensagens, logs e templates do sistema.
 * Organizado em subpastas por domínio:
 * - analistas/ - Mensagens de analistas e detectores
 * - cli/       - Mensagens de comandos e handlers CLI
 * - core/      - Mensagens core (correções, diagnóstico, exceções, etc.)
 * - log/       - Sistema de logging
 * - relatorios/- Mensagens de relatórios MD/JSON
 * - ui/        - Ícones, sugestões, filtros
 * - zeladores/ - Mensagens de zeladores
 */

  /* -------------------------- SISTEMA DE LOG -------------------------- */

export {
  log,
  logAnalistas,
  logAuto,
  logConselheiro,
  LogContextConfig,
  logCore,
  logEngine,
  LogEngineAdaptativo,
  logFiltros,
  logGuardian,
  LogMessages,
  logMetricas,
  logOcorrencias,
  logProjeto,
  logRelatorio,
  logScanner,
  logSistema,
} from './log/index.js';

  /* -------------------------- MENSAGENS DE RELATÓRIOS -------------------------- */

export {
  escreverRelatorioMarkdown,
  formatMessage,
  gerarFooterRelatorio,
  gerarHeaderRelatorio,
  gerarSecaoEstatisticas,
  gerarSecaoGuardian,
  gerarSecaoProblemasAgrupados,
  gerarTabelaDuasColunas,
  gerarTabelaOcorrencias,
  gerarTabelaResumoTipos,
  getDescricaoCampo,
  JsonMessages,
  type MetadadosRelatorioEstendido,
  pluralize,
  RelatorioMessages,
  separator,
  wrapComMetadados,
} from './relatorios/index.js';

  /* -------------------------- FILTRO INTELIGENTE E UI -------------------------- */

export {
  type AgrupamentoConfig,
  AGRUPAMENTOS_MENSAGEM,
  type ConfigPrioridade,
  contarPorPrioridade,
  findAgrupamento,
  formatarSugestoes,
  gerarSugestoesContextuais,
  getIcone,
  getPrioridade,
  type IconeAcao,
  type IconeArquivo,
  type IconeComando,
  type IconeDiagnostico,
  type IconeFeedback,
  type IconeNivel,
  type IconeRelatorio,
  ICONES_ACAO,
  ICONES_ARQUIVO,
  ICONES as ICONES_CENTRAL,
  ICONES_COMANDO,
  ICONES_DIAGNOSTICO as ICONES_DIAGNOSTICO_CENTRAL,
  ICONES_FEEDBACK,
  ICONES_NIVEL,
  ICONES_RELATORIO,
  ICONES_STATUS,
  ICONES_TIPOS,
  ICONES_ZELADOR as ICONES_ZELADOR_CENTRAL,
  type IconeStatus,
  type IconeTipo,
  type IconeZelador,
  ordenarPorPrioridade,
  type PrioridadeNivel,
  PRIORIDADES,
  SUGESTOES,
  SUGESTOES_ARQUETIPOS,
  SUGESTOES_AUTOFIX,
  SUGESTOES_COMANDOS,
  SUGESTOES_DIAGNOSTICO,
  SUGESTOES_GUARDIAN,
  SUGESTOES_METRICAS,
  SUGESTOES_PODAR,
  SUGESTOES_REESTRUTURAR,
  SUGESTOES_TIPOS,
  SUGESTOES_ZELADOR,
  suportaCores,
} from './ui/index.js';

  /* -------------------------- MENSAGENS CORE (DIAGNÓSTICO, CORREÇÕES, FIX-TYPES, ETC.) -------------------------- */

export * from './core/index.js';
  /* -------------------------- MENSAGENS DE ZELADORES -------------------------- */

export {
  ERROS_IMPORTS,
  EXIT_CODES,
  formatarComTimestamp,
  formatarDuracao,
  formatarEstatistica,
  formatarListaArquivos,
  gerarResumoImports,
  ICONES_ZELADOR,
  MENSAGENS_ESTRUTURA,
  MENSAGENS_IMPORTS,
  MENSAGENS_TIPOS,
  MENSAGENS_ZELADOR_GERAL,
  PROGRESSO_IMPORTS,
  TEMPLATES_SAIDA,
} from './zeladores/index.js';

  /* -------------------------- MENSAGENS DE CLI (COMANDOS E HANDLERS) -------------------------- */

export * from './cli/index.js';

  /* -------------------------- MENSAGENS DE ANALISTAS E DETECTORES -------------------------- */

export * from './analistas/index.js';
