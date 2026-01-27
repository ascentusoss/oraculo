// SPDX-License-Identifier: MIT

/**
 * Sistema próprio de validação e tipos para dados externos
 * Substitui unknown/any com tipos TypeScript específicos + validação manual
 *
 * FILOSOFIA: Tolerância zero ao código frágil, sem compromissos com dependências externas
 */

/**
 * Tipo padronizado para errors em toda a aplicação
 * Use este tipo em catch blocks e error handling
 */
export type ErrorLike = Error | ErroComMensagem | { message: string };

/**
 * Helper para extrair mensagem de erro de forma segura
 */
export function extrairMensagemErro(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isErroComMensagem(error)) {
    if (typeof error.message === 'string') {
      return error.message;
    }
    if (error.message instanceof Error) {
      return error.message.message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: string | Error }).message;
    if (typeof msg === 'string') return msg;
  }
  return 'Erro desconhecido';
}

/**
 * Objetos de erro genéricos
 */
export interface ErroComMensagem {
  message: string | Error;
  name?: string;
  stack?: string;
  code?: string | number;
  cause?: Error;
}

/**
 * API DisplayNames do Intl
 */
export interface DisplayNamesAPI {
  of: (input: string) => string | undefined;
}

/**
 * Constructor de DisplayNames
 */
export interface DisplayNamesConstructor {
  new (locales: string[], options: { type: string }): DisplayNamesAPI;
}

/**
 * Intl com DisplayNames tipado
 */
export interface IntlComDisplayNames {
  DisplayNames?: DisplayNamesConstructor;
  DateTimeFormat?: typeof Intl.DateTimeFormat;
  NumberFormat?: typeof Intl.NumberFormat;
  Collator?: typeof Intl.Collator;
}

/**
 * Função de import dinâmico
 */
export type ImportDinamico = (path: string) => Promise<unknown>;

/**
 * Contexto global com import dinâmico
 */
export interface GlobalComImport {
  import?: ImportDinamico;
  require?: NodeRequire;
  process?: NodeJS.Process;
}

/**
 * Mock function do Vitest
 */
export type VitestMockFn<T = unknown> = {
  (...args: unknown[]): T;
  mockReturnValue: (value: T) => VitestMockFn<T>;
  mockResolvedValue: (value: T) => VitestMockFn<T>;
  mockImplementation: (fn: (...args: unknown[]) => T) => VitestMockFn<T>;
};

/**
 * Contexto global Vitest
 */
export interface GlobalComVitest {
  vi?: {
    fn?: <T = unknown>(
      implementation?: (...args: unknown[]) => T,
    ) => VitestMockFn<T>;
    mock?: (path: string, factory?: () => unknown) => void;
    spyOn?: <T extends object, K extends keyof T>(
      object: T,
      method: K,
    ) => VitestMockFn<T[K]>;
    clearAllMocks?: () => void;
    resetAllMocks?: () => void;
    restoreAllMocks?: () => void;
  };
  describe?: (name: string, fn: () => void) => void;
  it?: (name: string, fn: () => void | Promise<void>) => void;
  test?: (name: string, fn: () => void | Promise<void>) => void;
  expect?: unknown;
}

/**
 * Pendência processável (estende Pendencia base)
 */
export interface PendenciaProcessavel {
  arquivo: string;
  motivo: string;
  detectedAt: number;
  scheduleAt: number;
  diasInativo?: number;
  categoria?: 'critico' | 'importante' | 'baixa-prioridade' | 'informativo';
  prioridade?: 'alta' | 'media' | 'baixa';
  status?: 'pendente' | 'processando' | 'concluido' | 'erro' | 'cancelado';
  tentativas?: number;
  ultimoErro?: string;
}

/**
 * Configuração com plugins
 */
export interface ConfigPlugin {
  STRUCTURE_PLUGINS?: Array<{
    nome: string;
    habilitado?: boolean;
    config?: Record<string, unknown>;
  }>;
  pluginsPaths?: string[];
  autoload?: boolean;
}

/**
 * Item de movimentação de plano
 */
export interface PlanoMoverItem {
  de: string;
  para: string;
  motivo?: string;
}

/**
 * Plano de sugestão estrutural
 */
export interface PlanoSugestaoEstrutura {
  mover: PlanoMoverItem[];
  conflitos?: Array<{ alvo: string; motivo: string }>;
  resumo?: {
    total: number;
    zonaVerde: number;
    bloqueados: number;
  };
}

/**
 * Snapshot de análise (para mapa de reversão)
 */
