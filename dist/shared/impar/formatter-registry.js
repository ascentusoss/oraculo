const registry = new Map();
export function registerFormatter(ext, fn) {
    registry.set(ext.toLowerCase(), fn);
}
export function getFormatterForPath(relPath) {
    const p = (relPath || '').toLowerCase();
    for (const [ext, fn] of registry.entries()) {
        if (p.endsWith(ext))
            return fn;
    }
    return null;
}
//# sourceMappingURL=formatter-registry.js.map