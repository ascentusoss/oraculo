import type { MoveReversao } from '../../types/index.js';
export declare class GerenciadorMapaReversao {
    private readonly mapaPath;
    private mapa;
    constructor(opts?: {
        mapaPath?: string;
    });
    carregar(): Promise<void>;
    salvar(): Promise<void>;
    registrarMove(origem: string, destino: string, motivo: string, conteudoOriginal?: string, conteudoFinal?: string, skipSalvar?: boolean): Promise<string>;
    removerMove(id: string): Promise<boolean>;
    obterMoves(): MoveReversao[];
    obterMovesPorArquivo(arquivo: string): MoveReversao[];
    podeReverterArquivo(arquivo: string): boolean;
    reverterMove(id: string, baseDir?: string): Promise<boolean>;
    reverterArquivo(arquivo: string, baseDir?: string): Promise<boolean>;
    listarMoves(): string;
    limpar(): Promise<void>;
}
export declare const mapaReversao: GerenciadorMapaReversao;
//# sourceMappingURL=mapa-reversao.d.ts.map