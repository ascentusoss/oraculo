// SPDX-License-Identifier: MIT
// @oraculo-disable tipo-literal-inline-complexo
// Justificativa: tipos inline para sistema de logs
/**
 * Sistema unificado de helpers de log
 * Consolidação de log-helpers.ts e log-helpers-inteligente.ts
 * Remove duplicação e centraliza lógica via log-engine
 */

import { config } from '@core/config/config.js';
import { logEngine } from '@core/messages/log/log-engine.js';
import { LogMessages } from '@core/messages/log/log-messages.js';
import {
  ICONES_ARQUIVO,
  ICONES_DIAGNOSTICO,
  ICONES_FEEDBACK,
  ICONES_STATUS,
} from '@core/messages/ui/icons.js';

/**
 * Sistema de logs para analistas com controle de spam unificado
 */
export const logAnalistas = {
  ultimoProgressoGlobal: 0,
  contadorArquivos: 0,
  totalArquivos: 0,
  ultimoEmitMs: 0,

  /** Inicializa batch de análise */
  iniciarBatch(totalArquivos: number): void {
    this.totalArquivos = totalArquivos;
    this.contadorArquivos = 0;
    this.ultimoProgressoGlobal = 0;
    this.ultimoEmitMs = 0;

    // Usa logEngine para formatação consistente apenas em modo complexo/verbose
    if (logEngine.contexto === 'complexo' || config.VERBOSE) {
      logEngine.log('info', LogMessages.analistas.execucao.inicio_detalhado, {
        totalArquivos: totalArquivos.toString(),
      });
    }
    // Em modo simples, não emite mensagem redundante (o progresso já mostra)
  },

  /** Log de inicio de analista (agora apenas registra) */
  iniciandoAnalista(
    nomeAnalista: string,
    arquivo: string,
    tamanho: number,
  ): void {
    // 🔕 ANTI-SPAM: Só loga analistas individuais em contextos específicos
    const deveLogarIndividual =
      logEngine.contexto === 'complexo' ||
      config.DEV_MODE ||
      process.env.VERBOSE === 'true';

    if (deveLogarIndividual) {
      logEngine.log('debug', LogMessages.analistas.execucao.inicio_detalhado, {
        analista: nomeAnalista,
        arquivo,
        tamanho: tamanho.toString(),
      });
    }
  },

  /** Incrementa contador quando arquivo é processado */
  arquivoProcessado(): void {
    this.contadorArquivos++;
    if (logEngine.contexto !== 'complexo' && !config.DEV_MODE) {
      this.logProgressoGrupado();
    }
  },

  /** Log de conclusão de analista */
  concluido(
    nomeAnalista: string,
    arquivo: string,
    ocorrencias: number,
    duracao: number,
  ): void {
    const deveLogarIndividual =
      logEngine.contexto === 'complexo' ||
      config.DEV_MODE ||
      process.env.VERBOSE === 'true';

    if (deveLogarIndividual) {
      logEngine.log('info', LogMessages.analistas.execucao.sucesso_detalhado, {
        analista: nomeAnalista,
        ocorrencias: ocorrencias.toString(),
        tempo: duracao.toFixed(2),
      });
    }
  },

  /** Log de progresso inteligente e agrupado */
  logProgressoGrupado(): void {
    const porcentagem = Math.round(
      (this.contadorArquivos / this.totalArquivos) * 100,
    );
    const agora = Date.now();

    // Densidade adaptativa: 5% para projetos pequenos, 10% para grandes
    const passo = this.totalArquivos < 200 ? 5 : 10;
    // Limite de frequência: no máximo 2 atualizações por segundo
    const minIntervalMs = 500;

    // Atualiza o progresso em intervalos adaptativos com anti-spam
    if (
      porcentagem - this.ultimoProgressoGlobal >= passo ||
      this.contadorArquivos === this.totalArquivos
    ) {
      if (
        agora - this.ultimoEmitMs >= minIntervalMs ||
        this.contadorArquivos === this.totalArquivos
      ) {
        logEngine.log(
          'info',
          `${ICONES_DIAGNOSTICO.progresso} Progresso: {arquivosProcessados}/{totalArquivos} ({percentual}%)`,
          {
            arquivosProcessados: this.contadorArquivos.toString(),
            totalArquivos: this.totalArquivos.toString(),
            percentual: porcentagem.toString(),
          },
        );
        this.ultimoProgressoGlobal = porcentagem;
        this.ultimoEmitMs = agora;
      }
    }
  },

  /** Finaliza batch de análise */
  finalizarBatch(totalOcorrencias: number, duracaoTotal: number): void {
    if (logEngine.contexto === 'simples') {
      logEngine.log(
        'info',
        `${ICONES_STATUS.ok} Análise concluída - {totalOcorrencias} problemas encontrados`,
        {
          totalOcorrencias: totalOcorrencias.toString(),
        },
      );
    } else {
      logEngine.log(
        'info',
        `${ICONES_STATUS.ok} Verificações concluídas - {totalOcorrencias} problemas detectados em {duracao}s`,
        {
          totalOcorrencias: totalOcorrencias.toString(),
          duracao: (duracaoTotal / 1000).toFixed(1),
        },
      );
    }
  },

  /** Timeout sempre é importante - usa logEngine */
  timeout(nomeAnalista: string, duracao: number): void {
    logEngine.log('aviso', LogMessages.analistas.execucao.timeout, {
      analista: nomeAnalista,
      tempo: duracao.toString(),
    });
  },

  /** Erros sempre são importantes - usa logEngine */
  erro(nomeAnalista: string, erro: string): void {
    logEngine.log('erro', LogMessages.analistas.execucao.erro, {
      analista: nomeAnalista,
      erro,
    });
  },

  /** Performance para projetos complexos */
  performance(dados: {
    analistas: number;
    media: number;
    total: number;
  }): void {
    if (logEngine.contexto === 'complexo' || config.DEV_MODE) {
      logEngine.log('info', LogMessages.analistas.metricas.performance, {
        analistas: dados.analistas.toString(),
        media: dados.media.toFixed(1),
      });
    }
  },
};

