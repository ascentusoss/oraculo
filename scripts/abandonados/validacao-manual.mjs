#!/usr/bin/env node
// SPDX-License-Identifier: MIT

/**
 * Validação Manual dos Falsos Positivos
 * Compara o antes e depois das melhorias
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const PROJETO_ROOT = process.cwd();

async function testarProjetoReal() {// console.log('=== Validação Manual - Projeto Oráculo ===\n'); // TODO: Remover antes da produção
  try {
    // Testa o próprio projeto Oráculo// console.log('Executando diagnóstico no projeto Oráculo...'); // TODO: Remover antes da produção
    const comando = `node "${path.join(PROJETO_ROOT, 'dist', 'bin', 'index.js')}" diagnosticar --json`;
    let resultado;
    
    try {
      const output = execSync(comando, { 
        cwd: PROJETO_ROOT, 
        encoding: 'utf-8',
        timeout: 30000
      });
      
      // Tenta extrair apenas a parte JSON
      const linhas = output.split('\n');
      let jsonLine = '';
      
      for (const linha of linhas) {
        const trimmed = linha.trim();
        if (trimmed.startsWith('{') && trimmed.includes('"status"')) {
          jsonLine = trimmed;
          break;
        }
      }
      
      if (jsonLine) {
        resultado = JSON.parse(jsonLine);
      } else {
        // Se não encontrar JSON bem formado, tenta parsear o output inteiro
        const match = output.match(/\{[\s\S]*\}/);
        if (match) {
          resultado = JSON.parse(match[0]);
        } else {
          throw new Error('JSON não encontrado na saída');
        }
      }
      
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError.message);
      throw parseError;
    }// console.log('✓ Diagnóstico executado com sucesso'); // TODO: Remover antes da produção
    // Analisa os resultados
    const padraoAusente = resultado.ocorrencias?.filter(o => o.tipo === 'padrao-ausente') || [];
    const totalOcorrencias = resultado.totalOcorrencias || 0;// console.log(`\nTotal de ocorrências: ${totalOcorrencias}`); // TODO: Remover antes da produção// console.log(`Padrões ausentes: ${padraoAusente.length}`); // TODO: Remover antes da produção
    if (padraoAusente.length > 0) {// console.log('\nProblemas de "padrão ausente" encontrados:'); // TODO: Remover antes da produção
      padraoAusente.forEach((problema, index) => {
        console.log(`${index + 1}. ${problema.problema} (${problema.relPath})`);
      });
    } else {// console.log('\n🎉 Nenhum falso positivo de "padrão ausente" detectado!'); // TODO: Remover antes da produção
    }
    
    // Verifica se são falsos positivos conhecidos
    const possiveisFalsosPositivos = padraoAusente.filter(p => {
      const arquivo = p.relPath?.toLowerCase() || '';
      const problema = p.problema?.toLowerCase() || '';
      
      // Arquivos que NÃO deveriam ser reportados como tendo padrões ausentes
      const exempcoesFalsoPositivo = [
        'config/',
        'tests/',
        '.test.',
        '.spec.',
        '__tests__',
        'vitest.config',
        'eslint.config',
        'tsconfig',
        'package.json'
      ];
      
      return exempcoesFalsoPositivo.some(exempcao => arquivo.includes(exempcao));
    });// console.log(`\nPossíveis falsos positivos: ${possiveisFalsosPositivos.length}`); // TODO: Remover antes da produção
    if (possiveisFalsosPositivos.length > 0) {// console.log('Arquivos que podem ser falsos positivos:'); // TODO: Remover antes da produção
      possiveisFalsosPositivos.forEach((p, i) => {// console.log(`${i + 1}. ${p.relPath} - ${p.problema}`); // TODO: Remover antes da produção
      });
    }
    
    // Avaliação final
    const reductionPercentage = ((11 - padraoAusente.length) / 11) * 100;// console.log('\n=== Avaliação da Melhoria ==='); // TODO: Remover antes da produção// console.log(`Estado anterior: 11 falsos positivos`); // TODO: Remover antes da produção// console.log(`Estado atual: ${padraoAusente.length} padrões ausentes`); // TODO: Remover antes da produção
    console.log(`Redução: ${reductionPercentage.toFixed(1)}%`);
    
    if (padraoAusente.length <= 1) {// console.log('🎉 SISTEMA DRASTICAMENTE MELHORADO!'); // TODO: Remover antes da produção// console.log('✓ Redução significativa de falsos positivos'); // TODO: Remover antes da produção// console.log('✓ Sistema demonstra inteligência contextual'); // TODO: Remover antes da produção// console.log('✓ Não está apenas "varrendo problemas para baixo do tapete"'); // TODO: Remover antes da produção
    } else if (padraoAusente.length <= 3) {// console.log('✅ SISTEMA MELHORADO'); // TODO: Remover antes da produção// console.log('Ainda há espaço para otimizações, mas houve progresso real'); // TODO: Remover antes da produção
    } else {// console.log('⚠ SISTEMA PRECISA MAIS AJUSTES'); // TODO: Remover antes da produção
    }
    
    return padraoAusente.length <= 1;
    
  } catch (error) {
    console.error('Erro durante validação:', error.message);
    return false;
  }
}

// Executa a validação
try {
  const sucesso = await testarProjetoReal();
  process.exit(sucesso ? 0 : 1);
} catch (error) {
  console.error('Erro fatal:', error.message);
  process.exit(1);
}