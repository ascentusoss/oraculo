// SPDX-License-Identifier: MIT
/**
 * Tipos para detecção inteligente de contexto e arquétipos
 * Consolidação de múltiplas versões
 */

export interface EvidenciaContexto {
  tipo:
    | 'dependencia'
    | 'import'
    | 'export'
    | 'estrutura'
    | 'config'
    | 'script'
    | 'codigo'
    | string;
  valor: string;
  confianca: number; // 0-1
  tecnologia?: string;
  origem?: string;
  localizacao?: string; // arquivo ou pasta onde foi encontrada
  detalhes?: Record<string, unknown>;
}

export interface ResultadoDeteccaoContextual {
  tecnologia?: string;
  contextoIdentificado?: string;
  confiancaTotal: number;
  evidencias: EvidenciaContexto[];
  sugestoesMelhoria?: string[];
  problemasDetectados?: string[];
  sinaisAdicionais?: string[];
}
