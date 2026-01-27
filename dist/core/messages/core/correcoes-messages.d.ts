export declare const MENSAGENS_FIX_TYPES: {
    readonly fixAny: {
        readonly title: "Substituir any por tipos seguros";
        readonly description: `Analisa uso de any e infere/cria tipos corretos em ${string}`;
    };
    readonly fixUnknown: {
        readonly title: "Substituir unknown por tipos específicos";
        readonly description: "Detecta padrões de type guards e cria tipos dedicados";
    };
    readonly validacao: {
        readonly falha: (erros: string[]) => string;
        readonly revisar: "Revise manualmente";
    };
    readonly warnings: {
        readonly confiancaBaixa: (confianca: number) => string;
        readonly confiancaMedia: (confianca: number, tipoSugerido: string) => string;
        readonly unknownApropriado: "unknown apropriado aqui (entrada genérica ou baixa confiança)";
        readonly useTiposCentralizados: () => string;
        readonly criarTipoDedicado: (caminho: string) => string;
        readonly adicioneTypeGuards: () => string;
    };
    readonly erros: {
        readonly extrairNome: "Não foi possível extrair nome da variável";
        readonly variavelNaoUsada: "Variável não utilizada - impossível inferir tipo";
        readonly analise: (erro: string) => string;
    };
};
export declare const MENSAGENS_AUTOFIX: {
    readonly iniciando: (modo: string) => string;
    readonly dryRun: "[i] Dry-run: simulando correções (nenhuma mudança será aplicada)";
    readonly aplicando: (count: number) => string;
    readonly concluido: (aplicadas: number, falhas: number) => string;
    readonly naoDisponivel: "[i] Nenhuma correção automática disponível";
    readonly flags: {
        readonly fixSafe: "[GUARD] Flag --fix-safe detectada: ativando modo conservador";
        readonly requireMutateFS: "[FALHA] Auto-fix indisponível no momento.";
    };
    readonly logs: {
        readonly modoConservador: "[GUARD] Modo conservador ativado - aplicando apenas correções de alta confiança";
        readonly validacaoEslint: "[SCAN] Executando validação ESLint pós-auto-fix...";
        readonly arquivoMovido: (origem: string, destino: string) => string;
        readonly arquivoRevertido: (origem: string, destino: string) => string;
        readonly arquivoRevertidoConteudo: (origem: string, destino: string) => string;
    };
    readonly resultados: {
        readonly sucesso: (count: number) => string;
        readonly falhas: (count: number) => string;
        readonly erroArquivo: (arquivo: string, erro: string) => string;
    };
    readonly dicas: {
        readonly executarLint: "[DICA] Execute `npm run lint` para verificar as correções";
        readonly executarBuild: "[DICA] Execute `npm run build` para verificar se o código compila";
        readonly removerDryRun: "[DICA] Remova --dry-run para aplicar correções automaticamente";
        readonly ajustarConfianca: "[DICA] Use --confidence <num> para ajustar o limiar (atual: 85%)";
    };
};
export declare const MENSAGENS_RELATORIOS_ANALISE: {
    readonly asyncPatterns: {
        readonly titulo: "[SUMMARY] Análise de Padrões Async/Await";
        readonly padroes: "\n[SUMMARY] Padrões de Uso do Código:";
        readonly recomendacoes: "\n[DICA] Recomendações de Correção:\n";
        readonly critico: "\u001B[31mERRO\u001B[0m CRÍTICO (Revisar Imediatamente):";
        readonly alto: "\n[!] ALTO (Revisar em Sprint Atual):";
        readonly salvo: (caminho: string) => string;
    };
    readonly fixTypes: {
        readonly analiseSalva: "[JSON] Análise detalhada salva em: .oraculo/fix-types-analise.json";
        readonly possibilidades: "└─ [SCAN] Possibilidades alternativas:";
        readonly sugestao: (texto: string) => string;
        readonly exportado: "[DOC] Relatórios de fix-types exportados:";
    };
    readonly guardian: {
        readonly baselineAceito: "[OK] Guardian: baseline aceito manualmente (--aceitar).";
        readonly exportado: "[DOC] Relatórios Guardian exportados:";
    };
};
export declare const MENSAGENS_ARQUETIPOS_HANDLER: {
    readonly timeout: "[!] Detecção de arquetipos expirou (timeout)";
    readonly salvo: (caminho: string) => string;
    readonly falha: "[!] Falha ao gerar plano via arquétipos.";
    readonly falhaEstrategista: "[!] Estrategista falhou ao sugerir plano.";
    readonly falhaGeral: "[!] Falha geral no planejamento.";
};
export declare const MENSAGENS_PLUGINS: {
    readonly registrado: (nome: string, extensoes: string[]) => string;
    readonly configAtualizada: "[FIX] Configuração do registry atualizada";
    readonly erroParsear: (linguagem: string, erro: string) => string;
};
export declare const MENSAGENS_EXECUTOR: {
    readonly analiseCompleta: (tecnica: string, arquivo: string, duracao: string) => string;
};
export declare const MENSAGENS_CORRECOES: {
    readonly fixTypes: {
        readonly fixAny: {
            readonly title: "Substituir any por tipos seguros";
            readonly description: `Analisa uso de any e infere/cria tipos corretos em ${string}`;
        };
        readonly fixUnknown: {
            readonly title: "Substituir unknown por tipos específicos";
            readonly description: "Detecta padrões de type guards e cria tipos dedicados";
        };
        readonly validacao: {
            readonly falha: (erros: string[]) => string;
            readonly revisar: "Revise manualmente";
        };
        readonly warnings: {
            readonly confiancaBaixa: (confianca: number) => string;
            readonly confiancaMedia: (confianca: number, tipoSugerido: string) => string;
            readonly unknownApropriado: "unknown apropriado aqui (entrada genérica ou baixa confiança)";
            readonly useTiposCentralizados: () => string;
            readonly criarTipoDedicado: (caminho: string) => string;
            readonly adicioneTypeGuards: () => string;
        };
        readonly erros: {
            readonly extrairNome: "Não foi possível extrair nome da variável";
            readonly variavelNaoUsada: "Variável não utilizada - impossível inferir tipo";
            readonly analise: (erro: string) => string;
        };
    };
    readonly autofix: {
        readonly iniciando: (modo: string) => string;
        readonly dryRun: "[i] Dry-run: simulando correções (nenhuma mudança será aplicada)";
        readonly aplicando: (count: number) => string;
        readonly concluido: (aplicadas: number, falhas: number) => string;
        readonly naoDisponivel: "[i] Nenhuma correção automática disponível";
        readonly flags: {
            readonly fixSafe: "[GUARD] Flag --fix-safe detectada: ativando modo conservador";
            readonly requireMutateFS: "[FALHA] Auto-fix indisponível no momento.";
        };
        readonly logs: {
            readonly modoConservador: "[GUARD] Modo conservador ativado - aplicando apenas correções de alta confiança";
            readonly validacaoEslint: "[SCAN] Executando validação ESLint pós-auto-fix...";
            readonly arquivoMovido: (origem: string, destino: string) => string;
            readonly arquivoRevertido: (origem: string, destino: string) => string;
            readonly arquivoRevertidoConteudo: (origem: string, destino: string) => string;
        };
        readonly resultados: {
            readonly sucesso: (count: number) => string;
            readonly falhas: (count: number) => string;
            readonly erroArquivo: (arquivo: string, erro: string) => string;
        };
        readonly dicas: {
            readonly executarLint: "[DICA] Execute `npm run lint` para verificar as correções";
            readonly executarBuild: "[DICA] Execute `npm run build` para verificar se o código compila";
            readonly removerDryRun: "[DICA] Remova --dry-run para aplicar correções automaticamente";
            readonly ajustarConfianca: "[DICA] Use --confidence <num> para ajustar o limiar (atual: 85%)";
        };
    };
    readonly relatorios: {
        readonly asyncPatterns: {
            readonly titulo: "[SUMMARY] Análise de Padrões Async/Await";
            readonly padroes: "\n[SUMMARY] Padrões de Uso do Código:";
            readonly recomendacoes: "\n[DICA] Recomendações de Correção:\n";
            readonly critico: "\u001B[31mERRO\u001B[0m CRÍTICO (Revisar Imediatamente):";
            readonly alto: "\n[!] ALTO (Revisar em Sprint Atual):";
            readonly salvo: (caminho: string) => string;
        };
        readonly fixTypes: {
            readonly analiseSalva: "[JSON] Análise detalhada salva em: .oraculo/fix-types-analise.json";
            readonly possibilidades: "└─ [SCAN] Possibilidades alternativas:";
            readonly sugestao: (texto: string) => string;
            readonly exportado: "[DOC] Relatórios de fix-types exportados:";
        };
        readonly guardian: {
            readonly baselineAceito: "[OK] Guardian: baseline aceito manualmente (--aceitar).";
            readonly exportado: "[DOC] Relatórios Guardian exportados:";
        };
    };
    readonly arquetipos: {
        readonly timeout: "[!] Detecção de arquetipos expirou (timeout)";
        readonly salvo: (caminho: string) => string;
        readonly falha: "[!] Falha ao gerar plano via arquétipos.";
        readonly falhaEstrategista: "[!] Estrategista falhou ao sugerir plano.";
        readonly falhaGeral: "[!] Falha geral no planejamento.";
    };
    readonly plugins: {
        readonly registrado: (nome: string, extensoes: string[]) => string;
        readonly configAtualizada: "[FIX] Configuração do registry atualizada";
        readonly erroParsear: (linguagem: string, erro: string) => string;
    };
    readonly executor: {
        readonly analiseCompleta: (tecnica: string, arquivo: string, duracao: string) => string;
    };
};
export default MENSAGENS_CORRECOES;
//# sourceMappingURL=correcoes-messages.d.ts.map