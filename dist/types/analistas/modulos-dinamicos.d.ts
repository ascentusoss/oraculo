import type { Analista, Tecnica } from '../index.js';
export interface ModuloDinamico {
    default?: unknown;
    [exportName: string]: unknown;
}
export interface ModuloAnalista extends ModuloDinamico {
    analistaCorrecaoAutomatica?: Analista | Tecnica;
    analistas?: (Analista | Tecnica)[];
    detectorDependencias?: Analista | Tecnica;
    detectorEstrutura?: Analista | Tecnica;
    analistaPontuacao?: Analista | Tecnica;
    analistaQuickFixes?: Analista | Tecnica;
    default?: Analista | Tecnica | (Analista | Tecnica)[];
}
export type EntradaRegistry = Analista | Tecnica | undefined;
export type ListaAnalistas = (Analista | Tecnica)[];
export interface InfoAnalista {
    nome: string;
    categoria: string;
    descricao: string;
}
export interface PluginEstrutura {
    processar?: (config: Record<string, unknown>) => Promise<void> | void;
    validar?: (estrutura: Record<string, unknown>) => boolean;
    [metodo: string]: unknown;
}
export interface ModuloPlugin extends ModuloDinamico {
    default?: PluginEstrutura | ((config: Record<string, unknown>) => PluginEstrutura);
    [exportName: string]: unknown;
}
//# sourceMappingURL=modulos-dinamicos.d.ts.map