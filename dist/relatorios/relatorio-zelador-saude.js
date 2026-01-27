import { estatisticasUsoGlobal } from '../analistas/js-ts/analista-padroes-uso.js';
import chalk from '../core/config/chalk-safe.js';
import { config } from '../core/config/config.js';
import { log, logRelatorio, RelatorioMessages } from '../core/messages/index.js';
export function exibirRelatorioZeladorSaude(ocorrencias) {
    const constsMap = estatisticasUsoGlobal.consts;
    const requiresMap = estatisticasUsoGlobal.requires;
    const constExcessivas = Object.entries(constsMap || {}).filter(([, n]) => n > 3);
    const requireRepetidos = Object.entries(requiresMap || {}).filter(([, n]) => n > 3);
    log.info(`\n${RelatorioMessages.saude.titulo}:\n`);
    if (!process.env.VITEST) {
        const tituloCab = RelatorioMessages.saude.titulo.replace('🧼 ', '');
        const linhasCab = [];
        const logComBloco = log;
        const larguraCab = logComBloco.calcularLargura
            ? logComBloco.calcularLargura(tituloCab, linhasCab, config.COMPACT_MODE ? 84 : 96)
            : undefined;
        logComBloco.imprimirBloco(tituloCab, linhasCab, chalk.cyan.bold, typeof larguraCab === 'number'
            ? larguraCab
            : config.COMPACT_MODE
                ? 84
                : 96);
    }
    if (ocorrencias.length > 0) {
        const logAviso = log.aviso;
        if (typeof logAviso === 'function')
            logAviso('⚠️ Funções longas encontradas:');
        else
            logRelatorio.funcoesLongas();
        const porArquivo = new Map();
        for (const o of ocorrencias) {
            const key = o.relPath || o.arquivo || '[desconhecido]';
            porArquivo.set(key, (porArquivo.get(key) || 0) + 1);
        }
        const totalOcorrencias = ocorrencias.length;
        const arquivosAfetados = porArquivo.size;
        const maiorPorArquivo = Math.max(...Array.from(porArquivo.values()));
        const mostrarTabela = config.RELATORIO_SAUDE_TABELA_ENABLED && !config.VERBOSE;
        const temImprimirBloco = typeof log.imprimirBloco === 'function';
        if (mostrarTabela && temImprimirBloco) {
            const header1 = 'arquivos';
            const header2 = 'quantidade';
            const linhas = [];
            const col1Width = Math.max(header1.length, 'com função longa'.length, 'funções longas (total)'.length, 'maior por arquivo'.length);
            const col2Width = Math.max(header2.length, String(totalOcorrencias).length, String(arquivosAfetados).length, String(maiorPorArquivo).length);
            const pinta = (n) => chalk.yellow(String(n).padStart(col2Width));
            linhas.push(`${header1.padEnd(col1Width)}  ${header2.padStart(col2Width)}`, `${'-'.repeat(col1Width)}  ${'-'.repeat(col2Width)}`, `${'com função longa'.padEnd(col1Width)}  ${pinta(arquivosAfetados)}`, `${'funções longas (total)'.padEnd(col1Width)}  ${pinta(totalOcorrencias)}`, `${'maior por arquivo'.padEnd(col1Width)}  ${pinta(maiorPorArquivo)}`, ''.padEnd(col1Width + col2Width + 2, ' '), `${'RESUMIDO'.padStart(Math.floor(col1Width / 2) + 4).padEnd(col1Width + col2Width + 2)}`);
            log.imprimirBloco('funções longas:', linhas, chalk.cyan.bold, log.calcularLargura
                ? log.calcularLargura('funções longas:', linhas, config.COMPACT_MODE ? 84 : 96)
                : 84);
            log.info(RelatorioMessages.saude.instrucoes.diagnosticoDetalhado);
            log.info(RelatorioMessages.saude.instrucoes.tabelasVerbosas);
            log.info('');
        }
        else if (mostrarTabela) {
            const header1 = 'arquivos';
            const header2 = 'quantidade';
            const col1Width = Math.max(header1.length, 'com função longa'.length, 'funções longas (total)'.length, 'maior por arquivo'.length);
            const col2Width = Math.max(header2.length, String(totalOcorrencias).length, String(arquivosAfetados).length, String(maiorPorArquivo).length);
            log.info(`${header1.padEnd(col1Width)}  ${header2.padStart(col2Width)}`);
            log.info(`${'-'.repeat(col1Width)}  ${'-'.repeat(col2Width)}`);
            log.info(`${'com função longa'.padEnd(col1Width)}  ${chalk.yellow(String(arquivosAfetados).padStart(col2Width))}`);
            log.info(`${'funções longas (total)'.padEnd(col1Width)}  ${chalk.yellow(String(totalOcorrencias).padStart(col2Width))}`);
            log.info(`${'maior por arquivo'.padEnd(col1Width)}  ${chalk.yellow(String(maiorPorArquivo).padStart(col2Width))}`);
            log.info('');
            log.info(RelatorioMessages.saude.instrucoes.diagnosticoDetalhado);
            log.info(RelatorioMessages.saude.instrucoes.tabelasVerbosas);
            log.info('');
        }
        else {
            const logInfoRaw = (log.infoSemSanitizar || log.info).bind(log);
            const titulo = chalk.bold(RelatorioMessages.saude.secoes.funcoesLongas.titulo);
            log.info(titulo);
            const colLeft = 50;
            const linhasDetalhe = [];
            const ordenar = Array.from(porArquivo.entries()).sort((a, b) => b[1] - a[1]);
            for (const [arquivo, qtd] of ordenar) {
                const left = arquivo.length > colLeft
                    ? `…${arquivo.slice(-colLeft + 1)}`
                    : arquivo;
                const numero = chalk.yellow(String(qtd).padStart(3));
                linhasDetalhe.push(`${left.padEnd(colLeft)}  ${numero}`);
            }
            for (const l of linhasDetalhe)
                logInfoRaw(l);
            log.info('');
        }
    }
    else {
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
    log.sucesso(RelatorioMessages.saude.secoes.fim.titulo);
    if (!process.env.VITEST) {
        const tituloFim = RelatorioMessages.saude.secoes.fim.titulo;
        const linhasFim = ['Mandou bem!'];
        const larguraFim = log
            .calcularLargura
            ? log.calcularLargura(tituloFim, linhasFim, config.COMPACT_MODE ? 84 : 96)
            : undefined;
        log.imprimirBloco(tituloFim, linhasFim, chalk.green.bold, typeof larguraFim === 'number'
            ? larguraFim
            : config.COMPACT_MODE
                ? 84
                : 96);
    }
}
//# sourceMappingURL=relatorio-zelador-saude.js.map