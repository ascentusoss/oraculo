import type { ModoOperacao } from '../../../types/index.js';
export declare const ICONES_DIAGNOSTICO: {
    readonly inicio: "[SCAN]";
    readonly progresso: "[...]";
    readonly arquivos: "[DIR]";
    readonly analise: "[SCAN]";
    readonly arquetipos: "[ARQ]";
    readonly guardian: "[GUARD]";
    readonly autoFix: "[FIX]";
    readonly export: "[EXP]";
    readonly sucesso: "[OK]";
    readonly aviso: "[AVISO]";
    readonly erro: "[ERRO]";
    readonly info: "[i]";
    readonly dica: "[DICA]";
    readonly executive: "[STATS]";
    readonly rapido: "[FAST]";
};
export declare const MENSAGENS_INICIO: Record<ModoOperacao, string>;
export declare const MENSAGENS_PROGRESSO: {
    readonly varredura: (total: number) => string;
    readonly analise: (atual: number, total: number) => string;
    readonly arquetipos: "[ARQ] Detectando estrutura do projeto...";
    readonly guardian: "[GUARD] Verificando integridade...";
    readonly autoFix: (modo: string) => string;
    readonly export: (formato: string) => string;
};
export declare const MENSAGENS_CONCLUSAO: {
    readonly sucesso: (ocorrencias: number) => string;
    readonly semProblemas: "[OK] Nenhum problema encontrado! Código está em ótimo estado.";
    readonly exportado: (caminho: string) => string;
};
export declare const MENSAGENS_ERRO: {
    readonly falhaAnalise: (erro: string) => string;
    readonly falhaExport: (erro: string) => string;
    readonly falhaGuardian: (erro: string) => string;
    readonly falhaAutoFix: (erro: string) => string;
    readonly flagsInvalidas: (erros: string[]) => string;
};
export declare const MENSAGENS_AVISO: {
    readonly modoFast: "[i] Modo fast ativo (ORACULO_TEST_FAST=1)";
    readonly semMutateFS: "[AVISO] Auto-fix desabilitado.";
    readonly guardianDesabilitado: "[i] Guardian não executado";
    readonly arquetiposTimeout: "[AVISO] Detecção de arquetipos expirou (timeout)";
};
export declare const MENSAGENS_FILTROS: {
    readonly titulo: "Filtros Ativos";
    readonly include: (patterns: string[]) => string;
    readonly exclude: (patterns: string[]) => string;
    readonly nodeModules: (incluido: boolean) => string;
};
export declare const MENSAGENS_STATS: {
    readonly titulo: "Estatísticas da Análise";
    readonly arquivos: (total: number) => string;
    readonly ocorrencias: (total: number) => string;
    readonly porTipo: (tipo: string, count: number) => string;
    readonly duracao: (ms: number) => string;
};
export declare const MENSAGENS_GUARDIAN: {
    readonly iniciando: "[GUARD] Iniciando verificação Guardian...";
    readonly baseline: "Usando baseline existente";
    readonly fullScan: "Full scan ativo (ignorando ignores)";
    readonly saveBaseline: "Salvando novo baseline...";
    readonly status: {
        readonly verde: "[OK] Guardian: Status VERDE (integridade OK)";
        readonly amarelo: "[AVISO] Guardian: Status AMARELO (atenção necessária)";
        readonly vermelho: "[ERRO] Guardian: Status VERMELHO (problemas críticos)";
    };
    readonly drift: (count: number) => string;
};
export declare const MENSAGENS_ARQUETIPOS: {
    readonly detectando: "[ARQ] Detectando estrutura do projeto...";
    readonly identificado: (tipo: string, confianca: number) => string;
    readonly multiplos: (count: number) => string;
    readonly salvando: "Salvando arquétipo personalizado...";
    readonly salvo: (caminho: string) => string;
};
export declare const TEMPLATES_BLOCO: {
    readonly sugestoes: {
        readonly titulo: "Sugestões Rápidas";
        readonly formatarFlag: (flag: string, descricao: string) => string;
        readonly formatarDica: (dica: string) => string;
    };
    readonly resumo: {
        readonly titulo: "Resumo do Diagnóstico";
        readonly secoes: {
            readonly filtros: "Filtros Aplicados";
            readonly estatisticas: "Estatísticas";
            readonly arquetipos: "Estrutura do Projeto";
            readonly guardian: "Integridade (Guardian)";
            readonly autoFix: "Correções Automáticas";
        };
    };
};
export declare function formatarBlocoSugestoes(flagsAtivas: string[], dicas: string[]): string[];
export declare function formatarResumoStats(stats: {
    arquivos: number;
    ocorrencias: number;
    duracao: number;
    porTipo?: Record<string, number>;
}): string[];
export declare function formatarModoJson(ascii: boolean): string;
export declare const CABECALHOS: {
    readonly analistas: {
        readonly tituloFast: "[i] Analistas registrados (FAST MODE)";
        readonly titulo: "[i] Analistas registrados";
        readonly mdTitulo: "# Analistas Registrados";
    };
    readonly diagnostico: {
        readonly flagsAtivas: "Flags ativas:";
        readonly informacoesUteis: "Informações úteis:";
    };
    readonly reestruturar: {
        readonly prioridadeDomainsFlat: "[AVISO] --domains e --flat informados. Priorizando --domains.";
        readonly planoVazioFast: "[i] Plano vazio: nenhuma movimentação sugerida. (FAST MODE)";
        readonly nenhumNecessarioFast: "[OK] Nenhuma correção estrutural necessária. (FAST MODE)";
        readonly conflitosDetectadosFast: (count: number) => string;
    };
};
//# sourceMappingURL=diagnostico-messages.d.ts.map