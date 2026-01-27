// SPDX-License-Identifier: MIT
import type { Node } from '@babel/types';

import type { FileEntryWithAst, Ocorrencia } from '@';

import type { GuardianResult } from '../../guardian/resultado.js';

export interface SimbolosLog {
  info: string;
  sucesso: string;
  erro: string;
  aviso: string;
  debug: string;
  fase: string;
  passo: string;
  scan: string;
  guardian: string;
  pasta: string;
}

export interface OcorrenciaParseErro extends Omit<Ocorrencia, 'relPath'> {
  relPath?: string;
  // Atributos específicos de erros de parsing
}

export function ocorrenciaParseErro(params: {
  mensagem: string;
  relPath?: string;
  origem?: string;
}): OcorrenciaParseErro {
  return {
    mensagem: params.mensagem,
    relPath: params.relPath,
    nivel: 'erro',
    origem: params.origem,
  };
}

export interface ResultadoInquisicaoCompleto {
  totalArquivos: number;
  arquivosAnalisados: string[];
  ocorrencias: Array<OcorrenciaParseErro | Ocorrencia>;
  timestamp: number;
  duracaoMs: number;
  fileEntries: FileEntryWithAst[];
  guardian: GuardianResult;
}

export type CacheValor = {
  ast: Node | null;
  timestamp: number;
};

export interface MetricasGlobais {
  parsingTimeMs: number;
  cacheHits: number;
  cacheMiss: number;
}

export interface EstadoIncArquivo {
  hash: string;
  ocorrencias?: Array<unknown>;
  analistas?: Record<string, { ocorrencias: number; duracaoMs: number }>;
  reaproveitadoCount?: number;
}

export type EstadoIncrementalInquisidor = {
  arquivos: Record<string, EstadoIncArquivo>;
};
