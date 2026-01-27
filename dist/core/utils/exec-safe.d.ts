import { type ExecSyncOptions } from 'node:child_process';
export declare function executarShellSeguro(cmd: string, opts?: ExecSyncOptions): Buffer | string;
export declare function executarShellSeguroAsync(cmd: string, opts?: ExecSyncOptions): Promise<Buffer | string>;
//# sourceMappingURL=exec-safe.d.ts.map