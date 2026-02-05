// SPDX-License-Identifier: MIT

import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';

export type OrigemArquivo = 'local' | 'remoto' | 'gerado';

// Versão base - compatível com núcleo
export interface FileEntry {
  fullPath: string;
  relPath: string;
  content: string | null;
  origem?: OrigemArquivo;
  ultimaModificacao?: number;
}

// Versão genérica - suporta ASTs de qualquer parser
export interface FileEntryWithAst extends FileEntry {
  ast: NodePath<Node> | object | null | undefined;
}

// Versão específica para Babel (backward compatibility)
export interface FileEntryWithBabelAst extends FileEntry {
  ast: NodePath<Node> | undefined;
}

// Versão específica para parsers não-Babel
export interface FileEntryWithGenericAst extends FileEntry {
  ast: object | null | undefined;
}

export type FileMap = Record<string, FileEntry>;
export type FileMapWithAst = Record<string, FileEntryWithAst>;
export type FileMapWithBabelAst = Record<string, FileEntryWithBabelAst>;
