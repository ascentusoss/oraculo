// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Oráculo Contributors

/**
 * @module cli/diagnostico/handlers/auto-fix-handler
 * @description Handler modular para execução de auto-fix com validação de options
 * @see docs/REFACTOR-CLI-DIAGNOSTICAR.md - Sprint 2
 */

import { ExcecoesMessages } from '@core/messages/core/excecoes-messages.js';
import { log, MENSAGENS_AUTOFIX } from '@core/messages/index.js';

import type { AutoFixOptions, AutoFixResult, FileEntryWithAst } from '@';

// Re-export para compatibilidade
export type { AutoFixOptions, AutoFixResult };

/* -------------------------- Handler Principal -------------------------- */

/**
 * Executa o sistema de auto-fix com timeout e validação
 *
 * @param entries - Lista de arquivos para processar
 * @param options - Opções de execução
 * @returns Resultado da execução
 */
export async function executarAutoFix(
  entries: FileEntryWithAst[],
  options: AutoFixOptions,
): Promise<AutoFixResult> {
  try {
    // Log de início (se não silencioso)
    if (!options.silent) {
      const modoLabel = {
        conservative: 'conservador',
        balanced: 'balanceado',
        aggressive: 'agressivo',
      }[options.mode];

      if (options.dryRun) {
        console.log(`${MENSAGENS_AUTOFIX.iniciando(modoLabel)}`);
        console.log(MENSAGENS_AUTOFIX.dryRun);
      } else {
        console.log(MENSAGENS_AUTOFIX.iniciando(modoLabel));
      }
    }

    // Executar com timeout
    const timeout =
      options.timeout ?? (process.env.VITEST === 'true' ? 1000 : 60000);
    const resultado = await executarComTimeout(entries, options, timeout);

    // Log de conclusão (se não silencioso)
    if (!options.silent) {
      const { correcoesAplicadas } = resultado.stats;

      if (options.dryRun && resultado.stats.correcoesSugeridas > 0) {
        console.log(
          `Correções sugeridas: ${resultado.stats.correcoesSugeridas} em ${resultado.stats.arquivosAnalisados} arquivo(s)`,
        );
      } else if (correcoesAplicadas > 0) {
        console.log(MENSAGENS_AUTOFIX.concluido(correcoesAplicadas, 0));
      } else {
        console.log(MENSAGENS_AUTOFIX.naoDisponivel);
      }
    }

    return resultado;
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);

    if (!options.silent) {
      log.aviso(
        `${MENSAGENS_AUTOFIX.resultados.erroArquivo('', mensagem).split(':')[0]}: ${mensagem}`,
      );
    }

    // Retornar resultado vazio em caso de erro
    return {
      executado: false,
      mode: options.mode,
      dryRun: options.dryRun,
      stats: {
        arquivosAnalisados: 0,
        arquivosModificados: 0,
        correcoesAplicadas: 0,
        correcoesSugeridas: 0,
        correcoesPuladas: 0,
      },
    };
  }
}

/**
 * Executa auto-fix com proteção de timeout
 */
async function executarComTimeout(
  entries: FileEntryWithAst[],
  options: AutoFixOptions,
  timeoutMs: number,
): Promise<AutoFixResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(ExcecoesMessages.autoFixTimeout(timeoutMs)));
    }, timeoutMs);

    executarAutoFixInterno(entries, options)
      .then((resultado) => {
        clearTimeout(timer);
        resolve(resultado);
      })
      .catch((erro) => {
        clearTimeout(timer);
        reject(erro);
      });
  });
}

/**
 * Lógica interna de auto-fix
 */
async function executarAutoFixInterno(
  entries: FileEntryWithAst[],
  options: AutoFixOptions,
): Promise<AutoFixResult> {
  // NOTA: Integração real com sistema de auto-fix pendente de implementação
  // Por enquanto, retornar resultado mock
  const stats = {
    arquivosAnalisados: entries.length,
    arquivosModificados: 0,
    correcoesAplicadas: 0,
    correcoesSugeridas: 0,
    correcoesPuladas: 0,
  };

  return {
    executado: true,
    mode: options.mode,
    dryRun: options.dryRun,
    stats,
  };
}

/* -------------------------- Formatação para JSON -------------------------- */

/**
 * Formata resultado do auto-fix para saída JSON
 */
export function formatarAutoFixParaJson(
  resultado: AutoFixResult,
): Record<string, unknown> {
  return {
    executado: resultado.executado,
    mode: resultado.mode,
    dryRun: resultado.dryRun,
    stats: resultado.stats,
    ...(resultado.correcoesPorTipo && {
      correcoesPorTipo: resultado.correcoesPorTipo,
    }),
    ...(resultado.detalhes && { detalhes: resultado.detalhes }),
  };
}

/* -------------------------- Helpers de Confiança -------------------------- */

/**
 * Calcula limiar de confiança baseado no modo
 */
export function calcularLimiarConfianca(mode: AutoFixOptions['mode']): number {
  const limiares = {
    conservative: 90,
    balanced: 75,
    aggressive: 50,
  };

  return limiares[mode];
}

/**
 * Valida se uma correção deve ser aplicada
 */
export function deveAplicarCorrecao(
  confianca: number,
  limiar: number,
  mode: AutoFixOptions['mode'],
): boolean {
  // Conservative: apenas alta confiança
  if (mode === 'conservative') {
    return confianca >= limiar;
  }

  // Balanced: permite ajuste fino
  if (mode === 'balanced') {
    return confianca >= limiar * 0.9;
  }

  // Aggressive: aceita confiança mais baixa
  return confianca >= limiar * 0.75;
}

/* -------------------------- Exit Code Helper -------------------------- */

/**
 * Determina exit code baseado no resultado do auto-fix
 */
export function getExitCodeAutoFix(resultado: AutoFixResult): number {
  if (!resultado.executado) {
    return 1; // Erro na execução
  }

  if (resultado.dryRun) {
    return resultado.stats.correcoesSugeridas > 0 ? 0 : 0; // Sempre 0 em dry-run
  }

  // Sucesso se aplicou correções ou não havia correções
  return resultado.stats.correcoesAplicadas >= 0 ? 0 : 1;
}
