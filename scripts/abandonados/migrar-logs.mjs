#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * 🔧 Script de migração para o sistema de logs consolidado
 * Atualiza todas as referências para usar o sistema unificado
 */

import { promises as fs } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '..');

// Mapeamento de imports antigos para novos
const MIGRATION_MAP = {
    "import { logAnalistas } from '/log-helpers.js';": "import { logAnalistas } from '';",
    "import { logAnalistas } from '/log-helpers-inteligente.js';": "import { logAnalistas } from '';",
    "import { logScanner } from '/log-helpers.js';": "import { logScanner } from '';",
    "import { logScanner } from '/log-helpers-inteligente.js';": "import { logScanner } from '';",
    "import { logSistema } from '/log-helpers.js';": "import { logSistema } from '';",
    "import { logSistema } from '/log-helpers-inteligente.js';": "import { logSistema } from '';",
    "import { logFiltros } from '/log-helpers.js';": "import { logFiltros } from '';",
    "import { logFiltros } from '/log-helpers-inteligente.js';": "import { logFiltros } from '';",
    "import { logProjeto } from '/log-helpers.js';": "import { logProjeto } from '';",
    "import { logProjeto } from '/log-helpers-inteligente.js';": "import { logProjeto } from '';",
    "import { logOcorrencias } from '/log-helpers.js';": "import { logOcorrencias } from '';",
    "import { logOcorrencias } from '/log-helpers-inteligente.js';": "import { logOcorrencias } from '';",
    "import { logRelatorio } from '/log-helpers.js';": "import { logRelatorio } from '';",
    "import { logRelatorio } from '/log-helpers-inteligente.js';": "import { logRelatorio } from '';",

    // Imports combinados
    "from '/log-helpers.js'": "from ''",
    "from '/log-helpers-inteligente.js'": "from ''",
};

// Padrões a atualizar usando regex
const REGEX_PATTERNS = [
    {
        pattern: /import\s*\{([^}]+)\}\s*from\s*['"]\/log-helpers(?:-inteligente)?\.js['"]/g,
        replacement: "import { $1 } from ''"
    }
];

async function getAllTsFiles(dir) {
    const files = [];

    async function scan(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // Pula certas pastas
                if (['node_modules', 'dist', '.git', '.deprecados'].includes(entry.name)) {
                    continue;
                }
                await scan(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    }

    await scan(dir);
    return files;
}

async function migrateFile(filePath) {
    let content = await fs.readFile(filePath, 'utf-8');
    let changed = false;

    // Aplica migrações diretas
    for (const [oldImport, newImport] of Object.entries(MIGRATION_MAP)) {
        if (content.includes(oldImport)) {
            content = content.replace(oldImport, newImport);
            changed = true;
        }
    }

    // Aplica regex patterns
    for (const { pattern, replacement } of REGEX_PATTERNS) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    if (changed) {
        await fs.writeFile(filePath, content, 'utf-8');
        return true;
    }

    return false;
}

async function main() {
    console.log('🔧 Iniciando migração do sistema de logs...');

    const files = await getAllTsFiles(ROOT_DIR);
    console.log(`📁 Encontrados ${files.length} arquivos TypeScript`);

    let migratedCount = 0;

    for (const file of files) {
        // Pula os próprios arquivos de log antigos
        if (file.includes('log-helpers.ts') || file.includes('log-helpers-inteligente.ts')) {
            continue;
        }

        try {
            const migrated = await migrateFile(file);
            if (migrated) {
                migratedCount++;
                console.log(`✅ Migrado: ${file.replace(ROOT_DIR, '')}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao migrar ${file}:`, error.message);
        }
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`📊 ${migratedCount} arquivos atualizados`);
    console.log(`📋 Próximo passo: Verificar e remover log-helpers.ts e log-helpers-inteligente.ts`);
}

main().catch(console.error);