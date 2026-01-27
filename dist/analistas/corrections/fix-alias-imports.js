import { promises as fs } from 'node:fs';
import path from 'node:path';
export async function aplicarFixAliasImports(filePath, content) {
    if (!filePath.endsWith('.ts'))
        return { changed: false, content };
    const out = content.replace(/@types\/types\.js\b/g, 'types');
    return { changed: out !== content, content: out };
}
export async function scanAndApplyFix(root) {
    let changed = 0;
    async function walk(dir) {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const filePath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(filePath);
            }
            else if (entry.isFile() && filePath.endsWith('.ts')) {
                const src = await fs.readFile(filePath, 'utf8');
                const { changed: wasChanged, content } = await aplicarFixAliasImports(filePath, src);
                if (wasChanged) {
                    await fs.writeFile(filePath, content, 'utf8');
                    changed++;
                }
            }
        }
    }
    await walk(path.join(root, 'src'));
    await walk(path.join(root, 'tests'));
    return changed;
}
//# sourceMappingURL=fix-alias-imports.js.map