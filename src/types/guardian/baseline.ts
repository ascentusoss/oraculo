// SPDX-License-Identifier: MIT

export type SnapshotBaseline = Record<string, string>;

export interface SnapshotEstruturaBaseline {
  version: 1;
  timestamp: string;
  arquetipo: string;
  confidence: number;
  arquivosRaiz: string[];
}

export interface ArquetipoDrift {
  alterouArquetipo: boolean;
  anterior?: string;
  atual?: string;
  deltaConfidence: number;
  arquivosRaizNovos: string[];
  arquivosRaizRemovidos: string[];
}
