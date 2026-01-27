export declare const ComandosCliMessages: {
    readonly padraoAusente: "Possível arquivo de comando sem registro detectado. Se este arquivo deveria conter comandos, considere usar padrões como \"onCommand\", \"registerCommand\", ou métodos específicos do framework (ex: SlashCommandBuilder para Discord.js).";
    readonly comandosDuplicados: (duplicados: string[]) => string;
    readonly handlerAnonimo: (comandoNome: string) => string;
    readonly handlerMuitosParametros: (comandoNome: string | undefined, paramCount: number) => string;
    readonly handlerMuitoLongo: (comandoNome: string | undefined, statements: number) => string;
    readonly handlerSemTryCatch: (comandoNome: string | undefined) => string;
    readonly handlerSemFeedback: (comandoNome: string | undefined) => string;
    readonly multiplosComandos: (count: number) => string;
};
//# sourceMappingURL=analista-comandos-cli-messages.d.ts.map