#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Script para corrigir imports específicos que precisam de .js no final
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/**/*.ts');

const fixes = [
    // Imports específicos que precisam de .js
    { from: /from ['"]\/paths['"]/g, to: "from '/registry/paths.js'" },
    { from: /from ['"]\/configuracao\/chalk-safe['"]/g, to: "from '/config/chalk-safe.js'" },
    { from: /from ['"]\/configuracao\/config['"]/g, to: "from '/config/config.js'" },
    { from: /from ['"]\/nucleo\/inquisidor['"]/g, to: "from '/execution/inquisidor.js'" },
    { from: /from ['"]\/nucleo\/scanner['"]/g, to: "from '/execution/scanner.js'" },
    { from: /from ['"]\/filtros['"]/g, to: "from '/parsing/filters.js'" },
    { from: /from ['"]\/util\/exec-safe['"]/g, to: "from '/utils/exec-safe.js'" },
    { from: /from ['"]\/auto-unificado['"]/g, to: "from '/corrections/auto-unificado.js'" },
    { from: /from ['"]\/quick-fixes\/fix-any-to-proper-type['"]/g, to: "from '/corrections/quick-fixes/fix-any-to-proper-type.js'" },
    { from: /from ['"]\/quick-fixes\/fix-unknown-to-specific-type['"]/g, to: "from '/corrections/quick-fixes/fix-unknown-to-specific-type.js'" },
    { from: /from ['"]\/type-safety\/context-analyzer['"]/g, to: "from '/corrections/type-safety/context-analyzer.js'" },
];

let count = 0;

for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    let modified = false;

    for (const { from, to } of fixes) {
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    }

    if (modified) {
        writeFileSync(file, content, 'utf-8');
        console.log(`✅ ${file}`);
        count++;
    }
}

console.log(`\n✨ ${count} arquivos corrigidos`);
