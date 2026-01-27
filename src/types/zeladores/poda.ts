// SPDX-License-Identifier: MIT

export interface Pendencia {
  arquivo: string;
  motivo: string;
  detectedAt: number;
  scheduleAt: number;
}

export interface HistoricoItem {
  arquivo: string;
  movidoEm: string;
  motivo: string;
}
