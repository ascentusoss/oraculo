// SPDX-License-Identifier: MIT
/**
 * Tipos para estratégias de estrutura de projeto
 * Originalmente em: src/shared/helpers/estrutura.ts
 */

export type NomeacaoEstilo = 'kebab' | 'dots' | 'camel';

export interface OpcoesEstrategista {
  preset?: string; // nome do preset de estrutura
  raizCodigo?: string;
  criarSubpastasPorEntidade?: boolean;
  // Quando true, apenas categorias presentes em `categoriasMapa` serão consideradas para movimentação.
  // Útil para modo "manual" (sem preset), onde o usuário decide explicitamente o que mover.
  apenasCategoriasConfiguradas?: boolean;
  estiloPreferido?: NomeacaoEstilo;
  categoriasMapa?: Record<string, string>;
  ignorarPastas?: string[];
}

export interface ParseNomeResultado {
  entidade: string | null;
  categoria: string | null;
}
