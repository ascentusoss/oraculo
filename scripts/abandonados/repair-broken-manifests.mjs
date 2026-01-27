#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const targets = [
    'src/shared/plugins/gradle/package.json',
    'src/shared/plugins/java/package.json',
    'src/shared/plugins/kotlin/package.json',
    'src/tsconfig.json',
];

function repairText(text) {
    let s = text;
    // Remove spaces after dots inside version-like tokens: 0. 2. 0 -> 0.2.0
    s = s.replace(/(\d)\.\s+(\d)/g, '$1.$2');

    // Remove spaces around dots in file paths/names: index. js -> index.js
    s = s.replace(/\.\s+(?=[a-zA-Z0-9_\-])/g, '.');

    // Remove spaces after slashes before filename parts: / dist -> /dist
    s = s.replace(/\/(\s)+(?=[\w.-])/g, '/');

    // Remove spaces between extension dot and extension letters: . j s -> .js (catch common splits)
    s = s.replace(/\.\s+([a-z]{1,4})\s+([a-z]{1,4})/gi, '.$1$2');

    // Trim accidental double spaces
    s = s.replace(/ {2,}/g, ' ');

    return s;
}

async function run() {
    const cwd = process.cwd();
    for (const rel of targets) {
        const file = path.join(cwd, rel);
        try {
            const orig = await fs.readFile(file, 'utf8');
            const repaired = repairText(orig);
            if (repaired !== orig) {
                await fs.writeFile(file + '.bak', orig, 'utf8');
                await fs.writeFile(file, repaired, 'utf8');
                console.log(`Repaired and backed up: ${rel}`);
            } else {
                console.log(`No changes needed: ${rel}`);
            }
        } catch (err) {
            console.error(`Error processing ${rel}:`, err.message);
        }
    }
}

run().catch((e) => { console.error(e); process.exit(1); });
