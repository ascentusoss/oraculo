import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import type { ContextoExecucao, Estatisticas, TecnicaAplicarResultado } from '../../types/index.js';
export declare const estatisticasUsoGlobal: Estatisticas;
export declare const analistaPadroesUso: {
    nome: string;
    global: boolean;
    test: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string, astInput: NodePath<Node> | Node | undefined | null, _fullPath?: string, contexto?: ContextoExecucao) => TecnicaAplicarResultado;
};
//# sourceMappingURL=analista-padroes-uso.d.ts.map