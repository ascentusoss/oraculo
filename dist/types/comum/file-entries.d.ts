import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
export type OrigemArquivo = 'local' | 'remoto' | 'gerado';
export interface FileEntry {
    fullPath: string;
    relPath: string;
    content: string | null;
    origem?: OrigemArquivo;
    ultimaModificacao?: number;
}
export interface FileEntryWithAst extends FileEntry {
    ast: NodePath<Node> | object | null | undefined;
}
export interface FileEntryWithBabelAst extends FileEntry {
    ast: NodePath<Node> | undefined;
}
export interface FileEntryWithGenericAst extends FileEntry {
    ast: object | null | undefined;
}
export type FileMap = Record<string, FileEntry>;
export type FileMapWithAst = Record<string, FileEntryWithAst>;
export type FileMapWithBabelAst = Record<string, FileEntryWithBabelAst>;
//# sourceMappingURL=file-entries.d.ts.map