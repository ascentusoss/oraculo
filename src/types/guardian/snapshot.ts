// SPDX-License-Identifier: MIT

export interface SnapshotDiff {
  adicionados: string[];
  removidos: string[];
  modificados: string[];
}

export interface SnapshotDetalhado {
  hash: string;
  timestamp: string;
  arquivos: Record<string, string>;
}

export type Snapshot = Record<string, string>;
