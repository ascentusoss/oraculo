// SPDX-License-Identifier: MIT

export interface MetricaAnalista {
  nome: string;
  duracaoMs: number;
  ocorrencias: number;
  global: boolean;
}

export interface TopAnalista {
  nome: string;
  totalMs: number;
  mediaMs: number;
  execucoes: number;
  ocorrencias: number;
}