/**
 * Sistema de logs para scanner (agora via logEngine)
 */
export const logScanner = {
  iniciarVarredura(diretorio: string): void {
    if (logEngine.contexto !== 'simples') {
      logEngine.log('info', LogMessages.scanner.inicio, { diretorio });
    }
  },

  progresso(diretorio: string, arquivos: number): void {
    if (logEngine.contexto === 'complexo' || config.VERBOSE) {
      const nomeDiretorio = diretorio.split('/').pop() || diretorio;
      logEngine.log('info', LogMessages.scanner.progresso, {
        diretorio: nomeDiretorio,
        arquivos: arquivos.toString(),
      });
    }
  },

  filtros(includeCount: number, excludeCount: number): void {
    if (
      logEngine.contexto !== 'simples' &&
      (includeCount > 0 || excludeCount > 0)
    ) {
      logEngine.log('info', LogMessages.scanner.filtros, {
        include: includeCount.toString(),
        exclude: excludeCount.toString(),
      });
    }
  },

  completo(arquivos: number, diretorios: number): void {
    logEngine.log('info', LogMessages.scanner.completo, {
      arquivos: arquivos.toString(),
      diretorios: diretorios.toString(),
    });
  },
};

/**
 * Sistema de logs para o sistema principal (via logEngine)
 */
