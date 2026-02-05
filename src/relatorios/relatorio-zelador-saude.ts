// SPDX-License-Identifier: MIT
import { estatisticasUsoGlobal } from '@analistas/js-ts/analista-padroes-uso.js';
import chalk from '@core/config/chalk-safe.js';
import { config } from '@core/config/config.js';
import { log, logRelatorio, RelatorioMessages } from '@core/messages/index.js';

import type { LogComBloco, Ocorrencia } from '@';

/**
 * Emite um relatório sobre a saúde do código com base nas estatísticas gerais.
 */

export function exibirRelatorioZeladorSaude(ocorrencias: Ocorrencia[]): void {
  // Usa o helper centralizado de molduras, com largura fixa para manter bordas alinhadas
  const constsMap = estatisticasUsoGlobal.consts as
    | Record<string, number>
    | undefined;
  const requiresMap = estatisticasUsoGlobal.requires as
    | Record<string, number>
    | undefined;
  const constExcessivas = Object.entries(constsMap || {}).filter(
    ([, n]) => n > 3,
  );
  const requireRepetidos = Object.entries(requiresMap || {}).filter(
    ([, n]) => n > 3,
  );

  // Cabeçalho usando mensagens centralizadas
  log.info(`\n${RelatorioMessages.saude.titulo}:\n`);

  // Moldura do cabeçalho (somente em runtime humano)
  if (!process.env.VITEST) {
    const tituloCab = RelatorioMessages.saude.titulo.replace('🧼 ', ''); // Remove emoji para moldura
    const linhasCab: string[] = [];
    const logComBloco = log as LogComBloco;
    const larguraCab = logComBloco.calcularLargura
      ? logComBloco.calcularLargura(
          tituloCab,
          linhasCab,
          config.COMPACT_MODE ? 84 : 96,
        )
      : undefined;
    logComBloco.imprimirBloco(
      tituloCab,
      linhasCab,
      chalk.cyan.bold,
      typeof larguraCab === 'number'
        ? larguraCab
        : config.COMPACT_MODE
          ? 84
          : 96,
    );
  }

  if (ocorrencias.length > 0) {
    // Usa mensagem centralizada para aviso
    const logAviso = (
      log as unknown as {
        aviso?: (m: string) => void;
        info: (m: string) => void;
      }
    ).aviso;
    if (typeof logAviso === 'function')
      logAviso('⚠️ Funções longas encontradas:');
    else logRelatorio.funcoesLongas();
    // Agrega por arquivo
    const porArquivo = new Map<string, number>();
    for (const o of ocorrencias) {
      const key = o.relPath || o.arquivo || '[desconhecido]';
      porArquivo.set(key, (porArquivo.get(key) || 0) + 1);
    }

    const totalOcorrencias = ocorrencias.length;
    const arquivosAfetados = porArquivo.size;
    const maiorPorArquivo = Math.max(...Array.from(porArquivo.values()));

    const mostrarTabela =
      config.RELATORIO_SAUDE_TABELA_ENABLED && !config.VERBOSE;

    type LogComBloco = {
      imprimirBloco?: (
        t: string,
        l: string[],
        c?: (s: string) => string,
        w?: number,
      ) => void;
    };
    const temImprimirBloco =
      typeof (log as unknown as LogComBloco).imprimirBloco === 'function';
    if (mostrarTabela && temImprimirBloco) {
      // Tabela compacta com moldura, sem caminhos
      const header1 = 'arquivos';
      const header2 = 'quantidade';
      const linhas: string[] = [];
      const col1Width = Math.max(
        header1.length,
        'com função longa'.length,
        'funções longas (total)'.length,
        'maior por arquivo'.length,
      );
      const col2Width = Math.max(
        header2.length,
        String(totalOcorrencias).length,
        String(arquivosAfetados).length,
        String(maiorPorArquivo).length,
      );
      const pinta = (n: number) => chalk.yellow(String(n).padStart(col2Width));
      linhas.push(
        `${header1.padEnd(col1Width)}  ${header2.padStart(col2Width)}`,
        `${'-'.repeat(col1Width)}  ${'-'.repeat(col2Width)}`,
        `${'com função longa'.padEnd(col1Width)}  ${pinta(arquivosAfetados)}`,
        `${'funções longas (total)'.padEnd(col1Width)}  ${pinta(totalOcorrencias)}`,
        `${'maior por arquivo'.padEnd(col1Width)}  ${pinta(maiorPorArquivo)}`,
        ''.padEnd(col1Width + col2Width + 2, ' '),
        `${'RESUMIDO'.padStart(Math.floor(col1Width / 2) + 4).padEnd(col1Width + col2Width + 2)}`,
      );

      (
        log as unknown as {
          imprimirBloco: (
            t: string,
            l: string[],
            c?: (s: string) => string,
            w?: number,
          ) => void;
        }
      ).imprimirBloco(
        'funções longas:',
        linhas,
        chalk.cyan.bold,
        (log as unknown as { calcularLargura?: Function }).calcularLargura
          ? (log as unknown as { calcularLargura: Function }).calcularLargura(
              'funções longas:',
              linhas,
              config.COMPACT_MODE ? 84 : 96,
            )
          : 84,
      );
      // Dicas usando mensagens centralizadas
      log.info(RelatorioMessages.saude.instrucoes.diagnosticoDetalhado);
      log.info(RelatorioMessages.saude.instrucoes.tabelasVerbosas);
      log.info('');
    } else if (mostrarTabela) {
      // Fallback tabular simplificado
      const header1 = 'arquivos';
      const header2 = 'quantidade';
      const col1Width = Math.max(
        header1.length,
        'com função longa'.length,
        'funções longas (total)'.length,
        'maior por arquivo'.length,
      );
      const col2Width = Math.max(
        header2.length,
        String(totalOcorrencias).length,
        String(arquivosAfetados).length,
        String(maiorPorArquivo).length,
      );
      log.info(`${header1.padEnd(col1Width)}  ${header2.padStart(col2Width)}`);
      log.info(`${'-'.repeat(col1Width)}  ${'-'.repeat(col2Width)}`);
      log.info(
        `${'com função longa'.padEnd(col1Width)}  ${chalk.yellow(String(arquivosAfetados).padStart(col2Width))}`,
      );
      log.info(
        `${'funções longas (total)'.padEnd(col1Width)}  ${chalk.yellow(String(totalOcorrencias).padStart(col2Width))}`,
      );
      log.info(
        `${'maior por arquivo'.padEnd(col1Width)}  ${chalk.yellow(String(maiorPorArquivo).padStart(col2Width))}`,
      );
      log.info('');
      // Dicas (mantém compatibilidade com testes que só checam mensagens principais)
      log.info(RelatorioMessages.saude.instrucoes.diagnosticoDetalhado);
      log.info(RelatorioMessages.saude.instrucoes.tabelasVerbosas);
      log.info('');
    } else {
      // Modo verbose: lista detalhada usando título centralizado
      const logInfoRaw = (
        (
          log as unknown as {
            infoSemSanitizar?: (m: string) => void;
            info: (m: string) => void;
          }
        ).infoSemSanitizar || log.info
      ).bind(log);
      const titulo = chalk.bold(
        RelatorioMessages.saude.secoes.funcoesLongas.titulo,
      );
      log.info(titulo);
      const colLeft = 50;
      const linhasDetalhe: string[] = [];
      const ordenar = Array.from(porArquivo.entries()).sort(
        (a, b) => b[1] - a[1],
      );
      for (const [arquivo, qtd] of ordenar) {
        // Normaliza caminho e alinha
        const left =
          arquivo.length > colLeft
            ? `…${arquivo.slice(-colLeft + 1)}`
            : arquivo;
        const numero = chalk.yellow(String(qtd).padStart(3));
        linhasDetalhe.push(`${left.padEnd(colLeft)}  ${numero}`);
      }
      // Em verbose não usamos moldura de bloco para permitir rolagem limpa
      for (const l of linhasDetalhe) logInfoRaw(l);
      log.info('');
    }
  } else {
    log.sucesso(RelatorioMessages.saude.secoes.funcoesLongas.vazio);
  }

  if (constExcessivas.length > 0) {
    log.info(RelatorioMessages.saude.secoes.constantesDuplicadas.titulo);
    for (const [nome, qtd] of constExcessivas) {
      log.info(`  - ${nome}: ${qtd} vez(es)`);
    }
    log.info('');
  }

  if (requireRepetidos.length > 0) {
    log.info(RelatorioMessages.saude.secoes.modulosRequire.titulo);
    for (const [nome, qtd] of requireRepetidos) {
      log.info(`  - ${nome}: ${qtd} vez(es)`);
    }
    log.info('');
  }

  // Rodapé usando mensagens centralizadas
  log.sucesso(RelatorioMessages.saude.secoes.fim.titulo);
  // Moldura de rodapé (somente em runtime humano)
  if (!process.env.VITEST) {
    const tituloFim = RelatorioMessages.saude.secoes.fim.titulo;
    const linhasFim: string[] = ['Mandou bem!'];
    const larguraFim = (log as unknown as { calcularLargura?: Function })
      .calcularLargura
      ? (log as unknown as { calcularLargura: Function }).calcularLargura(
          tituloFim,
          linhasFim,
          config.COMPACT_MODE ? 84 : 96,
        )
      : undefined;
    (log as unknown as { imprimirBloco: Function }).imprimirBloco(
      tituloFim,
      linhasFim,
      chalk.green.bold,
      typeof larguraFim === 'number'
        ? larguraFim
        : config.COMPACT_MODE
          ? 84
          : 96,
    );
  }
}
