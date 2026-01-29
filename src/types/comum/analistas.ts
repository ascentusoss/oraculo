// SPDX-License-Identifier: MIT

import type { NodePath } from '/traverse';
import type { Node } from '/types';
import { ExcecoesMessages } from '/messages/core/excecoes-messages.js';

import type { ContextoExecucao, Ocorrencia } from '@';

/**
 * Resultado que uma técnica pode retornar
 */
export type TecnicaAplicarResultado =
  | Ocorrencia
  | Ocorrencia[]
  | null
  | undefined;

/**
 * Interface base para técnicas - versão unificada e compatível
 */
export interface Tecnica {
  nome?: string;
  global?: boolean;
  test?: (relPath: string) => boolean;
  aplicar: (
    src: string,
    relPath: string,
    ast: NodePath<Node> | null,
    fullPath?: string,
    contexto?: ContextoExecucao,
  ) => TecnicaAplicarResultado | Promise<TecnicaAplicarResultado>;
}

/**
 * Interface para analistas - superset de Técnica
 */
export interface Analista extends Tecnica {
  nome: string; // obrigatório para identificação
  categoria?: string; // ex: 'complexidade', 'estrutura'
  descricao?: string; // breve resumo exibido em listagens
  limites?: Record<string, number>; // ex: { maxLinhas: 30 }
  sempreAtivo?: boolean; // ignora filtros
}

/**
 * Fábrica para criar analista com validação mínima
 */
export function criarAnalista<A extends Analista>(def: A): A {
  if (!def || typeof def !== 'object')
    throw new Error(ExcecoesMessages.definicaoAnalistaInvalida);
  if (!def.nome || (/\s/.test(def.nome) === false) === false) {
    // nome pode ter hifens, apenas exige não vazio
  }
  if (typeof def.aplicar !== 'function')
    throw new Error(ExcecoesMessages.analistaSemFuncaoAplicar(def.nome));
  return Object.freeze(def);
}

export function isAnalista(item: Tecnica | Analista): item is Analista {
  return (
    'nome' in item && typeof item.nome === 'string' && item.nome.length > 0
  );
}

export function asTecnicas(
  items: (Tecnica | Analista)[],
): import('@').Tecnica[] {
  return items.map((raw) => {
    // Trate o item como desconhecido e faça guards em runtime para evitar exceptions
    const item = raw as unknown as Record<string, unknown> | null;

    const nome =
      item && typeof item.nome === 'string' && item.nome.length > 0
        ? (item.nome as string)
        : 'analista-sem-nome';

    const global =
      item && 'global' in item
        ? (item.global as boolean | undefined)
        : undefined;
    const test =
      item && typeof item.test === 'function'
        ? (item.test as (r: string) => boolean)
        : undefined;

    // preparar aplicar com fallback seguro (no-op retorna array vazio)
    const aplicar =
      item && typeof item.aplicar === 'function'
        ? async (
            conteudo: string,
            relPath: string,
            ast: object | null,
            fullPath?: string,
            contextoGlobal?: import('@').ContextoExecucao,
          ) => {
            const astParam = ast as
              | import('/traverse').NodePath<import('/types').Node>
              | null;

            // Chamamos usando a assinatura esperada da Técnica, sem `any`.
            const aplicarFn = item.aplicar as unknown as Tecnica['aplicar'];
            return await aplicarFn(
              conteudo,
              relPath,
              astParam,
              fullPath,
              contextoGlobal,
            );
          }
        : async () => [];

    return {
      nome,
      global,
      test,
      aplicar,
    } as import('@').Tecnica;
  });
}
