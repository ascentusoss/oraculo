// SPDX-License-Identifier: MIT
/**
 * Tipos para fragmentação de relatórios
 * Originalmente em: src/shared/data-processing/fragmentar-relatorio.ts
 */

import type { FileEntryWithAst } from '../comum/file-entries.js';
import type { Ocorrencia } from '../comum/ocorrencias.js';

/**
 * Entrada de arquivo flexível para fragmentação (tipo union específico)
 */
export type FileEntryFragmentacao =
  | FileEntryWithAst
  | {
      relPath?: string;
      fullPath?: string;
      path?: string;
      content?: string | null;
      [k: string]: unknown;
    };

/**
 * Manifesto de fragmentação
 */
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
  resultado?: unknown; // Pode ser ResultadoInquisicaoCompleto ou estrutura customizada
  ocorrencias?: Ocorrencia[];
  fileEntries?: FileEntryWithAst[];
  [k: string]: unknown;
}
