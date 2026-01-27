// SPDX-License-Identifier: MIT
/**
 * Tipos para handlers de diagnóstico (Guardian, Arquetipo, Auto-Fix)
 */

import type { IntegridadeStatus, ResultadoGuardian } from '@';

/* ================================
   GUARDIAN HANDLER TYPES
   ================================ */

/**
 * Opções do Guardian
 */
export interface GuardianOptions {
  enabled: boolean;
  fullScan: boolean;
  saveBaseline: boolean;
  silent?: boolean;
}

/**
 * Resultado do Guardian com métricas (usado no processamento de diagnóstico)
 */
export interface GuardianResultadoProcessamento {
  executado: boolean;
  resultado?: ResultadoGuardian;
  status?: IntegridadeStatus;
  drift?: number;
  temProblemas: boolean;
}

/* ================================
   ARQUETIPO HANDLER TYPES
   ================================ */

/**
 * Opções do detector de arquetipos
 */
export interface ArquetipoOptions {
  enabled: boolean;
  salvar: boolean;
  timeout?: number;
  silent?: boolean;
}

/**
 * Resultado da detecção de arquetipos
 */
export interface ArquetipoResult {
  executado: boolean;
  arquetipos?: Array<{
    tipo: string;
    confianca: number;
    caracteristicas?: string[];
  }>;
  principal?: {
    tipo: string;
    confianca: number;
  };
  salvo?: boolean;
  erro?: string;
}

/* ================================
   AUTO-FIX HANDLER TYPES
   ================================ */

/**
 * Options para execução do auto-fix
 */
export interface AutoFixOptions {
  /** Modo de operação: conservative, balanced, aggressive */
  mode: 'conservative' | 'balanced' | 'aggressive';

  /** Dry-run: simula correções sem aplicar */
  dryRun: boolean;

  /** Limite de confiança mínima (0-100) */
  confidenceThreshold?: number;

  /** Limitar máximo de correções por arquivo */
  maxCorrecoesPorArquivo?: number;

  /** Limitar máximo de correções totais */
  maxCorrecoesTotal?: number;

  /** Silenciar logs (útil em --json) */
  silent: boolean;

  /** Timeout em ms (padrão: 60s, testes: 1s) */
  timeout?: number;
}

/**
 * Resultado da execução do auto-fix
 */
export interface AutoFixResult {
  /** Se o auto-fix foi executado */
  executado: boolean;

  /** Modo usado */
  mode: 'conservative' | 'balanced' | 'aggressive';

  /** Se foi dry-run */
  dryRun: boolean;

  /** Estatísticas de correções */
  stats: {
    /** Arquivos analisados */
    arquivosAnalisados: number;

    /** Arquivos modificados */
    arquivosModificados: number;

    /** Total de correções aplicadas */
    correcoesAplicadas: number;

    /** Total de correções sugeridas (não aplicadas) */
    correcoesSugeridas: number;

    /** Correções puladas (baixa confiança) */
    correcoesPuladas: number;
  };

  /** Lista de correções por tipo */
  correcoesPorTipo?: Record<string, number>;

  /** Detalhes das correções (se solicitado) */
  detalhes?: Array<{
    arquivo: string;
    tipo: string;
    linha?: number;
    mensagem: string;
    aplicada: boolean;
    confianca?: number;
  }>;

  /** Erros encontrados */
  erros?: string[];

  /** Avisos gerados */
  avisos?: string[];

  /** Tempo de execução em ms */
  tempoExecucao?: number;
}
