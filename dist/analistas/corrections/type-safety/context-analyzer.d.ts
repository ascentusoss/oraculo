import type { CategorizacaoUnknown } from '../../../types/index.js';
export declare function isInString(code: string, position: number): boolean;
export declare function isInComment(code: string, position: number): boolean;
export declare function isInStringOrComment(code: string, position: number): boolean;
export declare function isTypeScriptContext(code: string, position: number): boolean;
export declare function isLegacyOrVendorFile(filePath?: string): boolean;
export declare function isUnknownInGenericContext(code: string, position: number): boolean;
export declare function isAnyInGenericFunction(code: string, position: number): boolean;
export declare function getDomainFromFilePath(filePath: string): string;
export declare function toKebabCase(str: string): string;
export declare function isDefinitionFile(filePath: string): boolean;
export declare function isTypeScriptFile(filePath: string): boolean;
export declare function extractVariableName(match: RegExpMatchArray, code: string): string | null;
export declare function extractLineContext(code: string, position: number): string;
export type { CategorizacaoUnknown };
export declare function categorizarUnknown(code: string, filePath: string, lineContext: string): CategorizacaoUnknown;
//# sourceMappingURL=context-analyzer.d.ts.map