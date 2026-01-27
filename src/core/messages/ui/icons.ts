// SPDX-License-Identifier: MIT
/**
 * Sistema Centralizado de Prefixos e Cores ANSI (sem emojis)
 *
 * Centraliza TODOS os prefixos textuais e cores usados no Oráculo para:
 * - Consistência visual em toda aplicação
 * - Fácil customização (pode trocar tudo aqui)
 * - Suporte robusto em CI/CD, terminais simples e Windows CMD
 * - Import dinâmico e tree-shaking
 */

// Códigos ANSI de cores
const CORES = {
  RESET: '\x1b[0m',
  VERDE: '\x1b[32m',
  AZUL: '\x1b[34m',
  AMARELO: '\x1b[33m',
  VERMELHO: '\x1b[31m',
  CINZA: '\x1b[37m',
} as const;

/**
 * Níveis de severidade - prefixos com cores ANSI
 */
export const ICONES_NIVEL = {
  sucesso: `${CORES.VERDE}SUCESSO${CORES.RESET}`,
  info: `${CORES.AZUL}INFO${CORES.RESET}`,
  aviso: `${CORES.AMARELO}AVISO${CORES.RESET}`,
  erro: `${CORES.VERMELHO}ERRO${CORES.RESET}`,
  critico: `${CORES.VERMELHO}ERRO${CORES.RESET}`,
  debug: `${CORES.CINZA}DEBUG${CORES.RESET}`,
} as const;

/**
 * Ícones de estado/status
 */
export const ICONES_STATUS = {
  ok: '[OK]',
  falha: '[FALHA]',
  pendente: '[...]',
  executando: '[>]',
  pausado: '[||]',
  pulado: '[>>]',
} as const;

/**
 * Ícones de ações/operações
 */
export const ICONES_ACAO = {
  analise: '[SCAN]',
  correcao: '[FIX]',
  limpeza: '[CLEAN]',
  organizacao: '[ORG]',
  validacao: '[CHECK]',
  compilacao: '[BUILD]',
  teste: '[TEST]',
  export: '[EXPORT]',
  import: '[IMPORT]',
  criar: '[+]',
  deletar: '[-]',
  mover: '[MOVE]',
  copiar: '[COPY]',
  renomear: '[RENAME]',
} as const;

/**
 * Ícones de arquivos/estrutura
 */
export const ICONES_ARQUIVO = {
  arquivo: '[FILE]',
  diretorio: '[DIR]',
  config: '[CFG]',
  codigo: '[CODE]',
  teste: '[TEST]',
  doc: '[DOC]',
  lock: '[LOCK]',
  package: '[PKG]',
  json: '[JSON]',
  typescript: '[TS]',
  javascript: '[JS]',
} as const;

/**
 * Ícones de feedback/dicas
 */
export const ICONES_FEEDBACK = {
  dica: '[DICA]',
  atencao: '[!]',
  importante: '[!]',
  info: '[i]',
  pergunta: '[?]',
  celebracao: '[!]',
  foguete: '[>]',
} as const;

/**
 * Ícones de diagnóstico
 */
export const ICONES_DIAGNOSTICO = {
  inicio: '[SCAN]',
  progresso: '[...]',
  arquetipos: '[ARQ]',
  guardian: '[GUARD]',
  autoFix: '[FIX]',
  executive: '[EXEC]',
  rapido: '[FAST]',
  completo: '[FULL]',
  stats: '[STATS]',
} as const;

/**
 * Ícones de tipos/qualidade
 */
export const ICONES_TIPOS = {
  any: `${CORES.VERMELHO}[ANY]${CORES.RESET}`,
  unknown: `${CORES.AMARELO}[?]${CORES.RESET}`,
  legitimo: `${CORES.VERDE}[OK]${CORES.RESET}`,
  melhoravel: `${CORES.AMARELO}[!]${CORES.RESET}`,
  corrigir: `${CORES.VERMELHO}[FIX]${CORES.RESET}`,
  seguro: '[OK]',
  inseguro: '[!]',
} as const;

