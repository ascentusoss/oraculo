import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import type { Ocorrencia } from '../../types/index.js';
export declare const analistaFuncoesLongas: {
    aplicar(src: string, relPath: string, ast: NodePath<Node> | Node | null, _fullPath?: string): Ocorrencia[];
    nome: string;
    categoria: string;
    descricao: string;
    limites: {
        linhas: number;
        params: number;
        aninhamento: number;
    };
    test: (relPath: string) => boolean;
    global: false;
};
//# sourceMappingURL=analista-funcoes-longas.d.ts.map