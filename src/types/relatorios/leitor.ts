// SPDX-License-Identifier: MIT
/**
 * Tipos para leitura de relatórios versionados
 * Originalmente em: src/shared/helpers/leitor-relatorio.ts
 */

export interface LeitorRelatorioOptions {
  /** Caminho do arquivo do relatório */
  caminho: string;
  /** Se deve validar o schema (padrão: true) */
  validar?: boolean;
  /** Se deve migrar para versão atual se necessário (padrão: false) */
  migrar?: boolean;
}
