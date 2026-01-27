// SPDX-License-Identifier: MIT

export interface ResultadoGuardian {
  status: IntegridadeStatus;
  detalhes?: string[];
  baselineModificado?: boolean;
}

export enum IntegridadeStatus {
  Criado = 'baseline-criado',
  Aceito = 'baseline-aceito',
  Ok = 'ok',
  AlteracoesDetectadas = 'alteracoes-detectadas',
}

export interface GuardianErrorDetails {
  tipo: string;
  mensagem: string;
  arquivos?: string[];
  hash?: string;
  esperado?: string;
  encontrado?: string;
}

export class GuardianError extends Error {
  detalhes: GuardianErrorDetails | GuardianErrorDetails[];
  constructor(erros: GuardianErrorDetails | GuardianErrorDetails[]) {
    super('Integridade comprometida — execuções bloqueadas.');
    this.name = 'GuardianError';
    this.detalhes = erros;
  }
}

/**
 * Snapshot de arquivo individual (hash)
 */
export interface SnapshotArquivo {
  hash: string;
  linhas: number;
  amostra: string;
}

/**
 * Comparação entre dois snapshots
 */
export interface ComparacaoSnapshot {
  removidos: string[];
  adicionados: string[];
  alterados: string[];
}

/**
 * Resultado de verificação de integridade
 */
export interface ResultadoVerificacao {
  corrompidos: string[];
  verificados: number;
}
