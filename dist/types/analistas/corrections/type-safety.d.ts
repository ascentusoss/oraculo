import type { Node } from '/types';
export interface ASTNode {
    type?: string;
    name?: string;
    object?: ASTNode;
    property?: ASTNode;
    callee?: ASTNode;
    value?: unknown;
    loc?: {
        start?: {
            line?: number;
            column?: number;
        };
    };
    [key: string]: unknown;
}
export interface TypeAnalysis {
    confidence: number;
    inferredType: string;
    isSimpleType: boolean;
    typeName: string;
    typeDefinition: string;
    suggestedPath: string;
    suggestion?: string;
    createdNewType?: boolean;
    requiresImport?: boolean;
}
export interface UsagePattern {
    allUsagesAreString: boolean;
    allUsagesAreNumber: boolean;
    allUsagesAreBoolean: boolean;
    hasObjectStructure: boolean;
    objectProperties?: PropertyUsage[];
    hasTypeGuards: boolean;
    typeGuards?: TypeGuard[];
    isFunction: boolean;
    isArray: boolean;
    unionTypes?: string[];
}
export interface PropertyUsage {
    name: string;
    inferredType: string;
    confidence: number;
    isOptional: boolean;
    methodsCalled?: string[];
}
export interface TypeGuard {
    type: 'typeof' | 'instanceof' | 'in' | 'custom';
    expression: string;
    inferredType: string;
    confidence: number;
}
export interface InferredInterface {
    name: string;
    definition: string;
    confidence: number;
    properties: PropertyUsage[];
}
export interface TypeReplacementValidation {
    isCompatible: boolean;
    expectedType: string;
    errors: string[];
    warnings: string[];
}
export interface AdditionalChange {
    type: 'add-import' | 'create-type-file' | 'update-index' | 'add-type-guard';
    content: string;
    path?: string;
}
export interface TypeSafetyWarning {
    type: 'type-suggestion' | 'unsafe-type' | 'keep-unknown' | 'duplicate-type';
    message: string;
    suggestion: string;
    confidence?: number;
    needsManualReview?: boolean;
    conflictingTypePath?: string;
}
export interface QuickFixResult {
    code: string;
    additionalChanges?: AdditionalChange[];
    warnings?: TypeSafetyWarning[];
    applied?: boolean;
    reason?: string;
}
export interface VariableUsage {
    name: string;
    nodeType: string;
    line: number;
    column: number;
    context: string;
    operation: 'call' | 'access' | 'assignment' | 'comparison' | 'return' | 'argument';
    property?: string;
    method?: string;
    argumentIndex?: number;
}
export interface TypeInferenceContext {
    filePath: string;
    domain: string;
    isTypeScript: boolean;
    isDefinitionFile: boolean;
    isLegacy: boolean;
    ast: Node | null;
    code: string;
}
export interface ExistingType {
    name: string;
    path: string;
    definition: string;
    isExported: boolean;
    domain: string;
}
export interface CategorizacaoUnknown {
    categoria: 'legitimo' | 'melhoravel' | 'corrigir';
    confianca: number;
    motivo: string;
    sugestao?: string;
    variantes?: string[];
}
//# sourceMappingURL=type-safety.d.ts.map