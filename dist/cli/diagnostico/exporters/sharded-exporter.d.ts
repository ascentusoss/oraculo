import type { DadosRelatorioMarkdown, Ocorrencia, RelatorioJson, ResultadoSharding, ShardInfo, ShardingOptions } from '../../../types/index.js';
export type { ResultadoSharding, ShardInfo, ShardingOptions };
export declare function fragmentarRelatorio(dados: Partial<RelatorioJson> | DadosRelatorioMarkdown, options: ShardingOptions): Promise<ResultadoSharding>;
export declare function dividirOcorrencias(ocorrencias: Ocorrencia[], tamanhoChunk: number): Ocorrencia[][];
export declare function calcularEstatisticasFragmentacao(ocorrencias: Ocorrencia[], tamanhoShard: number): {
    numShards: number;
    tamanhoMedio: number;
    ultimoShardTamanho: number;
};
export declare function gerarNomeShard(prefixo: string, indice: number, total: number, formato: 'json' | 'markdown'): string;
export declare function gerarIndiceConsolidado(shards: ShardInfo[], formato: 'json' | 'markdown'): string;
export declare function validarOptionsSharding(options: Partial<ShardingOptions>): {
    valido: boolean;
    erros: string[];
};
export declare function criarOptionsShardingPadrao(overrides?: Partial<ShardingOptions>): ShardingOptions;
//# sourceMappingURL=sharded-exporter.d.ts.map