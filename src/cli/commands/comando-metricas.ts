// SPDX-License-Identifier: MIT
// @oraculo-disable tipo-literal-inline-complexo
// Justificativa: tipos inline para opções de comando CLI são locais e não precisam de extração
import path from 'node:path';

import { ExitCode, sair } from '@cli/helpers/exit-codes.js';
import { config } from '@core/config/config.js';
import { formatMs } from '@core/config/format.js';
import { CliComandoMetricasMessages } from '@core/messages/cli/cli-comando-metricas-messages.js';
import { ICONES_DIAGNOSTICO, log, logMetricas } from '@core/messages/index.js';
import { lerEstado, salvarEstado } from '@shared/persistence/persistencia.js';
import { Command } from 'commander';

import type { MetricaExecucao } from '@';

interface RegistroHistorico extends MetricaExecucao {
  timestamp: number;
}

const formatarDuracao = (ms: number) => formatMs(ms);

function agregados(historico: RegistroHistorico[]) {
  if (!historico.length) return null;
  const total = historico.length;
  const somaAnalise = historico.reduce(
    (acc, h) => acc + (h.tempoAnaliseMs ?? 0),
    0,
  );
  const somaParsing = historico.reduce(
    (acc, h) => acc + (h.tempoParsingMs ?? 0),
    0,
  );
  const analistasMap = new Map<
    string,
    { totalMs: number; execucoes: number; ocorrencias: number }
  >();
  for (const h of historico) {
    if (!h.analistas) continue;
    for (const a of h.analistas) {
      const dado = analistasMap.get(a.nome) || {
        totalMs: 0,
        execucoes: 0,
        ocorrencias: 0,
      };
      dado.totalMs += a.duracaoMs;
      dado.execucoes += 1;
      dado.ocorrencias += a.ocorrencias;
      analistasMap.set(a.nome, dado);
    }
  }
  const analistasOrdenados = [...analistasMap.entries()]
    .sort((a, b) => b[1].totalMs - a[1].totalMs)
    .slice(0, 5)
    .map(([nome, d]) => ({
      nome,
      totalMs: d.totalMs,
      mediaMs: d.totalMs / d.execucoes,
      execucoes: d.execucoes,
      ocorrencias: d.ocorrencias,
    }));
  return {
    totalExecucoes: total,
    mediaAnaliseMs: somaAnalise / total,
    mediaParsingMs: somaParsing / total,
    topAnalistas: analistasOrdenados,
  };
}

export function comandoMetricas(): Command {
  return new Command('metricas')
    .description('Inspeciona histórico de métricas de execuções anteriores')
    .option('-j, --json', 'Saída em JSON bruto (historico e agregados)')
    .option(
      '-l, --limite <n>',
      'Quantidade de registros mais recentes (default 10)',
      (v) => Number(v),
      10,
    )
    .option(
      '-e, --export <arquivo>',
      'Exporta histórico completo em JSON para arquivo',
    )
    .option('-a, --analistas', 'Exibe tabela agregada por analista (top 5)')
    .action(
      async (opts: {
        json?: boolean;
        limite?: number;
        export?: string;
        analistas?: boolean;
      }) => {
        try {
          const caminho = config.ANALISE_METRICAS_HISTORICO_PATH;
          const historico = await lerEstado<RegistroHistorico[]>(caminho).catch(
            () => [],
          );
          const lista = Array.isArray(historico) ? historico : [];
          const ultimos = opts.limite ? lista.slice(-opts.limite) : lista;
          const agg = agregados(lista) || undefined;

          if (opts.export) {
            const destino = path.isAbsolute(opts.export)
              ? opts.export
              : path.join(process.cwd(), opts.export);
            await salvarEstado(destino, {
              exportadoEm: new Date().toISOString(),
              total: lista.length,
              historico: lista,
            });
            log.sucesso(CliComandoMetricasMessages.historicoExportado(destino));
            return;
          }

          if (opts.json) {
            // Emite JSON puro (sem prefixos de log) para facilitar piping / CI
            console.log(
              JSON.stringify(
                {
                  total: lista.length,
                  limite: opts.limite,
                  historico: ultimos,
                  agregados: agg,
                },
                null,
                2,
              ),
            );
            return;
          }

          logMetricas.execucoesRegistradas(lista.length);
          if (!lista.length) {
            logMetricas.nenhumHistorico();
            return;
          }
          for (const h of ultimos) {
            const timestampISO = new Date(h.timestamp).toISOString();
            log.info(
              CliComandoMetricasMessages.linhaExecucao(
                timestampISO,
                h.totalArquivos ?? 0,
                formatarDuracao(h.tempoAnaliseMs ?? 0),
                formatarDuracao(h.tempoParsingMs ?? 0),
                h.cacheAstHits ?? 0,
                h.cacheAstMiss ?? 0,
              ),
            );
          }
          if (opts.analistas && agg) {
            log.info(CliComandoMetricasMessages.linhaEmBranco);
            log.info(
              CliComandoMetricasMessages.tituloTopAnalistas(
                ICONES_DIAGNOSTICO.info,
              ),
            );
            for (const a of agg.topAnalistas) {
              log.info(
                CliComandoMetricasMessages.linhaTopAnalista(
                  a.nome,
                  formatMs(a.totalMs),
                  formatMs(a.mediaMs),
                  a.execucoes,
                  a.ocorrencias,
                ),
              );
            }
          }
          if (agg) {
            log.info(
              CliComandoMetricasMessages.medias(
                formatMs(agg.mediaAnaliseMs),
                formatMs(agg.mediaParsingMs),
              ),
            );
          }
        } catch (err) {
          log.erro(
            `Falha ao processar métricas: ${err instanceof Error ? err.message : String(err)}`,
          );
          sair(ExitCode.Failure);
        }
      },
    );
}
