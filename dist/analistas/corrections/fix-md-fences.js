import { promises as fs } from 'node:fs';
import path from 'node:path';
export function guessLang(block) {
    const head = block.slice(0, 200).trim();
    if (/^\{[\s\S]*\}$/.test(head))
        return 'json';
    if (/\$env:|PowerShell/i.test(block))
        return 'powershell';
    if (/^#!\/usr\/bin\/(env\s+)?bash|\bnpm\s|\bnode\s|\bbash\b/i.test(block))
        return 'bash';
    if (/import\s.+from|export\s+(const|function|default)/.test(block))
        return 'ts';
    if (/"?type"?\s*:\s*"module"/.test(block))
        return 'json';
    return 'text';
}
export function fixFences(content) {
    const lines = content.split(/\r?\n/);
    const out = [];
    let lineIndex = 0;
    while (lineIndex < lines.length) {
        const line = lines[lineIndex];
        if (/^```\s*$/.test(line)) {
            const _start = lineIndex;
            lineIndex++;
            const buf = [];
            while (lineIndex < lines.length && !/^```\s*$/.test(lines[lineIndex])) {
                buf.push(lines[lineIndex]);
                lineIndex++;
            }
            const lang = guessLang(buf.join('\n'));
            out.push(`\`\`\`${lang}`);
            out.push(...buf);
            if (lineIndex < lines.length) {
                out.push('```');
                lineIndex++;
            }
        }
        else {
            out.push(line);
            lineIndex++;
        }
    }
    return out.join('\n');
}
export async function scanAndApplyFixMdFences(root) {
    let changed = 0;
    async function listMarkdown(dir) {
        const out = [];
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        }
        catch {
            return out;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (/^(node_modules|dist|coverage|pre-public|preview-oraculo|\.git)$/i.test(entry.name))
                    continue;
                out.push(...(await listMarkdown(fullPath)));
            }
            else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
                out.push(fullPath);
            }
        }
        return out;
    }
    const files = await listMarkdown(root);
    for (const filePath of files) {
        const rel = path.relative(root, filePath).replace(/\\/g, '/');
        if (rel.startsWith('pre-public/') || rel.includes('/legado/'))
            continue;
        const content = await fs.readFile(filePath, 'utf8');
        if (!/```\s*\n/.test(content))
            continue;
        const updated = fixFences(content);
        if (updated !== content) {
            await fs.writeFile(filePath, updated, 'utf8');
            changed++;
        }
    }
    return changed;
}
//# sourceMappingURL=fix-md-fences.js.map