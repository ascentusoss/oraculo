// SPDX-License-Identifier: MIT

export const CliComandoGuardianMessages = {
  baselineNaoPermitidoFullScan:
    'Não é permitido aceitar baseline em modo --full-scan. Remova a flag e repita.',

  diffMudancasDetectadas: (drift: number) =>
    `Detectadas ${drift} mudança(s) desde o baseline.`,

  diffComoAceitarMudancas:
    'Execute `oraculo guardian --accept-baseline` para aceitar essas mudanças.',

  baselineCriadoComoAceitar:
    'Execute `oraculo guardian --accept-baseline` para aceitá-lo ou `oraculo diagnosticar` novamente.',
} as const;
