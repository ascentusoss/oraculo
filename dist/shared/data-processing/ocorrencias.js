export function dedupeOcorrencias(arr) {
    const seen = new Map();
    for (const o of arr || []) {
        const key = `${o.relPath || ''}|${String(o.linha ?? '')}|${o.tipo || ''}|${o.mensagem || ''}`;
        if (!seen.has(key))
            seen.set(key, o);
    }
    return Array.from(seen.values());
}
export function agruparAnalistas(analistas) {
    if (!analistas || !Array.isArray(analistas) || analistas.length === 0)
        return [];
    const map = new Map();
    for (const a of analistas) {
        const nome = String((a && a['nome']) || 'desconhecido');
        const dur = Number((a && a['duracaoMs']) || 0);
        const occ = Number((a && a['ocorrencias']) || 0);
        const globalFlag = Boolean((a && a['global']) || false);
        const entry = map.get(nome) || {
            nome,
            duracaoMs: 0,
            ocorrencias: 0,
            execucoes: 0,
            global: false,
        };
        entry.duracaoMs += dur;
        entry.ocorrencias += occ;
        entry.execucoes += 1;
        entry.global = entry.global || globalFlag;
        map.set(nome, entry);
    }
    return Array.from(map.values()).sort((x, y) => {
        return y.ocorrencias - x.ocorrencias || y.duracaoMs - x.duracaoMs;
    });
}
//# sourceMappingURL=ocorrencias.js.map