export const logSistema = {
  inicializacao(): void {
    if (logEngine.contexto !== 'simples') {
      logEngine.log('info', LogMessages.sistema.inicializacao.sucesso, {});
    }
  },

  shutdown(): void {
    if (logEngine.contexto !== 'simples') {
      logEngine.log('info', LogMessages.sistema.shutdown, {});
    }
  },

  erro(mensagem: string, detalhes?: string): void {
    const detalhesStr = detalhes ? ` - ${detalhes}` : '';
    logEngine.log(
      'erro',
      `${ICONES_STATUS.falha} Erro: ${mensagem}${detalhesStr}`,
      {},
    );
  },

  // Correções automáticas
  autoFixNenhumaCorrecao(): void {
    logEngine.log('info', LogMessages.sistema.correcoes.nenhuma_disponivel, {});
  },

  autoFixAplicando(modo: string): void {
    logEngine.log('info', LogMessages.sistema.correcoes.aplicando, { modo });
  },

  autoFixArquivoNaoEncontrado(arquivo: string): void {
    logEngine.log(
      'aviso',
      LogMessages.sistema.correcoes.arquivo_nao_encontrado,
      { arquivo },
    );
  },

  autoFixAplicada(titulo: string, confianca: number): void {
    if (config.VERBOSE) {
      logEngine.log('info', LogMessages.sistema.correcoes.aplicada, {
        titulo,
        confianca: confianca.toString(),
      });
    }
  },

  autoFixCorrigido(arquivo: string): void {
    if (config.VERBOSE) {
      logEngine.log('info', LogMessages.sistema.correcoes.corrigido, {
        arquivo,
      });
    }
  },

  autoFixFalha(id: string, erro: string): void {
    logEngine.log('aviso', LogMessages.sistema.correcoes.falha, { id, erro });
  },

  autoFixNenhumaAplicada(): void {
    logEngine.log('aviso', LogMessages.sistema.correcoes.nenhuma_aplicada, {});
  },

  autoFixEstatisticas(estatisticas: string[]): void {
    logEngine.log('info', LogMessages.sistema.correcoes.estatisticas, {
      estatisticas: estatisticas.join(', '),
    });
  },

  autoFixESLintHarmonia(): void {
    logEngine.log('info', LogMessages.sistema.correcoes.eslint_harmonia, {});
  },

  autoFixESLintAjustes(): void {
    logEngine.log('info', LogMessages.sistema.correcoes.eslint_ajustes, {});
  },

  autoFixESLintFalha(erro: string): void {
    logEngine.log('aviso', LogMessages.sistema.correcoes.eslint_falha, {
      erro,
    });
  },

  // Processamento de diagnóstico
  processamentoFixDetectada(): void {
    logEngine.log('info', LogMessages.sistema.processamento.fix_detectada, {});
  },

  processamentoESLintOutput(output: string): void {
    logEngine.log('info', LogMessages.sistema.processamento.eslint_output, {
      output,
    });
  },

  processamentoResumoOcorrencias(total: number): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.resumo_ocorrencias,
      {
        total: total.toString(),
      },
    );
  },

  processamentoDicasContextuais(): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.dicas_contextuais,
      {},
    );
  },

  processamentoDetalhamentoOcorrencias(total: number): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.detalhamento_ocorrencias,
      {
        total: total.toString(),
      },
    );
  },

  processamentoErrosCriticos(total: number): void {
    logEngine.log('info', LogMessages.sistema.processamento.erros_criticos, {
      total: total.toString(),
    });
  },

  processamentoAvisosEncontrados(total: number): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.avisos_encontrados,
      {
        total: total.toString(),
      },
    );
  },

  processamentoQuickFixesMuitos(total: number): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.quick_fixes_muitos,
      {
        total: total.toString(),
      },
    );
  },

  processamentoQuickFixesComando(): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.quick_fixes_comando,
      {},
    );
  },

  processamentoQuickFixesExecutar(): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.quick_fixes_executar,
      {},
    );
  },

  processamentoTodosMuitos(total: number): void {
    logEngine.log('info', LogMessages.sistema.processamento.todos_muitos, {
      total: total.toString(),
    });
  },

  processamentoTodosPoucos(total: number): void {
    logEngine.log('info', LogMessages.sistema.processamento.todos_poucos, {
      total: total.toString(),
    });
  },

  processamentoMuitasOcorrencias(): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.muitas_ocorrencias,
      {},
    );
  },

  processamentoFiltrarPasta(): void {
    logEngine.log('info', LogMessages.sistema.processamento.filtrar_pasta, {});
  },

  processamentoUsarFull(): void {
    logEngine.log('info', LogMessages.sistema.processamento.usar_full, {});
  },

  processamentoUsarJson(): void {
    logEngine.log('info', LogMessages.sistema.processamento.usar_json, {});
  },

  processamentoProjetoLimpo(): void {
    logEngine.log('info', LogMessages.sistema.processamento.projeto_limpo, {});
  },

  processamentoAnalistasProblemas(quantidade: number): void {
    logEngine.log(
      'info',
      LogMessages.sistema.processamento.analistas_problemas,
      {
        quantidade: quantidade.toString(),
      },
    );
  },

  // Atualização do sistema
  atualizacaoExecutando(comando: string): void {
    logEngine.log('info', LogMessages.sistema.atualizacao.executando, {
      comando,
    });
  },

  atualizacaoSucesso(): void {
    logEngine.log('info', LogMessages.sistema.atualizacao.sucesso, {});
  },

  atualizacaoFalha(): void {
    logEngine.log('erro', LogMessages.sistema.atualizacao.falha, {});
  },

  atualizacaoDetalhes(detalhe: string): void {
    logEngine.log('aviso', LogMessages.sistema.atualizacao.detalhes, {
      detalhe,
    });
  },

  // Performance
  performanceRegressaoDetectada(limite: number): void {
    logEngine.log(
      'aviso',
      LogMessages.sistema.performance.regressao_detectada,
      {
        limite: limite.toString(),
      },
    );
  },

  performanceSemRegressoes(): void {
    logEngine.log('info', LogMessages.sistema.performance.sem_regressoes, {});
  },

  // Poda
  podaCancelada(): void {
    logEngine.log('info', LogMessages.sistema.poda.cancelada, {});
  },

  podaConcluida(): void {
    logEngine.log('info', LogMessages.sistema.poda.concluida, {});
  },

  // Reversão
  reversaoNenhumMove(arquivo: string): void {
    logEngine.log('erro', LogMessages.sistema.reversao.nenhum_move, {
      arquivo,
    });
  },

  reversaoRevertendo(arquivo: string): void {
    logEngine.log('info', LogMessages.sistema.reversao.revertendo, { arquivo });
  },

  reversaoSucesso(arquivo: string): void {
    logEngine.log('info', LogMessages.sistema.reversao.sucesso, { arquivo });
  },

  reversaoFalha(arquivo: string): void {
    logEngine.log('erro', LogMessages.sistema.reversao.falha, { arquivo });
  },
};

