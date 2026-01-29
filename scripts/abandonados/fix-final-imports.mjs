#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Correção final de imports relativos após reorganização
 */

import { readFileSync, writeFileSync } from 'fs';

const fixes = [
    // comando-perf
    {
        file: 'src/cli/commands/comando-perf.ts',
        from: "from '/util/exec-safe.js'",
        to: "from '/utils/exec-safe.js'",
    },
    // config.ts
    {
        file: 'src/core/config/config.ts',
        from: "from '../paths.js'",
        to: "from '../registry/paths.js'",
    },
    // inquisidor.ts
    {
        file: 'src/core/execution/inquisidor.ts',
        from: "from '/parser.js'",
        to: "from '/parsing/parser.js'",
    },
    // file-registry.ts
    {
        file: 'src/core/registry/file-registry.ts',
        from: "from '../core/messages/log.js'",
        to: "from '../messages/log.js'",
    },
    // gerador-relatorio.ts
    {
        file: 'src/relatorios/gerador-relatorio.ts',
        from: "from '/schema-versao.js'",
        to: "from '/schema/version.js'",
    },
    // relatorio-arquetipos.ts
    {
        file: 'src/relatorios/relatorio-arquetipos.ts',
        from: "from '/schema-versao.js'",
        to: "from '/schema/version.js'",
    },
    // leitor-relatorio.ts
    {
        file: 'src/shared/helpers/leitor-relatorio.ts',
        from: "from '/schema-versao.js'",
        to: "from '/schema/version.js'",
    },
    // core-plugin.ts
    {
        file: 'src/shared/plugins/core-plugin.ts',
        from: "from '/parser.js'",
        to: "from '/parsing/parser.js'",
    },
    // ambiente.ts
    {
        file: 'src/tipos/core/execution/ambiente.ts',
        from: "from '../guardian/resultado.js'",
        to: "from '../../guardian/resultado.js'",
    },
    // resultados.ts
    {
        file: 'src/tipos/core/execution/resultados.ts',
        from: "from '../guardian/resultado.js'",
        to: "from '../../guardian/resultado.js'",
    },
];

let count = 0;

for (const { file, from, to } of fixes) {
    try {
        let content = readFileSync(file, 'utf-8');
        if (content.includes(from)) {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
            writeFileSync(file, content, 'utf-8');
            console.log(`✅ ${file}`);
            count++;
        }
    } catch (err) {
        console.log(`❌ ${file}: ${err.message}`);
    }
}

console.log(`\n✨ ${count} arquivos corrigidos`);
