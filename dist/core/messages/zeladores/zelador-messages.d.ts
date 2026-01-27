export declare const ICONES_ZELADOR: {
    readonly inicio: "[START]";
    readonly sucesso: "\u001B[32m[OK]\u001B[0m";
    readonly erro: "\u001B[31m[ERR]\u001B[0m";
    readonly aviso: "\u001B[33m[!]\u001B[0m";
    readonly resumo: "[SUMMARY]";
    readonly arquivo: "[FILE]";
    readonly diretorio: "[DIR]";
    readonly correcao: "[FIX]";
    readonly dryRun: "[DRY]";
    readonly estatistica: "[STATS]";
};
export declare const MENSAGENS_IMPORTS: {
    readonly titulo: "[FIX] Zelador de Imports - Iniciando correções...";
    readonly resumo: "[SUMMARY] Resumo:";
    readonly dryRunAviso: "[DRY] Modo dry-run: nenhum arquivo foi modificado";
    readonly sucessoFinal: "[OK] Correções aplicadas com sucesso!";
};
export declare const PROGRESSO_IMPORTS: {
    readonly diretorioNaoEncontrado: (dir: string) => string;
    readonly arquivoProcessado: (arquivo: string, count: number) => string;
    readonly arquivoErro: (arquivo: string, erro: string) => string;
    readonly lendoDiretorio: (dir: string) => string;
};
export declare const ERROS_IMPORTS: {
    readonly lerDiretorio: (dir: string, error: unknown) => string;
    readonly processar: (arquivo: string, error: unknown) => string;
};
export declare function formatarEstatistica(label: string, valor: number | string, icone?: string): string;
export declare function gerarResumoImports(stats: {
    processados: number;
    modificados: number;
    totalCorrecoes: number;
    erros: number;
    dryRun: boolean;
}): string[];
export declare const MENSAGENS_TIPOS: {
    readonly titulo: "[FIX] Zelador de Tipos - Iniciando correções...";
    readonly analisandoTipo: (tipo: string) => string;
    readonly tipoCorrigido: (antes: string, depois: string) => string;
};
export declare const MENSAGENS_ESTRUTURA: {
    readonly titulo: "[ORG] Zelador de Estrutura - Reorganizando arquivos...";
    readonly movendo: (origem: string, destino: string) => string;
    readonly criandoDiretorio: (dir: string) => string;
};
export declare const MENSAGENS_ZELADOR_GERAL: {
    readonly iniciando: (zelador: string) => string;
    readonly concluido: (zelador: string) => string;
    readonly erro: (zelador: string, mensagem: string) => string;
};
export declare const TEMPLATES_SAIDA: {
    readonly compacto: {
        readonly inicio: (nome: string) => string;
        readonly progresso: (atual: number, total: number) => string;
        readonly fim: (sucesso: boolean) => "\u001B[32m[OK]\u001B[0m" | "\u001B[31m[ERR]\u001B[0m";
    };
    readonly detalhado: {
        readonly inicio: (nome: string, descricao: string) => string;
        readonly progresso: (arquivo: string, atual: number, total: number) => string;
        readonly fim: (stats: {
            sucesso: number;
            falha: number;
        }) => string;
    };
};
export declare const EXIT_CODES: {
    readonly SUCESSO: 0;
    readonly ERRO_GERAL: 1;
    readonly ERRO_ARQUIVO: 2;
    readonly ERRO_PERMISSAO: 3;
    readonly CANCELADO_USUARIO: 4;
};
export declare function formatarListaArquivos(arquivos: string[], maxExibir?: number): string[];
export declare function formatarDuracao(ms: number): string;
export declare function formatarComTimestamp(mensagem: string): string;
//# sourceMappingURL=zelador-messages.d.ts.map