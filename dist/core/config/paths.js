export const SRC_ROOT = 'src';
export const SRC_GLOB = 'src/**';
export const META_DIRS = ['.github', '.vscode', '.oraculo'];
export function toPosix(p) {
    return String(p || '').replace(/\\+/g, '/');
}
export function isInsideSrc(relPath) {
    const r = toPosix(relPath);
    return /(?:^|\/)src(?:\/|$)/.test(r);
}
export function isMetaPath(relPath) {
    const r = toPosix(relPath);
    if (META_DIRS.some((d) => r === d || r.startsWith(`${d}/`)))
        return true;
    return !isInsideSrc(r);
}
//# sourceMappingURL=paths.js.map