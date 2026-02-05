import type { File as BabelFile } from '@babel/types';
import type { DecifrarSintaxeOpts, ParserFunc, ParserOptions as PluginParserOptions } from '../../types/index.js';
export declare function getCurrentParsingFile(): string;
export declare const PARSERS: Map<string, ParserFunc>;
export declare const EXTENSOES_SUPORTADAS: string[];
export declare function decifrarSintaxe(codigo: string, ext: string, opts?: DecifrarSintaxeOpts): Promise<BabelFile | null>;
export declare function parseComPlugins(codigo: string, extensao: string, opts?: PluginParserOptions): Promise<BabelFile | null>;
export declare function getPluginStats(): {
    pluginsRegistrados: number;
    extensoesSuportadas: number;
    sistemAtivojava: boolean;
};
//# sourceMappingURL=parser.d.ts.map