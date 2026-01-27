// SPDX-License-Identifier: MIT
/**
 * Templates reutilizáveis para geração de relatórios Markdown
 * Funções que geram seções completas de MD com formatação consistente
 */

import { formatMs } from '@core/config/format.js';

import type {
  GuardianInfo,
  MetadadosRelatorioEstendido,
  ProblemaAgrupado,
} from '@';

import { RelatorioMessages } from './relatorio-messages.js';

// Re-exporta o tipo para compatibilidade
export type { MetadadosRelatorioEstendido };

/**
 * Gera o cabeçalho padrão do relatório Markdown
 */
export function gerarHeaderRelatorio(
  metadados: MetadadosRelatorioEstendido,
): string[] {
  const lines: string[] = [];
  const { principal } = RelatorioMessages;

  lines.push(`# ${principal.titulo}`);
  lines.push('');
  lines.push(`**${principal.secoes.metadados.data}:** ${metadados.dataISO}  `);
  lines.push(
    `**${principal.secoes.metadados.duracao}:** ${formatMs(metadados.duracao)}  `,
  );
  lines.push(
    `**${principal.secoes.metadados.arquivos}:** ${metadados.totalArquivos}  `,
  );
  lines.push(
    `**${principal.secoes.metadados.ocorrencias}:** ${metadados.totalOcorrencias}  `,
  );
  lines.push('');
  lines.push(RelatorioMessages.comum.separadores.secao);
  lines.push('');

  // Se houver manifest
  if (metadados.manifestFile && metadados.relatoriosDir) {
    lines.push(
      `**${principal.secoes.metadados.arquivoManifest}:** \`${metadados.manifestFile}\`  `,
    );
    lines.push('');
    lines.push(`> ${principal.secoes.metadados.notaManifest}`);
    lines.push('');
    lines.push(RelatorioMessages.comum.separadores.secao);
    lines.push('');
  }

  return lines;
}

/**
 * Gera a seção Guardian do relatório
 */
export function gerarSecaoGuardian(guardian: GuardianInfo): string[] {
  const lines: string[] = [];
  const { guardian: msg } = RelatorioMessages.principal.secoes;

  lines.push(`## ${msg.titulo}`);
  lines.push('');
  lines.push(`  - **${msg.status}:** ${guardian.status}`);
  lines.push(`  - **${msg.timestamp}:** ${guardian.timestamp}`);
  lines.push(`  - **${msg.totalArquivos}:** ${guardian.totalArquivos}`);
  lines.push('');
  lines.push(RelatorioMessages.comum.separadores.secao);
  lines.push('');

  return lines;
}

/**
 * Gera tabela de resumo por tipo
 */
export function gerarTabelaResumoTipos(
  tiposCount: Record<string, number>,
  limite = 10,
): string[] {
  const lines: string[] = [];
  const { resumoTipos } = RelatorioMessages.principal.secoes;

  lines.push(`## ${resumoTipos.titulo}`);
  lines.push('');
  lines.push(`| ${resumoTipos.tipo} | ${resumoTipos.quantidade} |`);
  lines.push('|-------------------|----------|');

  const sorted = Object.entries(tiposCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limite);

  for (const [tipo, count] of sorted) {
    lines.push(`| ${tipo.padEnd(17)} | ${String(count).padStart(8)} |`);
  }

  lines.push('');
  lines.push(RelatorioMessages.comum.separadores.secao);
  lines.push('');

  return lines;
}

/**
 * Gera tabela de ocorrências
 */
function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

export function gerarTabelaOcorrencias<
  T extends {
    relPath?: string;
    linha?: number;
    nivel?: string;
    mensagem?: string;
  },
