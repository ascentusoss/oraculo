#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Relatório Detalhado de Interfaces Inline
 * 
 * Gera relatório mostrando:
 * - Onde está cada interface
 * - Se deve ou não ser movida
 * - Sugestão de destino
 * - Status atual (já centralizada ou não)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const BASE_DIR = process.cwd();
const SRC_DIR = join(BASE_DIR, 'src');

// Diretórios que NÃO devem ter interfaces inline (devem movê-las)
const DIRS_MOVER = [
    'src/cli',
    'src/core',
    'src/analistas',
    'src/guardian',
    'src/relatorios',
    'src/shared',
    'src/zeladores',
];

// Diretórios que JÁ SÃO centralizados (não precisam mover)
const DIRS_CENTRALIZADOS = [
    'src/tipos',
    'src/@types',
];

// Diretórios ignorados
const DIRS_IGNORADOS = [
    'node_modules',
    'dist',
    '.deprecados',
    'tests',
    'tmp',
];

/**
 * Verifica se um arquivo deve ser analisado
 */
function deveAnalisar(caminho) {
    const rel = relative(BASE_DIR, caminho);

    // Ignorar diretórios específicos
    if (DIRS_IGNORADOS.some(dir => rel.includes(dir))) {
        return false;
    }

    // Ignorar .d.ts
    if (rel.endsWith('.d.ts')) {
        return false;
    }

    // Apenas .ts e .tsx
    return rel.endsWith('.ts') || rel.endsWith('.tsx');
}

/**
 * Determina se a interface deve ser movida
 */
function deveMover(caminho) {
    const rel = relative(BASE_DIR, caminho);

    // Já está centralizado?
    if (DIRS_CENTRALIZADOS.some(dir => rel.startsWith(dir))) {
        return { mover: false, motivo: '✅ Já centralizado em tipos/' };
    }

    // Está em diretório que deve mover?
    if (DIRS_MOVER.some(dir => rel.startsWith(dir))) {
        return { mover: true, motivo: '🔴 Deve ser movido para tipos/' };
    }

    return { mover: false, motivo: '⚪ Indefinido' };
}

/**
 * Sugere destino para a interface
 */
function sugerirDestino(caminho, nomeInterface) {
    const rel = relative(BASE_DIR, caminho);

    // CLI
    if (rel.startsWith('src/cli/commands/')) {
        return 'tipos/cli/commands.ts';
    }
    if (rel.startsWith('src/cli/handlers/')) {
        return 'tipos/cli/handlers.ts (✅ já existe)';
    }
    if (rel.startsWith('src/cli/diagnostico/exporters/')) {
        return 'tipos/cli/exporters.ts (✅ já existe)';
    }
    if (rel.startsWith('src/cli/diagnostico/handlers/')) {
        return 'tipos/cli/diagnostico-handlers.ts (✅ já existe)';
    }
    if (rel.startsWith('src/cli/options/')) {
        return 'tipos/cli/options.ts (✅ já existe)';
    }
    if (rel.startsWith('src/cli/')) {
        return 'tipos/cli/';
    }

    // Core
    if (rel.startsWith('src/core/schema/')) {
        return 'tipos/core/schema.ts';
    }
    if (rel.startsWith('src/core/messages/')) {
        return 'tipos/core/messages.ts';
    }
    if (rel.startsWith('src/core/config/auto/')) {
        return 'tipos/core/config-auto.ts';
    }
    if (rel.startsWith('src/core/config/')) {
        return 'tipos/core/config.ts (✅ já existe)';
    }
    if (rel.startsWith('src/core/parsing/')) {
        return 'tipos/core/parsing.ts';
    }
    if (rel.startsWith('src/core/')) {
        return 'tipos/core/';
    }

    // Analistas
    if (rel.startsWith('src/analistas/')) {
        return 'tipos/analistas/ (✅ já existe)';
    }

    // Guardian
    if (rel.startsWith('src/guardian/')) {
        return 'tipos/guardian/ (✅ já existe)';
    }

    // Relatorios
    if (rel.startsWith('src/relatorios/')) {
        return 'tipos/relatorios/ (✅ já existe)';
    }

    // Shared
    if (rel.startsWith('src/shared/')) {
        return 'tipos/shared/';
    }

    // Zeladores
    if (rel.startsWith('src/zeladores/')) {
        return 'tipos/zeladores/ (✅ já existe)';
    }

    return 'tipos/';
}

/**
 * Extrai interfaces de um arquivo
 */
function extrairInterfaces(caminho) {
    const conteudo = readFileSync(caminho, 'utf-8');
    const interfaces = [];

    // Pattern: export interface NomeInterface
    const pattern = /^export\s+interface\s+(\w+)/gm;
    let match;

    while ((match = pattern.exec(conteudo)) !== null) {
        const nome = match[1];
        const linha = conteudo.substring(0, match.index).split('\n').length;

        interfaces.push({ nome, linha });
    }

    return interfaces;
}

