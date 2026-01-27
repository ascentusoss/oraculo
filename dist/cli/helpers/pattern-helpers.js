export function processPatternList(raw) {
    if (!raw || !raw.length)
        return [];
    return Array.from(new Set(raw
        .flatMap((r) => r.split(/[\s,]+/))
        .map((s) => s.trim())
        .filter(Boolean)));
}
export function expandIncludePatterns(list) {
    const META = /[\\*\?\{\}\[\]]/;
    const out = new Set();
    for (const p of list) {
        out.add(p);
        if (!META.test(p)) {
            const withoutTrailing = p.replace(/\\+$/, '').replace(/\/+$/, '');
            out.add(`${withoutTrailing}/**`);
            if (!p.includes('/') && !p.includes('\\')) {
                out.add(`**/${p}/**`);
            }
        }
    }
    return Array.from(out);
}
//# sourceMappingURL=pattern-helpers.js.map