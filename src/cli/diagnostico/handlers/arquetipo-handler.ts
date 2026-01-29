// SPDX-License-Identifier: MIT
/**
 * 🏗️ Arquetipo Handler
 *
 * Gerencia detecção e análise de estrutura do projeto
 * - Detecta arquetipos com timeout
 * - Identifica padrões de projeto
 * - Salva arquetipos personalizados
 * - Formata resultados
 */

import { detectarArquetipos } from '/detectores/detector-arquetipos.js';
import { config } from '/config/config.js';
import { CliArquetipoHandlerMessages } from '/messages/cli/cli-arquetipo-handler-messages.js';
import { MENSAGENS_ARQUETIPOS } from '/messages/core/diagnostico-messages.js';
import { log } from '/messages/index.js';

import type { ArquetipoOptions, ArquetipoResult, FileEntryWithAst } from '@';

// Re-export para compatibilidade
export type { ArquetipoOptions, ArquetipoResult };

/**
 * Timeout padrão para detecção (em ms)
 */
const DEFAULT_TIMEOUT_MS = process.env.VITEST ? 1000 : 30000;

/**
 * Executa detecção de arquetipos com timeout
 */
export async function executarDeteccaoArquetipos(
  entries: FileEntryWithAst[],
  baseDir: string,
  options: ArquetipoOptions,
): Promise<ArquetipoResult> {
  // Se desabilitado, retorna resultado vazio
  if (!options.enabled) {
    return {
      executado: false,
    };
  }

  try {
    // Log de início (se não silencioso)
    if (!options.silent) {
      log.info(MENSAGENS_ARQUETIPOS.detectando);
    }

    // Preparar contexto
    const ctx = {
      arquivos: entries,
      baseDir,
    };

    // Executar detecção com timeout
    const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;
    const resultado = await executarComTimeout(
      detectarArquetipos(ctx, baseDir),
      timeoutMs,
    );

    // Se timeout ou erro, retorna resultado parcial
    if (!resultado) {
      if (!options.silent) {
        log.aviso(CliArquetipoHandlerMessages.timeoutDeteccao);
      }
      return {
        executado: true,
        erro: 'timeout',
      };
    }

    // Processar resultado
    const arquetipos = resultado.candidatos || [];
    const principal = arquetipos.length > 0 ? arquetipos[0] : undefined; // Log de resultado (se não silencioso)
    if (!options.silent && principal) {
      log.info(
        MENSAGENS_ARQUETIPOS.identificado(principal.nome, principal.confidence),
      );

      if (arquetipos.length > 1) {
        log.info(MENSAGENS_ARQUETIPOS.multiplos(arquetipos.length));
      }
    }

    // Salvar se solicitado
    let salvo = false;
    if (options.salvar && resultado) {
      salvo = await salvarArquetipo(resultado, baseDir, options.silent);
    }

    return {
      executado: true,
      arquetipos: arquetipos.map((a) => ({
        tipo: a.nome,
        confianca: a.confidence,
        caracteristicas: a.matchedRequired || [],
      })),
      principal: principal
        ? {
            tipo: principal.nome,
            confianca: principal.confidence,
          }
        : undefined,
      salvo,
    };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);

    if (!options.silent) {
      log.aviso(CliArquetipoHandlerMessages.erroDeteccao(mensagem));
    }

    // Em DEV_MODE, log mais detalhado
    if (config.DEV_MODE) {
      console.error(CliArquetipoHandlerMessages.devErroPrefixo, erro);
    }

    return {
      executado: true,
      erro: mensagem,
    };
  }
}

/**
 * Executa função com timeout
 */
async function executarComTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | undefined> {
  try {
    const timeoutPromise = new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), timeoutMs),
    );

    return (await Promise.race([promise, timeoutPromise])) as T | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Salva arquetipo personalizado
 */
async function salvarArquetipo(
  resultado: Awaited<ReturnType<typeof detectarArquetipos>>,
  baseDir: string,
  silent?: boolean,
): Promise<boolean> {
  try {
    if (!silent) {
      log.info(MENSAGENS_ARQUETIPOS.salvando);
    }

    // Importação dinâmica para evitar dependências circulares
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    // Preparar dados do arquetipo
    const arquetipo = {
      timestamp: new Date().toISOString(),
      projeto: path.basename(baseDir),
      arquetipos: resultado.candidatos,
      baseline: resultado.baseline,
      drift: resultado.drift,
    };

    // Salvar em arquivo
    const outputPath = path.join(baseDir, 'oraculo.repo.arquetipo.json');
    await fs.writeFile(outputPath, JSON.stringify(arquetipo, null, 2), 'utf-8');

    if (!silent) {
      log.sucesso(MENSAGENS_ARQUETIPOS.salvo(outputPath));
    }

    return true;
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);

    if (!silent) {
      log.aviso(CliArquetipoHandlerMessages.falhaSalvar(mensagem));
    }

    return false;
  }
}

/**
 * Formata resultado de arquetipos para JSON
 */
export function formatarArquetiposParaJson(
  result: ArquetipoResult,
): Record<string, unknown> {
  if (!result.executado) {
    return {
      executado: false,
    };
  }

  if (result.erro) {
    return {
      executado: true,
      erro: result.erro,
    };
  }

  return {
    executado: true,
    arquetipos: result.arquetipos || [],
    principal: result.principal || null,
    salvo: result.salvo || false,
  };
}

/**
 * Gera sugestões baseadas no arquetipo detectado
 */
export function gerarSugestoesArquetipo(result: ArquetipoResult): string[] {
  const sugestoes: string[] = [];

  if (!result.executado || !result.principal) {
    return sugestoes;
  }

  const { tipo, confianca } = result.principal;

  // Sugestões baseadas no tipo de projeto
  switch (tipo.toLowerCase()) {
    case 'monorepo':
      sugestoes.push(
        '💡 Monorepo detectado: considere usar filtros por workspace',
      );
      sugestoes.push(
        '💡 Use --include packages/* para analisar workspaces específicos',
      );
      break;

    case 'biblioteca':
    case 'library':
      sugestoes.push(
        '💡 Biblioteca detectada: foque em exports públicos e documentação',
      );
      sugestoes.push('💡 Use --guardian para verificar API pública');
      break;

    case 'cli':
    case 'cli-tool':
      sugestoes.push('💡 CLI detectado: priorize testes de comandos e flags');
      break;

    case 'api':
    case 'api-rest':
    case 'api-server':
      sugestoes.push('💡 API detectada: foque em endpoints e contratos');
      sugestoes.push('💡 Considere testes de integração para rotas');
      break;

    case 'frontend':
    case 'web-app':
      sugestoes.push(
        '💡 Frontend detectado: priorize componentes e state management',
      );
      break;
  }

  // Sugestão baseada em confiança
  if (confianca < 70) {
    sugestoes.push(
      '⚠️  Confiança baixa na detecção: estrutura pode ser híbrida',
    );
    sugestoes.push(
      '💡 Use --criar-arquetipo --salvar-arquetipo para personalizar',
    );
  }

  return sugestoes;
}
