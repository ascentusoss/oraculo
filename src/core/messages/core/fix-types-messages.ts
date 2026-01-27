// SPDX-License-Identifier: MIT
/**
 * Mensagens do Comando fix-types
 *
 * Centraliza todas as mensagens, textos e templates relacionados ao comando fix-types
 * que detecta e categoriza tipos inseguros (any/unknown) no código TypeScript.
 */

import {
  ICONES_ACAO,
  ICONES_ARQUIVO,
  ICONES_COMANDO,
  ICONES_DIAGNOSTICO,
  ICONES_FEEDBACK,
  ICONES_RELATORIO,
  ICONES_STATUS,
  ICONES_TIPOS,
} from '../ui/icons.js';

/**
 * Configuração de categorias de tipos inseguros
 */
export const CATEGORIAS_TIPOS = {
  LEGITIMO: {
    icone: ICONES_TIPOS.legitimo,
    nome: 'LEGÍTIMO',
    descricao: 'Uso correto de unknown - nenhuma ação necessária',
    confidenciaMin: 100,
  },
  MELHORAVEL: {
    icone: ICONES_TIPOS.melhoravel,
    nome: 'MELHORÁVEL',
    descricao: 'Pode ser mais específico - revisão manual recomendada',
    confidenciaMin: 70,
  },
  CORRIGIR: {
    icone: ICONES_TIPOS.corrigir,
    nome: 'CORRIGIR',
    descricao: 'Deve ser substituído - correção automática possível',
    confidenciaMin: 95,
  },
} as const;

/**
 * Mensagens de início/header do comando
 */
export const MENSAGENS_INICIO = {
  titulo: `${ICONES_COMANDO.fixTypes} Iniciando análise de tipos inseguros...`,
  analisando: (target: string) =>
    `${ICONES_ARQUIVO.diretorio} Analisando: ${target}`,
  confianciaMin: (min: number) =>
    `${ICONES_DIAGNOSTICO.stats} Confiança mínima: ${min}%`,
  modo: (dryRun: boolean) =>
    `${dryRun ? ICONES_ACAO.analise : ICONES_ACAO.correcao} Modo: ${
      dryRun ? 'Análise (dry-run)' : 'Aplicar correções'
    }`,
} as const;

/**
 * Mensagens de progresso/status
 */
export const MENSAGENS_PROGRESSO = {
  processandoArquivos: (count: number) =>
    `${ICONES_ARQUIVO.diretorio} Processando ${count} arquivos...`,
  arquivoAtual: (arquivo: string, count: number) =>
    `${ICONES_ARQUIVO.arquivo} ${arquivo}: ${count} ocorrência${count !== 1 ? 's' : ''}`,
} as const;

/**
 * Mensagens de resumo/estatísticas
 */
export const MENSAGENS_RESUMO = {
  encontrados: (count: number) => `Encontrados ${count} tipos inseguros:`,
  tituloCategorizacao: `${ICONES_DIAGNOSTICO.stats} Análise de Categorização:`,
  confianciaMedia: (media: number) =>
    `${ICONES_DIAGNOSTICO.stats} Confiança média: ${media}%`,
  porcentagem: (count: number, total: number) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `${count} caso${count !== 1 ? 's' : ''} (${pct}%)`;
  },
} as const;

/**
 * Mensagens de dicas/help
 */
export const DICAS = {
  removerDryRun: '[DICA] Para aplicar correções, remova a flag --dry-run',
  usarInterativo: '[DICA] Use --interactive para confirmar cada correção',
  ajustarConfianca: (atual: number) =>
    `${ICONES_FEEDBACK.dica} Use --confidence <num> para ajustar o limiar (atual: ${atual}%)`,
  revisar: (categoria: string) =>
    `${ICONES_FEEDBACK.dica} Revise os casos ${categoria} manualmente`,
} as const;

/**
 * Mensagens de ações sugeridas por categoria
 */
export const ACOES_SUGERIDAS = {
  LEGITIMO: [
    'Estes casos estão corretos e devem ser mantidos como estão',
    'Não requerem nenhuma ação adicional',
  ],
  MELHORAVEL: [
    'Considere substituir por tipos mais específicos quando possível',
    'Revisar durante refatorações futuras',
    'Adicionar comentários explicando o uso de unknown',
  ],
  CORRIGIR: [
    'Priorize a correção destes casos',
    'Substituir por tipos TypeScript específicos',
    'Usar type guards quando necessário',
  ],
} as const;

/**
 * Mensagens de erro/aviso
 */
export const MENSAGENS_ERRO = {
  correcaoNaoImplementada:
    'Correção automática completa ainda não implementada',
  sistemaDesenvolvimento: `${ICONES_FEEDBACK.foguete} Sistema de correção automática avançada em desenvolvimento`,
  requisitoAnalise:
    'Requer análise de AST e inferência de tipos para ser seguro',
  detectorNaoEncontrado:
    'Detector de tipos inseguros não encontrado no registro de analistas',
  modulosNaoEncontrados: 'Módulos de correção não encontrados',
} as const;

