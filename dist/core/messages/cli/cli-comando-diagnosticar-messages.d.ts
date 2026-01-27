export declare const CliComandoDiagnosticarMessages: {
    readonly linhaEmBranco: "";
    readonly fastModeTipo: "diagnostico";
    readonly sugestoesHeader: "┌── Sugestões rápidas ─────────────────────────────────────────";
    readonly sugestoesFooter: "└───────────────────────────────────────────────────────────────";
    readonly nenhumaFlagRelevante: "Nenhuma flag relevante detectada — execute com --help para ver todas.";
    readonly detalheLinha: (texto: string) => string;
    readonly detalheSaidaEstruturada: "Saída estruturada: imprime JSON (útil para CI). Combine com --export para salvar arquivo.";
    readonly detalheGuardian: "Guardian: executa verificação de integridade (recomendado para deploys).";
    readonly detalheExecutive: "Executive: mostra apenas problemas críticos (ideal para reuniões executivas).";
    readonly detalheFull: "Full: gera relatório detalhado localmente (pode ser verboso).";
    readonly detalheFast: "Fast: processamento paralelo com Workers (ideal para projetos grandes e CI).";
    readonly detalheCompact: "Compact: consolida progresso e mostra apenas o essencial.";
    readonly detalheAutoFix: "Auto-fix: aplica correções rápidas. Use com cautela.";
    readonly detalheAutoFixConservative: "Atalho: equivalente a --auto-fix --auto-fix-mode conservative";
    readonly detalheIncludePatterns: (count: number, joined: string) => string;
    readonly detalheExcludePatterns: (count: number, joined: string) => string;
    readonly detalheExport: (relDir: string) => string;
    readonly detalheExportFull: "Export-full: gera shards gzip e um manifest (pode ser grande). Use apenas quando precisar do dump completo.";
    readonly detalheLogLevel: (logLevel: string) => string;
    readonly dicaPrefiraLogLevelDebug: "Dica: prefira --log-level debug ao invés de --debug/--dev legados.";
    readonly dicaAutoFixConservative: "Dica: --auto-fix-conservative é um atalho; prefira usar explicitamente --auto-fix --auto-fix-mode conservative para clareza.";
    readonly spinnerExecutando: "[SCAN] Diagnóstico em execução...";
    readonly spinnerFase: (titulo: string) => string;
    readonly spinnerConcluido: "Diagnóstico concluído.";
    readonly spinnerFalhou: "Diagnóstico falhou.";
};
//# sourceMappingURL=cli-comando-diagnosticar-messages.d.ts.map