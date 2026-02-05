import type { Node } from '@babel/types';
import type { TypeAnalysis } from '../../../types/index.js';
export declare function analyzeTypeUsage(match: RegExpMatchArray, fullCode: string, filePath: string, ast: Node | null): Promise<TypeAnalysis>;
export declare function analyzeUnknownUsage(match: RegExpMatchArray, fullCode: string, filePath: string, ast: Node | null): Promise<TypeAnalysis>;
//# sourceMappingURL=type-analyzer.d.ts.map