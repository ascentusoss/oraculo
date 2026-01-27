// SPDX-License-Identifier: MIT

/**
 * Tipos específicos para métricas de analistas
 * Substitui unknown em processamento de métricas
 */

/**
 * Métrica bruta de um analista individual
 */
export interface MetricaAnalistaBruta {
  nome: string;
  categoria?: string;
  ocorrencias: number;
  duracaoMs: number;
  execucoes?: number;
  erros?: number;
  status?: 'sucesso' | 'erro' | 'timeout';
}

/**
 * Métrica agrupada de analistas (depois de agrupar duplicatas)
 */
export interface MetricaAnalistaAgrupada {
  nome: string;
  categoria?: string;
  ocorrencias: number;
  duracaoMs: number;
  execucoes: number;
  erros: number;
  mediaMs: number;
}

/**
 * Top analista para relatórios resumidos
 */
export interface TopAnalistaProcessado {
  nome: string;
  totalMs: number;
  mediaMs: number;
  execucoes: number;
  ocorrencias: number;
}

/**
 * Resultado de execução com métricas tipadas
 */
export interface ResultadoExecucaoComMetricas {
  metricas?: {
    analistas?: MetricaAnalistaBruta[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Métricas finais processadas
 */
export interface MetricasFinaisProcessadas {
  analistas: MetricaAnalistaAgrupada[];
  topAnalistas?: TopAnalistaProcessado[];
  [key: string]: unknown;
}
