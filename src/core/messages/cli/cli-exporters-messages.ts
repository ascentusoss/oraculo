// SPDX-License-Identifier: MIT

import { ICONES_ACAO, ICONES_RELATORIO } from '../ui/icons.js';

export const CliExportersMessages = {
  poda: {
    relatoriosExportados: (dir: string) =>
      `Relatórios de poda exportados para: ${dir}`,
    falhaExportar: (erroMensagem: string) =>
      `Falha ao exportar relatórios de poda: ${erroMensagem}`,
  },

  guardian: {
    relatoriosExportadosTitulo: `${ICONES_ACAO.export} ${ICONES_RELATORIO.detalhado} Relatórios Guardian exportados:`,
    caminhoMarkdown: (caminhoMd: string) => `   Markdown: ${caminhoMd}`,
    caminhoJson: (caminhoJson: string) => `   JSON: ${caminhoJson}`,
    falhaExportar: (erroMensagem: string) =>
      `Falha ao exportar relatórios Guardian: ${erroMensagem}`,
  },

  fixTypes: {
    relatoriosExportadosTitulo: `${ICONES_ACAO.export} ${ICONES_RELATORIO.detalhado} Relatórios de fix-types exportados:`,
    caminhoMarkdown: (caminhoMd: string) => `   Markdown: ${caminhoMd}`,
    caminhoJson: (caminhoJson: string) => `   JSON: ${caminhoJson}`,
    falhaExportar: (erroMensagem: string) =>
      `Falha ao exportar relatórios de fix-types: ${erroMensagem}`,
  },

  reestruturacao: {
    relatoriosExportados: (modoPrefixo: string, dir: string) =>
      `Relatórios de reestruturação ${modoPrefixo}exportados para: ${dir}`,
    falhaExportar: (modoPrefixo: string, erroMensagem: string) =>
      `Falha ao exportar relatórios ${modoPrefixo}de reestruturação: ${erroMensagem}`,
  },
} as const;
