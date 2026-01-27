export declare const LogMessages: {
    readonly sistema: {
        readonly inicializacao: {
            readonly sucesso: "[>] Oráculo inicializado em {tempo}ms";
            readonly falha: "[FALHA] Falha na inicialização: {erro}";
            readonly configuracao: "[CFG] Configuração carregada: {fonte} ({campos} campos)";
        };
        readonly shutdown: "[OK] Análise concluída graciosamente";
        readonly atualizacao: {
            readonly executando: "[IMPORT] Executando: {comando}";
            readonly sucesso: "[OK] Atualização concluída com sucesso!";
            readonly falha: "[FALHA] Atualização abortada ou falhou.";
            readonly detalhes: "[!] {detalhe}";
        };
        readonly performance: {
            readonly regressao_detectada: "[!] Regressão acima de {limite}% detectada.";
            readonly sem_regressoes: "[OK] Sem regressões significativas.";
        };
        readonly poda: {
            readonly cancelada: "[FALHA] Poda cancelada.";
            readonly concluida: "[OK] Poda concluída: Arquivos órfãos removidos com sucesso!";
        };
        readonly reversao: {
            readonly nenhum_move: "[FALHA] Nenhum move encontrado para o arquivo: {arquivo}";
            readonly revertendo: "[UNDO] Revertendo moves para: {arquivo}";
            readonly sucesso: "[OK] Arquivo revertido com sucesso: {arquivo}";
            readonly falha: "[FALHA] Falha ao reverter arquivo: {arquivo}";
        };
        readonly auto: {
            readonly mapa_reversao: {
                readonly erro_carregar: "[FALHA] Erro ao carregar mapa de reversão: {erro}";
                readonly erro_salvar: "[FALHA] Erro ao salvar mapa de reversão: {erro}";
                readonly move_nao_encontrado: "[FALHA] Move não encontrado: {id}";
                readonly arquivo_destino_nao_encontrado: "[FALHA] Arquivo de destino não encontrado: {destino}";
                readonly arquivo_existe_origem: "[!] Arquivo já existe na origem: {origem}";
                readonly erro_reverter: "[FALHA] Erro ao reverter move: {erro}";
                readonly nenhum_move: "[!] Nenhum move encontrado para: {arquivo}";
                readonly revertendo_move: "[UNDO] Revertendo move: {id}";
                readonly move_revertido: "[OK] Move revertido com sucesso: {id}";
                readonly falha_reverter_move: "[FALHA] Falha ao reverter move: {id}";
                readonly carregado: "[LIST] Mapa de reversão carregado: {moves} moves registrados";
                readonly nenhum_encontrado: "[LIST] Nenhum mapa de reversão encontrado, iniciando novo";
            };
            readonly poda: {
                readonly nenhum_arquivo: "[OK] Nenhum arquivo para podar neste ciclo.\n";
                readonly podando: "[CLEAN] Podando {quantidade} arquivos...";
                readonly podando_simulado: "[CLEAN] Podando {quantidade} arquivos... (SIMULADO)";
                readonly arquivo_movido: "[OK] {arquivo} movido para abandonados.";
            };
            readonly corretor: {
                readonly erro_criar_diretorio: "[FALHA] Falha ao criar diretório para {destino}: {erro}";
                readonly destino_existe: "[!] Destino já existe: {arquivo} → {destino}";
                readonly erro_mover: "[FALHA] Falha ao mover {arquivo} via rename: {erro}";
            };
        };
        readonly correcoes: {
            readonly nenhuma_disponivel: "[OK] Nenhuma correção automática disponível";
            readonly aplicando: "[FIX] Aplicando correções automáticas em modo {modo}...";
            readonly arquivo_nao_encontrado: "[!] Arquivo não encontrado para correção: {arquivo}";
            readonly aplicada: "[OK] {titulo} (confiança: {confianca}%)";
            readonly corrigido: "[OK] Corrigido: {arquivo}";
            readonly falha: "[!] Falha ao aplicar quick fix {id}: {erro}";
            readonly nenhuma_aplicada: "[!] Nenhuma correção pôde ser aplicada";
            readonly estatisticas: "[OK] {estatisticas}";
            readonly eslint_harmonia: "[OK] Validação ESLint concluída - harmonia mantida";
            readonly eslint_ajustes: "[OK] ESLint aplicou ajustes adicionais para harmonia total";
            readonly eslint_falha: "[FALHA] ESLint validation falhou: {erro}";
        };
        readonly processamento: {
            readonly fix_detectada: "[FIX] Flag --fix detectada: ativando correções automáticas";
            readonly eslint_output: "[LIST] ESLint output: {output}";
            readonly resumo_ocorrencias: "[STATS] Resumo das {total} ocorrências:";
            readonly dicas_contextuais: "[DICA] Dicas contextuais:";
            readonly detalhamento_ocorrencias: "[STATS] Detalhamento das {total} ocorrências:";
            readonly erros_criticos: "\u001B[31m[ERR]\u001B[0m {total} erros críticos encontrados - priorize estes primeiro";
            readonly avisos_encontrados: "\u001B[33m[!]\u001B[0m {total} avisos encontrados";
            readonly quick_fixes_muitos: "[FIX] {total} correções automáticas disponíveis:";
            readonly quick_fixes_comando: "   → ORACULO_ALLOW_MUTATE_FS=1 npm run diagnosticar --fix";
            readonly quick_fixes_executar: "   (comando pronto para executar)";
            readonly todos_muitos: "[LIST] {total} TODOs encontrados - considere --include para focar em área específica";
            readonly todos_poucos: "[LIST] {total} TODOs encontrados - bom controle!";
            readonly muitas_ocorrencias: "[!] Muitas ocorrências - use --executive para visão de alto nível";
            readonly filtrar_pasta: "[DIR] Ou filtre por pasta: --include \"src/cli\" ou --include \"src/analistas\"";
            readonly usar_full: "[FULL] Use --full para detalhamento completo";
            readonly usar_json: "[JSON] Use --json para saída estruturada (CI/scripts)";
            readonly projeto_limpo: "[OK] Projeto limpo! Use --guardian-check para verificação de integridade";
            readonly analistas_problemas: "[SCAN] Analistas que encontraram problemas: {quantidade}";
        };
    };
    readonly scanner: {
        readonly inicio: "[SCAN] Iniciando varredura em: {diretorio}";
        readonly progresso: "[DIR] Escaneando: {diretorio} ({arquivos} arquivos)";
        readonly filtros: "[STATS] Filtros aplicados: {include} includes, {exclude} excludes";
        readonly completo: "[OK] Varredura concluída: {arquivos} arquivos em {diretorios} diretórios";
    };
    readonly analistas: {
        readonly execucao: {
            readonly inicio_simples: "[SCAN] Analisando {arquivo}";
            readonly sucesso_simples: "[OK] {arquivo}: {ocorrencias} issues";
            readonly inicio_detalhado: "[SCAN] Executando '{analista}' em {arquivo} ({tamanho}kb)";
            readonly sucesso_detalhado: "[OK] '{analista}' concluído: {ocorrencias} ocorrências ({tempo}ms)";
            readonly timeout: "[!] Timeout do analista '{analista}' após {tempo}ms";
            readonly erro: "[FALHA] Erro no analista '{analista}': {erro}";
            readonly skip: "[>>] Pulando '{arquivo}' (suprimido por configuração)";
        };
        readonly metricas: {
            readonly performance: "[STATS] Performance: {analistas} analistas, {media}ms/arquivo médio";
            readonly cache_hit: "[FAST] Cache hit: {hits}/{total} ({percentual}%)";
            readonly worker_pool: "[>] Worker pool: {ativos}/{total} workers ativos";
        };
    };
    readonly filtros: {
        readonly incluindo: " [+] Incluindo: {pattern} ({matches} arquivos)";
        readonly excluindo: " [-] Excluindo: {pattern} ({matches} arquivos)";
        readonly supressao: "[||] Suprimidas {count} ocorrências: {motivo}";
        readonly cli_override: "[STATS] CLI override: {tipo} patterns dominando configuração";
    };
    readonly projeto: {
        readonly detectado: "[LIST] Projeto detectado: {tipo} ({confianca}% confiança)";
        readonly estrutura: "[STATS] Estrutura: {arquivos} arquivos, {linguagens} linguagens";
        readonly complexidade: "[STATS] Complexidade: {nivel} (baseado em {metricas})";
        readonly recomendacao: "[DICA] Recomendação: {acao} para este tipo de projeto";
    };
    readonly contexto: {
        readonly desenvolvedor_novo: "[i] Projeto simples detectado - logs simplificados ativados";
        readonly equipe_experiente: "[i] Projeto empresarial detectado - logs detalhados ativados";
        readonly ci_cd: "[i] Ambiente CI/CD detectado - logs estruturados ativados";
        readonly debug_mode: "[i] Modo debug ativo - logs verbosos ativados";
    };
    readonly ocorrencias: {
        readonly critica: "\u001B[31mERRO\u001B[0m CRÍTICO: {mensagem} em {arquivo}:{linha}";
        readonly aviso: "\u001B[33mAVISO\u001B[0m Aviso: {mensagem} ({categoria})";
        readonly info: "\u001B[34mINFO\u001B[0m Info: {mensagem}";
        readonly sugestao: "[DICA] Sugestão: {mensagem} - {acao_sugerida}";
    };
    readonly relatorio: {
        readonly resumo: "[STATS] Resumo: {total} issues ({criticos} críticos, {avisos} avisos)";
        readonly categorias: "[LIST] Principais: {top_categorias}";
        readonly arquivo_problema: "[!] Mais issues: {arquivo} ({count} ocorrências)";
        readonly tendencia: "[STATS] Tendência: {direcao} comparado à baseline";
        readonly repositorio_impecavel: "Repositório impecável";
        readonly ocorrencias_encontradas: "Encontradas {total} ocorrências";
        readonly fim_padroes_uso: "\n[OK] Fim do relatório de padrões de uso.\n";
        readonly funcoes_longas: "[!] Funções longas encontradas:";
    };
    readonly conselheiro: {
        readonly volume_alto: "[i] volume de tarefas alto? O código não foge; burnout sim.";
        readonly respira: "[i] Ei, rapidinho: respira só por um instante.";
        readonly cuidado: "[i] Se cuida: toma uma água, alonga, fecha os olhos 5 min. Continuamos depois.\n";
        readonly madrugada: "[!] Já passa das {hora}. Código compila amanhã; você descansa agora.";
    };
    readonly guardian: {
        readonly integridade_ok: "[GUARD] [OK] Guardian: integridade preservada.";
        readonly baseline_criado: "[GUARD] \u001B[34mINFO\u001B[0m Guardian baseline criado.";
        readonly baseline_aceito: "[GUARD] \u001B[33mAVISO\u001B[0m Guardian: novo baseline aceito — execute novamente.";
        readonly alteracoes_detectadas: "[GUARD] \u001B[31mERRO\u001B[0m Guardian: alterações suspeitas detectadas! Considere executar 'oraculo guardian --diff'.";
        readonly bloqueado: "[GUARD] [FALHA] Guardian bloqueou: alterações suspeitas ou erro fatal.";
        readonly modo_permissivo: "[GUARD] \u001B[33mAVISO\u001B[0m Modo permissivo: prosseguindo sob risco.";
        readonly scan_only: "[GUARD] \u001B[34mINFO\u001B[0m Modo scan-only: {arquivos} arquivos mapeados.";
        readonly avisos_encontrados: "[GUARD] \u001B[33mAVISO\u001B[0m Há ocorrências de nível aviso";
        readonly full_scan_aviso: "\u001B[33mAVISO\u001B[0m --full-scan ativo: baseline NÃO será persistido com escopo expandido.";
        readonly full_scan_warning_baseline: "\u001B[33mAVISO\u001B[0m --full-scan ativo, mas será criado baseline com escopo expandido temporariamente.";
        readonly aceitando_baseline: "\n[UPD] Aceitando novo baseline de integridade...\n";
        readonly baseline_aceito_sucesso: "[OK] Novo baseline de integridade aceito com sucesso!";
        readonly comparando_integridade: "\n[STATS] Comparando integridade do Oráculo com o baseline...\n";
        readonly diferencas_detectadas: "\u001B[31m[ERR]\u001B[0m Diferenças detectadas:";
        readonly diferenca_item: "  - {diferenca}";
        readonly comando_diff_recomendado: "Execute com --diff para mostrar diferenças detalhadas ou --accept para aceitar novo baseline.";
        readonly integridade_preservada: "[OK] Nenhuma diferença detectada. Integridade preservada.";
        readonly verificando_integridade: "\n[GUARD] Verificando integridade do Oráculo...\n";
        readonly baseline_criado_console: "[GUARD] Guardian baseline criado";
        readonly baseline_atualizado: "[GUARD] Baseline atualizado e aceito";
        readonly alteracoes_suspeitas: "[GUARD] \u001B[31mERRO\u001B[0m Alterações suspeitas detectadas!";
        readonly erro_guardian: "[GUARD] [FALHA] Erro no Guardian: {erro}";
    };
    readonly metricas: {
        readonly execucoes_registradas: "\n[STATS] Execuções registradas: {quantidade}";
        readonly nenhum_historico: "Nenhum histórico de métricas encontrado ainda. Execute um diagnóstico com --metricas ativo.";
    };
    readonly auto: {
        readonly plugin_ignorado: "\u001B[33mAVISO\u001B[0m Plugin ignorado ({plugin}): {erro}";
        readonly caminho_nao_resolvido: "\u001B[33mAVISO\u001B[0m Caminho de plugin não resolvido: {plugin}";
        readonly plugin_falhou: "[FALHA] Plugin falhou: {plugin} — {erro}";
        readonly move_removido: "[-] Move removido do mapa: {id}";
    };
    readonly core: {
        readonly parsing: {
            readonly erro_babel: "\u001B[33mAVISO\u001B[0m Erro de parsing Babel em {arquivo}: {erro}";
            readonly erro_ts: "\u001B[33mAVISO\u001B[0m Erro TS compiler parse em {arquivo}: {erro}";
            readonly erro_xml: "\u001B[33mAVISO\u001B[0m Erro XML parse em {arquivo}: {erro}";
            readonly erro_html: "\u001B[33mAVISO\u001B[0m Erro HTML parse em {arquivo}: {erro}";
            readonly erro_css: "\u001B[33mAVISO\u001B[0m Erro CSS parse em {arquivo}: {erro}";
            readonly nenhum_parser: "\u001B[33mAVISO\u001B[0m Nenhum parser disponível para extensão: {extensao}";
            readonly timeout_parsing: "\u001B[33mAVISO\u001B[0m Parsing timeout após {timeout}ms para extensão {extensao}";
            readonly plugin_nao_encontrado: "\u001B[33mAVISO\u001B[0m Plugin não encontrado para {extensao}, usando sistema legado";
            readonly sistema_plugins_falhou: "[FALHA] Sistema de plugins falhou: {erro}, usando sistema legado";
            readonly plugins_registrados: "[SCAN] Plugins padrão registrados no sistema";
            readonly usando_plugin: "[SCAN] Usando plugin '{nome}' para {extensao}";
        };
        readonly plugins: {
            readonly erro_carregar: "[FALHA] Erro ao carregar plugin {nome}: {erro}";
            readonly tentando_autoload: "[SCAN] Tentando autoload para extensão {extensao}";
            readonly autoload_falhou: "[FALHA] Autoload falhou para {nome}";
            readonly extensao_nao_suportada: "\u001B[33mAVISO\u001B[0m Extensão {extensao} não suportada pelo core plugin";
            readonly registrando: "[SCAN] Registrando plugin: {nome} v{versao}";
        };
        readonly executor: {
            readonly reaproveitado_incremental: "[FAST] Reaproveitado {arquivo} (incremental)";
        };
    };
};
export declare const LogContextConfig: {
    readonly simples: {
        readonly nivel_detalhamento: "basico";
        readonly mostrar_performance: false;
        readonly mostrar_cache: false;
        readonly mostrar_workers: false;
        readonly formato_arquivo: "nome_apenas";
        readonly agrupar_ocorrencias: true;
    };
    readonly medio: {
        readonly nivel_detalhamento: "moderado";
        readonly mostrar_performance: true;
        readonly mostrar_cache: false;
        readonly mostrar_workers: false;
        readonly formato_arquivo: "relativo";
        readonly agrupar_ocorrencias: true;
    };
    readonly complexo: {
        readonly nivel_detalhamento: "completo";
        readonly mostrar_performance: true;
        readonly mostrar_cache: true;
        readonly mostrar_workers: true;
        readonly formato_arquivo: "completo";
        readonly agrupar_ocorrencias: false;
    };
    readonly ci: {
        readonly nivel_detalhamento: "estruturado";
        readonly mostrar_performance: true;
        readonly mostrar_cache: true;
        readonly mostrar_workers: true;
        readonly formato_arquivo: "relativo";
        readonly agrupar_ocorrencias: false;
        readonly formato_saida: "json_lines";
    };
};
//# sourceMappingURL=log-messages.d.ts.map