// SPDX-License-Identifier: MIT
// Gerador de relatórios: Markdown e JSON
import {
  gerarHeaderRelatorio,
  gerarSecaoGuardian,
  gerarTabelaOcorrencias,
  gerarTabelaResumoTipos,
  RelatorioMessages,
} from '@core/messages/index.js';

import type {
  GeradorMarkdownOptions,
  Ocorrencia,
  ResultadoInquisicaoCompleto,
} from '@';

export async function gerarRelatorioMarkdown(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string,
  modoBrief = false,
  options?: GeradorMarkdownOptions,
): Promise<void> {
  const {
    totalArquivos = 0,
    ocorrencias = [],
    guardian,
    timestamp = Date.now(),
    duracaoMs = 0,
  } = (resultado || {}) as ResultadoInquisicaoCompleto;

  const dataISO = new Date(timestamp).toISOString();

  // Se modo brief, usar filtro inteligente
  if (modoBrief) {
    const { processarRelatorioResumo, gerarRelatorioMarkdownResumo } =
      await import('@relatorios/filtro-inteligente.js');
    const relatorioResumo = processarRelatorioResumo(ocorrencias);
    await gerarRelatorioMarkdownResumo(relatorioResumo, outputPath);
    return;
  }

  const ocorrenciasOrdenadas: Ocorrencia[] = [...ocorrencias].sort((a, b) => {
    const ra = String(a.relPath ?? '');
    const rb = String(b.relPath ?? '');
    const cmp = ra.localeCompare(rb);
    if (cmp !== 0) return cmp;
    const la = typeof a.linha === 'number' ? a.linha : Number.MAX_SAFE_INTEGER;
    const lb = typeof b.linha === 'number' ? b.linha : Number.MAX_SAFE_INTEGER;
    return la - lb;
  });

  // Extrair dados do Guardian
  const guardianData =
    guardian && typeof guardian === 'object'
      ? {
          status:
            'status' in guardian
              ? String((guardian as Record<string, unknown>).status)
              : 'não executada',
          timestamp:
            'timestamp' in guardian
              ? String((guardian as Record<string, unknown>).timestamp)
              : '—',
          totalArquivos:
            'totalArquivos' in guardian
              ? String((guardian as Record<string, unknown>).totalArquivos)
              : '—',
        }
      : {
          status: 'não executada',
          timestamp: '—',
          totalArquivos: '—',
        };

  // Montar o header usando template centralizado
  const lines: string[] = [];

  lines.push(
    ...gerarHeaderRelatorio({
      dataISO,
      duracao: duracaoMs,
      totalArquivos,
      totalOcorrencias: ocorrencias.length,
    }),
  );

  // Se houver manifest, adiciona link e sumário rápido
  if (options && options.manifestFile && options.relatoriosDir) {
    const relPath = options.manifestFile;
    lines.push(
      `**${RelatorioMessages.principal.secoes.metadados.arquivoManifest}:** \`${relPath}\`  `,
    );
    lines.push('');
    lines.push(
      `> ${RelatorioMessages.principal.secoes.metadados.notaManifest}`,
    );
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Seção Guardian usando template
  lines.push(...gerarSecaoGuardian(guardianData));

  // Sumário das ocorrências por tipo usando template
  const tiposCount: Record<string, number> = {};
  for (const ocorrencia of ocorrencias) {
    const tipo =
      (ocorrencia && (ocorrencia as Ocorrencia).tipo) || 'desconhecido';
    tiposCount[String(tipo)] = (tiposCount[String(tipo)] || 0) + 1;
  }

  lines.push(...gerarTabelaResumoTipos(tiposCount, 10));

  // Tabela com ocorrências usando template
  lines.push('---');
  lines.push('');
  lines.push(
    `## ${RelatorioMessages.principal.secoes.ocorrencias.titulo} (amostra)`,
  );
  lines.push('');

  const AMOSTRA_MAX = 2000;
  const sample = ocorrenciasOrdenadas.slice(0, AMOSTRA_MAX);

  lines.push(...gerarTabelaOcorrencias(sample));

  if (ocorrenciasOrdenadas.length > AMOSTRA_MAX) {
    lines.push('');
    lines.push(
      `> Mostrando apenas ${AMOSTRA_MAX} ocorrências. Para ver todas, consulte os shards listados no manifest.`,
    );
  }

  const { salvarEstado } = await import('@shared/persistence/persistencia.js');
  await salvarEstado(outputPath, lines.join('\n'));
}

export async function gerarRelatorioJson(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string,
): Promise<void> {
  // Importar sistema de versionamento
  const { criarRelatorioComVersao } = await import('@core/schema/version.js');

  // Criar relatório versionado (mantemos metadados, mas salvamos os dados brutos para compatibilidade)
  const relatorioVersionado = criarRelatorioComVersao(
    resultado,
    undefined,
    'Relatório completo de diagnóstico do Oráculo',
  );

  const { salvarEstado } = await import('@shared/persistence/persistencia.js');
  await salvarEstado(outputPath, relatorioVersionado.dados ?? resultado);
}
