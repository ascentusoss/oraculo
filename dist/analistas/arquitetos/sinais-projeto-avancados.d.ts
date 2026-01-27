import type { ArquetipoEstruturaDef, FileEntryWithAst, PackageJson, ResultadoDeteccaoArquetipo, SinaisProjetoAvancados } from '../../types/index.js';
export declare function scoreArquetipo(def: ArquetipoEstruturaDef, _arquivos: string[], _sinaisAvancados?: SinaisProjetoAvancados): ResultadoDeteccaoArquetipo;
export declare function extrairSinaisAvancados(fileEntries: FileEntryWithAst[], packageJson?: PackageJson, _p0?: unknown, _baseDir?: string, _arquivos?: string[]): SinaisProjetoAvancados;
//# sourceMappingURL=sinais-projeto-avancados.d.ts.map