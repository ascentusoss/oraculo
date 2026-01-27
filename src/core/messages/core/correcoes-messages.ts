// SPDX-License-Identifier: MIT
/**
 * Mensagens de Correções Automáticas
 *
 * Centraliza todas as mensagens relacionadas a:
 * - Quick Fixes (fix-any-to-proper-type, fix-unknown, etc)
 * - Zeladores (imports, estrutura, tipos)
 * - Auto-fix em geral
 */

import {
  buildTypesRelPathPosix,
  getTypesDirectoryDisplay,
} from '../../config/conventions.js';
import { ICONES } from '../ui/icons.js';

/**
 * Mensagens de Quick Fixes - Any/Unknown
 */
export const MENSAGENS_FIX_TYPES = {
  // Títulos e descrições de quick fixes
  fixAny: {
    title: 'Substituir any por tipos seguros',
    description: `Analisa uso de any e infere/cria tipos corretos em ${getTypesDirectoryDisplay()}`,
  },
  fixUnknown: {
    title: 'Substituir unknown por tipos específicos',
    description: 'Detecta padrões de type guards e cria tipos dedicados',
  },

  // Mensagens de validação
  validacao: {
    falha: (erros: string[]) => `Validação falhou: ${erros.join(', ')}`,
    revisar: 'Revise manualmente',
  },

  // Warnings e sugestões
  warnings: {
    confiancaBaixa: (confianca: number) =>
      `Tipo inseguro (any) com confiança muito baixa (${confianca}%) para correção automática`,
    confiancaMedia: (confianca: number, tipoSugerido: string) =>
      `Tipo inseguro detectado. Sugestão: ${tipoSugerido} (confiança: ${confianca}%)`,
    unknownApropriado:
      'unknown apropriado aqui (entrada genérica ou baixa confiança)',
    useTiposCentralizados: () =>
      `Use tipos centralizados em diretório dedicado (${getTypesDirectoryDisplay()})`,
    criarTipoDedicado: (caminho: string) =>
      `Considere criar tipo dedicado em ${buildTypesRelPathPosix(caminho)}`,
    adicioneTypeGuards: () =>
      `Se possível, adicione type guards ou crie tipo dedicado em ${getTypesDirectoryDisplay()}`,
  },

  // Mensagens de erro
  erros: {
    extrairNome: 'Não foi possível extrair nome da variável',
    variavelNaoUsada: 'Variável não utilizada - impossível inferir tipo',
    analise: (erro: string) => `Erro na análise: ${erro}`,
  },
} as const;

/**
 * Mensagens de Auto-Fix
 */
export const MENSAGENS_AUTOFIX = {
  // Mensagens de status
  iniciando: (modo: string) =>
    `${ICONES.acao.correcao} Iniciando auto-fix (modo: ${modo})`,
  dryRun: `${ICONES.feedback.info} Dry-run: simulando correções (nenhuma mudança será aplicada)`,
  aplicando: (count: number) =>
    `Aplicando ${count} correção${count !== 1 ? 'ões' : ''}...`,
  concluido: (aplicadas: number, falhas: number) =>
    `${ICONES.nivel.sucesso} Auto-fix concluído: ${aplicadas} aplicada${aplicadas !== 1 ? 's' : ''}, ${falhas} falha${falhas !== 1 ? 's' : ''}`,
  naoDisponivel: `${ICONES.feedback.info} Nenhuma correção automática disponível`,

  // Flags e modos
  flags: {
    fixSafe: `${ICONES.comando.guardian} Flag --fix-safe detectada: ativando modo conservador`,
    requireMutateFS: `${ICONES.status.falha} Auto-fix indisponível no momento.`,
  },

  // Logs de progresso
  logs: {
    modoConservador: `${ICONES.comando.guardian} Modo conservador ativado - aplicando apenas correções de alta confiança`,
    validacaoEslint: `${ICONES.acao.analise} Executando validação ESLint pós-auto-fix...`,
    arquivoMovido: (origem: string, destino: string) =>
      `${ICONES.status.ok} Movido: ${origem} → ${destino}`,
    arquivoRevertido: (origem: string, destino: string) =>
      `↩️ Arquivo revertido: ${destino} → ${origem}`,
    arquivoRevertidoConteudo: (origem: string, destino: string) =>
      `↩️ Arquivo revertido com conteúdo original: ${destino} → ${origem}`,
  },

  // Resultados
  resultados: {
    sucesso: (count: number) =>
      `${ICONES.status.ok} ${count} arquivo(s) corrigido(s)`,
    falhas: (count: number) =>
      `${ICONES.status.falha} ${count} arquivo(s) com erro`,
    erroArquivo: (arquivo: string, erro: string) =>
      `${ICONES.status.falha} ${arquivo}: ${erro}`,
  },

  // Dicas pós-correção
  dicas: {
    executarLint: `${ICONES.feedback.dica} Execute \`npm run lint\` para verificar as correções`,
    executarBuild: `${ICONES.feedback.dica} Execute \`npm run build\` para verificar se o código compila`,
    removerDryRun: `${ICONES.feedback.dica} Remova --dry-run para aplicar correções automaticamente`,
    ajustarConfianca: `${ICONES.feedback.dica} Use --confidence <num> para ajustar o limiar (atual: 85%)`,
  },
} as const;

