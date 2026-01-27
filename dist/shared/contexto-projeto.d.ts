import type { ContextoProjeto, DetectarContextoOpcoes } from '../types/index.js';
export type { ContextoProjeto, DetectarContextoOpcoes };
export declare function detectarContextoProjeto(opcoes: DetectarContextoOpcoes): ContextoProjeto;
export declare function isRelevanteParaAnalise(contexto: ContextoProjeto, tipoAnalise: 'comando' | 'web' | 'bot' | 'cli' | 'biblioteca'): boolean;
export declare function sugerirFrameworks(contexto: ContextoProjeto): string[];
//# sourceMappingURL=contexto-projeto.d.ts.map