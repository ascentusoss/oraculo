import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import type { ContextoExecucao, SinaisProjeto, TecnicaAplicarResultado } from '../../types/index.js';
export declare const sinaisDetectados: SinaisProjeto;
export declare const detectorEstrutura: {
    nome: string;
    global: boolean;
    test(_relPath: string): boolean;
    aplicar(_src: string, _relPath: string, _ast: NodePath<Node> | null, _fullPath?: string, contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=detector-estrutura.d.ts.map