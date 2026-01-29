import type { NodePath } from '/traverse';
import type { Node } from '/types';
import type { ContextoExecucao, Ocorrencia } from '../index.js';
export type TecnicaAplicarResultado = Ocorrencia | Ocorrencia[] | null | undefined;
export interface Tecnica {
    nome?: string;
    global?: boolean;
    test?: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string, ast: NodePath<Node> | null, fullPath?: string, contexto?: ContextoExecucao) => TecnicaAplicarResultado | Promise<TecnicaAplicarResultado>;
}
export interface Analista extends Tecnica {
    nome: string;
    categoria?: string;
    descricao?: string;
    limites?: Record<string, number>;
    sempreAtivo?: boolean;
}
export declare function criarAnalista<A extends Analista>(def: A): A;
export declare function isAnalista(item: Tecnica | Analista): item is Analista;
export declare function asTecnicas(items: (Tecnica | Analista)[]): import('../index.js').Tecnica[];
//# sourceMappingURL=analistas.d.ts.map