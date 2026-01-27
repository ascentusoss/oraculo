#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Script para analisar problemas de documentação detectados
 * Executa o CLI e analisa o output JSON
 */

import { spawn } from 'node:child_process';

async function main() {
  console.log('🔍 Analisando problemas de documentação...\n');

  try {
    // Executar diagnóstico e capturar JSON
    const diagnostico = spawn('npm', ['run', 'diagnosticar', '--', '--json'], {
      cwd: process.cwd(),
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let jsonData = '';
    let started = false;

    diagnostico.stdout.on('data', (data) => {
      const str = data.toString();
      // Procurar início do JSON (linha com '{')
      if (!started && str.trim().startsWith('{')) {
        started = true;
      }
      if (started) {
        jsonData += str;
      }
    });

    diagnostico.stderr.on('data', () => {
      // Ignorar stderr para não misturar com JSON
    });

    await new Promise((resolve, reject) => {
      diagnostico.on('close', (code) => {
        if (code !== 0 && code !== 1) {
          reject(new Error(`Diagnóstico falhou com código ${code}`));
        } else {
          resolve();
        }
      });
    });

    // Parsear JSON
    const resultado = JSON.parse(jsonData);
    const docsProblems = resultado.ocorrencias.filter(
      (occ) => occ.tipo === 'problema-documentacao'
    );

    console.log(`📊 Total de problemas de documentação: ${docsProblems.length}\n`);

    // Agrupar por arquivo
    const porArquivo = {};
    for (const occ of docsProblems) {
      if (!porArquivo[occ.relPath]) {
        porArquivo[occ.relPath] = [];
      }
      porArquivo[occ.relPath].push(occ);
    }

    // Mostrar top 15 arquivos com mais problemas
    const arquivosOrdenados = Object.entries(porArquivo)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15);

    console.log('📁 Top 15 arquivos com mais problemas:\n');
    for (const [arquivo, ocorrencias] of arquivosOrdenados) {
      console.log(`  ${arquivo} (${ocorrencias.length} problemas)`);
      for (const occ of ocorrencias.slice(0, 2)) {
        console.log(`    L${occ.linha}: ${occ.mensagem}`);
      }
      if (ocorrencias.length > 2) {
        console.log(`    ... +${ocorrencias.length - 2} mais`);
      }
      console.log('');
    }

    // Agrupar por tipo de mensagem (extrair padrão)
    const porPadrao = {};
    for (const occ of docsProblems) {
      // Extrair padrão: "Problemas de documentação (prioridade): ..."
      const match = occ.mensagem.match(/Problemas de documentação \(([^)]+)\): (.+)/);
      if (match) {
        const prioridade = match[1];
        const tipos = match[2].split(', ').map(t => t.replace(/ \(\+\d+ mais\)$/, ''));
        
        if (!porPadrao[prioridade]) {
          porPadrao[prioridade] = {};
        }
        
        for (const tipo of tipos) {
          if (!porPadrao[prioridade][tipo]) {
            porPadrao[prioridade][tipo] = 0;
          }
          porPadrao[prioridade][tipo]++;
        }
      }
    }

    console.log('\n📝 Distribuição por tipo e prioridade:\n');
    for (const [prioridade, tipos] of Object.entries(porPadrao)) {
      console.log(`\n  Prioridade ${prioridade}:`);
      const tiposOrdenados = Object.entries(tipos).sort((a, b) => b[1] - a[1]);
      for (const [tipo, count] of tiposOrdenados) {
        console.log(`    ${count}x ${tipo}`);
      }
    }

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    process.exit(1);
  }
}

main();
