export function parsearCategorias(categoria) {
    const map = {};
    const itemList = Array.isArray(categoria) ? categoria : [];
    for (const p of itemList) {
        const [k, v] = String(p).split("=");
        if (!k || !v)
            continue;
        map[k.trim().toLowerCase()] = v.trim();
    }
    return map;
}
//# sourceMappingURL=flags-helpers.js.map