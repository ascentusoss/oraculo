// SPDX-License-Identifier: MIT

import { ICONES_FEEDBACK } from '../ui/icons.js';

export const CliArquetipoHandlerMessages = {
  timeoutDeteccao: `${ICONES_FEEDBACK.atencao} Detecção de arquetipos expirou (timeout)`,
  erroDeteccao: (mensagem: string) =>
    `Erro na detecção de arquetipos: ${mensagem}`,
  devErroPrefixo: '[Arquetipo Handler] Erro:',
  falhaSalvar: (mensagem: string) => `Falha ao salvar arquetipo: ${mensagem}`,
} as const;