/**
 * Varre diretório recursivamente
 */
function varrerDiretorio(dir) {
    const arquivos = [];

    try {
        const entries = readdirSync(dir);

        for (const entry of entries) {
            const fullPath = join(dir, entry);

            try {
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    // Ignorar diretórios específicos
                    if (!DIRS_IGNORADOS.includes(entry)) {
                        arquivos.push(...varrerDiretorio(fullPath));
                    }
                } else if (stat.isFile() && deveAnalisar(fullPath)) {
                    arquivos.push(fullPath);
                }
            } catch (err) {
                // Ignorar erros de permissão
            }
        }
    } catch (err) {
        console.error(`Erro ao ler diretório ${dir}:`, err.message);
    }

    return arquivos;
}

/**
 * Gera relatório
 */
function gerarRelatorio() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  📋 RELATÓRIO DETALHADO DE INTERFACES INLINE                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const arquivos = varrerDiretorio(SRC_DIR);

    const porStatus = {
        'ja-centralizado': [],
        'deve-mover': [],
        'indefinido': [],
    };

    let totalInterfaces = 0;

    for (const arquivo of arquivos) {
        const interfaces = extrairInterfaces(arquivo);

        if (interfaces.length === 0) continue;

        const rel = relative(BASE_DIR, arquivo);
        const { mover, motivo } = deveMover(arquivo);

        for (const iface of interfaces) {
            totalInterfaces++;

            const destino = sugerirDestino(arquivo, iface.nome);

            const info = {
                arquivo: rel,
                interface: iface.nome,
                linha: iface.linha,
                motivo,
                destino,
            };

            if (motivo.includes('✅')) {
                porStatus['ja-centralizado'].push(info);
            } else if (motivo.includes('🔴')) {
                porStatus['deve-mover'].push(info);
            } else {
                porStatus['indefinido'].push(info);
            }
        }
    }

    // Relatório por status
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔴 INTERFACES QUE DEVEM SER MOVIDAS PARA tipos/\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (porStatus['deve-mover'].length === 0) {
        console.log('  ✅ Nenhuma interface inline detectada fora de tipos/!\n');
    } else {
        const porArquivo = {};

        for (const info of porStatus['deve-mover']) {
            if (!porArquivo[info.arquivo]) {
                porArquivo[info.arquivo] = [];
            }
            porArquivo[info.arquivo].push(info);
        }

        for (const [arquivo, interfaces] of Object.entries(porArquivo)) {
            console.log(`\n📄 ${arquivo}`);
            console.log(`   Destino sugerido: ${interfaces[0].destino}\n`);

            for (const info of interfaces) {
                console.log(`   • ${info.interface} (linha ${info.linha})`);
            }
        }

        console.log(`\n   Total: ${porStatus['deve-mover'].length} interfaces\n`);
    }

    // Interfaces já centralizadas
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('✅ INTERFACES JÁ CENTRALIZADAS (tipos/)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (porStatus['ja-centralizado'].length > 0) {
        const porArquivo = {};

        for (const info of porStatus['ja-centralizado']) {
            if (!porArquivo[info.arquivo]) {
                porArquivo[info.arquivo] = [];
            }
            porArquivo[info.arquivo].push(info);
        }

        let count = 0;
        for (const [arquivo, interfaces] of Object.entries(porArquivo)) {
            count++;
            if (count <= 5) { // Mostrar apenas primeiros 5 arquivos
                console.log(`   📄 ${arquivo}: ${interfaces.length} interface(s)`);
            }
        }

        if (count > 5) {
            console.log(`   ... e mais ${count - 5} arquivo(s)`);
        }

        console.log(`\n   Total: ${porStatus['ja-centralizado'].length} interfaces\n`);
    }

    // Resumo final
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RESUMO\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   Total de interfaces: ${totalInterfaces}`);
    console.log(`   🔴 Devem ser movidas: ${porStatus['deve-mover'].length}`);
    console.log(`   ✅ Já centralizadas: ${porStatus['ja-centralizado'].length}`);
    console.log(`   ⚪ Indefinidas: ${porStatus['indefinido'].length}\n`);

    // Próximos passos
    if (porStatus['deve-mover'].length > 0) {
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('🎯 PRÓXIMOS PASSOS\n');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('   1. Criar arquivos de tipos sugeridos (se não existirem)');
        console.log('   2. Mover interfaces para os arquivos de tipos');
        console.log('   3. Adicionar re-exports nos arquivos originais');
        console.log('   4. Atualizar imports nos consumidores');
        console.log('   5. Rodar build para validar\n');
    }
}

// Executar
gerarRelatorio();
