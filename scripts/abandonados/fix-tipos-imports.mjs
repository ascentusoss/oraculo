// SPDX-License-Identifier: MIT
// Script pequeno para normalizar imports de tipos:
// Troca importações que começam com /<subpath> para /tipos
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('./src');

async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            files.push(...(await walk(full)));
        } else if (/\.(ts|js|mjs|tsx|jsx)$/.test(e.name)) {
            files.push(full);
        }
    }
    return files;
}

async function fixFile(file) {
    const raw = await fs.readFile(file, 'utf8');
    let updated = raw;

    // Replace imports like: from '/whatever' or '/whatever.js' to '/tipos'
    // Keep import type vs value intact; only change module specifier.
    updated = updated.replace(/(['\"])\/(?:[^'"\n]+?)\1/g, (m) => {
        const quote = m[0];
        return `${quote}/tipos${quote}`;
    });

    // Also replace occurrences in .js.map or generated headers that may include /...
    // but limit to files inside src only (we walk src)

    if (updated !== raw) {
        await fs.writeFile(file, updated, 'utf8');
        console.log('patched', path.relative(process.cwd(), file));
    }
}

async function main() {
    const files = await walk(ROOT);
    for (const f of files) {
        try {
            await fixFile(f);
        } catch (err) {
            console.error('error', f, err);
        }
    }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('fix-tipos-imports.mjs')) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
