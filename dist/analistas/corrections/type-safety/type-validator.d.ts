import type { TypeAnalysis, TypeReplacementValidation } from '../../../types/index.js';
export declare function validateTypeReplacement(originalCode: string, fixedCode: string, typeAnalysis: TypeAnalysis): Promise<TypeReplacementValidation>;
export declare function runTypeScriptCompiler(code: string): {
    hasErrors: boolean;
    errors: string[];
};
//# sourceMappingURL=type-validator.d.ts.map