>(ocorrencias: T[]): string[] {
  const lines: string[] = [];
  const { ocorrencias: msg } = RelatorioMessages.principal.secoes;

  lines.push(`## ${msg.titulo}`);
  lines.push('');
  lines.push(
    `| ${msg.colunas.arquivo} | ${msg.colunas.linha} | ${msg.colunas.nivel}  | ${msg.colunas.mensagem} |`,
  );
  lines.push('|---------|-------|--------|----------|');

  for (const o of ocorrencias) {
    const arquivo = String(o.relPath || '');
    const linha = o.linha ? String(o.linha) : '';
    const nivel = String(o.nivel || '');
    const mensagem = escapeMarkdownTableCell(String(o.mensagem || ''));
    lines.push(`| ${arquivo} | ${linha} | ${nivel} | ${mensagem} |`);
  }

  lines.push('');

  return lines;
}

/**
 * Gera seção de problemas agrupados (para filtro inteligente)
 */
export function gerarSecaoProblemasAgrupados(
  titulo: string,
  problemas: ProblemaAgrupado[],
  mostrarExemplos = true,
): string[] {
  const lines: string[] = [];
  const { labels } = RelatorioMessages.resumo;

  lines.push(`## ${titulo}`);
  lines.push('');

  if (problemas.length === 0) {
    lines.push(`> ${RelatorioMessages.comum.vazios.nenhumResultado}`);
    lines.push('');
    return lines;
  }

  for (const prob of problemas) {
    lines.push(`### ${prob.icone} ${prob.titulo}`);
    lines.push('');
    lines.push(`**${labels.quantidade}:** ${prob.quantidade}  `);
    lines.push(`**Resumo:** ${prob.resumo}  `);

    if (prob.acaoSugerida) {
      lines.push(`**${labels.acaoSugerida}:** ${prob.acaoSugerida}  `);
    }

    lines.push('');

    // Mostrar até 3 exemplos
    if (mostrarExemplos && prob.ocorrencias.length > 0) {
      lines.push(`**${labels.exemplos}:**`);
      const exemplos = prob.ocorrencias.slice(0, 3);
      for (const ex of exemplos) {
        const local = ex.relPath
          ? `${ex.relPath}${ex.linha ? `:${ex.linha}` : ''}`
          : '';
        const msg = ex.mensagem ? ` - ${ex.mensagem}` : '';
        lines.push(`  - \`${local}\`${msg}`);
      }
      if (prob.ocorrencias.length > 3) {
        lines.push(
          `  - _...e mais ${prob.ocorrencias.length - 3} ocorrências_`,
        );
      }
      lines.push('');
    }

    lines.push(RelatorioMessages.comum.separadores.subsecao);
    lines.push('');
  }

  return lines;
}

/**
 * Gera tabela genérica de duas colunas
 */
export function gerarTabelaDuasColunas(
  dados: Array<[string, string | number]>,
  cabecalhos: [string, string],
): string[] {
  const lines: string[] = [];

  lines.push(`| ${cabecalhos[0]} | ${cabecalhos[1]} |`);
  lines.push('|------------------|----------|');

  for (const [col1, col2] of dados) {
    lines.push(`| ${col1.padEnd(16)} | ${String(col2).padStart(8)} |`);
  }

  lines.push('');

  return lines;
}

/**
 * Gera seção de estatísticas
 */
export function gerarSecaoEstatisticas(
  stats: Record<string, string | number>,
): string[] {
  const lines: string[] = [];
  const { estatisticas } = RelatorioMessages.principal.secoes;

  lines.push(`## ${estatisticas.titulo}`);
  lines.push('');

  for (const [chave, valor] of Object.entries(stats)) {
    lines.push(`  - **${chave}:** ${valor}`);
  }

  lines.push('');

  return lines;
}

/**
 * Gera footer do relatório
 */
export function gerarFooterRelatorio(timestampISO?: string): string[] {
  const lines: string[] = [];

  lines.push(RelatorioMessages.comum.separadores.secao);
  lines.push('');
  lines.push('_Gerado por Oráculo CLI_');
  if (timestampISO) {
    lines.push(`_${timestampISO}_`);
  }
  lines.push('');

  return lines;
}

/**
 * Helper para escrever arquivo MD completo
 */
export async function escreverRelatorioMarkdown(
  outputPath: string,
  lines: string[],
): Promise<void> {
  const { salvarEstado } = await import('@shared/persistence/persistencia.js');
  await salvarEstado(outputPath, lines.join('\n'));
}
