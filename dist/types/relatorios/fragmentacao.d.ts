import type { FileEntryWithAst } from '../comum/file-entries.js';
import type { Ocorrencia } from '../comum/ocorrencias.js';
export type FileEntryFragmentacao = FileEntryWithAst | {
    relPath?: string;
    fullPath?: string;
    path?: string;
    content?: string | null;
    [k: string]: unknown;
};
export interface Manifest {
    generatedAt: string;
    baseName: string;
    parts: ManifestPart[];
}
export interface FragmentOptions {
    maxOcorrenciasPerShard?: number;
    maxFileEntriesPerShard?: number;
}
export interface ManifestPart {
    file: string;
    items?: number;
    count?: number;
    sizeBytes?: number;
    bytes?: number;
    compressed?: boolean;
    kind?: string;
    index?: number;
    total?: number;
    summary?: Record<string, unknown>;
    [k: string]: unknown;
}
export interface RelatorioCompleto {
    resultado?: unknown;
    ocorrencias?: Ocorrencia[];
    fileEntries?: FileEntryWithAst[];
    [k: string]: unknown;
}
//# sourceMappingURL=fragmentacao.d.ts.map