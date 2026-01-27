import type { ArquetipoEstruturaDef, ResultadoDeteccaoArquetipo, SinaisProjetoAvancados } from '../../types/index.js';
export declare function scoreArquetipo(def: ArquetipoEstruturaDef, arquivos: string[]): ResultadoDeteccaoArquetipo;
export declare function pontuarTodos(arquivos: string[]): ResultadoDeteccaoArquetipo[];
export declare function scoreArquetipoAvancado(def: ArquetipoEstruturaDef, arquivos: string[], sinaisAvancados?: SinaisProjetoAvancados): ResultadoDeteccaoArquetipo;
export declare function pontuarTodosAvancado(arquivos: string[], sinaisAvancados?: SinaisProjetoAvancados): ResultadoDeteccaoArquetipo[];
//# sourceMappingURL=pontuador.d.ts.map