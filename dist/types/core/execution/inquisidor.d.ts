import type { Node } from '@babel/types';
import type { FileEntryWithAst, Ocorrencia } from '../../index.js';
import type { GuardianResult } from '../../guardian/resultado.js';
export interface SimbolosLog {
    info: string;
    sucesso: string;
    erro: string;
    aviso: string;
    debug: string;
    fase: string;
    passo: string;
    scan: string;
    guardian: string;
    pasta: string;
}
export interface OcorrenciaParseErro extends Omit<Ocorrencia, 'relPath'> {
    relPath?: string;
}
export declare function ocorrenciaParseErro(params: {
    mensagem: string;
    relPath?: string;
    origem?: string;
}): OcorrenciaParseErro;
export interface ResultadoInquisicaoCompleto {
    totalArquivos: number;
    arquivosAnalisados: string[];
    ocorrencias: Array<OcorrenciaParseErro | Ocorrencia>;
    timestamp: number;
    duracaoMs: number;
    fileEntries: FileEntryWithAst[];
    guardian: GuardianResult;
}
export type CacheValor = {
    ast: Node | null;
    timestamp: number;
};
export interface MetricasGlobais {
    parsingTimeMs: number;
    cacheHits: number;
    cacheMiss: number;
}
export interface EstadoIncArquivo {
    hash: string;
    ocorrencias?: Array<unknown>;
    analistas?: Record<string, {
        ocorrencias: number;
        duracaoMs: number;
    }>;
    reaproveitadoCount?: number;
}
export type EstadoIncrementalInquisidor = {
    arquivos: Record<string, EstadoIncArquivo>;
};
//# sourceMappingURL=inquisidor.d.ts.map