/**
 * Mensagens de Relatórios de Análise
 */
export const MENSAGENS_RELATORIOS_ANALISE = {
  asyncPatterns: {
    titulo: `${ICONES.relatorio.resumo} Análise de Padrões Async/Await`,
    padroes: `\n${ICONES.relatorio.resumo} Padrões de Uso do Código:`,
    recomendacoes: `\n${ICONES.feedback.dica} Recomendações de Correção:\n`,
    critico: `${ICONES.nivel.erro} CRÍTICO (Revisar Imediatamente):`,
    alto: `\n${ICONES.feedback.atencao} ALTO (Revisar em Sprint Atual):`,
    salvo: (caminho: string) =>
      `${ICONES.nivel.sucesso} Relatório async salvo em: ${caminho}`,
  },

  fixTypes: {
    analiseSalva: `${ICONES.arquivo.json} Análise detalhada salva em: .oraculo/fix-types-analise.json`,
    possibilidades: `└─ ${ICONES.acao.analise} Possibilidades alternativas:`,
    sugestao: (texto: string) => `└─ ${ICONES.feedback.dica} ${texto}`,
    exportado: `${ICONES.arquivo.doc} Relatórios de fix-types exportados:`,
  },

  guardian: {
    baselineAceito: `${ICONES.status.ok} Guardian: baseline aceito manualmente (--aceitar).`,
    exportado: `${ICONES.arquivo.doc} Relatórios Guardian exportados:`,
  },
} as const;

/**
 * Mensagens de Arquetipos
 */
export const MENSAGENS_ARQUETIPOS_HANDLER = {
  timeout: `${ICONES.feedback.atencao} Detecção de arquetipos expirou (timeout)`,
  salvo: (caminho: string) =>
    `${ICONES.status.ok} Arquétipo personalizado salvo em ${caminho}`,
  falha: `${ICONES.feedback.atencao} Falha ao gerar plano via arquétipos.`,
  falhaEstrategista: `${ICONES.feedback.atencao} Estrategista falhou ao sugerir plano.`,
  falhaGeral: `${ICONES.feedback.atencao} Falha geral no planejamento.`,
} as const;

/**
 * Mensagens de Plugins
 */
export const MENSAGENS_PLUGINS = {
  registrado: (nome: string, extensoes: string[]) =>
    `${ICONES.status.ok} Plugin ${nome} registrado com extensões: ${extensoes.join(', ')}`,
  configAtualizada: `${ICONES.acao.correcao} Configuração do registry atualizada`,
  erroParsear: (linguagem: string, erro: string) =>
    `${ICONES.feedback.atencao} Erro ao parsear ${linguagem}: ${erro}`,
} as const;

/**
 * Mensagens de Executor
 */
export const MENSAGENS_EXECUTOR = {
  analiseCompleta: (tecnica: string, arquivo: string, duracao: string) =>
    `${ICONES.arquivo.arquivo} '${tecnica}' analisou ${arquivo} em ${duracao}`,
} as const;

/**
 * Export consolidado
 */
export const MENSAGENS_CORRECOES = {
  fixTypes: MENSAGENS_FIX_TYPES,
  autofix: MENSAGENS_AUTOFIX,
  relatorios: MENSAGENS_RELATORIOS_ANALISE,
  arquetipos: MENSAGENS_ARQUETIPOS_HANDLER,
  plugins: MENSAGENS_PLUGINS,
  executor: MENSAGENS_EXECUTOR,
} as const;

export default MENSAGENS_CORRECOES;