export interface SnapshotAnalise {
  timestamp: string;
  arquivos: string[];
  metricas: {
    totalArquivos?: number;
    totalLinhas?: number;
    complexidade?: number;
    [key: string]: unknown;
  };
  configuracao: {
    versao?: string;
    ambiente?: string;
    [key: string]: unknown;
  };
}

/**
 * Entrada de mapa de reversão
 */
export interface EntradaMapaReversao {
  arquivo: string;
  operacao: 'adicionar' | 'remover' | 'modificar';
  timestamp: string;
  snapshot?: SnapshotAnalise;
  conteudoAnterior?: string;
  conteudoPosterior?: string;
  hash?: string;
}

/**
 * Contexto de relatório
 */
export interface ContextoRelatorio {
  total: number;
  processados: number;
  erros: number;
  tempo?: number;
  avisos?: number;
  sucessos?: number;
  fase?: string;
  detalhes?: string;
}

/**
 * Erro de validação de combinação de flags
 * Originalmente em: src/shared/validation/validacao.ts
 */
export interface ErroValidacaoCombinacao {
  codigo: string;
  mensagem: string;
}

/**
 * Função helper para validação segura com fallback (sem dependências externas)
 */
export function validarSeguro<T>(
  validador: (dados: unknown) => dados is T,
  dados: unknown,
  fallback: T,
  contexto?: string,
): T {
  if (validador(dados)) {
    return dados;
  }

  // Em modo DEV, logga o problema de validação
  if (process.env.NODE_ENV === 'development' || process.env.VITEST) {
    console.warn(
      `[Validação] Falhou${contexto ? ` em ${contexto}` : ''}, usando fallback`,
    );
  }

  return fallback;
}

/**
 * Type guards para verificação runtime - Nossa implementação própria
 */
export function isErroComMensagem(obj: unknown): obj is ErroComMensagem {
  return typeof obj === 'object' && obj !== null && 'message' in obj;
}

export function isGlobalComVitest(obj: unknown): obj is GlobalComVitest {
  return typeof obj === 'object' && obj !== null && 'vi' in obj;
}

export function isPendenciaProcessavel(
  obj: unknown,
): obj is PendenciaProcessavel {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'arquivo' in obj &&
    'motivo' in obj &&
    typeof (obj as PendenciaProcessavel).arquivo === 'string' &&
    typeof (obj as PendenciaProcessavel).motivo === 'string'
  );
}

export function isIntlComDisplayNames(
  obj: unknown,
): obj is IntlComDisplayNames {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('DisplayNames' in obj || Object.keys(obj).length >= 0)
  );
}

export function isGlobalComImport(obj: unknown): obj is GlobalComImport {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('import' in obj || Object.keys(obj).length >= 0)
  );
}

export function isConfigPlugin(obj: unknown): obj is ConfigPlugin {
  return typeof obj === 'object' && obj !== null;
}

export function isPlanoSugestaoEstrutura(
  obj: unknown,
): obj is PlanoSugestaoEstrutura {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'mover' in obj &&
    Array.isArray((obj as PlanoSugestaoEstrutura).mover)
  );
}

export function isSnapshotAnalise(obj: unknown): obj is SnapshotAnalise {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'timestamp' in obj &&
    'arquivos' in obj &&
    Array.isArray((obj as SnapshotAnalise).arquivos)
  );
}

export function isEntradaMapaReversao(
  obj: unknown,
): obj is EntradaMapaReversao {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'arquivo' in obj &&
    'operacao' in obj &&
    typeof (obj as EntradaMapaReversao).arquivo === 'string' &&
    ['adicionar', 'remover', 'modificar'].includes(
      (obj as EntradaMapaReversao).operacao,
    )
  );
}

/**
 * Helpers para conversão segura (nossa alternativa ao casting frágil)
 */
export function converterSeguro<T>(
  obj: unknown,
  validador: (dados: unknown) => dados is T,
  fallback: T,
): T {
  return validador(obj) ? obj : fallback;
}

/**
 * Helper para validação de string não vazia
 */
export function isStringNaoVazia(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

/**
 * Helper para validação de número válido
 */
export function isNumeroValido(valor: unknown): valor is number {
  return typeof valor === 'number' && !isNaN(valor) && isFinite(valor);
}

/**
 * Helper para validação de array não vazio
 */
export function isArrayNaoVazio<T>(valor: unknown): valor is T[] {
  return Array.isArray(valor) && valor.length > 0;
}