/**
 * Sistema de logs para filtros (via logEngine)
 */
export const logFiltros = {
  incluindo(pattern: string, matches: number): void {
    if (config.VERBOSE || logEngine.contexto === 'complexo') {
      logEngine.log('info', LogMessages.filtros.incluindo, {
        pattern,
        matches: matches.toString(),
      });
    }
  },

  excluindo(pattern: string, matches: number): void {
    if (config.VERBOSE || logEngine.contexto === 'complexo') {
      logEngine.log('info', LogMessages.filtros.excluindo, {
        pattern,
        matches: matches.toString(),
      });
    }
  },

  supressao(count: number, motivo: string): void {
    if (count > 0) {
      logEngine.log('info', LogMessages.filtros.supressao, {
        count: count.toString(),
        motivo,
      });
    }
  },
};

/**
 * Sistema de logs para projeto (via logEngine)
 */
export const logProjeto = {
  detectado(tipo: string, confianca: number): void {
    logEngine.log('info', LogMessages.projeto.detectado, {
      tipo,
      confianca: confianca.toString(),
    });
  },

  estrutura(arquivos: number, linguagens: number): void {
    if (logEngine.contexto !== 'simples') {
      logEngine.log('info', LogMessages.projeto.estrutura, {
        arquivos: arquivos.toString(),
        linguagens: linguagens.toString(),
      });
    }
  },

  complexidade(nivel: string, metricas: string): void {
    if (logEngine.contexto === 'complexo') {
      logEngine.log('info', LogMessages.projeto.complexidade, {
        nivel,
        metricas,
      });
    }
  },

  recomendacao(acao: string): void {
    logEngine.log('info', LogMessages.projeto.recomendacao, { acao });
  },

  performance(dados: {
    analistas: number;
    duracao: number;
    throughput?: number;
  }): void {
    if (logEngine.contexto === 'complexo' || config.DEV_MODE) {
      const throughput = dados.throughput
        ? ` (${dados.throughput.toFixed(1)} arq/s)`
        : '';
      logEngine.log(
        'info',
        `${ICONES_DIAGNOSTICO.stats} Performance: {analistas} analistas em {duracao}s{throughput}`,
        {
          analistas: dados.analistas.toString(),
          duracao: (dados.duracao / 1000).toFixed(1),
          throughput,
        },
      );
    }
  },
};

/**
 * Sistema de logs para ocorrências (via logEngine)
 */
export const logOcorrencias = {
  critica(mensagem: string, arquivo: string, linha?: number): void {
    logEngine.log('erro', LogMessages.ocorrencias.critica, {
      mensagem,
      arquivo,
      linha: linha?.toString() || '',
    });
  },

  resumo(total: number, criticos: number, avisos: number): void {
    logEngine.log('info', LogMessages.relatorio.resumo, {
      total: total.toString(),
      criticos: criticos.toString(),
      avisos: avisos.toString(),
    });
  },
};

/**
 * Sistema de logs para relatórios (via logEngine)
 */
