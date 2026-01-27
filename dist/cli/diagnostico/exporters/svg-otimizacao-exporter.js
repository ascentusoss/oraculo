import path from 'node:path';
import { otimizarSvgLikeSvgo, shouldSugerirOtimizacaoSvg, } from '../../../shared/impar/svgs.js';
function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0)
        return String(bytes);
    if (bytes < 1024)
        return `${bytes}B`;
    const kb = bytes / 1024;
    if (kb < 1024)
        return `${kb.toFixed(1)}KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)}MB`;
}
export async function exportarRelatorioSvgOtimizacao(params) {
    const { entries, relatoriosDir, ts } = params;
    const candidatos = [];
    for (const e of entries) {
        if (!e || typeof e.relPath !== 'string')
            continue;
        if (!/\.svg$/i.test(e.relPath))
            continue;
        if (typeof e.content !== 'string')
            continue;
        if (!/<svg\b/i.test(e.content))
            continue;
        const opt = otimizarSvgLikeSvgo({ svg: e.content });
        const shouldSuggest = opt.changed &&
            opt.originalBytes > opt.optimizedBytes &&
            shouldSugerirOtimizacaoSvg(opt.originalBytes, opt.optimizedBytes);
        if (!shouldSuggest)
            continue;
        const savedBytes = opt.originalBytes - opt.optimizedBytes;
        candidatos.push({
            relPath: e.relPath,
            dir: path.posix.dirname(e.relPath),
            originalBytes: opt.originalBytes,
            optimizedBytes: opt.optimizedBytes,
            savedBytes,
            mudancas: opt.mudancas,
            temViewBox: /\bviewBox\s*=\s*['"][^'"]+['"]/i.test(e.content),
        });
    }
    const totalEconomiaBytes = candidatos.reduce((acc, c) => acc + c.savedBytes, 0);
    const porDir = new Map();
    for (const c of candidatos) {
        const key = c.dir;
        const existing = porDir.get(key);
        if (!existing) {
            porDir.set(key, { count: 1, totalSaved: c.savedBytes, exemplos: [c] });
        }
        else {
            existing.count += 1;
            existing.totalSaved += c.savedBytes;
            if (existing.exemplos.length < 10)
                existing.exemplos.push(c);
        }
    }
    const outputPath = path.join(relatoriosDir, `oraculo-svg-otimizacao-${ts}.md`);
    let md = '';
    md += '# Relatório de Otimização de SVG\n\n';
    md += `Gerado em: ${new Date().toISOString()}\n\n`;
    md += `Arquivos candidatos: **${candidatos.length}**\n\n`;
    md += `Economia potencial total: **${formatBytes(totalEconomiaBytes)}**\n\n`;
    md += '## Por diretório\n\n';
    md += '| Diretório | Arquivos | Economia |\n';
    md += '|---|---:|---:|\n';
    const dirsOrdenados = Array.from(porDir.entries()).sort((a, b) => b[1].totalSaved - a[1].totalSaved);
    for (const [dir, info] of dirsOrdenados) {
        md += `| ${dir} | ${info.count} | ${formatBytes(info.totalSaved)} |\n`;
    }
    md += '\n## Exemplos (top 30 por economia)\n\n';
    const topFiles = [...candidatos]
        .sort((a, b) => b.savedBytes - a.savedBytes)
        .slice(0, 30);
    for (const f of topFiles) {
        const mudancas = f.mudancas.join(', ');
        md += `- ${f.relPath} — ${formatBytes(f.originalBytes)} → ${formatBytes(f.optimizedBytes)} (−${formatBytes(f.savedBytes)})`;
        md += ` — mudanças: ${mudancas}`;
        md += f.temViewBox ? '' : ' — (sem viewBox)';
        md += '\n';
    }
    const { promises: fs } = await import('node:fs');
    await fs.mkdir(relatoriosDir, { recursive: true });
    await fs.writeFile(outputPath, md, 'utf-8');
    return { outputPath, totalArquivos: candidatos.length, totalEconomiaBytes };
}
//# sourceMappingURL=svg-otimizacao-exporter.js.map