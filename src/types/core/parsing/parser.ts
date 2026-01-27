// SPDX-License-Identifier: MIT

import type { File } from '@babel/types';

// Re-export do tipo comum para compatibilidade

export interface ParserBabelFileExtra extends File {
  oraculoExtra?: {
    lang: string;
    rawAst: unknown;
    metadata?: unknown;
  };
}

export type ParserFunc = (
  codigo: string,
  plugins?: string[],
) => File | ParserBabelFileExtra | null;

export interface DecifrarSintaxeOpts {
  plugins?: string[];
  codigo?: string;
  relPath?: string;
  fullPath?: string;
  ignorarErros?: boolean;
  timeoutMs?: number;
}
