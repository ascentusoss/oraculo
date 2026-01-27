// SPDX-License-Identifier: MIT

/**
 * Configuração de pontuação para análise de qualidade de código
 * (Diferente de ConfiguracaoPontuacao em core/config que é para arquétipos)
 */
export interface ConfiguracaoPontuacaoAnalista {
  pesoBase: number;
  multiplicadores: {
    complexidade?: number;
    cobertura?: number;
    documentacao?: number;
    performance?: number;
    seguranca?: number;
  };
  limiares: {
    minimo: number;
    maximo: number;
    critico: number;
  };
  ajustes?: Record<string, number>;
}
