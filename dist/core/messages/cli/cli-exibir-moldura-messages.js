export const CliExibirMolduraMessages = {
    fallbackLinha: (linha) => `  ${linha}`,
    planoTitulo: 'Plano de reestruturação',
    planoCabecalhoLinha1: 'De                                → Para',
    planoCabecalhoLinha2: '----------------------------------  ---------------------------------------',
    planoOverflow: (restantes) => `... +${restantes} restantes`,
    planoFallbackLinha: (de, para) => `  - ${de} → ${para}`,
    planoFallbackOverflow: (restantes) => `  ... +${restantes} restantes`,
    conflitosTitulo: 'Conflitos de destino',
    conflitosCabecalhoLinha1: 'Destino                           Motivo',
    conflitosCabecalhoLinha2: '-------------------------------   ------------------------------',
    conflitosOverflow: (restantes) => `... +${restantes} restantes`,
    conflitosFallbackLinha: (alvo, motivo) => `  - ${alvo} :: ${motivo}`,
    conflitosFallbackOverflow: (restantes) => `  ... +${restantes} restantes`,
};
//# sourceMappingURL=cli-exibir-moldura-messages.js.map