export const CliComandoGuardianMessages = {
    baselineNaoPermitidoFullScan: 'Não é permitido aceitar baseline em modo --full-scan. Remova a flag e repita.',
    diffMudancasDetectadas: (drift) => `Detectadas ${drift} mudança(s) desde o baseline.`,
    diffComoAceitarMudancas: 'Execute `oraculo guardian --accept-baseline` para aceitar essas mudanças.',
    baselineCriadoComoAceitar: 'Execute `oraculo guardian --accept-baseline` para aceitá-lo ou `oraculo diagnosticar` novamente.',
};
//# sourceMappingURL=cli-comando-guardian-messages.js.map