// SPDX-License-Identifier: MIT
// @oraculo-disable tipo-literal-inline-complexo
// Justificativa: tipos inline para helpers de mensagens
/**
 * Mensagens do Comando Diagnosticar
 *
 * Centraliza todas as mensagens relacionadas ao diagnóstico de repositório
 */

import type { ModoOperacao } from '@';

/**
 * Ícones do diagnóstico
 */
export const ICONES_DIAGNOSTICO = {
  inicio: '[SCAN]',
  progresso: '[...]',
  arquivos: '[DIR]',
  analise: '[SCAN]',
  arquetipos: '[ARQ]',
  guardian: '[GUARD]',
  autoFix: '[FIX]',
  export: '[EXP]',
  sucesso: '[OK]',
  aviso: '[AVISO]',
  erro: '[ERRO]',
  info: '[i]',
  dica: '[DICA]',
  executive: '[STATS]',
  rapido: '[FAST]',
} as const;

/**
 * Mensagens de início por modo
 */
export const MENSAGENS_INICIO: Record<ModoOperacao, string> = {
  compact: `${ICONES_DIAGNOSTICO.inicio} Diagnóstico (modo compacto)`,
  full: `${ICONES_DIAGNOSTICO.inicio} Iniciando diagnóstico completo`,
  executive: `${ICONES_DIAGNOSTICO.executive} Análise executiva (apenas críticos)`,
  quick: `${ICONES_DIAGNOSTICO.rapido} Análise rápida`,
};

/**
 * Mensagens de progresso
 */
export const MENSAGENS_PROGRESSO = {
  varredura: (total: number) =>
    `${ICONES_DIAGNOSTICO.arquivos} Varrendo ${total} arquivo${total !== 1 ? 's' : ''}...`,
  analise: (atual: number, total: number) =>
    `${ICONES_DIAGNOSTICO.analise} Analisando: ${atual}/${total}`,
  arquetipos: `${ICONES_DIAGNOSTICO.arquetipos} Detectando estrutura do projeto...`,
  guardian: `${ICONES_DIAGNOSTICO.guardian} Verificando integridade...`,
  autoFix: (modo: string) =>
    `${ICONES_DIAGNOSTICO.autoFix} Aplicando correções (modo: ${modo})...`,
  export: (formato: string) =>
    `${ICONES_DIAGNOSTICO.export} Exportando relatório (${formato})...`,
} as const;

/**
 * Mensagens de conclusão
 */
export const MENSAGENS_CONCLUSAO = {
  sucesso: (ocorrencias: number) =>
    `${ICONES_DIAGNOSTICO.sucesso} Diagnóstico concluído: ${ocorrencias} ocorrência${ocorrencias !== 1 ? 's' : ''} encontrada${ocorrencias !== 1 ? 's' : ''}`,
  semProblemas: `${ICONES_DIAGNOSTICO.sucesso} Nenhum problema encontrado! Código está em ótimo estado.`,
  exportado: (caminho: string) =>
    `${ICONES_DIAGNOSTICO.export} Relatório salvo em: ${caminho}`,
} as const;

/**
 * Mensagens de erro
 */
export const MENSAGENS_ERRO = {
  falhaAnalise: (erro: string) =>
    `${ICONES_DIAGNOSTICO.erro} Falha na análise: ${erro}`,
  falhaExport: (erro: string) =>
    `${ICONES_DIAGNOSTICO.erro} Falha ao exportar: ${erro}`,
  falhaGuardian: (erro: string) =>
    `${ICONES_DIAGNOSTICO.erro} Guardian falhou: ${erro}`,
  falhaAutoFix: (erro: string) =>
    `${ICONES_DIAGNOSTICO.erro} Auto-fix falhou: ${erro}`,
  flagsInvalidas: (erros: string[]) =>
    `${ICONES_DIAGNOSTICO.erro} Flags inválidas:\n${erros.map((e) => `  • ${e}`).join('\n')}`,
} as const;

/**
 * Mensagens de aviso
 */
