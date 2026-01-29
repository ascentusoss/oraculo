// SPDX-License-Identifier: MIT
/**
 *  Análise de padrões async/await
 *
 * Pós-processador de relatórios que analisa ocorrências `unhandled-async`,
 * agrupa por criticidade e gera recomendações priorizadas.
 *
 * Migrado de: scripts/analisar-async-patterns.mjs
 * Data: 2025-11-02
 */

import path from 'node:path';

import { log, MENSAGENS_RELATORIOS_ANALISE } from '/messages/index.js';
import { salvarEstado } from '/persistence/persistencia.js';

import type { Ocorrencia } from '@';

import type {
  AsyncAnalysisOptions,
  AsyncAnalysisReport,
  AsyncArquivoRanqueado,
  AsyncCategoria,
  AsyncCategoriaStats,
  AsyncIssuesArquivo,
} from '../types/relatorios/async-analysis.js';

/**
 * Categoriza arquivo baseado no path
 */
function categorizarArquivo(relPath: string): AsyncCategoria {
  if (relPath.includes('cli/')) return 'cli';
  if (relPath.includes('analistas/')) return 'analistas';
  if (relPath.includes('core/') || relPath.includes('nucleo/')) return 'core';
  if (relPath.includes('guardian/')) return 'guardian';
  if (relPath.includes('auto/') || relPath.includes('zeladores/'))
    return 'auto';
  return 'outros';
}

/**
 * Extrai total de promises de uma mensagem
 */
function extrairTotalPromises(mensagem: string): number {
  const match = mensagem.match(/\((\d+) mais\)/);
  if (match) {
    return parseInt(match[1], 10) + 1;
  }
  return 1;
}

/**
 * Agrupa ocorrências por arquivo
 */
function agruparPorArquivo(
  ocorrencias: Ocorrencia[],
): Map<string, AsyncIssuesArquivo> {
  const porArquivo = new Map<string, AsyncIssuesArquivo>();

  for (const issue of ocorrencias) {
    const arquivo = issue.relPath;
    if (!porArquivo.has(arquivo)) {
      porArquivo.set(arquivo, {
        ocorrencias: [],
        nivel: (issue.nivel || 'info') as 'erro' | 'aviso' | 'info',
        total: 0,
      });
    }
    const info = porArquivo.get(arquivo);
    if (!info) continue;
    info.ocorrencias.push({
      linha: issue.linha,
      mensagem: issue.mensagem,
      nivel: (issue.nivel || 'info') as 'erro' | 'aviso' | 'info',
    });
    info.total += extrairTotalPromises(issue.mensagem);
  }

  return porArquivo;
}

/**
 * Analisa padrões async/await de um relatório
 */
