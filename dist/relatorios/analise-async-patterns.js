import path from 'node:path';
import { log, MENSAGENS_RELATORIOS_ANALISE } from '../core/messages/index.js';
import { salvarEstado } from '../shared/persistence/persistencia.js';
function categorizarArquivo(relPath) {
    if (relPath.includes('cli/'))
        return 'cli';
    if (relPath.includes('analistas/'))
        return 'analistas';
    if (relPath.includes('core/') || relPath.includes('nucleo/'))
        return 'core';
    if (relPath.includes('guardian/'))
        return 'guardian';
    if (relPath.includes('auto/') || relPath.includes('zeladores/'))
        return 'auto';
    return 'outros';
}
function extrairTotalPromises(mensagem) {
    const match = mensagem.match(/\((\d+) mais\)/);
    if (match) {
        return parseInt(match[1], 10) + 1;
    }
    return 1;
}
function agruparPorArquivo(ocorrencias) {
    const porArquivo = new Map();
    for (const issue of ocorrencias) {
        const arquivo = issue.relPath;
        if (!porArquivo.has(arquivo)) {
            porArquivo.set(arquivo, {
                ocorrencias: [],
                nivel: (issue.nivel || 'info'),
                total: 0,
            });
        }
        const info = porArquivo.get(arquivo);
        if (!info)
            continue;
        info.ocorrencias.push({
            linha: issue.linha,
            mensagem: issue.mensagem,
            nivel: (issue.nivel || 'info'),
        });
        info.total += extrairTotalPromises(issue.mensagem);
    }
    return porArquivo;
}
export async function analisarAsyncPatterns(ocorrencias, options = {}) {
    const topN = options.topN || 20;
    const asyncIssues = ocorrencias.filter((o) => o.mensagem && o.mensagem.includes('unhandled-async'));
    log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.titulo);
    log.info(`Total de ocorrências unhandled-async: ${asyncIssues.length}`);
    const porArquivo = agruparPorArquivo(asyncIssues);
    const arquivosOrdenados = Array.from(porArquivo.entries())
        .map(([arquivo, info]) => ({
        arquivo,
        total: info.total,
        nivel: (info.nivel || 'info'),
    }))
        .sort((a, b) => b.total - a.total);
    log.info(`\n🔴 TOP ${Math.min(topN, arquivosOrdenados.length)} Arquivos com Mais Promises Não Tratadas:\n`);
    for (let i = 0; i < Math.min(topN, arquivosOrdenados.length); i++) {
        const { arquivo, total, nivel } = arquivosOrdenados[i];
        const nivelIcon = nivel === 'erro' ? '🔴' : nivel === 'aviso' ? '⚠️' : 'ℹ️';
        log.info(`${i + 1}. ${nivelIcon} ${arquivo}`);
        log.info(`   └─ ${total} promise(s) sem tratamento de erro`);
        log.info(`   └─ Prioridade: ${nivel.toUpperCase()}\n`);
    }
    const categorias = {
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
            log.info(`  ${cat.toUpperCase()}: ${stats.totalArquivos} arquivos, ${stats.totalPromises} promises`);
        }
    }
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
    const report = {
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
export async function salvarRelatorioAsync(report, outputPath) {
    await salvarEstado(outputPath, report);
    log.sucesso(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.salvo(outputPath));
}
export async function executarAnaliseAsync(ocorrencias, baseDir, options = {}) {
    const report = await analisarAsyncPatterns(ocorrencias, options);
    const reportPath = path.join(baseDir, 'relatorios', 'async-analysis-report.json');
    await salvarRelatorioAsync(report, reportPath);
}
//# sourceMappingURL=analise-async-patterns.js.map