export const logRelatorio = {
  gerado(caminho: string, formato: string): void {
    logEngine.log(
      'info',
      `${ICONES_ARQUIVO.arquivo} Relatório ${formato} gerado: ${caminho}`,
      {},
    );
  },

  erro(erro: string): void {
    logEngine.log(
      'erro',
      `${ICONES_STATUS.falha} Erro ao gerar relatório: ${erro}`,
      {},
    );
  },

  repositorioImpecavel(): void {
    logEngine.log('info', LogMessages.relatorio.repositorio_impecavel, {});
  },

  ocorrenciasEncontradas(total: number): void {
    logEngine.log('aviso', LogMessages.relatorio.ocorrencias_encontradas, {
      total: total.toString(),
    });
  },

  fimPadroesUso(): void {
    logEngine.log('info', LogMessages.relatorio.fim_padroes_uso, {});
  },

  funcoesLongas(): void {
    logEngine.log('aviso', LogMessages.relatorio.funcoes_longas, {});
  },
};

/**
 * Sistema de logs para automação (via logEngine)
 */
export const logAuto = {
  // Mapa de reversão
  mapaReversaoErroCarregar(erro: string): void {
    logEngine.log(
      'erro',
      LogMessages.sistema.auto.mapa_reversao.erro_carregar,
      { erro },
    );
  },

  mapaReversaoErroSalvar(erro: string): void {
    logEngine.log('erro', LogMessages.sistema.auto.mapa_reversao.erro_salvar, {
      erro,
    });
  },

  mapaReversaoMoveNaoEncontrado(id: string): void {
    logEngine.log(
      'erro',
      LogMessages.sistema.auto.mapa_reversao.move_nao_encontrado,
      { id },
    );
  },

  mapaReversaoArquivoDestinoNaoEncontrado(destino: string): void {
    logEngine.log(
      'erro',
      LogMessages.sistema.auto.mapa_reversao.arquivo_destino_nao_encontrado,
      {
        destino,
      },
    );
  },

  mapaReversaoArquivoExisteOrigem(origem: string): void {
    logEngine.log(
      'aviso',
      LogMessages.sistema.auto.mapa_reversao.arquivo_existe_origem,
      {
        origem,
      },
    );
  },

  mapaReversaoErroReverter(erro: string): void {
    logEngine.log(
      'erro',
      LogMessages.sistema.auto.mapa_reversao.erro_reverter,
      { erro },
    );
  },

  mapaReversaoNenhumMove(arquivo: string): void {
    logEngine.log('aviso', LogMessages.sistema.auto.mapa_reversao.nenhum_move, {
      arquivo,
    });
  },

  mapaReversaoRevertendoMove(id: string): void {
    logEngine.log(
      'info',
      LogMessages.sistema.auto.mapa_reversao.revertendo_move,
      { id },
    );
  },

  mapaReversaoMoveRevertido(id: string): void {
    logEngine.log(
      'info',
      LogMessages.sistema.auto.mapa_reversao.move_revertido,
      { id },
    );
  },

  mapaReversaoFalhaReverterMove(id: string): void {
    logEngine.log(
      'erro',
      LogMessages.sistema.auto.mapa_reversao.falha_reverter_move,
      { id },
    );
  },

  mapaReversaoCarregado(moves: number): void {
    logEngine.log('info', LogMessages.sistema.auto.mapa_reversao.carregado, {
      moves: moves.toString(),
    });
  },

  mapaReversaoNenhumEncontrado(): void {
    logEngine.log(
      'info',
      LogMessages.sistema.auto.mapa_reversao.nenhum_encontrado,
      {},
    );
  },

  // Poda
  podaNenhumArquivo(): void {
    logEngine.log('info', LogMessages.sistema.auto.poda.nenhum_arquivo, {});
  },

  podaPodando(quantidade: number): void {
    logEngine.log('aviso', LogMessages.sistema.auto.poda.podando, {
      quantidade: quantidade.toString(),
    });
  },

  podaPodandoSimulado(quantidade: number): void {
    logEngine.log('aviso', LogMessages.sistema.auto.poda.podando_simulado, {
      quantidade: quantidade.toString(),
    });
  },

  podaArquivoMovido(arquivo: string): void {
    logEngine.log('info', LogMessages.sistema.auto.poda.arquivo_movido, {
      arquivo,
    });
  },

  // Corretor de estrutura
  corretorErroCriarDiretorio(destino: string, erro: string): void {
    logEngine.log(
      'erro',
      LogMessages.sistema.auto.corretor.erro_criar_diretorio,
      {
        destino,
        erro,
      },
    );
  },

  corretorDestinoExiste(arquivo: string, destino: string): void {
    logEngine.log('aviso', LogMessages.sistema.auto.corretor.destino_existe, {
      arquivo,
      destino,
    });
  },

  corretorErroMover(arquivo: string, erro: string): void {
    logEngine.log('erro', LogMessages.sistema.auto.corretor.erro_mover, {
      arquivo,
      erro,
    });
  },

  // Plugin específico
  pluginIgnorado(plugin: string, erro: string): void {
    logEngine.log('aviso', LogMessages.auto.plugin_ignorado, { plugin, erro });
  },

  caminhoNaoResolvido(plugin: string): void {
    logEngine.log('aviso', LogMessages.auto.caminho_nao_resolvido, { plugin });
  },

  pluginFalhou(plugin: string, erro: string): void {
    logEngine.log('aviso', LogMessages.auto.plugin_falhou, { plugin, erro });
  },

  moveRemovido(id: string): void {
    logEngine.log('info', LogMessages.auto.move_removido, { id });
  },
};

