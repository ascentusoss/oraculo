import type { SvgoMinimoResult } from '../../types/index.js';
export type { SvgoMinimoMudanca, SvgoMinimoResult } from '../../types/index.js';
export declare const SVG_OPT_MIN_BYTES_SAVED = 40;
export declare const SVG_OPT_MIN_PERCENT_SAVED = 5;
export declare function shouldSugerirOtimizacaoSvg(originalBytes: number, optimizedBytes: number): boolean;
export declare function otimizarSvgLikeSvgo(params: {
    svg: string;
}): SvgoMinimoResult;
//# sourceMappingURL=svgs.d.ts.map