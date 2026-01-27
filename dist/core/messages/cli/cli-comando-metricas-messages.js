import { ICONES_ACAO } from '../ui/icons.js';
export const CliComandoMetricasMessages = {
    linhaEmBranco: '',
    historicoExportado: (destino) => `${ICONES_ACAO.export} Histórico de métricas exportado para ${destino}`,
    linhaExecucao: (timestampISO, totalArquivos, duracaoAnalise, duracaoParsing, cacheHits, cacheMiss) => `- ${timestampISO} | arquivos=${totalArquivos} analise=${duracaoAnalise} parsing=${duracaoParsing} cache(h/m)=${cacheHits}/${cacheMiss}`,
    tituloTopAnalistas: (iconeInfo) => `${iconeInfo} Top analistas (por tempo acumulado):`,
    linhaTopAnalista: (nome, total, media, execucoes, ocorrencias) => `  • ${nome} total=${total} média=${media} exec=${execucoes} ocorr=${ocorrencias}`,
    medias: (mediaAnalise, mediaParsing) => `\nMédias: análise=${mediaAnalise} parsing=${mediaParsing}`,
};
//# sourceMappingURL=cli-comando-metricas-messages.js.map