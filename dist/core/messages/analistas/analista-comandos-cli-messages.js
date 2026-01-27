function comandoLabel(comandoNome) {
    return comandoNome ? ` "${comandoNome}"` : "";
}
export const ComandosCliMessages = {
    padraoAusente: 'Possível arquivo de comando sem registro detectado. Se este arquivo deveria conter comandos, considere usar padrões como "onCommand", "registerCommand", ou métodos específicos do framework (ex: SlashCommandBuilder para Discord.js).',
    comandosDuplicados: (duplicados) => `Comandos duplicados detectados: ${[...new Set(duplicados)].join(", ")}`,
    handlerAnonimo: (comandoNome) => `Handler do comando "${comandoNome}" é função anônima. Prefira funções nomeadas para facilitar debugging e rastreabilidade.`,
    handlerMuitosParametros: (comandoNome, paramCount) => `Handler do comando${comandoLabel(comandoNome)} possui muitos parâmetros (${paramCount}). Avalie simplificar a interface.`,
    handlerMuitoLongo: (comandoNome, statements) => `Handler do comando${comandoLabel(comandoNome)} é muito longo (${statements} statements). Considere extrair funções auxiliares.`,
    handlerSemTryCatch: (comandoNome) => `Handler do comando${comandoLabel(comandoNome)} não possui bloco try/catch. Recomenda-se tratar erros explicitamente.`,
    handlerSemFeedback: (comandoNome) => `Handler do comando${comandoLabel(comandoNome)} não faz log nem responde ao usuário. Considere adicionar feedback/logging.`,
    multiplosComandos: (count) => `Múltiplos comandos registrados neste arquivo (${count}). Avalie separar cada comando em seu próprio módulo para melhor manutenção.`,
};
//# sourceMappingURL=analista-comandos-cli-messages.js.map