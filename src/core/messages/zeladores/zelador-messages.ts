// SPDX-License-Identifier: MIT
// @oraculo-disable tipo-literal-inline-complexo
// Justificativa: tipos inline para mensagens de zeladores

import {
  ICONES_ACAO,
  ICONES_STATUS,
  ICONES_ZELADOR as ICONES_ZELADOR_CENTRAL,
} from '../ui/icons.js';
/**
 * Mensagens dos Zeladores
 *
 * Centraliza todas as mensagens relacionadas aos zeladores (auto-fix)
 * incluindo: imports, tipos, estrutura, etc.
 */

/**
 * Ícones e emojis usados pelos zeladores
 */
export const ICONES_ZELADOR = {
  ...ICONES_ZELADOR_CENTRAL,
} as const;

/**
 * Mensagens do Zelador de Imports
 */
export const MENSAGENS_IMPORTS = {
  titulo: `${ICONES_ACAO.correcao} Zelador de Imports - Iniciando correções...`,
  resumo: `${ICONES_ZELADOR.resumo} Resumo:`,
  dryRunAviso: `${ICONES_ZELADOR.dryRun} Modo dry-run: nenhum arquivo foi modificado`,
  sucessoFinal: `${ICONES_STATUS.ok} Correções aplicadas com sucesso!`,
} as const;

/**
 * Mensagens de progresso do zelador de imports
 */
export const PROGRESSO_IMPORTS = {
  diretorioNaoEncontrado: (dir: string) =>
    `${ICONES_ZELADOR.aviso} Diretório não encontrado: ${dir}`,
  arquivoProcessado: (arquivo: string, count: number) =>
    `${ICONES_ZELADOR.sucesso} ${arquivo} (${count} correção${count !== 1 ? 'ões' : ''})`,
  arquivoErro: (arquivo: string, erro: string) =>
    `${ICONES_ZELADOR.erro} ${arquivo}: ${erro}`,
  lendoDiretorio: (dir: string) => `Lendo diretório: ${dir}`,
} as const;

/**
 * Mensagens de erro do zelador de imports
 */
export const ERROS_IMPORTS = {
  lerDiretorio: (dir: string, error: unknown) => {
    const mensagem = error instanceof Error ? error.message : String(error);
    return `Erro ao ler diretório ${dir}: ${mensagem}`;
  },
  processar: (arquivo: string, error: unknown) => {
    const mensagem = error instanceof Error ? error.message : String(error);
    return `Erro ao processar ${arquivo}: ${mensagem}`;
  },
} as const;

/**
 * Formata linha de estatísticas de resumo
 */
export function formatarEstatistica(
  label: string,
  valor: number | string,
  icone?: string,
): string {
  const prefixo = icone ? `${icone} ` : '   ';
  return `${prefixo}${label}: ${valor}`;
}

/**
 * Gera resumo de correções de imports
 */
export function gerarResumoImports(stats: {
  processados: number;
  modificados: number;
  totalCorrecoes: number;
  erros: number;
  dryRun: boolean;
}): string[] {
  const linhas: string[] = [
    '',
    MENSAGENS_IMPORTS.resumo,
    formatarEstatistica('Arquivos processados', stats.processados),
    formatarEstatistica('Arquivos modificados', stats.modificados),
    formatarEstatistica('Total de correções', stats.totalCorrecoes),
  ];

  if (stats.erros > 0) {
    linhas.push(
      formatarEstatistica('Erros', stats.erros, ICONES_ZELADOR.aviso),
    );
  }

  linhas.push('');

  if (stats.dryRun) {
    linhas.push(MENSAGENS_IMPORTS.dryRunAviso);
  } else {
    linhas.push(MENSAGENS_IMPORTS.sucessoFinal);
  }

  return linhas;
}

/**
 * Mensagens do Zelador de Tipos (future)
 */
export const MENSAGENS_TIPOS = {
  titulo: `${ICONES_ACAO.correcao} Zelador de Tipos - Iniciando correções...`,
  analisandoTipo: (tipo: string) => `Analisando tipo: ${tipo}`,
  tipoCorrigido: (antes: string, depois: string) =>
    `Corrigido: ${antes} → ${depois}`,
} as const;

/**
 * Mensagens do Zelador de Estrutura (future)
 */
export const MENSAGENS_ESTRUTURA = {
  titulo: `${ICONES_ACAO.organizacao} Zelador de Estrutura - Reorganizando arquivos...`,
  movendo: (origem: string, destino: string) =>
    `Movendo: ${origem} → ${destino}`,
  criandoDiretorio: (dir: string) => `Criando diretório: ${dir}`,
} as const;

/**
 * Mensagens genéricas de zeladores
 */
export const MENSAGENS_ZELADOR_GERAL = {
  iniciando: (zelador: string) =>
    `${ICONES_ZELADOR.inicio} ${zelador} - Iniciando...`,
  concluido: (zelador: string) =>
    `${ICONES_ZELADOR.sucesso} ${zelador} - Concluído!`,
  erro: (zelador: string, mensagem: string) =>
    `${ICONES_ZELADOR.erro} ${zelador} - Erro: ${mensagem}`,
} as const;

/**
 * Templates de saída para diferentes modos
 */
export const TEMPLATES_SAIDA = {
  compacto: {
    inicio: (nome: string) => `${ICONES_ZELADOR.inicio} ${nome}`,
    progresso: (atual: number, total: number) => `[${atual}/${total}]`,
    fim: (sucesso: boolean) =>
      sucesso ? ICONES_ZELADOR.sucesso : ICONES_ZELADOR.erro,
  },
  detalhado: {
    inicio: (nome: string, descricao: string) =>
      `${ICONES_ZELADOR.inicio} ${nome}\n   ${descricao}`,
    progresso: (arquivo: string, atual: number, total: number) =>
      `   [${atual}/${total}] ${arquivo}`,
    fim: (stats: { sucesso: number; falha: number }) =>
      `\n${ICONES_ZELADOR.resumo} Sucesso: ${stats.sucesso}, Falha: ${stats.falha}`,
  },
} as const;

/**
 * Códigos de saída para zeladores
 */
export const EXIT_CODES = {
  SUCESSO: 0,
  ERRO_GERAL: 1,
  ERRO_ARQUIVO: 2,
  ERRO_PERMISSAO: 3,
  CANCELADO_USUARIO: 4,
} as const;

/**
 * Formata lista de arquivos modificados
 */
export function formatarListaArquivos(
  arquivos: string[],
  maxExibir: number = 10,
): string[] {
  const linhas: string[] = [];

  const mostrar = arquivos.slice(0, maxExibir);
  for (const arquivo of mostrar) {
    linhas.push(`   ${ICONES_ZELADOR.arquivo} ${arquivo}`);
  }

  const restantes = arquivos.length - maxExibir;
  if (restantes > 0) {
    linhas.push(
      `   ... e mais ${restantes} arquivo${restantes !== 1 ? 's' : ''}`,
    );
  }

  return linhas;
}

/**
 * Formata duração de execução
 */
export function formatarDuracao(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  return `${minutos}m ${segundos}s`;
}

/**
 * Formata mensagem com timestamp
 */
export function formatarComTimestamp(mensagem: string): string {
  const timestamp = new Date().toISOString().substring(11, 19); // HH:MM:SS
  return `[${timestamp}] ${mensagem}`;
}
