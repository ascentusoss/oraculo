#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Script para atualizar imports após reorganização de src/
 * Data: 2025-11-03
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const TESTS_DIR = join(ROOT, 'tests');

// Mapa de substituições (ordem importa!)
const REPLACEMENTS = [
    // Messages movido para core/messages
    { from: /from ['"]\//g, to: "from '/messages/" },
    { from: /from ['"]\.\.\/messages\//g, to: "from '../core/messages/" },
    { from: /from ['"]\.\.\/.\.\/messages\//g, to: "from '../../core/messages/" },
    { from: /from ['"]\.\.\/\.\.\/\.\.\/messages\//g, to: "from '../../../core/messages/" },

    // Auto movido para analistas/corrections
    { from: /from ['"]\//g, to: "from '/corrections/" },
    { from: /from ['"]\.\.\/auto\//g, to: "from '../analistas/corrections/" },
    { from: /from ['"]\.\.\/.\.\/auto\//g, to: "from '../../analistas/corrections/" },

    // Core/nucleo → core/execution
    { from: /from ['"]\/nucleo\//g, to: "from '/execution/" },
    { from: /from ['"]\.\.\/nucleo\//g, to: "from '../execution/" },
    { from: /from ['"]\.\.\/.\.\/core\/nucleo\//g, to: "from '../../core/execution/" },

    // Core files movidos
    { from: /from ['"]\/parser['"];/g, to: "from '/parsing/parser.js';" },
    { from: /from ['"]\/filtros['"];/g, to: "from '/parsing/filters.js';" },
    { from: /from ['"]\/schema-versao['"];/g, to: "from '/schema/version.js';" },
    { from: /from ['"]\/worker-pool['"];/g, to: "from '/workers/worker-pool.js';" },
    { from: /from ['"]\/file-registry['"];/g, to: "from '/registry/file-registry.js';" },
    { from: /from ['"]\/paths['"];/g, to: "from '/registry/paths.js';" },

    // Caminhos relativos para parser/filtros
    { from: /from ['"]\.\.\/parser['"];/g, to: "from '../parsing/parser.js';" },
    { from: /from ['"]\.\.\/filtros['"];/g, to: "from '../parsing/filters.js';" },
    { from: /from ['"]\.\.\/.\.\/parser['"];/g, to: "from '../../parsing/parser.js';" },
    { from: /from ['"]\.\.\/.\.\/filtros['"];/g, to: "from '../../parsing/filters.js';" },

    // Configuracao → config
    { from: /from ['"]\/configuracao\//g, to: "from '/config/" },
    { from: /from ['"]\.\.\/configuracao\//g, to: "from '../config/" },
    { from: /from ['"]\.\.\/.\.\/configuracao\//g, to: "from '../../config/" },

    // Util → utils
    { from: /from ['"]\/util\//g, to: "from '/utils/" },
    { from: /from ['"]\.\.\/util\//g, to: "from '../utils/" },

    // Analistas/scripts → analistas/js-ts
    { from: /from ['"]\/scripts\//g, to: "from '/js-ts/" },
    { from: /from ['"]\.\.\/scripts\//g, to: "from '../js-ts/" },
];

function getAllFiles(dir, fileList = []) {
    const files = readdirSync(dir);

    files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('dist')) {
                getAllFiles(filePath, fileList);
            }
        } else {
            const ext = extname(file);
            if (['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs', '.tsx', '.jsx'].includes(ext)) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

function processFile(filePath) {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const { from, to } of REPLACEMENTS) {
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    }

    if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${filePath.replace(ROOT, '')}`);
        return 1;
    }

    return 0;
}

console.log('🔧 Atualizando imports após reorganização...\n');

const srcFiles = getAllFiles(SRC_DIR);
const testFiles = getAllFiles(TESTS_DIR);
const allFiles = [...srcFiles, ...testFiles];

let modifiedCount = 0;

for (const file of allFiles) {
    modifiedCount += processFile(file);
}

console.log(`\n✨ Concluído! ${modifiedCount} arquivos modificados.`);
