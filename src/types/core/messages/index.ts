// SPDX-License-Identifier: MIT
/**
 * Tipos centralizados para mensagens JSON
 */

  /* -------------------------- ESTRUTURAS DE MENSAGENS -------------------------- */

/**
 * Estrutura de campo de mensagem JSON
 */
export interface CampoMensagem {
  label: string;
  descricao: string;
}

/**
 * Estrutura de seção de mensagens com campos
 */
export interface SecaoMensagemComCampos {
  label: string;
  descricao: string;
  campos: Record<string, string>;
}

/**
 * JSON com metadados versionados
 */
export interface JsonComMetadados<T> {
  _metadata: {
    schema: string;
    versao: string;
    geradoEm: string;
    descricao?: string;
  };
  dados: T;
}

/**
 * Tipo para valores de mensagens (string ou objeto com label/descricao)
 */
export type ValorMensagem = string | CampoMensagem | SecaoMensagemComCampos;