/**
 * Mensagens de sucesso
 */
export const MENSAGENS_SUCESSO = {
  nenhumTipoInseguro: `${ICONES_STATUS.ok} Nenhum tipo inseguro detectado! Código está com boa type safety.`,
  nenhumAltaConfianca: `${ICONES_STATUS.ok} Nenhuma correção de alta confiança encontrada`,
  nenhumaCorrecao:
    'Nenhuma correção aplicada (use --confidence para ajustar limiar)',
} as const;

/**
 * Mensagens específicas do fluxo CLI (linhas e headers) usadas em src/cli/**
 */
export const MENSAGENS_CLI_FIX_TYPES = {
  linhaEmBranco: '',

  erroExecutar: (mensagem: string) => `Erro ao executar fix-types: ${mensagem}`,

  linhaResumoTipo: (texto: string) => `  ${texto}`,

  exemplosDryRunTitulo: `${ICONES_RELATORIO.lista} Exemplos encontrados (dry-run):`,
  exemploLinha: (icone: string, relPath: string | undefined, linha: string) =>
    `  ${icone} ${relPath}:${linha}`,
  exemploMensagem: (mensagem: string) => `     └─ ${mensagem}`,
  debugVariavel: (nome: string) => `     └─ Variável: ${nome}`,
  maisOcorrencias: (qtd: number) => `  ... e mais ${qtd} ocorrências`,

  aplicandoCorrecoesAuto: `${ICONES_ACAO.correcao} Aplicando correções automáticas...`,
  exportandoRelatorios: `${ICONES_ACAO.export} Exportando relatórios...`,

  // Verbose / logs detalhados
  verboseAnyDetectado: (arquivo: string, linha: string) =>
    `  ${ICONES_TIPOS.any} ${arquivo}:${linha} - any detectado (correção recomendada)`,
  verboseAsAnyCritico: (arquivo: string, linha: string) =>
    `  ${ICONES_TIPOS.corrigir} ${arquivo}:${linha} - "as any" detectado (CRÍTICO - correção obrigatória)`,
  verboseAngleAnyCritico: (arquivo: string, linha: string) =>
    `  ${ICONES_TIPOS.corrigir} ${arquivo}:${linha} - "<any>" detectado (CRÍTICO - sintaxe legada)`,

  verboseUnknownCategoria: (
    icone: string,
    arquivo: string,
    linha: string,
    categoria: string,
    confianca: number,
  ) => `  ${icone} ${arquivo}:${linha} - ${categoria} (${confianca}%)`,
  verboseMotivo: (motivo: string) => `     └─ ${motivo}`,
  verboseSugestao: (sugestao: string) =>
    `     └─ ${ICONES_FEEDBACK.dica} ${sugestao}`,
  verboseVariantesTitulo: `     └─ ${ICONES_DIAGNOSTICO.stats} Possibilidades alternativas:`,
  verboseVarianteItem: (idxBase1: number, variante: string) =>
    `        ${idxBase1}. ${variante}`,

  analiseDetalhadaSalva: `${ICONES_ARQUIVO.arquivo} Análise detalhada salva em: .oraculo/fix-types-analise.json`,

  altaConfiancaTitulo: (qtd: number) =>
    `${ICONES_DIAGNOSTICO.stats} ${qtd} correções de alta confiança (≥85%):`,
  altaConfiancaLinha: (
    relPath: string | undefined,
    linha: string,
    confianca: number,
  ) => `  ${ICONES_TIPOS.corrigir} ${relPath}:${linha} (${confianca}%)`,
  altaConfiancaDetalhe: (texto: string) => `     └─ ${texto}`,
  altaConfiancaMais: (qtd: number) => `  ... e mais ${qtd} correções`,

  incertosTitulo: (qtd: number) =>
    `${ICONES_FEEDBACK.pergunta} ${qtd} casos com análise incerta (<70% confiança):`,
  incertosIntro:
    '   Estes casos requerem revisão manual cuidadosa - múltiplas possibilidades detectadas',
  incertosLinha: (
    relPath: string | undefined,
    linha: string,
    confianca: number,
  ) => `  ${ICONES_TIPOS.melhoravel} ${relPath}:${linha} (${confianca}%)`,
  incertosMais: (qtd: number) =>
    `  ... e mais ${qtd} casos incertos (veja .oraculo/fix-types-analise.json)`,

  correcoesResumoSucesso: (qtd: number) =>
    `${ICONES_STATUS.ok} ${qtd} arquivo(s) corrigido(s)`,
  correcoesResumoLinhaOk: (arquivo: string, linhas: number) =>
    `   Logging  ${arquivo}: ${linhas} linha(s) modificada(s)`,
  correcoesResumoLinhaErro: (arquivo: string, erro: string | undefined) =>
    `   ${ICONES_STATUS.falha} ${arquivo}: ${erro}`,
  correcoesResumoFalhas: (qtd: number) =>
    `${ICONES_STATUS.falha} ${qtd} arquivo(s) com erro`,

  dryRunAviso: (iconeInicio: string) =>
    `${iconeInicio} Modo dry-run ativo - nenhuma alteração será feita`,
  templatePasso: (passo: string) => `  ${passo}`,
} as const;

