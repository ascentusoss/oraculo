import type { NodePath } from '@babel/traverse';
import type { ContextoExecucao, TecnicaAplicarResultado } from '../../types/index.js';
export declare const grafoDependencias: Map<string, Set<string>>;
export declare const importsUsadosDinamicamente: Map<string, Set<string>>;
export declare function isUsadoEmRegistroDinamico(src: string, importName: string): boolean;
export declare const detectorDependencias: {
    nome: string;
    test(relPath: string): boolean;
    aplicar(src: string, relPath: string, ast: NodePath | null, _fullPath?: string, contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=detector-dependencias.d.ts.map