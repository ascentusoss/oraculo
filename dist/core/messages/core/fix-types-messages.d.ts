export declare const CATEGORIAS_TIPOS: {
    readonly LEGITIMO: {
        readonly icone: "\u001B[32m[OK]\u001B[0m";
        readonly nome: "LEGÍTIMO";
        readonly descricao: "Uso correto de unknown - nenhuma ação necessária";
        readonly confidenciaMin: 100;
    };
    readonly MELHORAVEL: {
        readonly icone: "\u001B[33m[!]\u001B[0m";
        readonly nome: "MELHORÁVEL";
        readonly descricao: "Pode ser mais específico - revisão manual recomendada";
        readonly confidenciaMin: 70;
    };
    readonly CORRIGIR: {
        readonly icone: "\u001B[31m[FIX]\u001B[0m";
        readonly nome: "CORRIGIR";
        readonly descricao: "Deve ser substituído - correção automática possível";
        readonly confidenciaMin: 95;
    };
};
export declare const MENSAGENS_INICIO: {
    readonly titulo: "[FIX] Iniciando análise de tipos inseguros...";
    readonly analisando: (target: string) => string;
    readonly confianciaMin: (min: number) => string;
    readonly modo: (dryRun: boolean) => string;
};
export declare const MENSAGENS_PROGRESSO: {
    readonly processandoArquivos: (count: number) => string;
    readonly arquivoAtual: (arquivo: string, count: number) => string;
};
export declare const MENSAGENS_RESUMO: {
    readonly encontrados: (count: number) => string;
    readonly tituloCategorizacao: "[STATS] Análise de Categorização:";
    readonly confianciaMedia: (media: number) => string;
    readonly porcentagem: (count: number, total: number) => string;
};
export declare const DICAS: {
    readonly removerDryRun: "[DICA] Para aplicar correções, remova a flag --dry-run";
    readonly usarInterativo: "[DICA] Use --interactive para confirmar cada correção";
    readonly ajustarConfianca: (atual: number) => string;
    readonly revisar: (categoria: string) => string;
};
export declare const ACOES_SUGERIDAS: {
    readonly LEGITIMO: readonly ["Estes casos estão corretos e devem ser mantidos como estão", "Não requerem nenhuma ação adicional"];
    readonly MELHORAVEL: readonly ["Considere substituir por tipos mais específicos quando possível", "Revisar durante refatorações futuras", "Adicionar comentários explicando o uso de unknown"];
    readonly CORRIGIR: readonly ["Priorize a correção destes casos", "Substituir por tipos TypeScript específicos", "Usar type guards quando necessário"];
};
export declare const MENSAGENS_ERRO: {
    readonly correcaoNaoImplementada: "Correção automática completa ainda não implementada";
    readonly sistemaDesenvolvimento: "[>] Sistema de correção automática avançada em desenvolvimento";
    readonly requisitoAnalise: "Requer análise de AST e inferência de tipos para ser seguro";
    readonly detectorNaoEncontrado: "Detector de tipos inseguros não encontrado no registro de analistas";
    readonly modulosNaoEncontrados: "Módulos de correção não encontrados";
};
export declare const MENSAGENS_SUCESSO: {
    readonly nenhumTipoInseguro: "[OK] Nenhum tipo inseguro detectado! Código está com boa type safety.";
    readonly nenhumAltaConfianca: "[OK] Nenhuma correção de alta confiança encontrada";
    readonly nenhumaCorrecao: "Nenhuma correção aplicada (use --confidence para ajustar limiar)";
};
export declare const MENSAGENS_CLI_FIX_TYPES: {
    readonly linhaEmBranco: "";
    readonly erroExecutar: (mensagem: string) => string;
    readonly linhaResumoTipo: (texto: string) => string;
    readonly exemplosDryRunTitulo: "[LIST] Exemplos encontrados (dry-run):";
    readonly exemploLinha: (icone: string, relPath: string | undefined, linha: string) => string;
    readonly exemploMensagem: (mensagem: string) => string;
    readonly debugVariavel: (nome: string) => string;
    readonly maisOcorrencias: (qtd: number) => string;
    readonly aplicandoCorrecoesAuto: "[FIX] Aplicando correções automáticas...";
    readonly exportandoRelatorios: "[EXPORT] Exportando relatórios...";
    readonly verboseAnyDetectado: (arquivo: string, linha: string) => string;
    readonly verboseAsAnyCritico: (arquivo: string, linha: string) => string;
    readonly verboseAngleAnyCritico: (arquivo: string, linha: string) => string;
    readonly verboseUnknownCategoria: (icone: string, arquivo: string, linha: string, categoria: string, confianca: number) => string;
    readonly verboseMotivo: (motivo: string) => string;
    readonly verboseSugestao: (sugestao: string) => string;
    readonly verboseVariantesTitulo: "     └─ [STATS] Possibilidades alternativas:";
    readonly verboseVarianteItem: (idxBase1: number, variante: string) => string;
    readonly analiseDetalhadaSalva: "[FILE] Análise detalhada salva em: .oraculo/fix-types-analise.json";
    readonly altaConfiancaTitulo: (qtd: number) => string;
    readonly altaConfiancaLinha: (relPath: string | undefined, linha: string, confianca: number) => string;
    readonly altaConfiancaDetalhe: (texto: string) => string;
    readonly altaConfiancaMais: (qtd: number) => string;
    readonly incertosTitulo: (qtd: number) => string;
    readonly incertosIntro: "   Estes casos requerem revisão manual cuidadosa - múltiplas possibilidades detectadas";
    readonly incertosLinha: (relPath: string | undefined, linha: string, confianca: number) => string;
    readonly incertosMais: (qtd: number) => string;
    readonly correcoesResumoSucesso: (qtd: number) => string;
    readonly correcoesResumoLinhaOk: (arquivo: string, linhas: number) => string;
    readonly correcoesResumoLinhaErro: (arquivo: string, erro: string | undefined) => string;
    readonly correcoesResumoFalhas: (qtd: number) => string;
    readonly dryRunAviso: (iconeInicio: string) => string;
    readonly templatePasso: (passo: string) => string;
};
export declare const TEXTOS_CATEGORIZACAO_FIX_TYPES: {
    readonly anyMotivo: "any é inseguro - substituir por tipo específico";
    readonly anySugestao: "Analisar uso da variável para inferir tipo correto";
    readonly asAnyMotivo: "Type assertion \"as any\" desabilita completamente type safety";
    readonly asAnySugestao: "CRÍTICO: Substituir por tipo específico ou usar unknown com validação runtime";
    readonly angleAnyMotivo: "Type casting legado <any> desabilita type safety";
    readonly angleAnySugestao: "CRÍTICO: Migrar para sintaxe \"as\" moderna e usar tipo específico";
    readonly semContextoMotivo: "Não foi possível analisar contexto";
    readonly semContextoSugestao: "Revisar manualmente";
};
export declare const TEMPLATE_RESUMO_FINAL: {
    readonly titulo: "[DETAIL] Para aplicar correções manualmente:";
    readonly passos: readonly ["Revise os casos categorizados acima", "LEGÍTIMOS (\u001B[32m[OK]\u001B[0m): Manter como estão", "MELHORÁVEIS (\u001B[33m[!]\u001B[0m): Considere tipos mais específicos", "CORRIGIR (\u001B[31m[FIX]\u001B[0m): Substitua por tipos específicos", "Execute `npm run lint` após as correções"];
};
export declare const ICONES: {
    readonly LEGITIMO: {
        readonly icone: "\u001B[32m[OK]\u001B[0m";
        readonly nome: "LEGÍTIMO";
        readonly descricao: "Uso correto de unknown - nenhuma ação necessária";
        readonly confidenciaMin: 100;
    };
    readonly MELHORAVEL: {
        readonly icone: "\u001B[33m[!]\u001B[0m";
        readonly nome: "MELHORÁVEL";
        readonly descricao: "Pode ser mais específico - revisão manual recomendada";
        readonly confidenciaMin: 70;
    };
    readonly CORRIGIR: {
        readonly icone: "\u001B[31m[FIX]\u001B[0m";
        readonly nome: "CORRIGIR";
        readonly descricao: "Deve ser substituído - correção automática possível";
        readonly confidenciaMin: 95;
    };
    readonly inicio: "[FIX]";
    readonly aplicando: "[>]";
    readonly analise: "[>]";
    readonly pasta: "[DIR]";
    readonly arquivo: "[FILE]";
    readonly alvo: "[>]";
    readonly edicao: "[EDIT]";
    readonly grafico: "[GRAPH]";
    readonly lampada: "[DICA]";
    readonly foguete: "[>>]";
    readonly nota: "[NOTE]";
    readonly checkbox: "[OK]";
    readonly setinha: "└─";
};
export declare function formatarTipoInseguro(tipo: string, count: number): string;
export declare function formatarOcorrencia(relPath: string, linha: number | undefined): string;
export declare function formatarComContexto(mensagem: string, indentLevel?: number): string;
export declare function formatarSugestao(sugestao: string): string;
export declare function gerarResumoCategoria(categoria: keyof typeof CATEGORIAS_TIPOS, count: number, total: number): string[];
export declare const DEBUG: {
    readonly categorizacao: (arquivo: string, tipo: string, categoria: string) => string;
    readonly confianca: (tipo: string, valor: number) => string;
};
//# sourceMappingURL=fix-types-messages.d.ts.map