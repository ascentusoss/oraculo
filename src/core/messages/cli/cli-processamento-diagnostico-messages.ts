// SPDX-License-Identifier: MIT

import {
  ICONES_ACAO,
  ICONES_ARQUIVO,
  ICONES_FEEDBACK,
  ICONES_STATUS,
} from '../ui/icons.js';

export const CliProcessamentoDiagnosticoMessages = {
  linhaEmBranco: '',

  templateArquetipoPreview:
    'Template de arquétipo personalizado gerado (pré-visualização)',

  // Resumo executivo
  resumoExecutivoHeader: (total: number, criticos: number, altos: number) =>
    `Resumo Executivo: ${total} problemas (críticos: ${criticos}, altos: ${altos})`,
  resumoExecutivoCriticos: (criticos: number) => `Críticos: ${criticos}`,
  resumoExecutivoAltos: (altos: number) => `Altos: ${altos}`,
  resumoExecutivoTopArquivosErrosAltos: 'Top arquivos (erros/altos):',
  resumoExecutivoBulletTopArquivo: (arquivo: string, count: number) =>
    `  • ${arquivo} (${count})`,
  resumoExecutivoAcaoSugerida:
    'Ação sugerida: filtrar por arquivo com --include "<padrão>" ou usar --export para análise off-line',

  // Resumo básico (console)
  principaisTiposTitulo: '  Mensagens  Principais tipos:',
  principaisTiposLinha: (tipo: string, count: number) =>
    `     • ${tipo}: ${count}`,
  topArquivosTitulo: `  ${ICONES_ARQUIVO.diretorio} Top arquivos:`,
  topArquivosLinha: (arquivo: string, count: number) =>
    `     • ${arquivo} (${count})`,

  // Verbose detalhado
  porTipoTitulo: 'Por tipo:',
  porTipoLinha: (tipo: string, count: number) => `  • ${tipo}: ${count}`,
  porSeveridadeTitulo: 'Por severidade:',
  porSeveridadeLinha: (prefixo: string, nivel: string, count: number) =>
    `  ${prefixo} ${nivel}: ${count}`,

  arquivosMaisOcorrenciasTitulo: 'Arquivos com mais ocorrências',
  topArquivosPorOcorrenciasTitulo: 'Top arquivos por ocorrências:',

  topCriticosTitulo: 'Top críticos (10)',
  topCriticosTituloComDoisPontos: 'Top críticos (10):',
  topCriticosLinha: (
    nivelUpper: string,
    tipo: string,
    arquivo: string,
    pos: string,
  ) => `  • ${nivelUpper} | ${tipo} — ${arquivo}${pos}`,

  amostraOcorrenciasTitulo: 'Amostra de ocorrências:',
  amostraLinhaIndentada: (linha: string) => `  ${linha}`,
  amostraMaisLinhas: (shown: number, total: number) =>
    `  ... mostrando ${shown}/${total}. Use --export ou ajustar filtros para estudar todas.`,
  amostraBlocoTitulo: (count: number) => `Amostra (${count})`,

  analistaOcorrenciasLinha: (
    nome: string,
    ocorrencias: number,
    duracaoMsFixed: string,
  ) => `  • ${nome}: ${ocorrencias} ocorrências em ${duracaoMsFixed}ms`,

  diagnosticoConcluido: 'Diagnóstico concluído',
  tudoPronto: 'Tudo pronto',

  // Arquétipos
  arquetiposDetectados: (qtd: number) =>
    `Detectados ${qtd} candidatos a arquétipos`,
  arquetiposCompact: (nome: string, confidence: number) =>
    `Arquétipos: ${nome} (${confidence}%)`,
  arquetiposCandidatosEncontrados: (qtd: number) =>
    `Arquétipos candidatos encontrados: ${qtd}`,
  arquetiposCandidatosTitulo: 'Arquétipos candidatos:',
  arquetiposCandidatoLinha: (nome: string, confidence: number) =>
    `  ${nome} (${confidence}%)`,
  planoSugestaoMove: (qtd: number) => `planoSugestao: ${qtd} move`,
  planoSugestaoNenhumMove: 'planoSugestao: nenhum move sugerido',
  conflitos: (qtd: number) => `conflitos: ${qtd}`,

  anomaliasTitulo: 'Anomalias detectadas',
  anomaliasTituloComDoisPontos: 'Anomalias detectadas:',
  anomaliaLinha: (path: string, motivo: string) => `${path}: ${motivo}`,
  anomaliasMais: (qtdExtra: number) => `... e mais ${qtdExtra} anomalias`,
  anomaliasOcultasAviso: (qtdOcultas: number) =>
    `Há ${qtdOcultas} anomalias ocultas. Use --full para ver todas.`,

  driftAlterou: (anterior: string | undefined, atual: string | undefined) =>
    `drift: arquétipo alterou de ${anterior} para ${atual}`,
  driftMantido: (atual: string | undefined) =>
    `drift: arquétipo ${atual} mantido`,
  driftNovos: (novosStr: string) => `novos:[${novosStr}]`,
  driftRemovidos: (removidosStr: string) => `removidos:[${removidosStr}]`,

  // Estrutura/baseline
  baselineDesconhecidoAviso:
    'Baseline desconhecido - primeira execução ou baseline não encontrado',
  baselineArquetipoDesconhecido: 'Arquétipo baseline: desconhecido',
  baselineArquetipo: (arquetipo: string, confidence: number) =>
    `Arquétipo baseline: ${arquetipo} (${confidence}%)`,
  baselineCriadoEm: (ptBr: string) => `Baseline criado em: ${ptBr}`,

  driftDetectado: (anterior: string | undefined, atual: string | undefined) =>
    `Drift detectado: ${anterior} → ${atual}`,
  arquetipoMantido: (atual: string | undefined) =>
    `Arquétipo mantido: ${atual}`,
  novosArquivosRaiz: (joined: string) => `Novos arquivos na raiz: ${joined}`,
  arquivosRemovidosRaiz: (joined: string) =>
    `Arquivos removidos da raiz: ${joined}`,
  candidatoPrincipal: (nome: string, confidence: number) =>
    `Candidato principal: ${nome} (${confidence}%)`,

  resumoEstruturaTitulo: 'Resumo da estrutura',

  // JSON/Debug
  debugAboutToEmitJson: (optsJson: string) =>
    `About to emit JSON output; opts=${optsJson}`,

  todosPendentesEncontrados: (qtd: number) =>
    `${qtd} TODOs pendentes encontrados`,

  errorGeneratingJson: 'Error generating JSON:',
  fallbackJson: 'Fallback JSON:',

  // Blocos finais (resumo/export)
  resumoExecutivoTitulo: (prioritarios: number) =>
    `Resumo Executivo (${prioritarios} prioritários)`,
  cabecalhoExecProblema: 'Problema',
  cabecalhoExecQtd: 'Qtd',

  dicaUseFull: (total: number) =>
    `${ICONES_FEEDBACK.dica} Use --full para ver todos os ${total} problemas encontrados`,
  projetoBomEstado: (total: number) =>
    `${ICONES_STATUS.ok} Projeto em bom estado! Apenas ${total} problemas menores encontrados.`,
  quickFixesDisponiveis: (qtd: number) =>
    `${ICONES_ACAO.correcao} ${qtd} correções automáticas disponíveis`,

  resumoTiposTitulo: 'Resumo dos tipos de problemas',
  cabecalhoResumoTipo: 'Tipo',
  cabecalhoResumoQuantidade: 'Quantidade',

  relatorioFullFragmentado: (manifestFile: string | undefined) =>
    `Relatório full fragmentado. Manifest: ${manifestFile}`,

  relatorioScanSalvo: (dir: string) => `Relatório de scan salvo em ${dir}`,
  falhaExportarRelatorioScanOnly: (errMsg: string) =>
    `Falha ao exportar relatório de scan-only: ${errMsg}`,

  autoFixModoAgressivo:
    'Modo agressivo ativado - aplicando mais correções (use com cuidado)',

  falhaGerarRelatorioMarkdownMetadados: (errMsg: string) =>
    `Falha ao gerar relatório Markdown com metadados: ${errMsg}`,
  relatoriosExportadosPara: (dir: string) =>
    `Relatórios exportados para ${dir}`,
  falhaSalvarRelatorioJson: (errMsg: string) =>
    `Falha ao salvar relatório JSON: ${errMsg}`,
  falhaExportarRelatorios: (errMsg: string) =>
    `Falha ao exportar relatórios: ${errMsg}`,

  erroFatalDiagnostico: (errMsg: string) =>
    `Erro fatal durante o diagnóstico: ${errMsg}`,
} as const;
