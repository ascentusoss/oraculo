// SPDX-License-Identifier: MIT
/**
 * Wrapper para analistas que adiciona suporte automático a supressões inline
 */

import type { Analista, Ocorrencia } from '@';

import { filtrarOcorrenciasSuprimidas } from './suppressao.js';

/**
 * Envolve um analista para adicionar suporte a supressões inline
 */
export function comSupressaoInline(analista: Analista): Analista {
  const aplicarOriginal = analista.aplicar;

  return {
    ...analista,
    aplicar: (src, relPath, ast, fullPath, contexto) => {
      // Executa o analista original
      const resultado = aplicarOriginal(src, relPath, ast, fullPath, contexto);

      // Se o resultado é uma Promise, aguarda antes de filtrar
      if (resultado instanceof Promise) {
        return resultado.then((ocorrencias) => {
          const arr = !ocorrencias
            ? []
            : Array.isArray(ocorrencias)
              ? ocorrencias
              : [ocorrencias];
          return filtrarOcorrenciasSuprimidas(
            arr as Ocorrencia[],
            analista.nome,
            src,
          );
        });
      }

      // Filtra ocorrências baseado em supressões inline
      const arr = !resultado
        ? []
        : Array.isArray(resultado)
          ? resultado
          : [resultado];
      return filtrarOcorrenciasSuprimidas(
        arr as Ocorrencia[],
        analista.nome,
        src,
      );
    },
  };
}

/**
 * Aplica o wrapper de supressão a múltiplos analistas
 */
export function aplicarSupressaoAAnalistas(analistas: Analista[]): Analista[] {
  return analistas.map(comSupressaoInline);
}
