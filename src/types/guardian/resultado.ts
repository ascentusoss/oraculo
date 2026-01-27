// SPDX-License-Identifier: MIT
/**
 * Tipos para resultados do Guardian
 */

export interface GuardianBaseline {
  hash: string;
  timestamp: number;
  files: Record<string, string>;
}

export interface GuardianViolation {
  tipo: string;
  mensagem: string;
  arquivo?: string;
  esperado?: string;
  encontrado?: string;
}

export type GuardianResult =
  | {
      status: 'ok';
      baseline: GuardianBaseline;
      message?: string;
    }
  | {
      status: 'alteracoes-detectadas';
      baseline: GuardianBaseline;
      violations: GuardianViolation[];
      message: string;
    }
  | {
      status: 'erro';
      error: string;
      details?: unknown;
    }
  | null
  | undefined;

/**
 * Type guard para verificar se é resultado válido do Guardian
 */
export function isGuardianResult(value: unknown): value is GuardianResult {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (!('status' in obj)) {
    return false;
  }

  const status = obj.status;
  return (
    status === 'ok' || status === 'alteracoes-detectadas' || status === 'erro'
  );
}

/**
 * Converte ResultadoGuardian (tipo legado) para GuardianResult
 */
export function converterResultadoGuardian(
  resultado: import('./integridade.js').ResultadoGuardian | undefined,
): GuardianResult {
  if (!resultado) {
    return null;
  }

  // Se já for GuardianResult, retorna como está
  if (isGuardianResult(resultado)) {
    return resultado;
  }

  // Converter de ResultadoGuardian para GuardianResult
  const status = resultado.status;

  if (status === 'ok' || status === 'baseline-aceito') {
    return {
      status: 'ok',
      baseline: {
        hash: '',
        timestamp: Date.now(),
        files: {},
      },
      message: resultado.detalhes?.join('; '),
    };
  }

  if (status === 'alteracoes-detectadas') {
    return {
      status: 'alteracoes-detectadas',
      baseline: {
        hash: '',
        timestamp: Date.now(),
        files: {},
      },
      violations: (resultado.detalhes || []).map((msg) => ({
        tipo: 'alteracao',
        mensagem: msg,
      })),
      message: resultado.detalhes?.join('; ') || 'Alterações detectadas',
    };
  }

  // Outros casos
  return null;
}
