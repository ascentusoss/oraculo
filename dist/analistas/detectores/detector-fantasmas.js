import { promises as fs } from 'node:fs';
import path from 'node:path';
import { grafoDependencias } from '../detectores/detector-dependencias.js';
import { config } from '../../core/config/config.js';
import { isInsideSrc } from '../../core/config/paths.js';
import { scanRepository } from '../../core/execution/scanner.js';
import { minimatch } from 'minimatch';
const EXTENSOES_ALVO = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
const INATIVIDADE_DIAS = Number(process.env.GHOST_DAYS) || 45;
const MILIS_POR_DIA = 86_400_000;
const ENTRYPOINT_PATTERNS = [
    /^(src\/)?index\.(ts|js|tsx|jsx|mjs|cjs)$/i,
    /^(src\/)?main\.(ts|js|tsx|jsx|mjs|cjs)$/i,
    /^(src\/)?server\.(ts|js|tsx|jsx|mjs|cjs)$/i,
    /^(src\/)?app\.(ts|js|tsx|jsx|mjs|cjs)$/i,
    /^(src\/)?cli\.(ts|js|tsx|jsx|mjs|cjs)$/i,
    /(^|\/)bin\/[^/]+\.(ts|js|mjs|cjs)$/i,
    /\/index\.(ts|js|tsx|jsx|mjs|cjs)$/i,
    /config\.(ts|js|cjs|mjs)$/i,
    /\.config\.(ts|js|cjs|mjs)$/i,
    /\.d\.ts$/i,
];
function isTestFileFromConfig(relPath) {
    const testConfig = config.testPatterns;
    const patterns = testConfig?.files || [
        '**/*.test.*',
        '**/*.spec.*',
        'test/**/*',
        'tests/**/*',
        '**/__tests__/**',
    ];
    const normalized = relPath.replace(/\\/g, '/');
    return patterns.some((p) => minimatch(normalized, p, { dot: true }));
}
function isEntrypoint(relPath) {
    const normalized = relPath.replace(/\\/g, '/');
    return ENTRYPOINT_PATTERNS.some((p) => p.test(normalized));
}
function estaSendoReferenciado(relPath, grafo) {
    const normalized = relPath.replace(/\\/g, '/');
    const variations = new Set([normalized]);
    const ext = path.posix.extname(normalized);
    if (ext) {
        variations.add(normalized.slice(0, -ext.length));
    }
    const base = ext ? normalized.slice(0, -ext.length) : normalized;
    for (const e of ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs']) {
        variations.add(base + e);
    }
    for (const dependencias of grafo.values()) {
        for (const dep of dependencias) {
            const depNorm = dep.replace(/\\/g, '/');
            if (variations.has(depNorm))
                return true;
        }
    }
    return false;
}
function importaOutros(relPath, grafo) {
    const normalized = relPath.replace(/\\/g, '/');
    for (const [chave, deps] of grafo.entries()) {
        if (chave.replace(/\\/g, '/') === normalized && deps.size > 0) {
            return true;
        }
    }
    return false;
}
export async function detectarFantasmas(baseDir = process.cwd()) {
    const fileMap = await scanRepository(baseDir);
    const agora = Date.now();
    const fantasmas = [];
    const testConfig = config.testPatterns;
    const excludeTestsFromOrphan = testConfig?.excludeFromOrphanCheck !== false;
    for (const entrada of Object.values(fileMap)) {
        const { relPath, fullPath } = entrada;
        const ext = path.extname(relPath).toLowerCase();
        if (!EXTENSOES_ALVO.includes(ext))
            continue;
        if (excludeTestsFromOrphan && isTestFileFromConfig(relPath)) {
            continue;
        }
        if (isEntrypoint(relPath)) {
            continue;
        }
        try {
            const stat = await fs.stat(fullPath);
            const diasInativo = Math.floor((agora - stat.mtimeMs) / MILIS_POR_DIA);
            if (grafoDependencias.size === 0)
                continue;
            const referenciado = estaSendoReferenciado(relPath, grafoDependencias);
            if (importaOutros(relPath, grafoDependencias)) {
                continue;
            }
            if (isInsideSrc(relPath)) {
                if (diasInativo < 7)
                    continue;
            }
            if (!referenciado && diasInativo > INATIVIDADE_DIAS) {
                fantasmas.push({ arquivo: relPath, referenciado, diasInativo });
            }
        }
        catch {
        }
    }
    return {
        total: fantasmas.length,
        fantasmas,
    };
}
//# sourceMappingURL=detector-fantasmas.js.map