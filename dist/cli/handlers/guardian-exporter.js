import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../../core/config/config.js';
import { CliExportersMessages } from '../../core/messages/cli/cli-exporters-messages.js';
import { log } from '../../core/messages/index.js';
async function gerarRelatorioJson(caminho, options) {
    const { status, baseline, drift, erros, warnings } = options;
    const relatorio = {
        metadata: {
            timestamp: new Date().toISOString(),
            comando: 'guardian',
            schemaVersion: '1.0.0',
        },
        status,
        baseline: baseline || null,
        drift: drift || null,
        issues: {
            erros: erros || [],
            warnings: warnings || [],
            totalErros: erros?.length || 0,
            totalWarnings: warnings?.length || 0,
        },
        resumo: {
            integridadeOk: status === 'ok' || status === 'baseline-criada',
            requerAtencao: (erros?.length || 0) > 0,
            drift: drift ? drift.alterouArquetipo : false,
        },
    };
    await fs.writeFile(caminho, JSON.stringify(relatorio, null, 2));
}
async function gerarRelatorioMarkdown(caminho, options) {
    const { status, baseline, drift, erros, warnings } = options;
    const lines = [];
    lines.push('# Relatório Guardian - Verificação de Integridade');
    lines.push('');
    lines.push(`**Gerado em:** ${new Date().toISOString()}`);
    lines.push(`**Comando:** \`oraculo guardian\``);
    lines.push('');
    const statusIcon = status === 'ok' ? '[SUCESSO]' : status === 'erro' ? '[ERRO]' : '[AVISO]';
    lines.push(`## ${statusIcon} Status: ${status}`);
    lines.push('');
    if (baseline) {
        lines.push('## [INFO] Baseline');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(baseline, null, 2));
        lines.push('```');
        lines.push('');
    }
    if (drift) {
        lines.push('## 🔄 Drift Detectado');
        lines.push('');
        lines.push(`- **Arquétipo alterado:** ${drift.alterouArquetipo ? 'Sim' : 'Não'}`);
        if (drift.deltaConfidence) {
            lines.push(`- **Delta de confiança:** ${drift.deltaConfidence}%`);
        }
        if (drift.arquivosNovos && drift.arquivosNovos.length > 0) {
            lines.push('');
            lines.push('### Arquivos Novos');
            drift.arquivosNovos.forEach((arquivo) => {
                lines.push(`- ${arquivo}`);
            });
        }
        if (drift.arquivosRemovidos && drift.arquivosRemovidos.length > 0) {
            lines.push('');
            lines.push('### Arquivos Removidos');
            drift.arquivosRemovidos.forEach((arquivo) => {
                lines.push(`- ${arquivo}`);
            });
        }
        lines.push('');
    }
    if (erros && erros.length > 0) {
        lines.push('## [ERRO] Erros');
        lines.push('');
        erros.forEach((erro, idx) => {
            lines.push(`### ${idx + 1}. ${erro.arquivo}`);
            lines.push('');
            lines.push(`**Mensagem:** ${erro.mensagem}`);
            lines.push('');
        });
    }
    if (warnings && warnings.length > 0) {
        lines.push('## [AVISO] Avisos');
        lines.push('');
        warnings.forEach((warning, idx) => {
            lines.push(`### ${idx + 1}. ${warning.arquivo}`);
            lines.push('');
            lines.push(`**Mensagem:** ${warning.mensagem}`);
            lines.push('');
        });
    }
    lines.push('## [INFO] Recomendações');
    lines.push('');
    if (status === 'ok') {
        lines.push('- [SUCESSO] Projeto está íntegro - nenhuma ação necessária');
    }
    else if (status === 'erro') {
        lines.push('- [ERRO] Resolver erros críticos antes de prosseguir');
        lines.push('- [INFO] Revisar arquivos listados acima');
    }
    else if (drift?.alterouArquetipo) {
        lines.push('- [AVISO] Drift de arquétipo detectado - revisar mudanças');
        lines.push('- [INFO] Considerar atualizar baseline se mudanças forem intencionais');
    }
    await fs.writeFile(caminho, lines.join('\n'));
}
export async function exportarRelatoriosGuardian(options) {
    if (!config.REPORT_EXPORT_ENABLED) {
        return null;
    }
    try {
        const { baseDir } = options;
        const dir = typeof config.REPORT_OUTPUT_DIR === 'string'
            ? config.REPORT_OUTPUT_DIR
            : path.join(baseDir, 'relatorios');
        await fs.mkdir(dir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeBase = `oraculo-guardian-${ts}`;
        const caminhoMd = path.join(dir, `${nomeBase}.md`);
        await gerarRelatorioMarkdown(caminhoMd, options);
        const caminhoJson = path.join(dir, `${nomeBase}.json`);
        await gerarRelatorioJson(caminhoJson, options);
        log.sucesso(CliExportersMessages.guardian.relatoriosExportadosTitulo);
        log.info(CliExportersMessages.guardian.caminhoMarkdown(caminhoMd));
        log.info(CliExportersMessages.guardian.caminhoJson(caminhoJson));
        return {
            markdown: caminhoMd,
            json: caminhoJson,
            dir,
        };
    }
    catch (error) {
        log.erro(CliExportersMessages.guardian.falhaExportar(error.message));
        return null;
    }
}
//# sourceMappingURL=guardian-exporter.js.map