// SPDX-License-Identifier: MIT
import { RelatorioMessages } from '@core/messages/index.js';
import { salvarEstado } from '@shared/persistence/persistencia.js';

import type { MovimentoEstrutural, OpcoesRelatorioReestruturar } from '@';

export async function gerarRelatorioReestruturarMarkdown(
  caminho: string,
  movimentos: MovimentoEstrutural[],
  opcoes?: OpcoesRelatorioReestruturar,
): Promise<void> {
  const dataISO = new Date().toISOString();
  const total = movimentos.length;
  const simulado = opcoes?.simulado;
  const origem = opcoes?.origem ?? 'desconhecido';
  const preset = opcoes?.preset ?? 'oraculo';
  const conflitos = opcoes?.conflitos ?? 0;

  const linhas: string[] = [];
  linhas.push(`# ${RelatorioMessages.reestruturar.titulo}`);
  linhas.push('');
  linhas.push(
    `**${RelatorioMessages.reestruturar.secoes.metadados.data}:** ${dataISO}  `,
  );
  linhas.push(
    `**${RelatorioMessages.reestruturar.secoes.metadados.execucao}:** ${simulado ? RelatorioMessages.reestruturar.secoes.metadados.simulacao : RelatorioMessages.reestruturar.secoes.metadados.real}  `,
  );
  linhas.push(
    `**${RelatorioMessages.reestruturar.secoes.metadados.origemPlano}:** ${origem}  `,
  );
  linhas.push(
    `**${RelatorioMessages.reestruturar.secoes.metadados.preset}:** ${preset}  `,
  );
  linhas.push(
    `**${RelatorioMessages.reestruturar.secoes.movimentos.total}:** ${total}  `,
  );
  linhas.push(
    `**${RelatorioMessages.reestruturar.secoes.conflitos.total}:** ${conflitos}  `,
  );
  linhas.push('');
  linhas.push('---');
  linhas.push('');

  linhas.push(`## ${RelatorioMessages.reestruturar.secoes.movimentos.titulo}`);
  if (!total) {
    linhas.push(RelatorioMessages.reestruturar.secoes.movimentos.vazio);
  } else {
    const cols = RelatorioMessages.reestruturar.secoes.movimentos.colunas;
    linhas.push(`| ${cols.origem} | ${cols.destino} |`);
    linhas.push('|----|------|');
    for (const m of movimentos) {
      linhas.push(`| ${m.de} | ${m.para} |`);
    }
  }

  await salvarEstado(caminho, linhas.join('\n'));
}

export async function gerarRelatorioReestruturarJson(
  caminho: string,
  movimentos: MovimentoEstrutural[],
  opcoes?: OpcoesRelatorioReestruturar,
): Promise<void> {
  const json = {
    simulado: Boolean(opcoes?.simulado),
    origem: opcoes?.origem ?? 'desconhecido',
    preset: opcoes?.preset ?? 'oraculo',
    conflitos: opcoes?.conflitos ?? 0,
    totalMovimentos: movimentos.length,
    movimentos,
    timestamp: Date.now(),
  };
  await salvarEstado(caminho, json);
}
