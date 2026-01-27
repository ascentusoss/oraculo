import { ICONES_ACAO, ICONES_RELATORIO } from '../ui/icons.js';
export const CliExportersMessages = {
    poda: {
        relatoriosExportados: (dir) => `Relatórios de poda exportados para: ${dir}`,
        falhaExportar: (erroMensagem) => `Falha ao exportar relatórios de poda: ${erroMensagem}`,
    },
    guardian: {
        relatoriosExportadosTitulo: `${ICONES_ACAO.export} ${ICONES_RELATORIO.detalhado} Relatórios Guardian exportados:`,
        caminhoMarkdown: (caminhoMd) => `   Markdown: ${caminhoMd}`,
        caminhoJson: (caminhoJson) => `   JSON: ${caminhoJson}`,
        falhaExportar: (erroMensagem) => `Falha ao exportar relatórios Guardian: ${erroMensagem}`,
    },
    fixTypes: {
        relatoriosExportadosTitulo: `${ICONES_ACAO.export} ${ICONES_RELATORIO.detalhado} Relatórios de fix-types exportados:`,
        caminhoMarkdown: (caminhoMd) => `   Markdown: ${caminhoMd}`,
        caminhoJson: (caminhoJson) => `   JSON: ${caminhoJson}`,
        falhaExportar: (erroMensagem) => `Falha ao exportar relatórios de fix-types: ${erroMensagem}`,
    },
    reestruturacao: {
        relatoriosExportados: (modoPrefixo, dir) => `Relatórios de reestruturação ${modoPrefixo}exportados para: ${dir}`,
        falhaExportar: (modoPrefixo, erroMensagem) => `Falha ao exportar relatórios ${modoPrefixo}de reestruturação: ${erroMensagem}`,
    },
};
//# sourceMappingURL=cli-exporters-messages.js.map