// SPDX-License-Identifier: MIT
/**
 *  Tipos para zelador de imports
 *
 * Define estruturas para correção automática de imports relativos
 * para aliases @ e normalização de imports de tipos.
 */

/**
 * Tipo de correção de import
 */
export type ImportCorrecaoTipo =
  | 'relativo-para-alias'
  | 'tipos-extensao'
  | 'tipos-subpath'
  | 'alias-invalido';

/**
 * Correção de import realizada
 */
export interface ImportCorrecao {
  /** Tipo de correção */
  tipo: ImportCorrecaoTipo | string;
  /** Import original */
  de: string;
  /** Import corrigido */
  para: string;
  /** Linha do import */
  linha: number;
}

/**
 * Resultado de correção de um arquivo
 */
export interface ImportCorrecaoArquivo {
  /** Caminho relativo do arquivo */
  arquivo: string;
  /** Correções realizadas */
  correcoes: ImportCorrecao[];
  /** Arquivo foi modificado */
  modificado: boolean;
  /** Erro durante processamento */
  erro?: string;
}

/**
 * Estatísticas de correção de imports
 */
export interface ImportCorrecaoStats {
  /** Total de arquivos processados */
  arquivosProcessados: number;
  /** Arquivos modificados */
  arquivosModificados: number;
  /** Total de correções */
  totalCorrecoes: number;
  /** Correções por tipo */
  porTipo: Record<string, number>;
  /** Tempo de processamento (ms) */
  tempoMs: number;
}

/**
 * Configuração de aliases do projeto
 */
export type AliasConfig = Record<string, string>;

/**
 * Opções para correção de imports
 */
export interface ImportCorrecaoOptions {
  /** Raiz do projeto */
  projectRoot: string;
  /** Fazer dry-run (não modificar arquivos) */
  dryRun?: boolean;
  /** Modo verbose */
  verbose?: boolean;
  /** Corrigir imports de  */
  corrigirTipos?: boolean;
  /** Corrigir imports relativos para aliases */
  corrigirRelativos?: boolean;
  /** Configuração de aliases */
  aliasConfig?: AliasConfig;
  /** Paths a ignorar */
  ignore?: string[];
}
