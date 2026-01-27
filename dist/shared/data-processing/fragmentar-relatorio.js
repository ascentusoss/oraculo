import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { config } from '../../core/config/config.js';
import { salvarBinario, salvarEstado, } from '../persistence/persistencia.js';
function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
    return out;
}
export async function fragmentarRelatorio(relatorioFull, dir, ts, options) {
    const maxOcorrencias = options?.maxOcorrenciasPerShard ??
        config.REPORT_FRAGMENT_OCCURRENCES ??
        2000;
    const maxFileEntries = options?.maxFileEntriesPerShard ??
        config.REPORT_FRAGMENT_FILEENTRIES ??
        500;
    const topN = config.REPORT_FRAGMENT_SUMMARY_TOPN ?? 5;
    const rel = relatorioFull;
    const resultado = rel && 'resultado' in rel
        ? rel.resultado
        : rel;
    const ocorrencias = resultado &&
        Array.isArray(resultado.ocorrencias)
        ? resultado.ocorrencias
        : [];
    const fileEntries = resultado &&
        Array.isArray(resultado.fileEntries)
        ? resultado.fileEntries
        : [];
    const salvar = salvarEstado;
    const manifest = {
        generatedAt: new Date().toISOString(),
        baseName: `oraculo-relatorio-full-${ts}`,
        parts: [],
    };
    const meta = { ...rel };
    if (meta.resultado && typeof meta.resultado === 'object') {
        const r = meta.resultado;
        delete r.ocorrencias;
        delete r.fileEntries;
    }
    const metaFilename = `oraculo-relatorio-full-${ts}-meta.json.gz`;
    const metaBuf = Buffer.from(JSON.stringify(meta, null, 2), 'utf-8');
    const metaGz = gzipSync(metaBuf);
    await salvarBinario(path.join(dir, metaFilename), metaGz);
    manifest.parts.push({
        kind: 'meta',
        file: metaFilename,
        bytes: metaGz.length,
    });
    if (ocorrencias.length > 0) {
        const occChunks = chunkArray(ocorrencias, maxOcorrencias);
        for (let i = 0; i < occChunks.length; i++) {
            const fname = `oraculo-relatorio-full-${ts}-ocorrencias-part-${i + 1}.json.gz`;
            const payload = {
                shard: { kind: 'ocorrencias', index: i + 1, total: occChunks.length },
                count: occChunks[i].length,
                ocorrencias: occChunks[i],
            };
            const buf = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
            const gz = gzipSync(buf);
            await salvarBinario(path.join(dir, fname), gz);
            const tiposCount = {};
            const arquivosCount = {};
            for (const o of occChunks[i]) {
                const oLegacy = o;
                const t = o && (o.tipo || oLegacy.type)
                    ? String(o.tipo ?? oLegacy.type)
                    : 'desconhecido';
                tiposCount[t] = (tiposCount[t] || 0) + 1;
                const relp = o && (o.relPath || oLegacy.path)
                    ? String(o.relPath ?? oLegacy.path)
                    : 'desconhecido';
                arquivosCount[relp] = (arquivosCount[relp] || 0) + 1;
            }
            const topTipos = Object.entries(tiposCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, topN)
                .map(([k, v]) => ({ tipo: k, count: v }));
            const topArquivos = Object.entries(arquivosCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, topN)
                .map(([k, v]) => ({ arquivo: k, count: v }));
            manifest.parts.push({
                kind: 'ocorrencias',
                file: fname,
                index: i + 1,
                total: occChunks.length,
                count: occChunks[i].length,
                bytes: gz.length,
                summary: { topTipos, topArquivos },
            });
        }
    }
    if (fileEntries.length > 0) {
        const feChunks = chunkArray(fileEntries, maxFileEntries);
        for (let i = 0; i < feChunks.length; i++) {
            const fname = `oraculo-relatorio-full-${ts}-fileentries-part-${i + 1}.json.gz`;
            const payload = {
                shard: { kind: 'fileEntries', index: i + 1, total: feChunks.length },
                count: feChunks[i].length,
                fileEntries: feChunks[i],
            };
            const buf = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
            const gz = gzipSync(buf);
            await salvarBinario(path.join(dir, fname), gz);
            const arquivosSummary = [];
            for (const fe of feChunks[i]) {
                const feLegacy = fe;
                const rel = fe && (fe.relPath || fe.fullPath || feLegacy.path)
                    ? String(fe.relPath ?? fe.fullPath ?? feLegacy.path)
                    : 'desconhecido';
                let linhas = undefined;
                try {
                    if (fe && typeof fe.content === 'string')
                        linhas = fe.content.split(/\r?\n/).length;
                }
                catch { }
                arquivosSummary.push({ arquivo: rel, linhas });
            }
            const topArquivosByLinhas = arquivosSummary
                .filter((a) => typeof a.linhas === 'number')
                .sort((a, b) => (b.linhas ?? 0) - (a.linhas ?? 0))
                .slice(0, topN);
            manifest.parts.push({
                kind: 'fileEntries',
                file: fname,
                index: i + 1,
                total: feChunks.length,
                count: feChunks[i].length,
                bytes: gz.length,
                summary: { topArquivosByLinhas },
            });
        }
    }
    const manifestFilename = `oraculo-relatorio-full-${ts}-manifest.json`;
    await salvar(path.join(dir, manifestFilename), manifest);
    return { manifestFile: manifestFilename, manifest };
}
export default fragmentarRelatorio;
//# sourceMappingURL=fragmentar-relatorio.js.map