/**
 * Ícones de comandos específicos
 */
export const ICONES_COMANDO = {
  diagnosticar: '[SCAN]',
  reestruturar: '[ORG]',
  podar: '[CLEAN]',
  fixTypes: '[FIX]',
  guardian: '[GUARD]',
  metricas: '[STATS]',
  reverter: '[UNDO]',
  atualizar: '[UPD]',
  perf: '[PERF]',
} as const;

/**
 * Ícones de relatórios
 */
export const ICONES_RELATORIO = {
  resumo: '[SUMMARY]',
  detalhado: '[DETAIL]',
  grafico: '[GRAPH]',
  tabela: '[TABLE]',
  lista: '[LIST]',
  warning: `${CORES.AMARELO}[!]${CORES.RESET}`,
  error: `${CORES.VERMELHO}[ERR]${CORES.RESET}`,
  success: `${CORES.VERDE}[OK]${CORES.RESET}`,
} as const;

/**
 * Ícones de zeladores
 */
export const ICONES_ZELADOR = {
  inicio: '[START]',
  sucesso: `${CORES.VERDE}[OK]${CORES.RESET}`,
  erro: `${CORES.VERMELHO}[ERR]${CORES.RESET}`,
  aviso: `${CORES.AMARELO}[!]${CORES.RESET}`,
  resumo: '[SUMMARY]',
  arquivo: '[FILE]',
  diretorio: '[DIR]',
  correcao: '[FIX]',
  dryRun: '[DRY]',
  estatistica: '[STATS]',
} as const;

/**
 * Tipo helper para acessar ícones de forma type-safe
 */
export type IconeNivel = keyof typeof ICONES_NIVEL;
export type IconeStatus = keyof typeof ICONES_STATUS;
export type IconeAcao = keyof typeof ICONES_ACAO;
export type IconeArquivo = keyof typeof ICONES_ARQUIVO;
export type IconeFeedback = keyof typeof ICONES_FEEDBACK;
export type IconeDiagnostico = keyof typeof ICONES_DIAGNOSTICO;
export type IconeTipo = keyof typeof ICONES_TIPOS;
export type IconeComando = keyof typeof ICONES_COMANDO;
export type IconeRelatorio = keyof typeof ICONES_RELATORIO;
export type IconeZelador = keyof typeof ICONES_ZELADOR;

/**
 * Função helper para obter prefixo/cor baseado na categoria
 */
export function getIcone(
  categoria: 'nivel' | 'status' | 'acao',
  nome: string,
): string {
  switch (categoria) {
    case 'nivel':
      return ICONES_NIVEL[nome as IconeNivel] || ICONES_NIVEL.info;
    case 'status':
      return ICONES_STATUS[nome as IconeStatus] || ICONES_STATUS.pendente;
    case 'acao':
      return ICONES_ACAO[nome as IconeAcao] || '[*]';
    default:
      return '[*]';
  }
}

/**
 * Detecta se ambiente suporta cores ANSI (agora sempre retorna true)
 */
export function suportaCores(): boolean {
  // A partir de agora, assumimos sempre cores ANSI disponíveis
  // ou o terminal remove as sequências automaticamente
  return true;
}

/**
 * Objeto consolidado para export fácil
 */
export const ICONES = {
  nivel: ICONES_NIVEL,
  status: ICONES_STATUS,
  acao: ICONES_ACAO,
  arquivo: ICONES_ARQUIVO,
  feedback: ICONES_FEEDBACK,
  diagnostico: ICONES_DIAGNOSTICO,
  tipos: ICONES_TIPOS,
  comando: ICONES_COMANDO,
  relatorio: ICONES_RELATORIO,
  zelador: ICONES_ZELADOR,
} as const;

/**
 * Export default para uso simplificado
 */
export default ICONES;
