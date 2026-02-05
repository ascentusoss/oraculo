// SPDX-License-Identifier: MIT
import crypto from 'node:crypto';

import { config } from '@core/config/config.js';
import { formatMs } from '@core/config/format.js';
import { log, logCore } from '@core/messages/index.js';
import { logAnalistas } from '@core/messages/log/log-helper.js';
import { WorkerPool } from '@core/workers/worker-pool.js';
import { lerEstado, salvarEstado } from '@shared/persistence/persistencia.js';
import XXH from 'xxhashjs';

import type {
  ContextoExecucao,
  EstadoIncremental,
  FileEntryWithAst,
  GuardianResult,
  MetricaAnalista,
  MetricaExecucao,
  MetricasGlobais,
  Ocorrencia,
  ResultadoInquisicao,
  Tecnica,
} from '@';
import { ocorrenciaErroAnalista } from '@';
// Fallback para infoDestaque quando mock de log não implementa
const __infoD = (msg: string) => {
  const l = log as unknown as {
    infoDestaque?: (m: string) => void;
    info: (m: string) => void;
  };
  if (typeof l.infoDestaque === 'function') return l.infoDestaque(msg);
  return l.info(msg);
};

export async function executarInquisicao(
  fileEntriesComAst: FileEntryWithAst[],
  tecnicas: Tecnica[],
  baseDir: string,
  guardianResultado: GuardianResult,
  opts?: { verbose?: boolean; compact?: boolean; fast?: boolean },
): Promise<ResultadoInquisicao> {
  const ocorrencias: Ocorrencia[] = [];
  const metricasAnalistas: MetricaAnalista[] = [];
  const arquivosValidosSet = new Set(fileEntriesComAst.map((f) => f.relPath));
  const contextoGlobal: ContextoExecucao = {
    baseDir,
    arquivos: fileEntriesComAst,
    ambiente: {
      arquivosValidosSet,
      guardian: guardianResultado,
    },
  };
  const inicioExecucao = performance.now();

  // Narrowing helper: detecta se um objeto se parece com NodePath do babel
  function isNodePath(
    x: unknown, // Type guard intencional: aceita entrada arbitrária para validação estrutural
  ): x is import('@babel/traverse').NodePath<import('@babel/types').Node> {
    if (typeof x !== 'object' || x === null) return false;
    const maybe = x as Record<string, unknown>;
    if (!('node' in maybe)) return false;
    const node = maybe.node as unknown;
    if (typeof node !== 'object' || node === null) return false;
    return 'type' in (node as Record<string, unknown>);
  }

  // Incremental: carregar estado anterior (tipo importado de @types)
  let estadoIncremental: EstadoIncremental | null = null;
  if (config.ANALISE_INCREMENTAL_ENABLED) {
    const lido = await lerEstado<EstadoIncremental>(
      config.ANALISE_INCREMENTAL_STATE_PATH,
    ).catch(() => null);
    if (lido && lido.versao === config.ANALISE_INCREMENTAL_VERSION)
      estadoIncremental = lido;
  }
  const novoEstado: EstadoIncremental = {
    versao: config.ANALISE_INCREMENTAL_VERSION,
    arquivos: {},
    estatisticas: {
      totalReaproveitamentos: 0,
      totalArquivosProcessados: 0,
      ultimaDuracaoMs: 0,
    },
  };

  function hashConteudo(c: string) {
    try {
      // Usa xxhash64 (seed arbitrária) para performance
      return XXH.h64(c, 0xabcd).toString(16);
    } catch {
      // Fallback para SHA1 se algo der errado
      // SHA1 usado apenas para cache de AST (fingerprinting de conteúdo)
      // Não é usado para segurança/criptografia - contexto: deduplicação de parsing
      return crypto.createHash('sha1').update(c).digest('hex');
    }
  }

  // Técnicas globais
  for (const tecnica of tecnicas) {
    if (tecnica.global) {
      // início medido apenas por analista específico (inicioAnalista)
      const timeoutMs = config.ANALISE_TIMEOUT_POR_ANALISTA_MS;
      try {
        const inicioAnalista = performance.now();

        // Implementa timeout para analistas globais se configurado
        let resultado: Awaited<ReturnType<typeof tecnica.aplicar>> | undefined;

        if (timeoutMs > 0) {
          // Promise.race entre execução do analista global e timeout
          const execPromise = tecnica.aplicar(
            '',
            '',
            null,
            undefined,
            contextoGlobal,
          );
          resultado = await (async () => {
            let timer: NodeJS.Timeout | null = null;
            try {
              const race = Promise.race([
                execPromise,
                new Promise<never>((_, reject) => {
                  timer = setTimeout(
                    () =>
                      reject(
                        new Error(
                          `Timeout: analista global '${tecnica.nome}' excedeu ${timeoutMs}ms`,
                        ),
                      ),
                    timeoutMs,
                  );
                }),
              ]);
              return await race;
            } finally {
              if (timer) clearTimeout(timer);
            }
          })();
        } else {
          // Execução sem timeout
          resultado = await tecnica.aplicar(
            '',
            '',
            null,
            undefined,
            contextoGlobal,
          );
        }

        if (Array.isArray(resultado)) {
          ocorrencias.push(...resultado);
        }

        const duracaoMs = performance.now() - inicioAnalista;
        if (config.ANALISE_METRICAS_ENABLED) {
          metricasAnalistas.push({
            nome: tecnica.nome || 'desconhecido',
            duracaoMs,
            ocorrencias: Array.isArray(resultado)
              ? resultado.length
              : resultado
                ? 1
                : 0,
            global: true,
          });
        }
        if (opts?.verbose) {
          log.sucesso(`Técnica global "${tecnica.nome}"`);
        }
        if (config.LOG_ESTRUTURADO) {
          log.info(
            JSON.stringify({
              tipo: 'analista',
              escopo: 'global',
              nome: tecnica.nome,
              duracaoMs,
              ocorrencias: metricasAnalistas.at(-1)?.ocorrencias,
            }),
          );
        }
      } catch (error) {
        const err = error as Error;
        const isTimeout = err.message.includes('Timeout: analista global');
        const nivelLog = isTimeout ? 'aviso' : 'erro';
        const prefixo = isTimeout ? '⏰' : '❌';

        // Log apropriado baseado no tipo de erro
        if (nivelLog === 'aviso') {
          log.aviso(`${prefixo} ${err.message}`);
        } else {
          log.erro(
            `${prefixo} Erro na técnica global '${tecnica.nome}': ${err.message}`,
          );
          // Exibe stack trace em modo verbose ou debug
          if (err.stack) {
            if (opts?.verbose || config.DEV_MODE) {
              log.info('Stack trace:');
              log.info(err.stack);
            }
          }
        }

        // Registra ocorrência de erro/timeout
        ocorrencias.push(
          ocorrenciaErroAnalista({
            mensagem: isTimeout
              ? `Timeout na técnica global '${tecnica.nome}': ${timeoutMs}ms excedido`
              : `Falha na técnica global '${tecnica.nome}': ${err.message}`,
            relPath: '[execução global]',
            origem: tecnica.nome,
            stack: !isTimeout && err.stack ? err.stack : undefined,
          }),
        );
      }
    }
  }

  // Modo Fast: usar WorkerPool para processamento paralelo
  if (opts?.fast && fileEntriesComAst.length > 0) {
    log.info('🚀 Modo rápido ativado: processamento paralelo com Workers');

    const workerPool = new WorkerPool({
      enabled: true,
      maxWorkers: config.WORKER_POOL_MAX_WORKERS || undefined,
      batchSize: 10,
      timeoutMs: config.ANALISE_TIMEOUT_POR_ANALISTA_MS,
    });

    const resultadoWorkers = await workerPool.processFiles(
      fileEntriesComAst,
      tecnicas.filter((t) => !t.global), // Apenas técnicas não-globais
      contextoGlobal,
    );

    ocorrencias.push(...resultadoWorkers.occurrences);
    metricasAnalistas.push(...resultadoWorkers.metrics);

    const duracaoTotal = performance.now() - inicioExecucao;
    log.sucesso(
      `✅ Análise rápida concluída: ${fileEntriesComAst.length} arquivos em ${formatMs(duracaoTotal)}`,
    );

    // Salvar estado incremental (se habilitado)
    if (config.ANALISE_INCREMENTAL_ENABLED) {
      try {
        for (const entry of fileEntriesComAst) {
          const hash = hashConteudo(entry.content ?? '');
          novoEstado.arquivos[entry.relPath] = {
            hash,
            ocorrencias: [],
            reaproveitadoCount: 0,
          };
        }
        if (novoEstado.estatisticas) {
          novoEstado.estatisticas.totalArquivosProcessados =
            fileEntriesComAst.length;
          novoEstado.estatisticas.ultimaDuracaoMs = duracaoTotal;
        }
        await salvarEstado(config.ANALISE_INCREMENTAL_STATE_PATH, novoEstado);
      } catch {
        /* Ignora erro ao salvar cache */
      }
    }

    const metricasExecucao: MetricaExecucao = {
      totalArquivos: fileEntriesComAst.length,
      tempoTotal: duracaoTotal,
      ocorrenciasEncontradas: ocorrencias.length,
      analistas: metricasAnalistas,
      workerPool: {
        workersAtivos: resultadoWorkers.totalProcessed,
        duracaoTotalMs: resultadoWorkers.duration,
      },
    };

    // Retorna resultado do processamento paralelo
    return {
      totalArquivos: fileEntriesComAst.length,
      arquivosAnalisados: fileEntriesComAst.map((e) => e.relPath),
      ocorrencias,
      timestamp: Date.now(),
      duracaoMs: duracaoTotal,
      metricas: metricasExecucao,
    };
  }

  // Técnicas por arquivo (modo sequencial padrão)
  let arquivoAtual = 0;
  const totalArquivos = fileEntriesComAst.length;
  // Limiar para logs detalhados por arquivo
  const LIMIAR_DETALHE_TOTAL = 100; // até aqui permite detalhar por arquivo
  const LIMIAR_DETALHE_THROTTLED_MAX = 250; // até aqui permite "Arquivo X/Y" com throttle
  // Define passo de logging quando em modo verbose para evitar spam massivo

  function passoDeLog(total: number): number {
    // Assumimos faixas: até 100 => cada arquivo; 101-250 => a cada 10; 251-500 => a cada 25; >500 => a cada 100
    if (total <= 100) return 1;
    if (total <= 250) return 10;
    if (total <= 500) return 25;
    return 100;
  }
  const frames = ['->', '=>', '>>', '=>'] as const;
  const stepVerbose = passoDeLog(totalArquivos);
  const detalharPorArquivo =
    (opts?.verbose ?? false) && totalArquivos <= LIMIAR_DETALHE_TOTAL;
  const permitirArquivoXY =
    (opts?.verbose ?? false) && totalArquivos <= LIMIAR_DETALHE_THROTTLED_MAX;

  // 🎯 Inicializa sistema de logs inteligente
  logAnalistas.iniciarBatch(totalArquivos);

  for (const entry of fileEntriesComAst) {
    arquivoAtual++;
    if (opts?.compact) {
      if (arquivoAtual === totalArquivos) {
        log.info(`Arquivos analisados: ${totalArquivos}`);
      }
    } else if (opts?.verbose) {
      // Em verbose: detalha por arquivo somente até o limiar; entre 101-250 mostra "Arquivo X/Y" com throttle; acima disso, só resumo de progresso.
      if (permitirArquivoXY) {
        if (
          arquivoAtual === 1 ||
          arquivoAtual % stepVerbose === 0 ||
          arquivoAtual === totalArquivos
        ) {
          const seta = frames[arquivoAtual % frames.length];
          log.info(
            `${seta} Arquivo ${arquivoAtual}/${totalArquivos}: ${entry.relPath}`,
          );
        }
      } else {
        if (
          arquivoAtual === 1 ||
          arquivoAtual % stepVerbose === 0 ||
          arquivoAtual === totalArquivos
        ) {
          log.info(`Arquivos analisados: ${arquivoAtual}/${totalArquivos}`);
        }
      }
    } else if (arquivoAtual % 50 === 0 || arquivoAtual === totalArquivos) {
      // Modo padrão: log apenas a cada 50 arquivos para reduzir ruído
      if (arquivoAtual === totalArquivos) {
        __infoD(`Arquivos analisados: ${arquivoAtual}/${totalArquivos}`);
      }
    }
    // Verifica incremento
    const conteudo = entry.content ?? '';
    const h = hashConteudo(conteudo);
    const cacheAnterior = estadoIncremental?.arquivos[entry.relPath];
    let reaproveitou = false;
    if (
      config.ANALISE_INCREMENTAL_ENABLED &&
      cacheAnterior &&
      cacheAnterior.hash === h
    ) {
      // Reaproveita ocorrências anteriores do arquivo
      ocorrencias.push(...cacheAnterior.ocorrencias);
      novoEstado.arquivos[entry.relPath] = cacheAnterior; // mantém
      novoEstado.arquivos[entry.relPath].reaproveitadoCount =
        (cacheAnterior.reaproveitadoCount || 0) + 1;
      if (novoEstado.estatisticas) {
        novoEstado.estatisticas.totalReaproveitamentos =
          (novoEstado.estatisticas.totalReaproveitamentos || 0) + 1;
      }
      reaproveitou = true;
      if (detalharPorArquivo) logCore.reaproveitadoIncremental(entry.relPath);
      if (config.LOG_ESTRUTURADO) {
        log.info(
          JSON.stringify({
            tipo: 'incremental-reuse',
            arquivo: entry.relPath,
            ocorrencias: cacheAnterior.ocorrencias.length,
          }),
        );
      }
    }
    if (reaproveitou) continue; // pula analistas

    for (const tecnica of tecnicas) {
      if (tecnica.global) continue;
      if (tecnica.test && !tecnica.test(entry.relPath)) continue;
      // início medido apenas por analista específico (inicioAnalista)
      const timeoutMs = config.ANALISE_TIMEOUT_POR_ANALISTA_MS;
      try {
        const inicioAnalista = performance.now();

        // Log adaptativo: início da análise
        const tamanhoArquivo = entry.content
          ? Math.round(entry.content.length / 1024)
          : 0;
        logAnalistas.iniciandoAnalista(
          tecnica.nome || 'analista-desconhecido',
          entry.relPath,
          tamanhoArquivo,
        );

        // Implementa timeout por analista se configurado
        let resultado: Awaited<ReturnType<typeof tecnica.aplicar>> | undefined;

        if (timeoutMs > 0) {
          // Promise.race entre execução do analista e timeout
          const astParam = isNodePath(entry.ast)
            ? (entry.ast as import('@babel/traverse').NodePath<
                import('@babel/types').Node
              >)
            : null;
          const execPromise = tecnica.aplicar(
            entry.content ?? '',
            entry.relPath,
            astParam,
            entry.fullPath,
            contextoGlobal,
          );
          resultado = await (async () => {
            let timer: NodeJS.Timeout | null = null;
            try {
              const race = Promise.race([
                execPromise,
                new Promise<never>((_, reject) => {
                  timer = setTimeout(
                    () =>
                      reject(
                        new Error(
                          `Timeout: analista '${tecnica.nome}' excedeu ${timeoutMs}ms para ${entry.relPath}`,
                        ),
                      ),
                    timeoutMs,
                  );
                }),
              ]);
              return await race;
            } finally {
              if (timer) clearTimeout(timer);
            }
          })();
        } else {
          // Execução sem timeout
          const astParam2 = isNodePath(entry.ast)
            ? (entry.ast as import('@babel/traverse').NodePath<
                import('@babel/types').Node
              >)
            : null;
          resultado = await tecnica.aplicar(
            entry.content ?? '',
            entry.relPath,
            astParam2,
            entry.fullPath,
            contextoGlobal,
          );
        }

        if (Array.isArray(resultado)) {
          ocorrencias.push(...resultado);
        }

        const duracaoMs = performance.now() - inicioAnalista;
        if (config.ANALISE_METRICAS_ENABLED) {
          metricasAnalistas.push({
            nome: tecnica.nome || 'desconhecido',
            duracaoMs,
            ocorrencias: Array.isArray(resultado)
              ? resultado.length
              : resultado
                ? 1
                : 0,
            global: false,
          });
        }

        // Log adaptativo: conclusão da análise
        const ocorrenciasCount = Array.isArray(resultado)
          ? resultado.length
          : resultado
            ? 1
            : 0;
        logAnalistas.concluido(
          tecnica.nome || 'analista-desconhecido',
          entry.relPath,
          ocorrenciasCount,
          duracaoMs,
        );

        if (detalharPorArquivo) {
          log.info(
            `📄 '${tecnica.nome}' analisou ${entry.relPath} em ${formatMs(duracaoMs)}`,
          );
        }
        if (config.LOG_ESTRUTURADO) {
          log.info(
            JSON.stringify({
              tipo: 'analista',
              arquivo: entry.relPath,
              nome: tecnica.nome,
              duracaoMs,
              ocorrencias: metricasAnalistas.at(-1)?.ocorrencias,
            }),
          );
        }
      } catch (error) {
        const err = error as Error;
        const isTimeout = err.message.includes('Timeout: analista');
        const nivelLog = isTimeout ? 'aviso' : 'erro';
        const prefixo = isTimeout ? '⏰' : '❌';

        // Log adaptativo para erros e timeouts
        if (isTimeout) {
          const duracaoEstimada =
            config.ANALISE_TIMEOUT_POR_ANALISTA_MS || 30000;
          logAnalistas.timeout(
            tecnica.nome || 'analista-desconhecido',
            duracaoEstimada,
          );
        } else {
          logAnalistas.erro(
            tecnica.nome || 'analista-desconhecido',
            err.message,
          );
        }

        // Log apropriado baseado no tipo de erro
        if (nivelLog === 'aviso') {
          log.aviso(`${prefixo} ${err.message}`);
        } else {
          log.erro(
            `${prefixo} Erro em '${tecnica.nome}' para ${entry.relPath}: ${err.message}`,
          );
          // Exibe stack trace em modo verbose ou debug
          if (err.stack) {
            if (opts?.verbose || config.DEV_MODE) {
              log.info('Stack trace:');
              log.info(err.stack);
            }
          }
        }

        // Registra ocorrência de erro/timeout com stack trace
        ocorrencias.push(
          ocorrenciaErroAnalista({
            mensagem: isTimeout
              ? `Timeout na técnica '${tecnica.nome}' para ${entry.relPath}: ${timeoutMs}ms excedido`
              : `Falha na técnica '${tecnica.nome}' para ${entry.relPath}: ${err.message}`,
            relPath: entry.relPath,
            origem: tecnica.nome,
            stack: !isTimeout && err.stack ? err.stack : undefined,
          }),
        );
      }
    }
    // Salva estado incremental do arquivo processado
    if (config.ANALISE_INCREMENTAL_ENABLED) {
      const ocorrArq = ocorrencias.filter((o) => o.relPath === entry.relPath);
      // Extrai métricas por analista específicas do arquivo
      const analistasArquivo: Record<
        string,
        { ocorrencias: number; duracaoMs: number }
      > = {};
      for (const m of metricasAnalistas.filter((m) => !m.global)) {
        analistasArquivo[m.nome] = {
          ocorrencias: m.ocorrencias,
          duracaoMs: m.duracaoMs,
        };
      }
      novoEstado.arquivos[entry.relPath] = {
        hash: h,
        ocorrencias: ocorrArq,
        analistas: analistasArquivo,
        ultimaExecucaoMs: Date.now(),
        reaproveitadoCount: 0,
      };
      if (novoEstado.estatisticas) {
        novoEstado.estatisticas.totalArquivosProcessados =
          (novoEstado.estatisticas.totalArquivosProcessados || 0) + 1;
      }
    }

    // 🎯 NOVO: Atualiza progresso por arquivo (não por analista)
    logAnalistas.arquivoProcessado();
  }

  const fimExecucao = performance.now();
  const duracaoMs = Math.round(fimExecucao - inicioExecucao);

  // 🎯 Finaliza sistema de logs inteligente
  logAnalistas.finalizarBatch(ocorrencias.length, duracaoMs);

  // Agregação de métricas
  let metricasExecucao: MetricaExecucao | null = null;
  if (config.ANALISE_METRICAS_ENABLED) {
    const metricasGlobais: MetricasGlobais = ((
      globalThis as unknown as Record<string, unknown>
    ).__ORACULO_METRICAS__ as MetricasGlobais) || {
      parsingTimeMs: 0,
      cacheHits: 0,
      cacheMiss: 0,
    };
    metricasExecucao = {
      totalArquivos: fileEntriesComAst.length,
      tempoParsingMs: Math.round(metricasGlobais.parsingTimeMs),
      tempoAnaliseMs: duracaoMs,
      cacheAstHits: metricasGlobais.cacheHits,
      cacheAstMiss: metricasGlobais.cacheMiss,
      analistas: metricasAnalistas,
    };
    if (config.LOG_ESTRUTURADO) {
      log.info(JSON.stringify({ tipo: 'metricas', ...metricasExecucao }));
    }
    // Persistir histórico
    try {
      const historicoPath = config.ANALISE_METRICAS_HISTORICO_PATH as
        | string
        | undefined;
      if (historicoPath) {
        type RegistroHistorico = MetricaExecucao & { timestamp: number };
        const anterior = await lerEstado<unknown>(historicoPath).catch(
          () => [] as RegistroHistorico[],
        );
        const lista = Array.isArray(anterior)
          ? (anterior as RegistroHistorico[])
          : [];
        lista.push({ ...metricasExecucao, timestamp: Date.now() });
        const max = config.ANALISE_METRICAS_HISTORICO_MAX || 200;
        const recortado = lista.slice(-max);
        await salvarEstado(historicoPath, recortado);
      }
    } catch (e) {
      // Sempre registra em DEV e também em execução normal para visibilidade dos testes
      log.erro(
        `Falha ao persistir histórico de métricas: ${(e as Error).message}`,
      );
    }
  }

  // Persistir incremental
  if (config.ANALISE_INCREMENTAL_ENABLED) {
    if (novoEstado.estatisticas) {
      novoEstado.estatisticas.ultimaDuracaoMs = duracaoMs;
    }
    await salvarEstado(config.ANALISE_INCREMENTAL_STATE_PATH, novoEstado);
    if (config.LOG_ESTRUTURADO) {
      log.info(
        JSON.stringify({
          tipo: 'incremental-salvo',
          arquivos: Object.keys(novoEstado.arquivos).length,
          totalReaproveitamentos:
            novoEstado.estatisticas?.totalReaproveitamentos,
          processados: novoEstado.estatisticas?.totalArquivosProcessados,
        }),
      );
    }
  }

  return {
    totalArquivos: fileEntriesComAst.length,
    arquivosAnalisados: fileEntriesComAst.map((e) => e.relPath),
    ocorrencias,
    timestamp: Date.now(),
    duracaoMs,
    metricas: metricasExecucao || undefined,
  };
}

// Hook simples para expor última métrica de execução (consumido por comando perf baseline)

export function registrarUltimasMetricas(
  metricas: MetricaExecucao | undefined,
): void {
  try {
    (
      globalThis as unknown as {
        __ULTIMAS_METRICAS_ORACULO__?: MetricaExecucao | null;
      }
    ).__ULTIMAS_METRICAS_ORACULO__ = metricas || null;
  } catch {
    /* ignore */
  }
}
