import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import type { ContextoExecucao, HandlerInfo, TecnicaAplicarResultado } from '../../types/index.js';
export declare function extractHandlerInfo(node: Node | unknown): HandlerInfo | null;
export declare const analistaComandosCli: {
    nome: string;
    test: (relPath: string) => boolean;
    aplicar(conteudo: string, arquivo: string, ast: NodePath | null, _fullPath?: string, _contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=analista-comandos-cli.d.ts.map