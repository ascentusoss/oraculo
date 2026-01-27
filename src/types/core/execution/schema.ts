// SPDX-License-Identifier: MIT
/**
 * Tipos centralizados para sistema de versionamento de schema
 * Consolidação de: src/core/schema/version.ts e versão anterior
 */

/**
 * Metadados de schema para relatórios JSON
 * Versão completa com todas as propriedades
 */
export interface SchemaMetadata {
  /** Versão do schema (ex: "1.0.0") */
  versao: string;
  /** Data de criação do schema */
  criadoEm: string;
  /** Descrição das mudanças nesta versão */
  descricao: string;
  /** Versões compatíveis para leitura (backward compatibility) */
  compatibilidade: string[];
  /** Campos obrigatórios nesta versão */
  camposObrigatorios: string[];
  /** Campos opcionais nesta versão */
  camposOpcionais: string[];

  // Propriedades alternativas para compatibilidade
  version?: string;
  generatedAt?: string;
  schemaVersion?: string;
  formato?: string;
}

/**
 * Relatório com metadados de versão
 */
export interface RelatorioComVersao<T = unknown> {
  /** Metadados de versão do schema */
  _schema: SchemaMetadata;
  /** Dados do relatório */
  dados: T;
  /** Metadados alternativos para compatibilidade */
  metadata?: SchemaMetadata;
}
