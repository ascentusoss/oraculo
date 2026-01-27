// SPDX-License-Identifier: MIT

export interface MoveReversao {
  id: string;
  timestamp: string;
  origem: string;
  destino: string;
  motivo: string;
  importsReescritos: boolean;
  conteudoOriginal?: string;
  conteudoFinal?: string;
}

export interface MapaReversao {
  versao: string;
  moves: MoveReversao[];
  metadata: {
    totalMoves: number;
    ultimoMove: string;
    podeReverter: boolean;
  };
}
