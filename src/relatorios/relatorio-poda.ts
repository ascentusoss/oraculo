// SPDX-License-Identifier: MIT
import { RelatorioMessages } from '/messages/index.js';
import { salvarEstado } from '/persistence/persistencia.js';

import type { OpcoesRelatorioPoda, Pendencia, PendenciaProcessavel } from '@';

export async function gerarRelatorioPodaMarkdown(
  caminho: string,
  podados: Pendencia[],
  mantidos: Pendencia[],
  opcoes?: OpcoesRelatorioPoda,
): Promise<void> {
  const dataISO = new Date().toISOString();
  const totalPodados = podados.length;
  const totalMantidos = mantidos.length;
  const simulado = opcoes?.simulado;

  let md = `# ${RelatorioMessages.poda.titulo}\n\n`;
  md += `**${RelatorioMessages.poda.secoes.metadados.data}:** ${dataISO}  \n`;
  md += `**${RelatorioMessages.poda.secoes.metadados.execucao}:** ${simulado ? RelatorioMessages.poda.secoes.metadados.simulacao : RelatorioMessages.poda.secoes.metadados.real}  \n`;
  md += `**${RelatorioMessages.poda.secoes.metadados.arquivosPodados}:** ${totalPodados}  \n`;
  md += `**${RelatorioMessages.poda.secoes.metadados.arquivosMantidos}:** ${totalMantidos}  \n`;
  md += `\n---\n`;

  md += `## ${RelatorioMessages.poda.secoes.podados.titulo}\n`;
  if (totalPodados === 0) {
    md += `${RelatorioMessages.poda.secoes.podados.vazio}\n`;
  } else {
    const cols = RelatorioMessages.poda.secoes.podados.colunas;
    md += `| ${cols.arquivo} | ${cols.motivo} | ${cols.diasInativo} | ${cols.detectadoEm} |\n`;
    md += '|---------|--------|--------------|--------------|\n';
    for (const p of podados) {
      const pendenciaObj = p as PendenciaProcessavel;
      const diasInativo =
        typeof pendenciaObj.diasInativo === 'number'
          ? String(pendenciaObj.diasInativo)
          : '-';
      md += `| ${p.arquivo} | ${p.motivo} | ${diasInativo} | ${p.detectedAt ? new Date(p.detectedAt).toISOString().slice(0, 10) : '-'} |\n`;
    }
  }
  md += '\n---\n';

  md += `## ${RelatorioMessages.poda.secoes.mantidos.titulo}\n`;
  if (totalMantidos === 0) {
    md += `${RelatorioMessages.poda.secoes.mantidos.vazio}\n`;
  } else {
    const cols = RelatorioMessages.poda.secoes.mantidos.colunas;
    md += `| ${cols.arquivo} | ${cols.motivo} |\n`;
    md += '|---------|--------|\n';
    for (const p of mantidos) {
      md += `| ${p.arquivo} | ${p.motivo} |\n`;
    }
  }

  await salvarEstado(caminho, md);
}

export async function gerarRelatorioPodaJson(
  caminho: string,
  podados: Pendencia[],
  mantidos: Pendencia[],
): Promise<void> {
  const json = {
    podados: podados.map((p) => {
      const pendenciaObj = p as PendenciaProcessavel;
      return {
        arquivo: p.arquivo,
        motivo: p.motivo,
        diasInativo:
          typeof pendenciaObj.diasInativo === 'number'
            ? pendenciaObj.diasInativo
            : undefined,
      };
    }),
    mantidos: mantidos.map((p) => ({ arquivo: p.arquivo, motivo: p.motivo })),
    totalPodados: podados.length,
    totalMantidos: mantidos.length,
    timestamp: Date.now(),
  };
  await salvarEstado(caminho, json);
}
