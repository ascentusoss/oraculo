import type { MagicConstantRule } from '../../types/index.js';
export type { MagicConstantRule };
export declare const DISCORD_LIMITS: MagicConstantRule[];
export declare const HTTP_STATUS_CODES: MagicConstantRule[];
export declare const COMMON_LIMITS: MagicConstantRule[];
export declare const MATH_CONSTANTS: MagicConstantRule[];
export declare const FRAMEWORK_WHITELISTS: Record<string, MagicConstantRule[]>;
export declare function isWhitelistedConstant(value: number, frameworks: string[], userWhitelist?: number[]): boolean;
export declare function getConstantDescription(value: number, frameworks: string[]): string | undefined;
//# sourceMappingURL=magic-constants-whitelist.d.ts.map