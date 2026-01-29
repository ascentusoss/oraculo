import type { Node } from '/types';
import type { UsagePattern, VariableUsage } from '../../../types/index.js';
export declare function findVariableUsages(varName: string, ast: Node | null): VariableUsage[];
export declare function analyzeUsagePatterns(usages: VariableUsage[]): UsagePattern;
//# sourceMappingURL=usage-analyzer.d.ts.map