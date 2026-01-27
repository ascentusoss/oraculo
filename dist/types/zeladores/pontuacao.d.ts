export interface ProblemaPontuacao {
    tipo: string;
    posicao?: number;
    comprimento?: number;
    descricao: string;
    sugestao?: string;
    confianca?: number;
    relPath?: string;
    linha?: number;
    coluna?: number;
}
export interface ConfiguracaoPontuacaoZelador {
    aplicarAutomaticamente?: boolean;
    backupExt?: string;
    maxFixesPerFile?: number;
    normalizarUnicode?: boolean;
    colapsarPontuacaoRepetida?: boolean;
    corrigirEspacamento?: boolean;
    balancearParenteses?: boolean;
    detectarCaracteresIncomuns?: boolean;
    limiteCaracteresIncomuns?: number;
}
//# sourceMappingURL=pontuacao.d.ts.map