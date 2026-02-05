// SPDX-License-Identifier: MIT
// import { log } from '@nucleo/constelacao/log.js';

import {
  log,
  logRelatorio,
  MENSAGENS_RELATORIOS_ANALISE,
} from '@core/messages/index.js';

import type { LogComBloco } from '@';

export function exibirRelatorioPadroesUso(): void {
  // Cabeçalho compatível com testes
  log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.padroes);
  // Moldura do cabeçalho (somente em runtime humano)
  if (!process.env.VITEST) {
    const titulo = 'Padrões de Uso do Código';
    const linhas: string[] = [];
    const logComBloco = log as LogComBloco;
    const largura = logComBloco.calcularLargura
      ? logComBloco.calcularLargura(titulo, linhas, 84)
      : undefined;
    logComBloco.imprimirBloco(
      titulo,
      linhas,
      (s: string) => s,
      typeof largura === 'number' ? largura : 84,
    );
  }
  // Rodapé compatível com testes
  logRelatorio.fimPadroesUso();
}
