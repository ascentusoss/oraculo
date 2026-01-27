// SPDX-License-Identifier: MIT
/**
 * Tipos para o scanner de repositório
 */

import type { Dirent } from 'node:fs';

/**
 * Opções para o scanner de repositório
 */
export interface ScanOptions {
  includeContent?: boolean;
  filter?: (relPath: string, entry: Dirent) => boolean;
  onProgress?: (msg: string) => void;
}
