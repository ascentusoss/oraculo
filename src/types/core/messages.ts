// SPDX-License-Identifier: MIT
/**
 * Tipos para sistema de mensagens e relatórios
 * Consolidação de: src/core/messages/filtro-config.ts, relatorio-templates.ts e versão anterior
 */

export type PrioridadeNivel = 'critica' | 'alta' | 'media' | 'baixa';

/**
 * Configuração de prioridade de problemas
 * Originalmente em: src/core/messages/filtro-config.ts
 */
export interface ConfigPrioridade {
  prioridade: PrioridadeNivel;
  icone: string;
  descricao?: string;
}

/**
 * Configuração de agrupamento inteligente por padrão de mensagem
 * Originalmente em: src/core/messages/filtro-config.ts
 */
export interface AgrupamentoConfig {
  padrao: RegExp;
  categoria: string;
  titulo: string;
  prioridade?: PrioridadeNivel;
  icone?: string;
  acaoSugerida?: string;
}

/**
 * Metadados estendidos para relatório (inclui campos opcionais de manifest)
 * Originalmente em: src/core/messages/relatorio-templates.ts
 */
export interface MetadadosRelatorioEstendido {
  dataISO: string;
  duracao: number;
  totalArquivos: number;
  totalOcorrencias: number;
  manifestFile?: string;
  relatoriosDir?: string;
}

/**
 * Configuração de filtros (sistema de supressão para OCORRÊNCIAS)
 * Originalmente em: src/core/parsing/filters.ts
 */
export interface FiltrosConfig {
  suppressRules?: string[];
  suppressByQuickFixId?: string[];
  suppressBySeverity?: Record<string, boolean>;
  suppressByPath?: string[];
  suppressByFilePattern?: string[];
}