export const MENSAGENS_AVISO = {
  modoFast: `${ICONES_DIAGNOSTICO.info} Modo fast ativo (ORACULO_TEST_FAST=1)`,
  semMutateFS: `${ICONES_DIAGNOSTICO.aviso} Auto-fix desabilitado.`,
  guardianDesabilitado: `${ICONES_DIAGNOSTICO.info} Guardian não executado`,
  arquetiposTimeout: `${ICONES_DIAGNOSTICO.aviso} Detecção de arquetipos expirou (timeout)`,
} as const;

/**
 * Mensagens de filtros
 */
export const MENSAGENS_FILTROS = {
  titulo: 'Filtros Ativos',
  include: (patterns: string[]) =>
    `Include: ${patterns.length > 0 ? patterns.join(', ') : 'nenhum'}`,
  exclude: (patterns: string[]) =>
    `Exclude: ${patterns.length > 0 ? patterns.join(', ') : 'padrões default'}`,
  nodeModules: (incluido: boolean) =>
    `node_modules: ${incluido ? `${ICONES_DIAGNOSTICO.sucesso} incluído` : `${ICONES_DIAGNOSTICO.aviso} ignorado (padrão)`}`,
} as const;

/**
 * Mensagens de estatísticas
 */
export const MENSAGENS_STATS = {
  titulo: 'Estatísticas da Análise',
  arquivos: (total: number) => `Arquivos analisados: ${total}`,
  ocorrencias: (total: number) => `Ocorrências encontradas: ${total}`,
  porTipo: (tipo: string, count: number) => `  • ${tipo}: ${count}`,
  duracao: (ms: number) => {
    if (ms < 1000) return `Duração: ${ms}ms`;
    if (ms < 60000) return `Duração: ${(ms / 1000).toFixed(1)}s`;
    const min = Math.floor(ms / 60000);
    const seg = Math.floor((ms % 60000) / 1000);
    return `Duração: ${min}m ${seg}s`;
  },
} as const;

/**
 * Mensagens de Guardian
 */
export const MENSAGENS_GUARDIAN = {
  iniciando: `${ICONES_DIAGNOSTICO.guardian} Iniciando verificação Guardian...`,
  baseline: 'Usando baseline existente',
  fullScan: 'Full scan ativo (ignorando ignores)',
  saveBaseline: 'Salvando novo baseline...',
  status: {
    verde: `${ICONES_DIAGNOSTICO.sucesso} Guardian: Status VERDE (integridade OK)`,
    amarelo: `${ICONES_DIAGNOSTICO.aviso} Guardian: Status AMARELO (atenção necessária)`,
    vermelho: `${ICONES_DIAGNOSTICO.erro} Guardian: Status VERMELHO (problemas críticos)`,
  },
  drift: (count: number) =>
    `Drift detectado: ${count} mudança${count !== 1 ? 's' : ''} em relação ao baseline`,
} as const;

// MENSAGENS_AUTOFIX foi movido para correcoes-messages.ts para consolidação

/**
 * Mensagens de arquetipos
 */
export const MENSAGENS_ARQUETIPOS = {
  detectando: `${ICONES_DIAGNOSTICO.arquetipos} Detectando estrutura do projeto...`,
  identificado: (tipo: string, confianca: number) =>
    `Arquétipo identificado: ${tipo} (${confianca}% confiança)`,
  multiplos: (count: number) =>
    `${count} arquétipo${count !== 1 ? 's' : ''} candidato${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`,
  salvando: `Salvando arquétipo personalizado...`,
  salvo: (caminho: string) =>
    `${ICONES_DIAGNOSTICO.sucesso} Arquétipo salvo em: ${caminho}`,
} as const;

/**
 * Templates de bloco
 */
