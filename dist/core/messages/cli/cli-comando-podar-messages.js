import { ICONES_COMANDO } from '../ui/icons.js';
export const CliComandoPodarMessages = {
    inicio: `\n${ICONES_COMANDO.podar} Iniciando processo de poda...\n`,
    nenhumaSujeira: (iconeSucesso) => `${iconeSucesso} Nenhuma sujeira detectada. Repositório limpo!`,
    orfaosDetectados: (qtd) => `\n${qtd} arquivos órfãos detectados:`,
    linhaArquivoOrfao: (arquivo) => `- ${arquivo}`,
    confirmarRemocao: 'Tem certeza que deseja remover esses arquivos? (s/N) ',
    erroDurantePoda: (erroMensagem) => `[ERRO] Erro durante a poda: ${erroMensagem}`,
};
//# sourceMappingURL=cli-comando-podar-messages.js.map