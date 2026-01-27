import type { InferredInterface, PropertyUsage, TypeAnalysis, UsagePattern } from '../../../types/index.js';
export declare function inferTypeFromUsage(varName: string, patterns: UsagePattern, _filePath: string): TypeAnalysis;
export declare function inferInterfaceFromProperties(varName: string, properties: PropertyUsage[]): InferredInterface;
export declare function extractTypeFromGuards(typeGuards: Array<{
    type: string;
    inferredType: string;
    confidence: number;
}>): {
    type: string;
    confidence: number;
};
//# sourceMappingURL=type-inference.d.ts.map