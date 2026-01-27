import type { ComparacaoSnapshot } from '../types/index.js';
export declare function diffSnapshots(before: Record<string, string>, after: Record<string, string>): ComparacaoSnapshot;
export declare function verificarErros(diffs: ComparacaoSnapshot): string[];
//# sourceMappingURL=diff.d.ts.map