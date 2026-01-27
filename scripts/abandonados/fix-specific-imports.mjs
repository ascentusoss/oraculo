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
    { from: /from ['"]@core\/paths['"]/g, to: "from '@core/registry/paths.js'" },
    { from: /from ['"]@core\/configuracao\/chalk-safe['"]/g, to: "from '@core/config/chalk-safe.js'" },
    { from: /from ['"]@core\/configuracao\/config['"]/g, to: "from '@core/config/config.js'" },
    { from: /from ['"]@core\/nucleo\/inquisidor['"]/g, to: "from '@core/execution/inquisidor.js'" },
    { from: /from ['"]@core\/nucleo\/scanner['"]/g, to: "from '@core/execution/scanner.js'" },
    { from: /from ['"]@core\/filtros['"]/g, to: "from '@core/parsing/filters.js'" },
    { from: /from ['"]@core\/util\/exec-safe['"]/g, to: "from '@core/utils/exec-safe.js'" },
    { from: /from ['"]@auto\/auto-unificado['"]/g, to: "from '@analistas/corrections/auto-unificado.js'" },
    { from: /from ['"]@auto\/quick-fixes\/fix-any-to-proper-type['"]/g, to: "from '@analistas/corrections/quick-fixes/fix-any-to-proper-type.js'" },
    { from: /from ['"]@auto\/quick-fixes\/fix-unknown-to-specific-type['"]/g, to: "from '@analistas/corrections/quick-fixes/fix-unknown-to-specific-type.js'" },
    { from: /from ['"]@auto\/type-safety\/context-analyzer['"]/g, to: "from '@analistas/corrections/type-safety/context-analyzer.js'" },
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