/**
 * Textos de categorização (motivos/sugestões) que aparecem em logs e exportações.
 */
export const TEXTOS_CATEGORIZACAO_FIX_TYPES = {
  anyMotivo: 'any é inseguro - substituir por tipo específico',
  anySugestao: 'Analisar uso da variável para inferir tipo correto',

  asAnyMotivo: 'Type assertion "as any" desabilita completamente type safety',
  asAnySugestao:
    'CRÍTICO: Substituir por tipo específico ou usar unknown com validação runtime',

  angleAnyMotivo: 'Type casting legado <any> desabilita type safety',
  angleAnySugestao:
    'CRÍTICO: Migrar para sintaxe "as" moderna e usar tipo específico',

  semContextoMotivo: 'Não foi possível analisar contexto',
  semContextoSugestao: 'Revisar manualmente',
} as const;

/**
 * Template do resumo final
 */
export const TEMPLATE_RESUMO_FINAL = {
  titulo: `${ICONES_RELATORIO.detalhado} Para aplicar correções manualmente:`,
  passos: [
    'Revise os casos categorizados acima',
    `LEGÍTIMOS (${ICONES_TIPOS.legitimo}): Manter como estão`,
    `MELHORÁVEIS (${ICONES_TIPOS.melhoravel}): Considere tipos mais específicos`,
    `CORRIGIR (${ICONES_TIPOS.corrigir}): Substitua por tipos específicos`,
    'Execute `npm run lint` após as correções',
  ],
} as const;

/**
 * Emojis e ícones usados no comando
 */
export const ICONES = {
  inicio: ICONES_COMANDO.fixTypes,
  aplicando: '[>]',
  analise: '[>]',
  pasta: '[DIR]',
  arquivo: '[FILE]',
  alvo: '[>]',
  edicao: '[EDIT]',
  grafico: '[GRAPH]',
  lampada: '[DICA]',
  foguete: '[>>]',
  nota: '[NOTE]',
  checkbox: '[OK]',
  setinha: '└─',
  ...CATEGORIAS_TIPOS,
} as const;

/**
 * Formata mensagem de tipo inseguro com ícone e contador
 */
export function formatarTipoInseguro(tipo: string, count: number): string {
  const icone = tipo.includes('any') ? ICONES_TIPOS.any : ICONES_TIPOS.unknown;
  const plural = count !== 1 ? 's' : '';
  return `${icone} ${tipo}: ${count} ocorrência${plural}`;
}

/**
 * Formata linha de ocorrência individual
 */
export function formatarOcorrencia(
  relPath: string,
  linha: number | undefined,
): string {
  return `  ${ICONES.setinha} ${relPath}:${linha || '?'}`;
}

/**
 * Formata mensagem com contexto
 */
export function formatarComContexto(
  mensagem: string,
  indentLevel: number = 1,
): string {
  const indent = '  '.repeat(indentLevel);
  return `${indent}${ICONES.setinha} ${mensagem}`;
}

/**
 * Formata sugestão de correção
 */
export function formatarSugestao(sugestao: string): string {
  return `     ${ICONES.setinha} ${ICONES.lampada} ${sugestao}`;
}

/**
 * Gera texto de resumo de categoria
 */
export function gerarResumoCategoria(
  categoria: keyof typeof CATEGORIAS_TIPOS,
  count: number,
  total: number,
): string[] {
  const config = CATEGORIAS_TIPOS[categoria];
  const porcentagem = MENSAGENS_RESUMO.porcentagem(count, total);

  return [
    categoria === 'CORRIGIR'
      ? `${config.icone} ${config.nome}: ${porcentagem}`
      : categoria === 'MELHORAVEL'
        ? `${config.icone} ${config.nome}: ${porcentagem}`
        : `${config.icone} ${config.nome}: ${porcentagem}`,
    `   ${ICONES.setinha} ${config.descricao}`,
  ];
}

/**
 * Mensagens de debug (só em DEV_MODE)
 */
export const DEBUG = {
  categorizacao: (arquivo: string, tipo: string, categoria: string) =>
    `[DEBUG] ${arquivo} - ${tipo} → ${categoria}`,
  confianca: (tipo: string, valor: number) =>
    `[DEBUG] Confiança para ${tipo}: ${valor}%`,
} as const;
