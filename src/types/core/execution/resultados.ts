// SPDX-License-Identifier: MIT
import type {
  EstruturaIdentificadaJson,
  FileEntryWithAst,
  LinguagensJson,
  MetricaExecucao,
  Ocorrencia,
  ParseErrosJson,
} from '@';

import type { GuardianResult } from '../../guardian/resultado.js';

export interface ResultadoInquisicao {
  totalArquivos: number;
  ocorrencias: Ocorrencia[];
  arquivosAnalisados: string[];
  timestamp: number;
  duracaoMs: number;
  metricas?: MetricaExecucao;
}

export interface ResultadoInquisicaoCompleto extends ResultadoInquisicao {
  arquivosAnalisados: string[];
  fileEntries: FileEntryWithAst[];
  guardian: GuardianResult;
}

export interface SaidaJsonDiagnostico {
  status: 'ok' | 'problemas' | 'erro';
  totalOcorrencias: number;
  guardian: 'verificado' | 'nao-verificado';
  tiposOcorrencias: Record<string, number>;
  parseErros: ParseErrosJson;
  ocorrencias: Ocorrencia[];
  estruturaIdentificada?: EstruturaIdentificadaJson;
  metricas?: MetricaExecucao;
  linguagens: LinguagensJson;
}

export interface ResultadoCorrecao {
  correcoesAplicadas: number;
}

export interface ResultadoPoda {
  arquivosOrfaos: ArquivoFantasma[];
}

export interface ArquivoFantasma {
  arquivo: string;
  referenciado: boolean;
  diasInativo: number;
}
