// SPDX-License-Identifier: MIT
/**
 * Motor de correção automática de tipos inseguros
 * Aplica correções baseadas em análise de contexto e confiança
 */

import { readFileSync, writeFileSync } from 'node:fs';

import type { CorrecaoConfig, CorrecaoResult, Ocorrencia } from '@';

/**
 * Aplica correção em um arquivo específico
 */
export async function aplicarCorrecaoArquivo(
  arquivo: string,
  ocorrencias: Array<{
    ocorrencia: Ocorrencia;
    categoria: 'legitimo' | 'melhoravel' | 'corrigir';
    confianca: number;
    sugestao?: string;
  }>,
  config: CorrecaoConfig,
): Promise<CorrecaoResult> {
  try {
    // Filtrar apenas ocorrências que devem ser corrigidas
    const paraCorrigir = ocorrencias.filter(
      (o) => o.categoria === 'corrigir' && o.confianca >= config.minConfianca,
    );

    if (paraCorrigir.length === 0) {
      return {
        sucesso: true,
        arquivo,
        linhasModificadas: 0,
      };
    }

    // Ler arquivo
    const conteudo = readFileSync(arquivo, 'utf-8');
    const linhas = conteudo.split('\n');
    let modificadas = 0;

    // Ordenar por linha (decrescente) para não afetar números de linha
    const ordenadas = [...paraCorrigir].sort(
      (a, b) => (b.ocorrencia.linha || 0) - (a.ocorrencia.linha || 0),
    );

    for (const item of ordenadas) {
      const linha = item.ocorrencia.linha;
      if (!linha || linha < 1 || linha > linhas.length) continue;

      const linhaIdx = linha - 1;
      const linhaOriginal = linhas[linhaIdx];

      // Aplicar correção baseada no tipo
      let linhaCorrigida = linhaOriginal;

      if (item.ocorrencia.tipo === 'tipo-inseguro-any') {
        // Substituir any por unknown (seguro por padrão)
        linhaCorrigida = linhaOriginal.replace(/:\s*any\b/g, ': unknown');
        linhaCorrigida = linhaCorrigida.replace(
          /\)\s*:\s*any\b/g,
          '): unknown',
        );
      } else if (item.ocorrencia.tipo === 'tipo-inseguro-any-assertion') {
        // Substituir as any por unknown (mais seguro)
        linhaCorrigida = linhaOriginal.replace(/as\s+any\b/g, 'as unknown');
      } else if (item.ocorrencia.tipo === 'tipo-inseguro-any-cast') {
        // Substituir <any> por <unknown>
        linhaCorrigida = linhaOriginal.replace(/<any>/g, '<unknown>');
      }

      if (linhaCorrigida !== linhaOriginal) {
        linhas[linhaIdx] = linhaCorrigida;
        modificadas++;
      }
    }

    // Se não houve modificações, retornar sucesso
    if (modificadas === 0) {
      return {
        sucesso: true,
        arquivo,
        linhasModificadas: 0,
      };
    }

    const novoConteudo = linhas.join('\n');

    // Se não é dry-run, escrever arquivo
    if (!config.dryRun) {
      writeFileSync(arquivo, novoConteudo, 'utf-8');
    }

    return {
      sucesso: true,
      arquivo,
      linhasModificadas: modificadas,
    };
  } catch (erro: unknown) {
    const mensagemErro = erro instanceof Error ? erro.message : String(erro);
    return {
      sucesso: false,
      arquivo,
      linhasModificadas: 0,
      erro: mensagemErro,
    };
  }
}

/**
 * Aplica correções em múltiplos arquivos
 */
export async function aplicarCorrecoesEmLote(
  porArquivo: Record<
    string,
    Array<{
      ocorrencia: Ocorrencia;
      categoria: 'legitimo' | 'melhoravel' | 'corrigir';
      confianca: number;
      sugestao?: string;
    }>
  >,
  config: CorrecaoConfig,
): Promise<{
  sucesso: number;
  falhas: number;
  resultados: CorrecaoResult[];
}> {
  const resultados: CorrecaoResult[] = [];
  let sucesso = 0;
  let falhas = 0;

  for (const [arquivo, ocorrencias] of Object.entries(porArquivo)) {
    const resultado = await aplicarCorrecaoArquivo(
      arquivo,
      ocorrencias,
      config,
    );
    resultados.push(resultado);

    if (resultado.sucesso && resultado.linhasModificadas > 0) {
      sucesso++;
    } else if (!resultado.sucesso) {
      falhas++;
    }
  }

  return { sucesso, falhas, resultados };
}
