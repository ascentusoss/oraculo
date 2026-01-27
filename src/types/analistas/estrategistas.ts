// SPDX-License-Identifier: MIT

export interface ArquivoMeta {
  relPath: string;
  padrao?: string;
  categoria?: string;
  sugestao?: string;
}

export interface SinaisProjetoAvancados {
  // Campos detectados/agrupados pelo analisador de sinais
  funcoes: number;
  imports: string[];
  variaveis: number;
  tipos: string[];
  classes: number;
  frameworksDetectados: string[];
  dependencias: string[];
  scripts: string[];
  pastasPadrao: string[];
  arquivosPadrao: string[];
  arquivosConfig: string[];
  // Novos campos inteligentes
  padroesArquiteturais: string[];
  tecnologiasDominantes: string[];
  complexidadeEstrutura: 'baixa' | 'media' | 'alta';
  tipoDominante: string;
  detalhes?: {
    testRunner?: string;
    linter?: string;
    bundler?: string;
    ciProvider?: string;
  };
}

export interface ResultadoEstrutural {
  arquivo: string;
  ideal: string | null;
  atual: string;
  motivo?: string;
}

/**
 * Opções para planejamento de estrutura
 * Originalmente em: src/analistas/estrategistas/operario-estrutura.ts
 */
export interface OpcoesPlanejamento {
  preferEstrategista?: boolean;
  criarSubpastasPorEntidade?: boolean; // domains vs flat
  preset?: string;
  categoriasMapa?: Record<string, string>;
}

/**
 * Resultado do planejamento de estrutura
 * Originalmente em: src/analistas/estrategistas/operario-estrutura.ts
 */
export interface ResultadoPlanejamento {
  plano?: import('../estrutura/plano-estrutura.js').PlanoSugestaoEstrutura;
  origem: 'arquetipos' | 'estrategista' | 'nenhum';
}
