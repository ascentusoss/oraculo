export declare const CliComandoReestruturarMessages: {
    readonly inicio: "\n[ORG] Iniciando processo de reestruturação...\n";
    readonly spinnerCalculandoPlano: "[...] Calculando plano de reestruturação...";
    readonly planoSugeridoFast: (origem: string, moverLen: number) => string;
    readonly dryRunFast: "Dry-run solicitado (--somente-plano). (FAST MODE)";
    readonly reestruturacaoConcluidaFast: (moverLen: number) => string;
    readonly planoCalculadoFastSemAplicar: "Plano calculado em FAST MODE (nenhuma ação aplicada sem --auto).";
    readonly erroDuranteReestruturacao: (erroMensagem: string) => string;
    readonly spinnerPlanoVazio: "Plano vazio: nenhuma movimentação sugerida.";
    readonly spinnerPlanoSugerido: (origem: string, moverLen: number) => string;
    readonly spinnerConflitosDetectados: (qtd: number) => string;
    readonly spinnerSemPlanoSugestao: "Sem planoSugestao (nenhum candidato ou erro). Usando ocorrências.";
    readonly dryRunCompleto: "Dry-run solicitado (--somente-plano). Nenhuma ação aplicada.";
    readonly dicaParaAplicar: "Para aplicar as movimentações reais, execute novamente com a flag --auto (ou --aplicar).";
    readonly fallbackProblemasEstruturais: (qtd: number) => string;
    readonly fallbackLinhaOcorrencia: (tipo: string, rel: string, mensagem: string) => string;
    readonly nenhumNecessario: "Nenhuma correção estrutural necessária. Repositório já otimizado!";
    readonly canceladoErroPrompt: "[FALHA] Reestruturação cancelada. (Erro no prompt)";
    readonly canceladoUseAuto: "[FALHA] Reestruturação cancelada. (Use --auto para aplicar sem prompt)";
    readonly spinnerAplicando: "[FIX] Aplicando movimentos...";
    readonly reestruturacaoConcluida: (qtd: number, frase: string) => string;
    readonly falhaReestruturacao: "Falha na reestruturação.";
};
//# sourceMappingURL=cli-comando-reestruturar-messages.d.ts.map