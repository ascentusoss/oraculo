// SPDX-License-Identifier: MIT
/**
 * Handler para exportação de relatórios de reestruturação
 * Consolida lógica duplicada de geração de relatórios Markdown e JSON
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { config } from '@core/config/config.js';
import { CliExportersMessages } from '@core/messages/cli/cli-exporters-messages.js';
import { log } from '@core/messages/index.js';
import {
  gerarRelatorioReestruturarJson,
  gerarRelatorioReestruturarMarkdown,
} from '@relatorios/relatorio-reestruturar.js';

import type {
  MovimentoEstrutural,
  ReestruturacaoExportOptions,
  ReestruturacaoExportResult,
} from '@';

// Re-export para compatibilidade
export type { ReestruturacaoExportOptions, ReestruturacaoExportResult };

/**
 * Normaliza movimentos para formato padrão MovimentoEstrutural
 */
function normalizarMovimentos(
  movimentos: ReestruturacaoExportOptions['movimentos'],
): MovimentoEstrutural[] {
  return movimentos.map((m) => {
    // Se tem 'de' e 'para', já está no formato correto (PlanoMoverItem)
    if ('de' in m && 'para' in m) {
      return { de: m.de, para: m.para };
    }
    // Se tem 'atual' e 'ideal', é MapaMoveItem - converter
    if ('atual' in m && 'ideal' in m) {
      return { de: m.atual, para: m.ideal ?? m.atual };
    }
    // Fallback: retornar objeto vazio (não deve acontecer com tipos corretos)
    return { de: '', para: '' };
  });
}

/**
 * Exporta relatórios de reestruturação (Markdown e JSON)
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
export async function exportarRelatoriosReestruturacao(
  options: ReestruturacaoExportOptions,
): Promise<ReestruturacaoExportResult | null> {
  if (!config.REPORT_EXPORT_ENABLED) {
    return null;
  }

  try {
    const { baseDir, movimentos, simulado, origem, preset, conflitos } =
      options;

    // Determinar diretório de saída
    const dir =
      typeof config.REPORT_OUTPUT_DIR === 'string'
        ? config.REPORT_OUTPUT_DIR
        : path.join(baseDir, 'relatorios');

    // Criar diretório se não existir
    await fs.mkdir(dir, { recursive: true });

    // Gerar timestamp único para os arquivos
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeBase = `oraculo-reestruturacao-${ts}`;

    // Normalizar movimentos para formato padrão
    const movimentosNormalizados = normalizarMovimentos(movimentos);

    // Gerar relatório Markdown
    const caminhoMd = path.join(dir, `${nomeBase}.md`);
    await gerarRelatorioReestruturarMarkdown(
      caminhoMd,
      movimentosNormalizados,
      {
        simulado,
        origem,
        preset,
        conflitos,
      },
    );

    // Gerar relatório JSON
    const caminhoJson = path.join(dir, `${nomeBase}.json`);
    await gerarRelatorioReestruturarJson(caminhoJson, movimentosNormalizados, {
      simulado,
      origem,
      preset,
      conflitos,
    });

    // Log de sucesso
    const modo = simulado ? '(dry-run) ' : '';
    log.sucesso(
      CliExportersMessages.reestruturacao.relatoriosExportados(modo, dir),
    );

    return {
      markdown: caminhoMd,
      json: caminhoJson,
      dir,
    };
  } catch (error) {
    const modo = options.simulado ? '(dry-run) ' : '';
    log.erro(
      CliExportersMessages.reestruturacao.falhaExportar(
        modo,
        (error as Error).message,
      ),
    );
    return null;
  }
}