/**
 * Sistema de logs para Guardian (via logEngine)
 */
export const logGuardian = {
  integridadeOk(): void {
    logEngine.log('info', LogMessages.guardian.integridade_ok, {});
  },

  baselineCriado(): void {
    logEngine.log('info', LogMessages.guardian.baseline_criado, {});
  },

  baselineAceito(): void {
    logEngine.log('aviso', LogMessages.guardian.baseline_aceito, {});
  },

  alteracoesDetectadas(): void {
    logEngine.log('aviso', LogMessages.guardian.alteracoes_detectadas, {});
  },

  bloqueado(): void {
    logEngine.log('erro', LogMessages.guardian.bloqueado, {});
  },

  modoPermissivo(): void {
    logEngine.log('aviso', LogMessages.guardian.modo_permissivo, {});
  },

  scanOnly(arquivos: number): void {
    logEngine.log('info', LogMessages.guardian.scan_only, {
      arquivos: arquivos.toString(),
    });
  },

  avisosEncontrados(): void {
    logEngine.log('aviso', LogMessages.guardian.avisos_encontrados, {});
  },

  // Comando Guardian específico
  fullScanAviso(): void {
    logEngine.log('aviso', LogMessages.guardian.full_scan_aviso, {});
  },

  fullScanWarningBaseline(): void {
    logEngine.log('aviso', LogMessages.guardian.full_scan_warning_baseline, {});
  },

  aceitandoBaseline(): void {
    logEngine.log('info', LogMessages.guardian.aceitando_baseline, {});
  },

  baselineAceitoSucesso(): void {
    logEngine.log('info', LogMessages.guardian.baseline_aceito_sucesso, {});
  },

  comparandoIntegridade(): void {
    logEngine.log('info', LogMessages.guardian.comparando_integridade, {});
  },

  diferencasDetectadas(): void {
    logEngine.log('aviso', LogMessages.guardian.diferencas_detectadas, {});
  },

  diferencaItem(diferenca: string): void {
    logEngine.log('info', LogMessages.guardian.diferenca_item, { diferenca });
  },

  comandoDiffRecomendado(): void {
    logEngine.log('aviso', LogMessages.guardian.comando_diff_recomendado, {});
  },

  integridadePreservada(): void {
    logEngine.log('info', LogMessages.guardian.integridade_preservada, {});
  },

  verificandoIntegridade(): void {
    logEngine.log('info', LogMessages.guardian.verificando_integridade, {});
  },

  baselineCriadoConsole(): void {
    logEngine.log('info', LogMessages.guardian.baseline_criado_console, {});
  },

  baselineAtualizado(): void {
    logEngine.log('info', LogMessages.guardian.baseline_atualizado, {});
  },

  alteracoesSuspeitas(): void {
    logEngine.log('aviso', LogMessages.guardian.alteracoes_suspeitas, {});
  },

  erroGuardian(erro: string): void {
    logEngine.log('erro', LogMessages.guardian.erro_guardian, { erro });
  },

  // Método genérico para outras mensagens Guardian
  info(mensagem: string): void {
    logEngine.log('info', `${ICONES_FEEDBACK.info} ${mensagem}`, {});
  },

  aviso(mensagem: string): void {
    logEngine.log('aviso', `${ICONES_FEEDBACK.atencao} ${mensagem}`, {});
  },
};

