import type { ExistingType, TypeAnalysis } from '../../../types/index.js';
export declare function createTypeDefinition(analysis: TypeAnalysis, sourceFilePath: string): Promise<string>;
export declare function findExistingType(typeName: string): Promise<ExistingType | null>;
export declare function isSameType(type1: ExistingType, type2: string): boolean;
//# sourceMappingURL=type-creator.d.ts.map