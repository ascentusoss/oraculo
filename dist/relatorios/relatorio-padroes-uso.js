import { log, logRelatorio, MENSAGENS_RELATORIOS_ANALISE, } from '../core/messages/index.js';
export function exibirRelatorioPadroesUso() {
    log.info(MENSAGENS_RELATORIOS_ANALISE.asyncPatterns.padroes);
    if (!process.env.VITEST) {
        const titulo = 'Padrões de Uso do Código';
        const linhas = [];
        const logComBloco = log;
        const largura = logComBloco.calcularLargura
            ? logComBloco.calcularLargura(titulo, linhas, 84)
            : undefined;
        logComBloco.imprimirBloco(titulo, linhas, (s) => s, typeof largura === 'number' ? largura : 84);
    }
    logRelatorio.fimPadroesUso();
}
//# sourceMappingURL=relatorio-padroes-uso.js.map