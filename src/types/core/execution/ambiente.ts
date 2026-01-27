// SPDX-License-Identifier: MIT

import type { Dirent } from 'node:fs';

import type { FileEntryWithAst } from '@';

import type { GuardianResult } from '../../guardian/resultado.js';

export interface AmbienteExecucao {
  arquivosValidosSet: Set<string>;
  guardian: GuardianResult;
}

export interface ContextoExecucao {
  baseDir: string;
  arquivos: FileEntryWithAst[];
  ambiente?: AmbienteExecucao;
}

export interface InquisicaoOptions {
  includeContent?: boolean;
  incluirMetadados?: boolean;
  skipExec?: boolean;
}

export interface ScanOptions {
  includeContent?: boolean;
  includeAst?: boolean;
  filter?: (relPath: string, entry: Dirent) => boolean;
  onProgress?: (msg: string) => void;
}
