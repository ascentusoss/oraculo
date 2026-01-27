import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../../core/config/config.js';
import { CliExportersMessages } from '../../core/messages/cli/cli-exporters-messages.js';
import { log } from '../../core/messages/index.js';
import { gerarRelatorioReestruturarJson, gerarRelatorioReestruturarMarkdown, } from '../../relatorios/relatorio-reestruturar.js';
function normalizarMovimentos(movimentos) {
    return movimentos.map((m) => {
        if ('de' in m && 'para' in m) {
            return { de: m.de, para: m.para };
        }
        if ('atual' in m && 'ideal' in m) {
            return { de: m.atual, para: m.ideal ?? m.atual };
        }
        return { de: '', para: '' };
    });
}
export async function exportarRelatoriosReestruturacao(options) {
    if (!config.REPORT_EXPORT_ENABLED) {
        return null;
    }
    try {
        const { baseDir, movimentos, simulado, origem, preset, conflitos } = options;
        const dir = typeof config.REPORT_OUTPUT_DIR === 'string'
            ? config.REPORT_OUTPUT_DIR
            : path.join(baseDir, 'relatorios');
        await fs.mkdir(dir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeBase = `oraculo-reestruturacao-${ts}`;
        const movimentosNormalizados = normalizarMovimentos(movimentos);
        const caminhoMd = path.join(dir, `${nomeBase}.md`);
        await gerarRelatorioReestruturarMarkdown(caminhoMd, movimentosNormalizados, {
            simulado,
            origem,
            preset,
            conflitos,
        });
        const caminhoJson = path.join(dir, `${nomeBase}.json`);
        await gerarRelatorioReestruturarJson(caminhoJson, movimentosNormalizados, {
            simulado,
            origem,
            preset,
            conflitos,
        });
        const modo = simulado ? '(dry-run) ' : '';
        log.sucesso(CliExportersMessages.reestruturacao.relatoriosExportados(modo, dir));
        return {
            markdown: caminhoMd,
            json: caminhoJson,
            dir,
        };
    }
    catch (error) {
        const modo = options.simulado ? '(dry-run) ' : '';
        log.erro(CliExportersMessages.reestruturacao.falhaExportar(modo, error.message));
        return null;
    }
}
//# sourceMappingURL=reestruturacao-exporter.js.map