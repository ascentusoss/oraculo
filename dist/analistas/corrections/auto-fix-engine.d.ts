import type { CorrecaoConfig, CorrecaoResult, Ocorrencia } from '../../types/index.js';
export declare function aplicarCorrecaoArquivo(arquivo: string, ocorrencias: Array<{
    ocorrencia: Ocorrencia;
    categoria: 'legitimo' | 'melhoravel' | 'corrigir';
    confianca: number;
    sugestao?: string;
}>, config: CorrecaoConfig): Promise<CorrecaoResult>;
export declare function aplicarCorrecoesEmLote(porArquivo: Record<string, Array<{
    ocorrencia: Ocorrencia;
    categoria: 'legitimo' | 'melhoravel' | 'corrigir';
    confianca: number;
    sugestao?: string;
}>>, config: CorrecaoConfig): Promise<{
    sucesso: number;
    falhas: number;
    resultados: CorrecaoResult[];
}>;
//# sourceMappingURL=auto-fix-engine.d.ts.map