export const TEMPLATES_BLOCO = {
  sugestoes: {
    titulo: 'Sugestões Rápidas',
    formatarFlag: (flag: string, descricao: string) => `${flag}: ${descricao}`,
    formatarDica: (dica: string) => `${ICONES_DIAGNOSTICO.dica} ${dica}`,
  },
  resumo: {
    titulo: 'Resumo do Diagnóstico',
    secoes: {
      filtros: 'Filtros Aplicados',
      estatisticas: 'Estatísticas',
      arquetipos: 'Estrutura do Projeto',
      guardian: 'Integridade (Guardian)',
      autoFix: 'Correções Automáticas',
    },
  },
} as const;

/**
 * Formata bloco de sugestões de flags
 */
export function formatarBlocoSugestoes(
  flagsAtivas: string[],
  dicas: string[],
): string[] {
  const linhas: string[] = [];

  linhas.push(''); // linha vazia
  linhas.push(
    `┌── ${TEMPLATES_BLOCO.sugestoes.titulo} ─────────────────────────────────────────`,
  );

  if (flagsAtivas.length > 0) {
    linhas.push(`Flags ativas: ${flagsAtivas.join(' ')}`);
  } else {
    linhas.push('Nenhuma flag especial detectada');
  }

  if (dicas.length > 0) {
    linhas.push('');
    linhas.push('Informações úteis:');
    for (const dica of dicas) {
      linhas.push(`  ${dica}`);
    }
  }

  linhas.push(
    '└───────────────────────────────────────────────────────────────',
  );
  linhas.push(''); // linha vazia

  return linhas;
}

/**
 * Formata resumo de estatísticas
 */
export function formatarResumoStats(stats: {
  arquivos: number;
  ocorrencias: number;
  duracao: number;
  porTipo?: Record<string, number>;
}): string[] {
  const linhas: string[] = [];

  linhas.push(''); // linha vazia
  linhas.push(
    `┌── ${TEMPLATES_BLOCO.resumo.secoes.estatisticas} ─────────────────────────────────────────`,
  );
  linhas.push(`  ${MENSAGENS_STATS.arquivos(stats.arquivos)}`);
  linhas.push(`  ${MENSAGENS_STATS.ocorrencias(stats.ocorrencias)}`);

  if (stats.porTipo && Object.keys(stats.porTipo).length > 0) {
    linhas.push('');
    linhas.push('  Por tipo:');
    for (const [tipo, count] of Object.entries(stats.porTipo)) {
      linhas.push(`    ${MENSAGENS_STATS.porTipo(tipo, count)}`);
    }
  }

  linhas.push('');
  linhas.push(`  ${MENSAGENS_STATS.duracao(stats.duracao)}`);
  linhas.push(
    '└───────────────────────────────────────────────────────────────',
  );
  linhas.push(''); // linha vazia

  return linhas;
}

/**
 * Formata mensagem de modo JSON
 */
export function formatarModoJson(ascii: boolean): string {
  return `${ICONES_DIAGNOSTICO.info} Saída JSON estruturada${ascii ? ' (ASCII escape)' : ''} ativada`;
}

/**
 * Cabeçalhos e textos padrão para comandos
 */
export const CABECALHOS = {
  analistas: {
    tituloFast: `${ICONES_DIAGNOSTICO.info} Analistas registrados (FAST MODE)`,
    titulo: `${ICONES_DIAGNOSTICO.info} Analistas registrados`,
    mdTitulo: '# Analistas Registrados',
  },
  diagnostico: {
    flagsAtivas: 'Flags ativas:',
    informacoesUteis: 'Informações úteis:',
  },
  reestruturar: {
    prioridadeDomainsFlat: `${ICONES_DIAGNOSTICO.aviso} --domains e --flat informados. Priorizando --domains.`,
    planoVazioFast: `${ICONES_DIAGNOSTICO.info} Plano vazio: nenhuma movimentação sugerida. (FAST MODE)`,
    nenhumNecessarioFast: `${ICONES_DIAGNOSTICO.sucesso} Nenhuma correção estrutural necessária. (FAST MODE)`,
    conflitosDetectadosFast: (count: number) =>
      `${ICONES_DIAGNOSTICO.aviso} Conflitos detectados: ${count} (FAST MODE)`,
  },
} as const;