export async function analisarAsyncPatterns(
  ocorrencias: Ocorrencia[],
  options: AsyncAnalysisOptions = {},
): Promise<AsyncAnalysisReport> {
  const topN = options.topN || 20;

  // Filtrar apenas unhandled-async
  const asyncIssues = ocorrencias.filter(
    (o) => o.mensagem && o.mensagem.includes('unhandled-async'),
  );

  log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.titulo);
  log.info(`Total de ocorrências unhandled-async: ${asyncIssues.length}`);

  // Agrupar por arquivo
  const porArquivo = agruparPorArquivo(asyncIssues);

  // Ordenar por total (decrescente)
  const arquivosOrdenados = Array.from(porArquivo.entries())
    .map(
      ([arquivo, info]): AsyncArquivoRanqueado => ({
        arquivo,
        total: info.total,
        nivel: (info.nivel || 'info') as 'erro' | 'aviso' | 'info',
      }),
    )
    .sort((a, b) => b.total - a.total);

  // Top arquivos
  log.info(
    `\n🔴 TOP ${Math.min(topN, arquivosOrdenados.length)} Arquivos com Mais Promises Não Tratadas:\n`,
  );

  for (let i = 0; i < Math.min(topN, arquivosOrdenados.length); i++) {
    const { arquivo, total, nivel } = arquivosOrdenados[i];
    const nivelIcon = nivel === 'erro' ? '🔴' : nivel === 'aviso' ? '⚠️' : 'ℹ️';
    log.info(`${i + 1}. ${nivelIcon} ${arquivo}`);
    log.info(`   └─ ${total} promise(s) sem tratamento de erro`);
    log.info(`   └─ Prioridade: ${nivel.toUpperCase()}\n`);
  }

  // Estatísticas por categoria
  const categorias: Record<AsyncCategoria, AsyncCategoriaStats> = {
    cli: { totalArquivos: 0, totalPromises: 0 },
    analistas: { totalArquivos: 0, totalPromises: 0 },
    core: { totalArquivos: 0, totalPromises: 0 },
    guardian: { totalArquivos: 0, totalPromises: 0 },
    auto: { totalArquivos: 0, totalPromises: 0 },
    outros: { totalArquivos: 0, totalPromises: 0 },
  };

  for (const { arquivo, total } of arquivosOrdenados) {
    const categoria = categorizarArquivo(arquivo);
    categorias[categoria].totalArquivos++;
    categorias[categoria].totalPromises += total;
  }

  log.info(`\n📂 Distribuição por Categoria:\n`);
  for (const [cat, stats] of Object.entries(categorias)) {
    if (stats.totalArquivos > 0) {
      log.info(
        `  ${cat.toUpperCase()}: ${stats.totalArquivos} arquivos, ${stats.totalPromises} promises`,
      );
    }
  }

  // Recomendações
  if (options.includeRecomendacoes !== false) {
    const criticos = arquivosOrdenados.filter((a) => a.nivel === 'erro');
    const altos = arquivosOrdenados.filter((a) => a.nivel === 'aviso');

    log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.recomendacoes);

    if (criticos.length > 0) {
      log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.critico);
      for (const { arquivo } of criticos.slice(0, 5)) {
        log.info(`   - ${arquivo}`);
      }
    }

    if (altos.length > 0) {
      log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.alto);
      for (const { arquivo } of altos.slice(0, 10)) {
        log.info(`   - ${arquivo}`);
      }
    }

    log.info(`\n📋 Próximos Passos:\n`);
    log.info('1. Revisar arquivos CRÍTICOS e adicionar .catch() ou try/catch');
    log.info('2. Para arquivos com muitas ocorrências, considerar refatoração');
    log.info('3. Validar se promises têm tratamento em nível superior');
    log.info('4. Adicionar testes para garantir robustez\n');
  }

  // Montar relatório
  const report: AsyncAnalysisReport = {
    timestamp: new Date().toISOString(),
    totalIssues: asyncIssues.length,
    totalFiles: porArquivo.size,
    topFiles: arquivosOrdenados.slice(0, topN),
    categorias,
  };

  if (options.includeRecomendacoes !== false) {
    const criticos = arquivosOrdenados.filter((a) => a.nivel === 'erro');
    const altos = arquivosOrdenados.filter((a) => a.nivel === 'aviso');

    report.recomendacoes = {
      criticos: criticos.slice(0, 5).map((a) => a.arquivo),
      altos: altos.slice(0, 10).map((a) => a.arquivo),
      proximosPassos: [
        'Revisar arquivos CRÍTICOS e adicionar .catch() ou try/catch',
        'Para arquivos com muitas ocorrências, considerar refatoração',
        'Validar se promises têm tratamento em nível superior',
        'Adicionar testes para garantir robustez',
      ],
    };
  }

  return report;
}

/**
 * Salva relatório de análise async
 */
export async function salvarRelatorioAsync(
  report: AsyncAnalysisReport,
  outputPath: string,
): Promise<void> {
  await salvarEstado(outputPath, report);
  log.sucesso(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.salvo(outputPath));
}

/**
 * Executa análise completa e salva relatório
 */
export async function executarAnaliseAsync(
  ocorrencias: Ocorrencia[],
  baseDir: string,
  options: AsyncAnalysisOptions = {},
): Promise<void> {
  const report = await analisarAsyncPatterns(ocorrencias, options);

  const reportPath = path.join(
    baseDir,
    'relatorios',
    'async-analysis-report.json',
  );
  await salvarRelatorioAsync(report, reportPath);
}
