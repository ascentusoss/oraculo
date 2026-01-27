// SPDX-License-Identifier: MIT

export const CliComandoReverterMessages = {
  mapaLimpoComSucesso: (iconeSucesso: string) =>
    `${iconeSucesso} Mapa de reversão limpo com sucesso`,

  ultimoMove: (dataPtBr: string) => `Último move: ${dataPtBr}`,
} as const;
