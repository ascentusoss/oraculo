import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../../core/config/config.js';
import { CliExportersMessages } from '../../core/messages/cli/cli-exporters-messages.js';
import { log } from '../../core/messages/index.js';
import { gerarRelatorioPodaJson, gerarRelatorioPodaMarkdown, } from '../../relatorios/relatorio-poda.js';
export async function exportarRelatoriosPoda(options) {
    if (!config.REPORT_EXPORT_ENABLED) {
        return null;
    }
    try {
        const { baseDir, podados, pendentes, simulado } = options;
        const dir = typeof config.REPORT_OUTPUT_DIR === 'string'
            ? config.REPORT_OUTPUT_DIR
            : path.join(baseDir, 'relatorios');
        await fs.mkdir(dir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeBase = `oraculo-poda-${ts}`;
        const caminhoMd = path.join(dir, `${nomeBase}.md`);
        await gerarRelatorioPodaMarkdown(caminhoMd, podados, pendentes, {
            simulado,
        });
        const caminhoJson = path.join(dir, `${nomeBase}.json`);
        await gerarRelatorioPodaJson(caminhoJson, podados, pendentes);
        log.sucesso(CliExportersMessages.poda.relatoriosExportados(dir));
        return {
            markdown: caminhoMd,
            json: caminhoJson,
            dir,
        };
    }
    catch (error) {
        log.erro(CliExportersMessages.poda.falhaExportar(error.message));
        throw error;
    }
}
//# sourceMappingURL=poda-exporter.js.map