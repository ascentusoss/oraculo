import type { FileEntry, GuardianOptions, GuardianResultadoProcessamento } from '../../../types/index.js';
export type { GuardianOptions };
export type GuardianResult = GuardianResultadoProcessamento;
export declare function executarGuardian(entries: FileEntry[], options: GuardianOptions): Promise<GuardianResult>;
export declare function formatarGuardianParaJson(result: GuardianResult): Record<string, unknown>;
export declare function getExitCodeGuardian(result: GuardianResult): number;
//# sourceMappingURL=guardian-handler.d.ts.map