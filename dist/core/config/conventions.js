import path from 'node:path';
import { config } from './config.js';
function toPosix(p) {
    return p.replace(/\\/g, '/');
}
function trimSlashes(p) {
    return p.replace(/^\/*/, '').replace(/\/*$/, '');
}
export function getTypesDirectoryRelPosix() {
    const raw = config.conventions?.typesDirectory;
    const s = typeof raw === 'string' && raw.trim() ? raw.trim() : 'src/tipos';
    return trimSlashes(toPosix(s));
}
export function getTypesDirectoryDisplay() {
    const base = getTypesDirectoryRelPosix();
    return base.endsWith('/') ? base : `${base}/`;
}
export function isInsideTypesDirectory(relPath) {
    const norm = trimSlashes(toPosix(relPath));
    const base = getTypesDirectoryRelPosix();
    return norm === base || norm.startsWith(`${base}/`);
}
export function buildTypesRelPathPosix(relInsideTypesDir) {
    const base = getTypesDirectoryRelPosix();
    const inside = trimSlashes(toPosix(relInsideTypesDir));
    return inside ? `${base}/${inside}` : base;
}
export function buildTypesFsPath(relInsideTypesDir) {
    const relPosix = buildTypesRelPathPosix(relInsideTypesDir);
    return path.join(...relPosix.split('/'));
}
//# sourceMappingURL=conventions.js.map