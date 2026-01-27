// SPDX-License-Identifier: MIT
import {
  analistaPontuacao,
  analistaQuickFixes,
} from '@analistas/corrections/analista-pontuacao.js';
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';

import type { Analista, Ocorrencia } from '@';

// Punto de entrada único para correções automáticas
export const analistaCorrecaoAutomatica: Analista = {
  nome: 'correcoes-automaticas',
  categoria: 'melhorias',
  descricao:
    'Agrega técnicas de correções automáticas (quick-fixes e correções de pontuação)',

  test: (relPath: string): boolean => {
    // Delegamos aos analistas internos - já tipados como Analista
    const quickFixesApplies =
      typeof analistaQuickFixes.test === 'function'
        ? analistaQuickFixes.test(relPath)
        : false;
    const pontuacaoApplies =
      typeof analistaPontuacao.test === 'function'
        ? analistaPontuacao.test(relPath)
        : false;
    return Boolean(quickFixesApplies || pontuacaoApplies);
  },

  aplicar: (src: string, relPath: string, ast?: NodePath<Node> | null) => {
    const ocorrencias: Ocorrencia[] = [];
    if (typeof analistaQuickFixes.aplicar === 'function') {
      ocorrencias.push(
        ...(
          analistaQuickFixes.aplicar as (
            s: string,
            r: string,
            a?: NodePath<Node> | null,
          ) => Ocorrencia[]
        )(src, relPath, ast),
      );
    }
    if (typeof analistaPontuacao.aplicar === 'function') {
      ocorrencias.push(
        ...(
          analistaPontuacao.aplicar as (
            s: string,
            r: string,
            a?: NodePath<Node> | null,
          ) => Ocorrencia[]
        )(src, relPath, ast),
      );
    }
    return ocorrencias;
  },
};

export default analistaCorrecaoAutomatica;
