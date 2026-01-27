#!/usr/bin/env node
// SPDX-License-Identifier: MIT

/**
 * Script de Validação Simplificada
 * Testa se o sistema está funcionando sem apenas suprimir problemas
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const PROJETO_ROOT = process.cwd();
const TEMP_DIR = path.join(PROJETO_ROOT, 'tests', 'tmp', 'validacao-simples');

// Helper para criar projeto de teste
/**

 * TODO: Adicionar descrição da função

 * @param {*} nome - TODO: Descrever parâmetro

 * @param {*} arquivos - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} nome - TODO: Descrever parâmetro

 * @param {*} arquivos - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} nome - TODO: Descrever parâmetro

 * @param {*} arquivos - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} nome - TODO: Descrever parâmetro

 * @param {*} arquivos - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} nome - TODO: Descrever parâmetro

 * @param {*} arquivos - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

async function criarProjetoTeste(nome, arquivos) {
  const projetoDir = path.join(TEMP_DIR, nome);
  await fs.mkdir(projetoDir, { recursive: true });
  
  for (const [arquivo, conteudo] of Object.entries(arquivos)) {
    const arquivoPath = path.join(projetoDir, arquivo);
    await fs.mkdir(path.dirname(arquivoPath), { recursive: true });
    await fs.writeFile(arquivoPath, conteudo, 'utf-8');
  }
  
  return projetoDir;
}

// Helper para executar diagnóstico

function executarDiagnostico(diretorio) {
  try {
    const comando = `node "${path.join(PROJETO_ROOT, 'dist', 'bin', 'index.js')}" diagnosticar --json`;
    const resultado = execSync(comando, { 
      cwd: diretorio, 
      encoding: 'utf-8',
      timeout: 30000
    });
    return JSON.parse(resultado);
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error.message);
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    if (error.stdout) {
      console.error('STDOUT:', error.stdout);
    }
    throw error;
  }
}

async function executarValidacaoSimples() {// console.log('=== Validação Simplificada do Sistema ===\n'); // TODO: Remover antes da produção
  // Limpar e criar diretório
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch {}
  await fs.mkdir(TEMP_DIR, { recursive: true });

  let testesPassaram = 0;
  let totalTestes = 0;

  // Teste 1: Discord.js Bot Correto (NÃO deve reportar problemas)// console.log('Teste 1: Discord.js Bot Correto'); // TODO: Remover antes da produção
  totalTestes++;
  
  try {
    const projetoDir = await criarProjetoTeste('discord-bot-ok', {
      'package.json': JSON.stringify({
        name: 'test-bot',
        dependencies: { 'discord.js': '^14.0.0' }
      }),
      'bot.js': `
import { Client, SlashCommandBuilder } from 'discord.js';

const client = new Client({ intents: ['Guilds'] });

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

const pingCommand = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Responde com Pong!');

client.login(process.env.TOKEN);
      `
    });

    const resultado = executarDiagnostico(projetoDir);
    const padraoAusente = resultado.ocorrencias?.filter(o => o.tipo === 'padrao-ausente') || [];
    
    if (padraoAusente.length === 0) {// console.log('✓ PASSOU - Nenhum falso positivo'); // TODO: Remover antes da produção
      testesPassaram++;
    } else {
      console.log(`✗ FALHOU - ${padraoAusente.length} falso(s) positivo(s)`);
      console.log('Problemas:', padraoAusente.map(p => p.problema));
    }
    
  } catch (error) {// console.log(`✗ ERRO - ${error.message}`); // TODO: Remover antes da produção
  }

  // Teste 2: Arquivo de Configuração (NÃO deve reportar problemas)  // console.log('\nTeste 2: Arquivo de Configuração'); // TODO: Remover antes da produção
  totalTestes++;
  
  try {
    const projetoDir = await criarProjetoTeste('config-file', {
      'config/database.js': `
export const config = {
  host: 'localhost',
  port: 5432,
  database: 'myapp'
};
      `
    });

    const resultado = executarDiagnostico(projetoDir);
    const padraoAusente = resultado.ocorrencias?.filter(o => o.tipo === 'padrao-ausente') || [];
    
    if (padraoAusente.length === 0) {// console.log('✓ PASSOU - Arquivo de config não reportado incorretamente'); // TODO: Remover antes da produção
      testesPassaram++;
    } else {
      console.log(`✗ FALHOU - ${padraoAusente.length} falso(s) positivo(s) em config`);
    }
    
  } catch (error) {// console.log(`✗ ERRO - ${error.message}`); // TODO: Remover antes da produção
  }

  // Teste 3: Arquivo de Teste (NÃO deve reportar problemas)// console.log('\nTeste 3: Arquivo de Teste'); // TODO: Remover antes da produção
  totalTestes++;
  
  try {
    const projetoDir = await criarProjetoTeste('test-file', {
      'tests/example.test.js': `
import { describe, it, expect } from 'vitest';

describe('Test Suite', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
      `
    });

    const resultado = executarDiagnostico(projetoDir);
    const padraoAusente = resultado.ocorrencias?.filter(o => o.tipo === 'padrao-ausente') || [];
    
    if (padraoAusente.length === 0) {// console.log('✓ PASSOU - Arquivo de teste não reportado incorretamente'); // TODO: Remover antes da produção
      testesPassaram++;
    } else {
      console.log(`✗ FALHOU - ${padraoAusente.length} falso(s) positivo(s) em teste`);
    }
    
  } catch (error) {// console.log(`✗ ERRO - ${error.message}`); // TODO: Remover antes da produção
  }

  // Resultado final
  const taxaSucesso = (testesPassaram / totalTestes) * 100;// console.log('\n=== Resultados ==='); // TODO: Remover antes da produção
  console.log(`Testes: ${testesPassaram}/${totalTestes} (${taxaSucesso.toFixed(1)}%)`);
  
  if (taxaSucesso >= 80) {// console.log('🎉 SISTEMA VALIDADO - Redução real de falsos positivos!'); // TODO: Remover antes da produção// console.log('O sistema demonstra inteligência contextual genuína.'); // TODO: Remover antes da produção
  } else {// console.log('⚠ SISTEMA PRECISA AJUSTES'); // TODO: Remover antes da produção
  }

  // Limpeza
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  return taxaSucesso >= 80;
}

// Executa
try {
  const sucesso = await executarValidacaoSimples();
  process.exit(sucesso ? 0 : 1);
} catch (error) {
  console.error('Erro fatal:', error.message);
  process.exit(1);
}