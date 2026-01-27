#!/usr/bin/env node
// SPDX-License-Identifier: MIT

/**
 * Script de análise de padrões async/await
 * 
 * Identifica promises sem tratamento de erro e prioriza por criticidade:
 * - CRÍTICO: Promises isoladas em funções exportadas
 * - ALTO: Promises em blocos try sem catch
 * - MÉDIO: Promises em callbacks/handlers
 * - BAIXO: Promises com tratamento em nível superior
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar relatório JSON do diagnóstico
const relatorioPath = process.argv[2];
if (!relatorioPath) {
    console.error('❌ Uso: node analisar-async-patterns.mjs <caminho-para-relatorio.json>');
    process.exit(1);
}

try {
    const data = JSON.parse(readFileSync(relatorioPath, 'utf-8'));
    const ocorrencias = data.resultadoResumo?.ocorrencias || [];

    // Filtrar apenas unhandled-async
    const asyncIssues = ocorrencias.filter(o =>
        o.mensagem && o.mensagem.includes('unhandled-async')
    );

    console.log('\n📊 Análise de Padrões Async/Await\n');
    console.log(`Total de ocorrências unhandled-async: ${asyncIssues.length}`);

    // Agrupar por arquivo
    const porArquivo = {};
    asyncIssues.forEach(issue => {
        const arquivo = issue.relPath;
        if (!porArquivo[arquivo]) {
            porArquivo[arquivo] = {
                ocorrencias: [],
                nivel: issue.nivel,
                total: 0
            };
        }
        porArquivo[arquivo].ocorrencias.push(issue);

        // Contar múltiplas ocorrências na mensagem
        const match = issue.mensagem.match(/\((\d+) mais\)/);
        if (match) {
            porArquivo[arquivo].total += parseInt(match[1]) + 1;
        } else {
            porArquivo[arquivo].total += 1;
        }
    });

    // Ordenar por total de ocorrências (decrescente)
    const arquivosOrdenados = Object.entries(porArquivo)
        .sort(([, a], [, b]) => b.total - a.total);

    console.log('\n🔴 TOP 15 Arquivos com Mais Promises Não Tratadas:\n');

    arquivosOrdenados.slice(0, 15).forEach(([arquivo, info], index) => {
        const nivelIcon = info.nivel === 'erro' ? '🔴' :
            info.nivel === 'aviso' ? '⚠️' : 'ℹ️';
        console.log(`${index + 1}. ${nivelIcon} ${arquivo}`);
        console.log(`   └─ ${info.total} promise(s) sem tratamento de erro`);
        console.log(`   └─ Prioridade: ${info.nivel.toUpperCase()}\n`);
    });

    // Estatísticas por categoria de arquivo
    const categorias = {
        'cli': [],
        'analistas': [],
        'core': [],
        'guardian': [],
        'auto': [],
        'outros': []
    };

    arquivosOrdenados.forEach(([arquivo, info]) => {
        if (arquivo.includes('cli/')) categorias.cli.push([arquivo, info]);
        else if (arquivo.includes('analistas/')) categorias.analistas.push([arquivo, info]);
        else if (arquivo.includes('core/') || arquivo.includes('nucleo/')) categorias.core.push([arquivo, info]);
        else if (arquivo.includes('guardian/')) categorias.guardian.push([arquivo, info]);
        else if (arquivo.includes('auto/') || arquivo.includes('zeladores/')) categorias.auto.push([arquivo, info]);
        else categorias.outros.push([arquivo, info]);
    });

    console.log('\n📂 Distribuição por Categoria:\n');
    Object.entries(categorias).forEach(([cat, arquivos]) => {
        if (arquivos.length > 0) {
            const total = arquivos.reduce((sum, [, info]) => sum + info.total, 0);
            console.log(`  ${cat.toUpperCase()}: ${arquivos.length} arquivos, ${total} promises`);
        }
    });

    // Recomendações
    console.log('\n💡 Recomendações de Correção:\n');

    const criticos = arquivosOrdenados.filter(([, info]) => info.nivel === 'erro');
    const altos = arquivosOrdenados.filter(([, info]) => info.nivel === 'aviso');

    if (criticos.length > 0) {
        console.log('🔴 CRÍTICO (Revisar Imediatamente):');
        criticos.slice(0, 5).forEach(([arquivo]) => {
            console.log(`   - ${arquivo}`);
        });
    }

    if (altos.length > 0) {
        console.log('\n⚠️  ALTO (Revisar em Sprint Atual):');
        altos.slice(0, 10).forEach(([arquivo]) => {
            console.log(`   - ${arquivo}`);
        });
    }

    console.log('\n📋 Próximos Passos:\n');
    console.log('1. Revisar arquivos CRÍTICOS e adicionar .catch() ou try/catch');
    console.log('2. Para arquivos com muitas ocorrências, considerar refatoração');
    console.log('3. Validar se promises têm tratamento em nível superior');
    console.log('4. Adicionar testes para garantir robustez\n');

    // Salvar relatório em arquivo
    const reportPath = join(dirname(relatorioPath), 'async-analysis-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        totalIssues: asyncIssues.length,
        totalFiles: Object.keys(porArquivo).length,
        topFiles: arquivosOrdenados.slice(0, 20).map(([arquivo, info]) => ({
            arquivo,
            total: info.total,
            nivel: info.nivel
        })),
        categorias: Object.fromEntries(
            Object.entries(categorias).map(([cat, arquivos]) => [
                cat,
                {
                    totalArquivos: arquivos.length,
                    totalPromises: arquivos.reduce((sum, [, info]) => sum + info.total, 0)
                }
            ])
        )
    };

    const { writeFileSync } = await import('fs');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Relatório salvo em: ${reportPath}\n`);

} catch (error) {
    console.error('❌ Erro ao processar relatório:', error.message);
    process.exit(1);
}
