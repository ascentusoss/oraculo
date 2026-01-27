import type { AutoFixConfig } from '../../../types/index.js';
export type { AutoFixConfig };
export declare const DEFAULT_AUTO_FIX_CONFIG: AutoFixConfig;
export declare const CONSERVATIVE_AUTO_FIX_CONFIG: AutoFixConfig;
export declare const AGGRESSIVE_AUTO_FIX_CONFIG: AutoFixConfig;
export declare const AUTO_FIX_CONFIG_DEFAULTS: AutoFixConfig;
export default AUTO_FIX_CONFIG_DEFAULTS;
export declare function shouldExcludeFile(filePath: string, config: AutoFixConfig): boolean;
export declare function shouldExcludeFunction(functionName: string, config: AutoFixConfig): boolean;
export declare function isCategoryAllowed(category: string, config: AutoFixConfig): boolean;
export declare function hasMinimumConfidence(confidence: number, config: AutoFixConfig): boolean;
export declare function getAutoFixConfig(mode?: string): AutoFixConfig;
//# sourceMappingURL=auto-fix-config.d.ts.map