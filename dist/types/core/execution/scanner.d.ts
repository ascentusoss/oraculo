import type { Dirent } from 'node:fs';
export interface ScanOptions {
    includeContent?: boolean;
    filter?: (relPath: string, entry: Dirent) => boolean;
    onProgress?: (msg: string) => void;
}
//# sourceMappingURL=scanner.d.ts.map