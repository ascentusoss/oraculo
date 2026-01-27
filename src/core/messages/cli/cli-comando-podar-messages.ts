// SPDX-License-Identifier: MIT

import { ICONES_COMANDO } from '../ui/icons.js';

export const CliComandoPodarMessages = {
  inicio: `\n${ICONES_COMANDO.podar} Iniciando processo de poda...\n`,

  nenhumaSujeira: (iconeSucesso: string) =>
    `${iconeSucesso} Nenhuma sujeira detectada. Repositório limpo!`,

  orfaosDetectados: (qtd: number) => `\n${qtd} arquivos órfãos detectados:`,
  linhaArquivoOrfao: (arquivo: string) => `- ${arquivo}`,

  confirmarRemocao: 'Tem certeza que deseja remover esses arquivos? (s/N) ',

  erroDurantePoda: (erroMensagem: string) =>
    `[ERRO] Erro durante a poda: ${erroMensagem}`,
} as const;
