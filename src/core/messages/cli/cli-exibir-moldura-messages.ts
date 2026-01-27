// SPDX-License-Identifier: MIT

export const CliExibirMolduraMessages = {
  fallbackLinha: (linha: string) => `  ${linha}`,

  planoTitulo: 'Plano de reestruturação',
  planoCabecalhoLinha1: 'De                                → Para',
  planoCabecalhoLinha2:
    '----------------------------------  ---------------------------------------',
  planoOverflow: (restantes: number) => `... +${restantes} restantes`,
  planoFallbackLinha: (de: string, para: string) => `  - ${de} → ${para}`,
  planoFallbackOverflow: (restantes: number) => `  ... +${restantes} restantes`,

  conflitosTitulo: 'Conflitos de destino',
  conflitosCabecalhoLinha1: 'Destino                           Motivo',
  conflitosCabecalhoLinha2:
    '-------------------------------   ------------------------------',
  conflitosOverflow: (restantes: number) => `... +${restantes} restantes`,
  conflitosFallbackLinha: (alvo: string, motivo: string) =>
    `  - ${alvo} :: ${motivo}`,
  conflitosFallbackOverflow: (restantes: number) =>
    `  ... +${restantes} restantes`,
} as const;
