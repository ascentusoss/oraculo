// SPDX-License-Identifier: MIT

export type Nivel = 'info' | 'sucesso' | 'erro' | 'aviso' | 'debug';

export interface FormatOptions {
  nivel: Nivel;
  mensagem: string;
  // quando true (padrão), remove símbolos/emojis iniciais redundantes na mensagem
  sanitize?: boolean;
}

// Re-export dos tipos do sistema de log-engine
export type LogLevel = 'debug' | 'sucesso' | 'info' | 'aviso' | 'erro';
export type LogContext = 'simples' | 'medio' | 'complexo' | 'ci';
export type LogTemplate = string;
export type LogData = Record<string, string | number | boolean>;

// Interface para métricas do projeto
export interface ProjetoMetricas {
  totalArquivos: number;
  linguagens: string[];
  estruturaComplexidade: 'simples' | 'media' | 'complexa';
  temCI: boolean;
  temTestes: boolean;
  temDependencias: boolean;
}

// Re-export do LogContextConfig
export { LogContextConfig } from '/messages/log/log-messages.js';

/**
 * Tipos para funcionalidades estendidas do sistema de log
 * Evita casts unknown para funcionalidades dinâmicas
 */

/**
 * Interface básica do logger
 */
export interface LoggerBase {
  info: (mensagem: string) => void;
  aviso?: (mensagem: string) => void;
  erro: (mensagem: string) => void;
  sucesso?: (mensagem: string) => void;
  debug?: (mensagem: string) => void;
}

/**
 * Interface para log com capacidades de impressão de blocos
 */
export interface LogComBloco extends LoggerBase {
  imprimirBloco: (
    titulo: string,
    linhas: string[],
    cor?: Function,
    largura?: number,
  ) => void;
  calcularLargura?: (
    titulo: string,
    linhas: string[],
    larguraMin?: number,
  ) => number;
}

/**
 * Interface para log com capacidade de sanitização desabilitada
 */
export interface LogComSanitizar extends LoggerBase {
  infoSemSanitizar?: (mensagem: string) => void;
}

/**
 * Interface completa do log com todas as funcionalidades
 */
export interface LogCompleto extends LogComBloco, LogComSanitizar {
  // Combina todas as capacidades estendidas
}

/**
 * Type guard para verificar se log tem capacidade de bloco
 */
export function temCapacidadeBloco(log: unknown): log is LogComBloco {
  return (
    typeof log === 'object' &&
    log !== null &&
    'imprimirBloco' in log &&
    typeof (log as LogComBloco).imprimirBloco === 'function'
  );
}

/**
 * Type guard para verificar se log tem capacidade de sanitização
 */
export function temCapacidadeSanitizar(log: unknown): log is LogComSanitizar {
  return typeof log === 'object' && log !== null && 'infoSemSanitizar' in log;
}
