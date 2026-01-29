// SPDX-License-Identifier: MIT
/**
 *  Tipos para detecção de problemas em arquivos Markdown
 *
 * Define estruturas para verificação de compliance de licenças,
 * proveniência e referências em documentação Markdown.
 */

/**
 * Tipo de problema detectado em Markdown
 */
export type MarkdownProblemaTipo =
  | 'licenca-incompativel'
  | 'falta-proveniencia'
  | 'referencia-risco'
  | 'formato-invalido';

/**
 * Severidade do problema
 */
export type MarkdownSeveridade = 'critico' | 'alto' | 'medio' | 'baixo';

/**
 * Problema detectado em arquivo Markdown
 */
export interface MarkdownProblema {
  /** Tipo do problema */
  tipo: MarkdownProblemaTipo;
  /** Descrição detalhada */
  descricao: string;
  /** Severidade */
  severidade: MarkdownSeveridade;
  /** Linha onde foi detectado (opcional) */
  linha?: number;
  /** Trecho de código problemático */
  trecho?: string;
  /** Sugestão de correção */
  sugestao?: string;
}

/**
 * Resultado de análise de um arquivo Markdown
 */
export interface MarkdownAnaliseArquivo {
  /** Caminho relativo do arquivo */
  relPath: string;
  /** Caminho absoluto do arquivo */
  fullPath: string;
  /** Problemas encontrados */
  problemas: MarkdownProblema[];
  /** Tem aviso de proveniência */
  temProveniencia: boolean;
  /** Está na whitelist */
  whitelisted: boolean;
  /** Tem marcador RISCO_REFERENCIA_OK */
  temRiscoOk: boolean;
}

/**
 * Padrões de licenças problemáticas
 */
export interface MarkdownLicensePatterns {
  /** Padrões de licenças incompatíveis */
  incompativeis: RegExp[];
  /** Padrões de cessão de direitos */
  cessaoDireitos: RegExp[];
  /** Padrões de referências externas arriscadas */
  referenciasRisco: RegExp[];
}

/**
 * Configuração de whitelist
 */
export interface MarkdownWhitelistConfig {
  /** Paths exatos permitidos */
  paths: string[];
  /** Padrões glob permitidos */
  patterns: string[];
  /** Diretórios permitidos */
  dirs: string[];
}

/**
 * Opções para detector de Markdown
 */
export interface MarkdownDetectorOptions {
  /** Verificar proveniência */
  checkProveniencia?: boolean;
  /** Verificar licenças */
  checkLicenses?: boolean;
  /** Verificar referências */
  checkReferences?: boolean;
  /** Configuração de whitelist */
  whitelist?: MarkdownWhitelistConfig;
  /** Linhas de cabeçalho para verificar proveniência */
  headerLines?: number;
}

/**
 * Estatísticas de análise Markdown
 */
export interface MarkdownAnaliseStats {
  /** Total de arquivos analisados */
  totalArquivos: number;
  /** Arquivos com problemas */
  arquivosComProblemas: number;
  /** Arquivos sem proveniência */
  semProveniencia: number;
  /** Arquivos com licenças incompatíveis */
  licencasIncompativeis: number;
  /** Arquivos whitelistados */
  whitelistados: number;
  /** Total de problemas */
  totalProblemas: number;
}
