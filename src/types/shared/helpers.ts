// SPDX-License-Identifier: MIT
/**
 * Tipos para helpers do shared
 */

/**
 * Informações sobre um framework detectado
 */
export interface FrameworkInfo {
  name: string;
  version?: string;
  isDev: boolean;
}

/**
 * Regra para whitelist de constantes mágicas
 */
export interface MagicConstantRule {
  value: number;
  description: string;
  contexts?: string[]; // Contextos onde esse valor é válido (opcional)
}

/**
 * Configuração de uma regra específica
 */
export interface RuleConfig {
  severity?: 'error' | 'warning' | 'info' | 'off';
  exclude?: string[];
  allowTestFiles?: boolean;
}

/**
 * Override de regras para arquivos específicos
 */
export interface RuleOverride {
  files: string[];
  rules: Record<string, RuleConfig | 'off'>;
}

/**
 * Informação de supressão inline
 */
export interface SupressaoInfo {
  /** Linha onde a supressão se aplica */
  linha: number;
  /** Regras que estão suprimidas */
  regras: string[];
  /** Tipo de supressão */
  tipo: 'linha-seguinte' | 'bloco-inicio' | 'bloco-fim';
}

/**
 * Regras suprimidas agrupadas
 */
export interface RegrasSuprimidas {
  /** Map de linha -> conjunto de regras suprimidas naquela linha */
  porLinha: Map<number, Set<string>>;
  /** Regras suprimidas em blocos ativos (sem fim ainda) */
  blocosAtivos: Set<string>;
}

/**
 * Mensagem em memória de conversação
 */
export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
