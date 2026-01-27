import type { FileEntryWithAst, Ocorrencia, OpcoesPlanejamento, PlanoSugestaoEstrutura, ResultadoPlanejamento } from '../../types/index.js';
export type { OpcoesPlanejamento, ResultadoPlanejamento };
export declare const OperarioEstrutura: {
    planejar(baseDir: string, fileEntriesComAst: FileEntryWithAst[], opcoes: OpcoesPlanejamento): Promise<ResultadoPlanejamento>;
    toMapaMoves(plano: PlanoSugestaoEstrutura | undefined): Array<{
        arquivo: string;
        ideal: string | null;
        atual: string;
    }>;
    aplicar(mapaMoves: {
        arquivo: string;
        ideal: string | null;
        atual: string;
    }[], fileEntriesComAst: FileEntryWithAst[], baseDir: string): Promise<void>;
    ocorrenciasParaMapa(ocorrencias?: Ocorrencia[]): Array<{
        arquivo: string;
        ideal: string | null;
        atual: string;
    }>;
};
//# sourceMappingURL=operario-estrutura.d.ts.map