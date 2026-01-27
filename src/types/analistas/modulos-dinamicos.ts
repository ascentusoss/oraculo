// SPDX-License-Identifier: MIT

import type { Analista, Tecnica } from '@';

/**
 * Tipos para módulos dinâmicos e registry de analistas
 */

/**
 * Módulo dinâmico carregado por import()
 */
export interface ModuloDinamico {
  default?: unknown;
  [exportName: string]: unknown;
}

/**
 * Módulo de analista potencial (pode ter diferentes formatos de export)
 */
export interface ModuloAnalista extends ModuloDinamico {
  // Exports comuns em módulos de analistas
  analistaCorrecaoAutomatica?: Analista | Tecnica;
  analistas?: (Analista | Tecnica)[];
  detectorDependencias?: Analista | Tecnica;
  detectorEstrutura?: Analista | Tecnica;
  analistaPontuacao?: Analista | Tecnica;
  analistaQuickFixes?: Analista | Tecnica;
  default?: Analista | Tecnica | (Analista | Tecnica)[];
}

/**
 * Entrada do registry que pode estar undefined (módulo não carregou)
 */
export type EntradaRegistry = Analista | Tecnica | undefined;

/**
 * Lista de analistas do registry (filtrando undefined)
 */
export type ListaAnalistas = (Analista | Tecnica)[];

/**
 * Informação resumida de analista para listagem
 */
export interface InfoAnalista {
  nome: string;
  categoria: string;
  descricao: string;
}

/**
 * Plugin de estrutura para corretor
 */
export interface PluginEstrutura {
  processar?: (config: Record<string, unknown>) => Promise<void> | void;
  validar?: (estrutura: Record<string, unknown>) => boolean;
  [metodo: string]: unknown;
}

/**
 * Módulo de plugin dinâmico
 */
export interface ModuloPlugin extends ModuloDinamico {
  default?:
    | PluginEstrutura
    | ((config: Record<string, unknown>) => PluginEstrutura);
  [exportName: string]: unknown;
}
