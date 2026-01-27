// SPDX-License-Identifier: MIT
/**
 * Handler para exportação de relatórios de poda
 * Consolida lógica duplicada de geração de relatórios Markdown e JSON
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { config } from '@core/config/config.js';
import { CliExportersMessages } from '@core/messages/cli/cli-exporters-messages.js';
import { log } from '@core/messages/index.js';
import {
  gerarRelatorioPodaJson,
  gerarRelatorioPodaMarkdown,
} from '@relatorios/relatorio-poda.js';

import type { PodaExportOptions, PodaExportResult } from '@';

// Re-export para compatibilidade
export type { PodaExportOptions, PodaExportResult };

/**
 * Exporta relatórios de poda (Markdown e JSON)
 *
 * Centraliza a lógica de:
 * - Criação de diretório de relatórios
 * - Geração de timestamp único
 * - Exportação em ambos os formatos
 * - Tratamento de erros
 *
 * @param options - Opções de exportação
 * @returns Caminhos dos arquivos gerados ou null em caso de erro
 */
export async function exportarRelatoriosPoda(
  options: PodaExportOptions,
): Promise<PodaExportResult | null> {
  if (!config.REPORT_EXPORT_ENABLED) {
    return null;
  }

  try {
    const { baseDir, podados, pendentes, simulado } = options;

    // Determinar diretório de saída
    const dir =
      typeof config.REPORT_OUTPUT_DIR === 'string'
        ? config.REPORT_OUTPUT_DIR
        : path.join(baseDir, 'relatorios');

    // Criar diretório se não existir
    await fs.mkdir(dir, { recursive: true });

    // Gerar timestamp único para os arquivos
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeBase = `oraculo-poda-${ts}`;

    // Gerar relatório Markdown
    const caminhoMd = path.join(dir, `${nomeBase}.md`);
    await gerarRelatorioPodaMarkdown(caminhoMd, podados, pendentes, {
      simulado,
    });

    // Gerar relatório JSON
    const caminhoJson = path.join(dir, `${nomeBase}.json`);
    await gerarRelatorioPodaJson(caminhoJson, podados, pendentes);

    // Log de sucesso
    log.sucesso(CliExportersMessages.poda.relatoriosExportados(dir));

    return {
      markdown: caminhoMd,
      json: caminhoJson,
      dir,
    };
  } catch (error) {
    log.erro(CliExportersMessages.poda.falhaExportar((error as Error).message));
    // Re-throw para manter comportamento original do comando
    throw error;
  }
}
