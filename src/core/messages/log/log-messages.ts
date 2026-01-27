// SPDX-License-Identifier: MIT
/**
 * Sistema de mensagens de log centralizadas e contextuais
 * Adapta-se automaticamente ao tipo e complexidade do projeto
 */

import {
  ICONES_ACAO,
  ICONES_ARQUIVO,
  ICONES_COMANDO,
  ICONES_DIAGNOSTICO,
  ICONES_FEEDBACK,
  ICONES_NIVEL,
  ICONES_RELATORIO,
  ICONES_STATUS,
} from '../ui/icons.js';

export const LogMessages = {
  sistema: {
    inicializacao: {
      sucesso: `${ICONES_FEEDBACK.foguete} Oráculo inicializado em {tempo}ms`,
      falha: `${ICONES_STATUS.falha} Falha na inicialização: {erro}`,
      configuracao: `${ICONES_ARQUIVO.config} Configuração carregada: {fonte} ({campos} campos)`,
    },
    shutdown: `${ICONES_STATUS.ok} Análise concluída graciosamente`,
    atualizacao: {
      executando: `${ICONES_ACAO.import} Executando: {comando}`,
      sucesso: `${ICONES_STATUS.ok} Atualização concluída com sucesso!`,
      falha: `${ICONES_STATUS.falha} Atualização abortada ou falhou.`,
      detalhes: `${ICONES_FEEDBACK.atencao} {detalhe}`,
    },
    performance: {
      regressao_detectada: `${ICONES_FEEDBACK.atencao} Regressão acima de {limite}% detectada.`,
      sem_regressoes: `${ICONES_STATUS.ok} Sem regressões significativas.`,
    },
    poda: {
      cancelada: `${ICONES_STATUS.falha} Poda cancelada.`,
      concluida: `${ICONES_STATUS.ok} Poda concluída: Arquivos órfãos removidos com sucesso!`,
    },
    reversao: {
      nenhum_move: `${ICONES_STATUS.falha} Nenhum move encontrado para o arquivo: {arquivo}`,
      revertendo: `${ICONES_COMANDO.reverter} Revertendo moves para: {arquivo}`,
      sucesso: `${ICONES_STATUS.ok} Arquivo revertido com sucesso: {arquivo}`,
      falha: `${ICONES_STATUS.falha} Falha ao reverter arquivo: {arquivo}`,
    },
    auto: {
      mapa_reversao: {
        erro_carregar: `${ICONES_STATUS.falha} Erro ao carregar mapa de reversão: {erro}`,
        erro_salvar: `${ICONES_STATUS.falha} Erro ao salvar mapa de reversão: {erro}`,
        move_nao_encontrado: `${ICONES_STATUS.falha} Move não encontrado: {id}`,
        arquivo_destino_nao_encontrado: `${ICONES_STATUS.falha} Arquivo de destino não encontrado: {destino}`,
        arquivo_existe_origem: `${ICONES_FEEDBACK.atencao} Arquivo já existe na origem: {origem}`,
        erro_reverter: `${ICONES_STATUS.falha} Erro ao reverter move: {erro}`,
        nenhum_move: `${ICONES_FEEDBACK.atencao} Nenhum move encontrado para: {arquivo}`,
        revertendo_move: `${ICONES_COMANDO.reverter} Revertendo move: {id}`,
        move_revertido: `${ICONES_STATUS.ok} Move revertido com sucesso: {id}`,
        falha_reverter_move: `${ICONES_STATUS.falha} Falha ao reverter move: {id}`,
        carregado: `${ICONES_RELATORIO.lista} Mapa de reversão carregado: {moves} moves registrados`,
        nenhum_encontrado: `${ICONES_RELATORIO.lista} Nenhum mapa de reversão encontrado, iniciando novo`,
      },
      poda: {
        nenhum_arquivo: `${ICONES_STATUS.ok} Nenhum arquivo para podar neste ciclo.\n`,
        podando: `${ICONES_COMANDO.podar} Podando {quantidade} arquivos...`,
        podando_simulado: `${ICONES_COMANDO.podar} Podando {quantidade} arquivos... (SIMULADO)`,
        arquivo_movido: `${ICONES_STATUS.ok} {arquivo} movido para abandonados.`,
      },
      corretor: {
        erro_criar_diretorio: `${ICONES_STATUS.falha} Falha ao criar diretório para {destino}: {erro}`,
        destino_existe: `${ICONES_FEEDBACK.atencao} Destino já existe: {arquivo} → {destino}`,
        erro_mover: `${ICONES_STATUS.falha} Falha ao mover {arquivo} via rename: {erro}`,
      },
    },
    correcoes: {
      nenhuma_disponivel: `${ICONES_STATUS.ok} Nenhuma correção automática disponível`,
      aplicando: `${ICONES_ACAO.correcao} Aplicando correções automáticas em modo {modo}...`,
      arquivo_nao_encontrado: `${ICONES_FEEDBACK.atencao} Arquivo não encontrado para correção: {arquivo}`,
      aplicada: `${ICONES_STATUS.ok} {titulo} (confiança: {confianca}%)`,
      corrigido: `${ICONES_STATUS.ok} Corrigido: {arquivo}`,
      falha: `${ICONES_FEEDBACK.atencao} Falha ao aplicar quick fix {id}: {erro}`,
      nenhuma_aplicada: `${ICONES_FEEDBACK.atencao} Nenhuma correção pôde ser aplicada`,
      estatisticas: `${ICONES_STATUS.ok} {estatisticas}`,
      eslint_harmonia: `${ICONES_STATUS.ok} Validação ESLint concluída - harmonia mantida`,
      eslint_ajustes: `${ICONES_STATUS.ok} ESLint aplicou ajustes adicionais para harmonia total`,
      eslint_falha: `${ICONES_STATUS.falha} ESLint validation falhou: {erro}`,
    },
    processamento: {
      fix_detectada: `${ICONES_ACAO.correcao} Flag --fix detectada: ativando correções automáticas`,
      eslint_output: `${ICONES_RELATORIO.lista} ESLint output: {output}`,
      resumo_ocorrencias: `${ICONES_DIAGNOSTICO.stats} Resumo das {total} ocorrências:`,
      dicas_contextuais: `${ICONES_FEEDBACK.dica} Dicas contextuais:`,
      detalhamento_ocorrencias: `${ICONES_DIAGNOSTICO.stats} Detalhamento das {total} ocorrências:`,
      erros_criticos: `${ICONES_RELATORIO.error} {total} erros críticos encontrados - priorize estes primeiro`,
      avisos_encontrados: `${ICONES_RELATORIO.warning} {total} avisos encontrados`,
      quick_fixes_muitos: `${ICONES_ACAO.correcao} {total} correções automáticas disponíveis:`,
      quick_fixes_comando:
        '   → ORACULO_ALLOW_MUTATE_FS=1 npm run diagnosticar --fix',
      quick_fixes_executar: '   (comando pronto para executar)',
      todos_muitos: `${ICONES_RELATORIO.lista} {total} TODOs encontrados - considere --include para focar em área específica`,
      todos_poucos: `${ICONES_RELATORIO.lista} {total} TODOs encontrados - bom controle!`,
      muitas_ocorrencias: `${ICONES_FEEDBACK.atencao} Muitas ocorrências - use --executive para visão de alto nível`,
      filtrar_pasta: `${ICONES_ARQUIVO.diretorio} Ou filtre por pasta: --include "src/cli" ou --include "src/analistas"`,
      usar_full: `${ICONES_DIAGNOSTICO.completo} Use --full para detalhamento completo`,
      usar_json: `${ICONES_ARQUIVO.json} Use --json para saída estruturada (CI/scripts)`,
      projeto_limpo: `${ICONES_STATUS.ok} Projeto limpo! Use --guardian-check para verificação de integridade`,
      analistas_problemas: `${ICONES_DIAGNOSTICO.inicio} Analistas que encontraram problemas: {quantidade}`,
    },
  },

  scanner: {
    inicio: `${ICONES_DIAGNOSTICO.inicio} Iniciando varredura em: {diretorio}`,
    progresso: `${ICONES_ARQUIVO.diretorio} Escaneando: {diretorio} ({arquivos} arquivos)`,
    filtros: `${ICONES_DIAGNOSTICO.stats} Filtros aplicados: {include} includes, {exclude} excludes`,
    completo: `${ICONES_STATUS.ok} Varredura concluída: {arquivos} arquivos em {diretorios} diretórios`,
  },

  analistas: {
    execucao: {
      // Logs simples para projetos pequenos
      inicio_simples: `${ICONES_DIAGNOSTICO.inicio} Analisando {arquivo}`,
      sucesso_simples: `${ICONES_STATUS.ok} {arquivo}: {ocorrencias} issues`,

      // Logs detalhados para projetos complexos
      inicio_detalhado: `${ICONES_DIAGNOSTICO.inicio} Executando '{analista}' em {arquivo} ({tamanho}kb)`,
      sucesso_detalhado: `${ICONES_STATUS.ok} '{analista}' concluído: {ocorrencias} ocorrências ({tempo}ms)`,
      timeout: `${ICONES_FEEDBACK.atencao} Timeout do analista '{analista}' após {tempo}ms`,
      erro: `${ICONES_STATUS.falha} Erro no analista '{analista}': {erro}`,
      skip: `${ICONES_STATUS.pulado} Pulando '{arquivo}' (suprimido por configuração)`,
    },

    metricas: {
      performance: `${ICONES_DIAGNOSTICO.stats} Performance: {analistas} analistas, {media}ms/arquivo médio`,
      cache_hit: `${ICONES_DIAGNOSTICO.rapido} Cache hit: {hits}/{total} ({percentual}%)`,
      worker_pool: `${ICONES_STATUS.executando} Worker pool: {ativos}/{total} workers ativos`,
    },
  },

  filtros: {
    incluindo: ` ${ICONES_ACAO.criar} Incluindo: {pattern} ({matches} arquivos)`,
    excluindo: ` ${ICONES_ACAO.deletar} Excluindo: {pattern} ({matches} arquivos)`,
    supressao: `${ICONES_STATUS.pausado} Suprimidas {count} ocorrências: {motivo}`,
    cli_override: `${ICONES_DIAGNOSTICO.stats} CLI override: {tipo} patterns dominando configuração`,
  },

  projeto: {
    detectado: `${ICONES_RELATORIO.lista} Projeto detectado: {tipo} ({confianca}% confiança)`,
    estrutura: `${ICONES_DIAGNOSTICO.stats} Estrutura: {arquivos} arquivos, {linguagens} linguagens`,
    complexidade: `${ICONES_DIAGNOSTICO.stats} Complexidade: {nivel} (baseado em {metricas})`,
    recomendacao: `${ICONES_FEEDBACK.dica} Recomendação: {acao} para este tipo de projeto`,
  },

  contexto: {
    desenvolvedor_novo: `${ICONES_FEEDBACK.info} Projeto simples detectado - logs simplificados ativados`,
    equipe_experiente: `${ICONES_FEEDBACK.info} Projeto empresarial detectado - logs detalhados ativados`,
    ci_cd: `${ICONES_FEEDBACK.info} Ambiente CI/CD detectado - logs estruturados ativados`,
    debug_mode: `${ICONES_FEEDBACK.info} Modo debug ativo - logs verbosos ativados`,
  },

  ocorrencias: {
    critica: `${ICONES_NIVEL.critico} CRÍTICO: {mensagem} em {arquivo}:{linha}`,
    aviso: `${ICONES_NIVEL.aviso} Aviso: {mensagem} ({categoria})`,
    info: `${ICONES_NIVEL.info} Info: {mensagem}`,
    sugestao: `${ICONES_FEEDBACK.dica} Sugestão: {mensagem} - {acao_sugerida}`,
  },

  relatorio: {
    resumo: `${ICONES_DIAGNOSTICO.stats} Resumo: {total} issues ({criticos} críticos, {avisos} avisos)`,
    categorias: `${ICONES_RELATORIO.lista} Principais: {top_categorias}`,
    arquivo_problema: `${ICONES_FEEDBACK.atencao} Mais issues: {arquivo} ({count} ocorrências)`,
    tendencia: `${ICONES_DIAGNOSTICO.stats} Tendência: {direcao} comparado à baseline`,
    repositorio_impecavel: 'Repositório impecável',
    ocorrencias_encontradas: 'Encontradas {total} ocorrências',
    fim_padroes_uso: `\n${ICONES_STATUS.ok} Fim do relatório de padrões de uso.\n`,
    funcoes_longas: `${ICONES_FEEDBACK.atencao} Funções longas encontradas:`,
  },

  conselheiro: {
    volume_alto: `${ICONES_FEEDBACK.info} volume de tarefas alto? O código não foge; burnout sim.`,
    respira: `${ICONES_FEEDBACK.info} Ei, rapidinho: respira só por um instante.`,
    cuidado: `${ICONES_FEEDBACK.info} Se cuida: toma uma água, alonga, fecha os olhos 5 min. Continuamos depois.\n`,
    madrugada: `${ICONES_FEEDBACK.atencao} Já passa das {hora}. Código compila amanhã; você descansa agora.`,
  },

  guardian: {
    integridade_ok: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_STATUS.ok} Guardian: integridade preservada.`,
    baseline_criado: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.info} Guardian baseline criado.`,
    baseline_aceito: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.aviso} Guardian: novo baseline aceito — execute novamente.`,
    alteracoes_detectadas: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.erro} Guardian: alterações suspeitas detectadas! Considere executar 'oraculo guardian --diff'.`,
    bloqueado: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_STATUS.falha} Guardian bloqueou: alterações suspeitas ou erro fatal.`,
    modo_permissivo: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.aviso} Modo permissivo: prosseguindo sob risco.`,
    scan_only: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.info} Modo scan-only: {arquivos} arquivos mapeados.`,
    avisos_encontrados: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.aviso} Há ocorrências de nível aviso`,
    // Comando Guardian
    full_scan_aviso: `${ICONES_NIVEL.aviso} --full-scan ativo: baseline NÃO será persistido com escopo expandido.`,
    full_scan_warning_baseline: `${ICONES_NIVEL.aviso} --full-scan ativo, mas será criado baseline com escopo expandido temporariamente.`,
    aceitando_baseline: `\n${ICONES_COMANDO.atualizar} Aceitando novo baseline de integridade...\n`,
    baseline_aceito_sucesso: `${ICONES_STATUS.ok} Novo baseline de integridade aceito com sucesso!`,
    comparando_integridade: `\n${ICONES_DIAGNOSTICO.stats} Comparando integridade do Oráculo com o baseline...\n`,
    diferencas_detectadas: `${ICONES_RELATORIO.error} Diferenças detectadas:`,
    diferenca_item: '  - {diferenca}',
    comando_diff_recomendado:
      'Execute com --diff para mostrar diferenças detalhadas ou --accept para aceitar novo baseline.',
    integridade_preservada: `${ICONES_STATUS.ok} Nenhuma diferença detectada. Integridade preservada.`,
    verificando_integridade: `\n${ICONES_DIAGNOSTICO.guardian} Verificando integridade do Oráculo...\n`,
    baseline_criado_console: `${ICONES_DIAGNOSTICO.guardian} Guardian baseline criado`,
    baseline_atualizado: `${ICONES_DIAGNOSTICO.guardian} Baseline atualizado e aceito`,
    alteracoes_suspeitas: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_NIVEL.erro} Alterações suspeitas detectadas!`,
    erro_guardian: `${ICONES_DIAGNOSTICO.guardian} ${ICONES_STATUS.falha} Erro no Guardian: {erro}`,
  },

  metricas: {
    execucoes_registradas: `\n${ICONES_DIAGNOSTICO.stats} Execuções registradas: {quantidade}`,
    nenhum_historico:
      'Nenhum histórico de métricas encontrado ainda. Execute um diagnóstico com --metricas ativo.',
  },

  auto: {
    plugin_ignorado: `${ICONES_NIVEL.aviso} Plugin ignorado ({plugin}): {erro}`,
    caminho_nao_resolvido: `${ICONES_NIVEL.aviso} Caminho de plugin não resolvido: {plugin}`,
    plugin_falhou: `${ICONES_STATUS.falha} Plugin falhou: {plugin} — {erro}`,
    move_removido: `${ICONES_ACAO.deletar} Move removido do mapa: {id}`,
  },

  core: {
    parsing: {
      erro_babel: `${ICONES_NIVEL.aviso} Erro de parsing Babel em {arquivo}: {erro}`,
      erro_ts: `${ICONES_NIVEL.aviso} Erro TS compiler parse em {arquivo}: {erro}`,
      erro_xml: `${ICONES_NIVEL.aviso} Erro XML parse em {arquivo}: {erro}`,
      erro_html: `${ICONES_NIVEL.aviso} Erro HTML parse em {arquivo}: {erro}`,
      erro_css: `${ICONES_NIVEL.aviso} Erro CSS parse em {arquivo}: {erro}`,
      nenhum_parser: `${ICONES_NIVEL.aviso} Nenhum parser disponível para extensão: {extensao}`,
      timeout_parsing: `${ICONES_NIVEL.aviso} Parsing timeout após {timeout}ms para extensão {extensao}`,
      plugin_nao_encontrado: `${ICONES_NIVEL.aviso} Plugin não encontrado para {extensao}, usando sistema legado`,
      sistema_plugins_falhou: `${ICONES_STATUS.falha} Sistema de plugins falhou: {erro}, usando sistema legado`,
      plugins_registrados: `${ICONES_DIAGNOSTICO.inicio} Plugins padrão registrados no sistema`,
      usando_plugin: `${ICONES_DIAGNOSTICO.inicio} Usando plugin '{nome}' para {extensao}`,
    },
    plugins: {
      erro_carregar: `${ICONES_STATUS.falha} Erro ao carregar plugin {nome}: {erro}`,
      tentando_autoload: `${ICONES_DIAGNOSTICO.inicio} Tentando autoload para extensão {extensao}`,
      autoload_falhou: `${ICONES_STATUS.falha} Autoload falhou para {nome}`,
      extensao_nao_suportada: `${ICONES_NIVEL.aviso} Extensão {extensao} não suportada pelo core plugin`,
      registrando: `${ICONES_DIAGNOSTICO.inicio} Registrando plugin: {nome} v{versao}`,
    },
    executor: {
      reaproveitado_incremental: `${ICONES_DIAGNOSTICO.rapido} Reaproveitado {arquivo} (incremental)`,
    },
  },
} as const;

/**
 * Configuração de contexto adaptativo para diferentes tipos de projeto
 */
export const LogContextConfig = {
  // Projeto simples: poucos arquivos, um desenvolvedor
  simples: {
    nivel_detalhamento: 'basico',
    mostrar_performance: false,
    mostrar_cache: false,
    mostrar_workers: false,
    formato_arquivo: 'nome_apenas', // apenas nome do arquivo, não path completo
    agrupar_ocorrencias: true,
  },

  // Projeto médio: equipe pequena, múltiplas linguagens
  medio: {
    nivel_detalhamento: 'moderado',
    mostrar_performance: true,
    mostrar_cache: false,
    mostrar_workers: false,
    formato_arquivo: 'relativo', // path relativo
    agrupar_ocorrencias: true,
  },

  // Projeto complexo: grande equipe, CI/CD, múltiplos módulos
  complexo: {
    nivel_detalhamento: 'completo',
    mostrar_performance: true,
    mostrar_cache: true,
    mostrar_workers: true,
    formato_arquivo: 'completo', // path completo + metadados
    agrupar_ocorrencias: false,
  },

  // Ambiente CI/CD: logs estruturados, sem cores
  ci: {
    nivel_detalhamento: 'estruturado',
    mostrar_performance: true,
    mostrar_cache: true,
    mostrar_workers: true,
    formato_arquivo: 'relativo',
    agrupar_ocorrencias: false,
    formato_saida: 'json_lines',
  },
} as const;