/**
 * Conselheiro oracular para bem-estar do desenvolvedor
 */
export const logConselheiro = {
  volumeAlto(): void {
    logEngine.log('aviso', LogMessages.conselheiro.volume_alto, {});
  },

  respira(): void {
    logEngine.log('aviso', LogMessages.conselheiro.respira, {});
  },

  cuidado(): void {
    logEngine.log('aviso', LogMessages.conselheiro.cuidado, {});
  },

  madrugada(hora: string): void {
    logEngine.log('aviso', LogMessages.conselheiro.madrugada, { hora });
  },
};

/**
 * Sistema de logs para Métricas
 */
export const logMetricas = {
  execucoesRegistradas(quantidade: number): void {
    logEngine.log('info', LogMessages.metricas.execucoes_registradas, {
      quantidade: quantidade.toString(),
    });
  },

  nenhumHistorico(): void {
    logEngine.log('aviso', LogMessages.metricas.nenhum_historico, {});
  },
};

/**
 * Sistema de logs para Core (parsing, etc.)
 */
export const logCore = {
  erroBabel(erro: string, arquivo?: string): void {
    logEngine.log('debug', LogMessages.core.parsing.erro_babel, {
      erro,
      arquivo: arquivo || 'desconhecido',
    });
  },

  erroTs(erro: string, arquivo?: string): void {
    logEngine.log('debug', LogMessages.core.parsing.erro_ts, {
      erro,
      arquivo: arquivo || 'desconhecido',
    });
  },

  erroCss(erro: string, arquivo?: string): void {
    logEngine.log('debug', LogMessages.core.parsing.erro_css, {
      erro,
      arquivo: arquivo || 'desconhecido',
    });
  },

  erroXml(erro: string, arquivo?: string): void {
    logEngine.log('debug', LogMessages.core.parsing.erro_xml, {
      erro,
      arquivo: arquivo || 'desconhecido',
    });
  },

  erroHtml(erro: string, arquivo?: string): void {
    logEngine.log('debug', LogMessages.core.parsing.erro_html, {
      erro,
      arquivo: arquivo || 'desconhecido',
    });
  },

  nenhumParser(extensao: string): void {
    logEngine.log('debug', LogMessages.core.parsing.nenhum_parser, {
      extensao,
    });
  },

  timeoutParsing(timeout: number, extensao: string): void {
    logEngine.log('debug', LogMessages.core.parsing.timeout_parsing, {
      timeout: timeout.toString(),
      extensao,
    });
  },

  pluginNaoEncontrado(extensao: string): void {
    logEngine.log('debug', LogMessages.core.parsing.plugin_nao_encontrado, {
      extensao,
    });
  },

  sistemaPluginsFalhou(erro: string): void {
    logEngine.log('debug', LogMessages.core.parsing.sistema_plugins_falhou, {
      erro,
    });
  },

  // Plugins
  erroCarregarPlugin(nome: string, erro: string): void {
    logEngine.log('debug', LogMessages.core.plugins.erro_carregar, {
      nome,
      erro,
    });
  },

  tentandoAutoload(extensao: string): void {
    logEngine.log('debug', LogMessages.core.plugins.tentando_autoload, {
      extensao,
    });
  },

  autoloadFalhou(nome: string): void {
    logEngine.log('debug', LogMessages.core.plugins.autoload_falhou, { nome });
  },

  extensaoNaoSuportada(extensao: string): void {
    logEngine.log('debug', LogMessages.core.plugins.extensao_nao_suportada, {
      extensao,
    });
  },

  pluginsRegistrados(): void {
    logEngine.log('debug', LogMessages.core.parsing.plugins_registrados, {});
  },

  usandoPlugin(nome: string, extensao: string): void {
    logEngine.log('debug', LogMessages.core.parsing.usando_plugin, {
      nome,
      extensao,
    });
  },

  registrandoPlugin(nome: string, versao: string): void {
    logEngine.log('debug', LogMessages.core.plugins.registrando, {
      nome,
      versao,
    });
  },

  reaproveitadoIncremental(arquivo: string): void {
    logEngine.log('info', LogMessages.core.executor.reaproveitado_incremental, {
      arquivo,
    });
  },
};
