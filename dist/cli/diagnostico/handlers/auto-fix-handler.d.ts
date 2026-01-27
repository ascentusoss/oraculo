import type { AutoFixOptions, AutoFixResult, FileEntryWithAst } from '../../../types/index.js';
export type { AutoFixOptions, AutoFixResult };
export declare function executarAutoFix(entries: FileEntryWithAst[], options: AutoFixOptions): Promise<AutoFixResult>;
export declare function formatarAutoFixParaJson(resultado: AutoFixResult): Record<string, unknown>;
export declare function calcularLimiarConfianca(mode: AutoFixOptions['mode']): number;
export declare function deveAplicarCorrecao(confianca: number, limiar: number, mode: AutoFixOptions['mode']): boolean;
export declare function getExitCodeAutoFix(resultado: AutoFixResult): number;
//# sourceMappingURL=auto-fix-handler.d.ts.map