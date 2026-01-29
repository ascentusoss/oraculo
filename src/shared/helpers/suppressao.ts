// SPDX-License-Identifier: MIT
/**
 * Sistema de supressão inline para o Oráculo
 * Permite desabilitar regras específicas usando comentários no código
 *
 * Formatos suportados (qualquer sintaxe de comentário inline, ex.: //, #, --, ;, <!-- -->, blocos /* ... * /):
 * -  nome-da-regra
 * -  nome-da-regra
 * -  nome-da-regra
 */

import type { RegrasSuprimidas, SupressaoInfo } from '@';

export type { RegrasSuprimidas, SupressaoInfo };

/**
 * Analisa comentários do código fonte para extrair diretivas de supressão
 */
export function extrairSupressoes(src: string): RegrasSuprimidas {
  const linhas = src.split('\n');
  const porLinha = new Map<number, Set<string>>();
  const blocosAtivos = new Set<string>();

  const normalizarLinha = (linha: string): string => {
    let t = linha.trim();

    // Remove wrappers de comentários comuns (ordem importa para HTML -> bloco -> linha)
    if (t.startsWith('<!--'))
      t = t
        .replace(/^<!--/, '')
        .replace(/--!?>(\s*)?$/, '')
        .trim();
    if (t.startsWith('/*'))
      t = t.replace(/^\/\*/, '').replace(/\*\/$/, '').trim();
    if (t.startsWith('*')) t = t.replace(/^\*\s?/, '').trim(); // linhas internas de bloco

    // Comentários de linha: JS/TS, shell/Python, SQL, INI, outros
    t = t.replace(/^\/\//, '').trim();
    t = t.replace(/^#/, '').trim();
    t = t.replace(/^--/, '').trim();
    t = t.replace(/^;/, '').trim();

    return t;
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaNorm = normalizarLinha(linha);
    const numeroLinha = i + 1;

    //  regra1 regra2
    const matchNextLine = linhaNorm.match(/\s+(.+)/);
    if (matchNextLine) {
      const regras = matchNextLine[1].trim().split(/\s+/);
      const linhaAfetada = numeroLinha + 1;

      if (!porLinha.has(linhaAfetada)) {
        porLinha.set(linhaAfetada, new Set());
      }

      regras.forEach((regra) => {
        porLinha.get(linhaAfetada)?.add(regra.trim());
      });

      continue;
    }

    //  regra1 regra2
    const matchDisable = linhaNorm.match(/\s+(.+)/);
    if (matchDisable) {
      const regras = matchDisable[1].trim().split(/\s+/);
      regras.forEach((regra) => {
        blocosAtivos.add(regra.trim());
      });
      continue;
    }

    //  regra1 regra2
    const matchEnable = linhaNorm.match(/\s+(.+)/);
    if (matchEnable) {
      const regras = matchEnable[1].trim().split(/\s+/);
      regras.forEach((regra) => {
        blocosAtivos.delete(regra.trim());
      });
      continue;
    }

    //  (desabilita todas as regras)
    if (linhaNorm.includes('')) {
      blocosAtivos.add('*');
      continue;
    }

    //  (reabilita todas as regras)
    if (linhaNorm.includes('')) {
      blocosAtivos.clear();
      continue;
    }

    // Se há blocos ativos, aplicar a esta linha
    if (blocosAtivos.size > 0) {
      if (!porLinha.has(numeroLinha)) {
        porLinha.set(numeroLinha, new Set());
      }

      blocosAtivos.forEach((regra) => {
        porLinha.get(numeroLinha)?.add(regra);
      });
    }
  }

  return { porLinha, blocosAtivos };
}

/**
 * Verifica se uma regra está suprimida em uma determinada linha
 */
export function isRegraSuprimida(
  regra: string,
  linha: number,
  supressoes: RegrasSuprimidas,
): boolean {
  const regrasDaLinha = supressoes.porLinha.get(linha);

  if (!regrasDaLinha) {
    return false;
  }

  // Verifica supressão específica da regra
  if (regrasDaLinha.has(regra)) {
    return true;
  }

  // Verifica supressão global (*)
  if (regrasDaLinha.has('*')) {
    return true;
  }

  return false;
}

/**
 * Filtra ocorrências baseado em supressões inline
 */
export function filtrarOcorrenciasSuprimidas<
  T extends { linha?: number; tipo?: string },
>(ocorrencias: T[], nomeAnalista: string, src: string): T[] {
  const supressoes = extrairSupressoes(src);

  return ocorrencias.filter((ocorrencia) => {
    if (!ocorrencia.linha) {
      return true; // Mantém ocorrências sem linha (não podem ser suprimidas)
    }

    // Prioriza tipo específico da ocorrência, depois nome do analista
    const _identificadorRegra = ocorrencia.tipo || nomeAnalista || '';

    // Verifica se está suprimida pelo tipo específico OU pelo nome do analista
    const suprimidaPorTipo =
      ocorrencia.tipo &&
      isRegraSuprimida(ocorrencia.tipo, ocorrencia.linha, supressoes);
    const suprimidaPorAnalista = isRegraSuprimida(
      nomeAnalista,
      ocorrencia.linha,
      supressoes,
    );

    return !suprimidaPorTipo && !suprimidaPorAnalista;
  });
}
