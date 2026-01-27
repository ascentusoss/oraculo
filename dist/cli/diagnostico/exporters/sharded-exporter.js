export async function fragmentarRelatorio(dados, options) {
    const ocorrencias = dados.ocorrencias || [];
    const totalOcorrencias = ocorrencias.length;
    const numShards = Math.ceil(totalOcorrencias / options.ocorrenciasPorShard);
    if (numShards <= 1) {
        return {
            sucesso: true,
            shards: [
                {
                    arquivo: `${options.prefixo}-completo.${options.formato === 'json' ? 'json' : 'md'}`,
                    caminho: `${options.outputDir}/${options.prefixo}-completo.${options.formato === 'json' ? 'json' : 'md'}`,
                    indice: 0,
                    ocorrencias: totalOcorrencias,
                },
            ],
            totalOcorrencias,
            stats: {
                shardsGerados: 1,
                tamanhoMedio: totalOcorrencias,
                tamanhoTotal: totalOcorrencias,
            },
        };
    }
    const shards = [];
    for (let i = 0; i < numShards; i++) {
        const inicio = i * options.ocorrenciasPorShard;
        const fim = Math.min(inicio + options.ocorrenciasPorShard, totalOcorrencias);
        const ocorrenciasNoShard = fim - inicio;
        shards.push({
            arquivo: `${options.prefixo}-parte${i + 1}.${options.formato === 'json' ? 'json' : 'md'}`,
            caminho: `${options.outputDir}/${options.prefixo}-parte${i + 1}.${options.formato === 'json' ? 'json' : 'md'}`,
            indice: i,
            ocorrencias: ocorrenciasNoShard,
            range: { inicio, fim },
        });
    }
    const tamanhoMedio = totalOcorrencias / numShards;
    return {
        sucesso: true,
        shards,
        indice: options.incluirIndice
            ? `${options.outputDir}/${options.prefixo}-indice.${options.formato === 'json' ? 'json' : 'md'}`
            : undefined,
        totalOcorrencias,
        stats: {
            shardsGerados: numShards,
            tamanhoMedio: Math.round(tamanhoMedio),
            tamanhoTotal: totalOcorrencias,
        },
    };
}
export function dividirOcorrencias(ocorrencias, tamanhoChunk) {
    const chunks = [];
    for (let i = 0; i < ocorrencias.length; i += tamanhoChunk) {
        chunks.push(ocorrencias.slice(i, i + tamanhoChunk));
    }
    return chunks;
}
export function calcularEstatisticasFragmentacao(ocorrencias, tamanhoShard) {
    const numShards = Math.ceil(ocorrencias.length / tamanhoShard);
    const tamanhoMedio = ocorrencias.length / numShards;
    const ultimoShardTamanho = ocorrencias.length % tamanhoShard || tamanhoShard;
    return {
        numShards,
        tamanhoMedio: Math.round(tamanhoMedio),
        ultimoShardTamanho,
    };
}
export function gerarNomeShard(prefixo, indice, total, formato) {
    const padding = total.toString().length;
    const numeroFormatado = (indice + 1).toString().padStart(padding, '0');
    const extensao = formato === 'json' ? 'json' : 'md';
    return `${prefixo}-parte${numeroFormatado}-de${total}.${extensao}`;
}
export function gerarIndiceConsolidado(shards, formato) {
    if (formato === 'json') {
        return JSON.stringify({
            tipo: 'indice-shards',
            timestamp: new Date().toISOString(),
            shards: shards.map((s) => ({
                arquivo: s.arquivo,
                indice: s.indice,
                ocorrencias: s.ocorrencias,
                range: s.range,
            })),
            total: shards.reduce((sum, s) => sum + s.ocorrencias, 0),
        }, null, 2);
    }
    let md = '# Índice de Relatório Fragmentado\n\n';
    md += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
    md += '## Fragmentos\n\n';
    md += '| Parte | Arquivo | Ocorrências | Range |\n';
    md += '|-------|---------|-------------|-------|\n';
    for (const shard of shards) {
        const range = shard.range
            ? `${shard.range.inicio}-${shard.range.fim}`
            : 'N/A';
        md += `| ${shard.indice + 1} | ${shard.arquivo} | ${shard.ocorrencias} | ${range} |\n`;
    }
    md += `\n**Total**: ${shards.reduce((sum, s) => sum + s.ocorrencias, 0)} ocorrências\n`;
    return md;
}
export function validarOptionsSharding(options) {
    const erros = [];
    if (!options.formato) {
        erros.push('Formato é obrigatório');
    }
    else if (options.formato !== 'json' && options.formato !== 'markdown') {
        erros.push('Formato deve ser "json" ou "markdown"');
    }
    if (!options.ocorrenciasPorShard || options.ocorrenciasPorShard <= 0) {
        erros.push('ocorrenciasPorShard deve ser maior que 0');
    }
    if (!options.outputDir) {
        erros.push('outputDir é obrigatório');
    }
    if (!options.prefixo) {
        erros.push('prefixo é obrigatório');
    }
    return {
        valido: erros.length === 0,
        erros,
    };
}
export function criarOptionsShardingPadrao(overrides = {}) {
    return {
        formato: 'json',
        ocorrenciasPorShard: 1000,
        outputDir: './relatorios',
        prefixo: 'diagnostico',
        incluirIndice: true,
        incluirMetadataEmShards: true,
        ...overrides,
    };
}
//# sourceMappingURL=sharded-exporter.js.map