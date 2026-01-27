export declare const SUGESTOES_COMANDOS: {
    readonly usarFull: "[DICA] Use --full para relatório detalhado com todas as informações";
    readonly usarJson: "[DICA] Use --json para saída estruturada em JSON";
    readonly combinarJsonExport: "[DICA] Combine --json com --export para salvar o relatório";
    readonly usarExport: "[DICA] Use --export <caminho> para salvar relatório em arquivo";
    readonly usarInclude: "[DICA] Use --include <pattern> para focar em arquivos específicos";
    readonly usarExclude: "[DICA] Use --exclude <pattern> para ignorar arquivos";
    readonly usarDryRun: "[DICA] Use --dry-run para simular sem modificar arquivos";
    readonly removerDryRun: "[DICA] Remova --dry-run para aplicar correções";
    readonly usarInterativo: "[DICA] Use --interactive para confirmar cada correção";
    readonly usarGuardian: "[DICA] Use --guardian para verificar integridade";
    readonly usarBaseline: "[DICA] Use --baseline para gerar baseline de referência";
    readonly usarAutoFix: "[DICA] Use --auto-fix para aplicar correções automáticas";
};
export declare const SUGESTOES_DIAGNOSTICO: {
    readonly modoExecutivo: "[EXEC] Modo executivo: mostrando apenas problemas críticos";
    readonly primeiraVez: readonly ["[DICA] Primeira vez? Comece com: oraculo diagnosticar --full", "[DICA] Use --help para ver todas as opções disponíveis"];
    readonly projetoGrande: readonly ["[DICA] Projeto grande detectado - use --include para análise incremental", "[DICA] Use --quick para análise rápida inicial"];
    readonly poucoProblemas: "\u001B[32mSUCESSO\u001B[0m Projeto em bom estado! Apenas {count} problemas menores encontrados.";
    readonly muitosProblemas: readonly ["[!] Muitos problemas encontrados - priorize os críticos primeiro", "[DICA] Use --executive para focar apenas no essencial"];
    readonly usarFiltros: "[DICA] Use filtros --include/--exclude para análise focada";
};
export declare const SUGESTOES_AUTOFIX: {
    readonly autoFixDisponivel: "[DICA] Correções automáticas disponíveis - use --auto-fix";
    readonly autoFixAtivo: "[!] Auto-fix ativo! Use --dry-run para simular sem modificar arquivos";
    readonly dryRunRecomendado: "[DICA] Recomendado: teste primeiro com --dry-run";
    readonly semMutateFS: "[!] Auto-fix indisponível no momento";
    readonly validarDepois: readonly ["[DICA] Execute npm run lint para verificar as correções", "[DICA] Execute npm run build para verificar se o código compila", "[DICA] Execute npm test para validar funcionalidades"];
};
export declare const SUGESTOES_GUARDIAN: {
    readonly guardianDesabilitado: "[GUARD] Guardian desativado. Use --guardian para verificar integridade";
    readonly primeiroBaseline: readonly ["[DICA] Primeira execução: gere um baseline com --baseline", "[DICA] O baseline serve como referência para mudanças futuras"];
    readonly driftDetectado: readonly ["[!] Mudanças detectadas em relação ao baseline", "[DICA] Revise as alterações antes de atualizar o baseline", "[DICA] Use --baseline para atualizar referência"];
    readonly integridadeOK: "\u001B[32mSUCESSO\u001B[0m Integridade verificada - nenhuma mudança não autorizada";
};
export declare const SUGESTOES_TIPOS: {
    readonly ajustarConfianca: (atual: number) => string;
    readonly revisar: (categoria: string) => string;
    readonly anyEncontrado: readonly ["[!] Tipos 'any' detectados - reduzem segurança do código", "[DICA] Priorize substituir 'as any' e casts explícitos"];
    readonly unknownLegitimo: "\u001B[32mSUCESSO\u001B[0m Usos legítimos de 'unknown' identificados";
    readonly melhoravelDisponivel: "[DICA] Casos melhoráveis encontrados - revisar em refatoração futura";
};
export declare const SUGESTOES_ARQUETIPOS: {
    readonly monorepo: readonly ["[DICA] Monorepo detectado: considere usar filtros por workspace", "[DICA] Use --include packages/* para analisar workspaces específicos"];
    readonly biblioteca: readonly ["[DICA] Biblioteca detectada: foque em exports públicos e documentação", "[DICA] Use --guardian para verificar API pública"];
    readonly cli: readonly ["[DICA] CLI detectado: priorize testes de comandos e flags", "[DICA] Valide tratamento de erros em comandos"];
    readonly api: readonly ["[DICA] API detectada: foque em endpoints e contratos", "[DICA] Considere testes de integração para rotas", "[DICA] Valide documentação de API (OpenAPI/Swagger)"];
    readonly frontend: readonly ["[DICA] Frontend detectado: priorize componentes e state management", "[DICA] Valide acessibilidade e performance"];
    readonly confiancaBaixa: readonly ["[!] Confiança baixa na detecção: estrutura pode ser híbrida", "[DICA] Use --criar-arquetipo --salvar-arquetipo para personalizar"];
};
export declare const SUGESTOES_REESTRUTURAR: {
    readonly backupRecomendado: readonly ["[!] IMPORTANTE: Faça backup antes de reestruturar!", "[DICA] Use git para versionar antes de mudanças estruturais"];
    readonly validarDepois: readonly ["[DICA] Execute testes após reestruturação", "[DICA] Valide imports e referências"];
    readonly usarDryRun: "[DICA] Primeira vez? Use --dry-run para ver mudanças propostas";
};
export declare const SUGESTOES_PODAR: {
    readonly cuidado: readonly ["[!] Poda remove arquivos permanentemente!", "[!] Certifique-se de ter backup ou controle de versão"];
    readonly revisar: "[DICA] Revise a lista de arquivos antes de confirmar";
    readonly usarDryRun: "[DICA] Use --dry-run para simular poda sem deletar";
};
export declare const SUGESTOES_METRICAS: {
    readonly baseline: readonly ["[DICA] Gere baseline para comparações futuras", "[DICA] Use --json para integração com CI/CD"];
    readonly tendencias: "[DICA] Execute regularmente para acompanhar tendências";
    readonly comparacao: "[DICA] Compare com execuções anteriores";
};
export declare const SUGESTOES_ZELADOR: {
    readonly imports: readonly ["[DICA] Zelador de imports corrige caminhos automaticamente", "[DICA] Use --dry-run para ver correções propostas"];
    readonly estrutura: readonly ["[DICA] Zelador de estrutura organiza arquivos por padrão", "[DICA] Configure padrões em oraculo.config.json"];
};
export declare function gerarSugestoesContextuais(contexto: {
    comando: string;
    temProblemas: boolean;
    countProblemas?: number;
    autoFixDisponivel?: boolean;
    guardianAtivo?: boolean;
    arquetipo?: string;
    flags?: string[];
}): string[];
export declare function formatarSugestoes(sugestoes: string[], titulo?: string): string[];
export declare const SUGESTOES: {
    readonly comandos: {
        readonly usarFull: "[DICA] Use --full para relatório detalhado com todas as informações";
        readonly usarJson: "[DICA] Use --json para saída estruturada em JSON";
        readonly combinarJsonExport: "[DICA] Combine --json com --export para salvar o relatório";
        readonly usarExport: "[DICA] Use --export <caminho> para salvar relatório em arquivo";
        readonly usarInclude: "[DICA] Use --include <pattern> para focar em arquivos específicos";
        readonly usarExclude: "[DICA] Use --exclude <pattern> para ignorar arquivos";
        readonly usarDryRun: "[DICA] Use --dry-run para simular sem modificar arquivos";
        readonly removerDryRun: "[DICA] Remova --dry-run para aplicar correções";
        readonly usarInterativo: "[DICA] Use --interactive para confirmar cada correção";
        readonly usarGuardian: "[DICA] Use --guardian para verificar integridade";
        readonly usarBaseline: "[DICA] Use --baseline para gerar baseline de referência";
        readonly usarAutoFix: "[DICA] Use --auto-fix para aplicar correções automáticas";
    };
    readonly diagnostico: {
        readonly modoExecutivo: "[EXEC] Modo executivo: mostrando apenas problemas críticos";
        readonly primeiraVez: readonly ["[DICA] Primeira vez? Comece com: oraculo diagnosticar --full", "[DICA] Use --help para ver todas as opções disponíveis"];
        readonly projetoGrande: readonly ["[DICA] Projeto grande detectado - use --include para análise incremental", "[DICA] Use --quick para análise rápida inicial"];
        readonly poucoProblemas: "\u001B[32mSUCESSO\u001B[0m Projeto em bom estado! Apenas {count} problemas menores encontrados.";
        readonly muitosProblemas: readonly ["[!] Muitos problemas encontrados - priorize os críticos primeiro", "[DICA] Use --executive para focar apenas no essencial"];
        readonly usarFiltros: "[DICA] Use filtros --include/--exclude para análise focada";
    };
    readonly autofix: {
        readonly autoFixDisponivel: "[DICA] Correções automáticas disponíveis - use --auto-fix";
        readonly autoFixAtivo: "[!] Auto-fix ativo! Use --dry-run para simular sem modificar arquivos";
        readonly dryRunRecomendado: "[DICA] Recomendado: teste primeiro com --dry-run";
        readonly semMutateFS: "[!] Auto-fix indisponível no momento";
        readonly validarDepois: readonly ["[DICA] Execute npm run lint para verificar as correções", "[DICA] Execute npm run build para verificar se o código compila", "[DICA] Execute npm test para validar funcionalidades"];
    };
    readonly guardian: {
        readonly guardianDesabilitado: "[GUARD] Guardian desativado. Use --guardian para verificar integridade";
        readonly primeiroBaseline: readonly ["[DICA] Primeira execução: gere um baseline com --baseline", "[DICA] O baseline serve como referência para mudanças futuras"];
        readonly driftDetectado: readonly ["[!] Mudanças detectadas em relação ao baseline", "[DICA] Revise as alterações antes de atualizar o baseline", "[DICA] Use --baseline para atualizar referência"];
        readonly integridadeOK: "\u001B[32mSUCESSO\u001B[0m Integridade verificada - nenhuma mudança não autorizada";
    };
    readonly tipos: {
        readonly ajustarConfianca: (atual: number) => string;
        readonly revisar: (categoria: string) => string;
        readonly anyEncontrado: readonly ["[!] Tipos 'any' detectados - reduzem segurança do código", "[DICA] Priorize substituir 'as any' e casts explícitos"];
        readonly unknownLegitimo: "\u001B[32mSUCESSO\u001B[0m Usos legítimos de 'unknown' identificados";
        readonly melhoravelDisponivel: "[DICA] Casos melhoráveis encontrados - revisar em refatoração futura";
    };
    readonly arquetipos: {
        readonly monorepo: readonly ["[DICA] Monorepo detectado: considere usar filtros por workspace", "[DICA] Use --include packages/* para analisar workspaces específicos"];
        readonly biblioteca: readonly ["[DICA] Biblioteca detectada: foque em exports públicos e documentação", "[DICA] Use --guardian para verificar API pública"];
        readonly cli: readonly ["[DICA] CLI detectado: priorize testes de comandos e flags", "[DICA] Valide tratamento de erros em comandos"];
        readonly api: readonly ["[DICA] API detectada: foque em endpoints e contratos", "[DICA] Considere testes de integração para rotas", "[DICA] Valide documentação de API (OpenAPI/Swagger)"];
        readonly frontend: readonly ["[DICA] Frontend detectado: priorize componentes e state management", "[DICA] Valide acessibilidade e performance"];
        readonly confiancaBaixa: readonly ["[!] Confiança baixa na detecção: estrutura pode ser híbrida", "[DICA] Use --criar-arquetipo --salvar-arquetipo para personalizar"];
    };
    readonly reestruturar: {
        readonly backupRecomendado: readonly ["[!] IMPORTANTE: Faça backup antes de reestruturar!", "[DICA] Use git para versionar antes de mudanças estruturais"];
        readonly validarDepois: readonly ["[DICA] Execute testes após reestruturação", "[DICA] Valide imports e referências"];
        readonly usarDryRun: "[DICA] Primeira vez? Use --dry-run para ver mudanças propostas";
    };
    readonly podar: {
        readonly cuidado: readonly ["[!] Poda remove arquivos permanentemente!", "[!] Certifique-se de ter backup ou controle de versão"];
        readonly revisar: "[DICA] Revise a lista de arquivos antes de confirmar";
        readonly usarDryRun: "[DICA] Use --dry-run para simular poda sem deletar";
    };
    readonly metricas: {
        readonly baseline: readonly ["[DICA] Gere baseline para comparações futuras", "[DICA] Use --json para integração com CI/CD"];
        readonly tendencias: "[DICA] Execute regularmente para acompanhar tendências";
        readonly comparacao: "[DICA] Compare com execuções anteriores";
    };
    readonly zelador: {
        readonly imports: readonly ["[DICA] Zelador de imports corrige caminhos automaticamente", "[DICA] Use --dry-run para ver correções propostas"];
        readonly estrutura: readonly ["[DICA] Zelador de estrutura organiza arquivos por padrão", "[DICA] Configure padrões em oraculo.config.json"];
    };
};
export default SUGESTOES;
//# sourceMappingURL=sugestoes.d.ts.map