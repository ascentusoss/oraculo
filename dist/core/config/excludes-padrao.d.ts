import type { ConfigExcludesPadrao } from '../../types/index.js';
export type { ConfigExcludesPadrao };
export declare const EXCLUDES_PADRAO: ConfigExcludesPadrao;
export declare function getExcludesRecomendados(tipoProjeto?: string): string[];
export declare function isPadraoExclusaoSeguro(padrao: string): boolean;
export declare function mesclarConfigExcludes(configUsuario: string[] | null | undefined, tipoProjeto?: string): string[];
//# sourceMappingURL=excludes-padrao.d.ts.map