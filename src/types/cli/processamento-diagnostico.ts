// SPDX-License-Identifier: MIT

// Importações dos tipos unificados
import type { detectarArquetipos } from '/detectores/detector-arquetipos.js';

import type { FileEntryWithAst, ResultadoExecucao, ResultadoGuardian } from '@';

export interface OpcoesProcessamentoDiagnostico {
  guardianCheck?: boolean;
  full?: boolean;
  logLevel?: string;
  include?: string[];
  exclude?: string[];
  listarAnalistas?: boolean;
  json?: boolean;
  jsonAscii?: boolean;
  executive?: boolean;
  criarArquetipo?: boolean;
  salvarArquetipo?: boolean;
  detalhado?: boolean;
  autoFix?: boolean;
  autoFixMode?: string;
  autoFixConservative?: boolean;
  fast?: boolean; // Modo rápido: processamento paralelo
  // 🚀 NOVAS FLAGS INTUITIVAS
  fix?: boolean;
  fixSafe?: boolean;
  showFixes?: boolean;
}

export interface ResultadoProcessamentoDiagnostico {
  totalOcorrencias: number;
  temErro: boolean;
  guardianResultado?: ResultadoGuardian;
  arquetiposResultado?: Awaited<ReturnType<typeof detectarArquetipos>>;
  fileEntriesComAst: FileEntryWithAst[];
  resultadoFinal: ResultadoExecucao;
}
