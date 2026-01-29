// SPDX-License-Identifier: MIT
/**
 * Comando fix-types - Corrige tipos inseguros (any/unknown)
 * Aplica correções automáticas baseadas em análise de uso e confiança
 */

import {
  type CasoTipoInseguro,
  exportarRelatoriosFixTypes,
} from '/handlers/fix-types-exporter.js';
import { ExitCode, sair } from '/helpers/exit-codes.js';
import {
  expandIncludePatterns,
  processPatternList,
} from '/helpers/pattern-helpers.js';
import { config } from '/config/config.js';
import {
  DICAS,
  formatarTipoInseguro,
  gerarResumoCategoria,
  ICONES_FIX_TYPES as ICONES,
  log,
  MENSAGENS_AUTOFIX,
  MENSAGENS_CLI_FIX_TYPES,
  MENSAGENS_ERRO_FIX_TYPES as MENSAGENS_ERRO,
  MENSAGENS_INICIO_FIX_TYPES as MENSAGENS_INICIO,
  MENSAGENS_PROGRESSO_FIX_TYPES as MENSAGENS_PROGRESSO,
  MENSAGENS_RESUMO,
  MENSAGENS_SUCESSO_FIX_TYPES as MENSAGENS_SUCESSO,
  TEMPLATE_RESUMO_FINAL,
  TEXTOS_CATEGORIZACAO_FIX_TYPES,
} from '/messages/index.js';
import { PROJECT_ROOT } from '/registry/paths.js';
import { Command } from 'commander';

import type { FixTypesOptions, Ocorrencia } from '@';
import { extrairMensagemErro } from '@';

export function criarComandoFixTypes(): Command {
  const cmd = new Command('fix-types');

  cmd
    .description('Detecta e corrige tipos inseguros (any/unknown) no código')
    .option(
      '--dry-run',
      'Mostra o que seria corrigido sem aplicar mudanças',
      false,
    )
    .option(
      '--target <path>',
      'Diretório ou arquivo específico para analisar',
      'src',
    )
    .option(
      '--confidence <number>',
      'Nível mínimo de confiança para aplicar correções (0-100)',
      '85',
    )
    .option('--verbose', 'Mostra detalhes de cada correção', false)
    .option('--interactive', 'Modo interativo: confirma cada correção', false)
    .option(
      '--export',
      'Exporta relatórios JSON e Markdown para pasta relatorios/',
      false,
    )
    .option(
      '--include <padrao>',
      'Glob pattern a INCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .option(
      '--exclude <padrao>',
      'Glob pattern a EXCLUIR adicionalmente (pode repetir a flag ou usar vírgulas / espaços)',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .action(async (options: FixTypesOptions) => {
      try {
        await executarFixTypes(options);
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : String(err);
        log.erro(MENSAGENS_CLI_FIX_TYPES.erroExecutar(mensagem));
        if (config.DEV_MODE) {
          console.error(extrairMensagemErro(err));
          if (err && typeof err === 'object' && 'stack' in err) {
            console.error((err as { stack?: string }).stack);
          }
        }
        sair(ExitCode.Failure);
        return;
      }
    });

  return cmd;
}

async function executarFixTypes(options: FixTypesOptions): Promise<void> {
  const isDryRun = options.dryRun || false;
  const minConfidence = Number(options.confidence) || 85;
  const target = options.target || 'src';
  const verbose = options.verbose || false;
  const _interactive = options.interactive || false;

  log.fase?.(MENSAGENS_INICIO.titulo);

  // Normaliza padrões de include/exclude para sincronizar filtros com o scanner
  const includeListRaw = processPatternList(options.include);
  const includeList = includeListRaw.length
    ? expandIncludePatterns(includeListRaw)
    : [];
  const excludeList = processPatternList(options.exclude);
  if (includeList.length) config.CLI_INCLUDE_PATTERNS = includeList;
  if (excludeList.length) config.CLI_EXCLUDE_PATTERNS = excludeList;

  // Importações dinâmicas para evitar dependências circulares
  const { iniciarInquisicao } = await import('/execution/inquisidor.js');
  const { registroAnalistas } = await import('/registry/registry.js');

  // Filtrar apenas o detector de tipos inseguros
  const analistaTiposInseguros = registroAnalistas.find(
    (a) => (a as { nome?: string }).nome === 'detector-tipos-inseguros',
  );

  if (!analistaTiposInseguros) {
    log.erro(MENSAGENS_ERRO.detectorNaoEncontrado);
    sair(ExitCode.Failure);
    return;
  }

  log.info(MENSAGENS_INICIO.analisando(target));
  log.info(MENSAGENS_INICIO.confianciaMin(minConfidence));
  log.info(MENSAGENS_INICIO.modo(isDryRun));

  // Executar análise com todos os analistas mas vamos filtrar depois
  let resultado;
  try {
    resultado = await iniciarInquisicao(process.cwd(), {
      includeContent: true,
      incluirMetadados: false,
      skipExec: false,
    });
  } catch (err) {
    log.erro(
      `Erro ao executar análise: ${err instanceof Error ? err.message : String(err)}`,
    );
    sair(ExitCode.Failure);
    return;
  }
  const ocorrencias = resultado.ocorrencias || [];
  const tiposInseguros = ocorrencias.filter(
    (o: Ocorrencia) =>
      o.tipo &&
      [
        'tipo-inseguro-any',
        'tipo-inseguro-any-assertion',
        'tipo-inseguro-any-cast',
        'tipo-inseguro-unknown',
      ].includes(o.tipo),
  );

  if (tiposInseguros.length === 0) {
    log.sucesso(MENSAGENS_SUCESSO.nenhumTipoInseguro);
    return;
  }

  log.aviso(MENSAGENS_RESUMO.encontrados(tiposInseguros.length));

  // Agrupar por tipo
  const porTipo = tiposInseguros.reduce(
    (acc: Record<string, Ocorrencia[]>, o: Ocorrencia) => {
      const tipo = o.tipo || 'desconhecido';
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(o);
      return acc;
    },
    {} as Record<string, Ocorrencia[]>,
  );

  // Mostrar resumo
  for (const [tipo, ocorrenciasTipo] of Object.entries(porTipo)) {
    const count = (ocorrenciasTipo as Ocorrencia[]).length;
    log.info(
      MENSAGENS_CLI_FIX_TYPES.linhaResumoTipo(
        formatarTipoInseguro(tipo, count),
      ),
    );
  }

  console.log();

  // Se for dry-run, mostrar exemplos e sair
  if (isDryRun) {
    log.fase?.(MENSAGENS_CLI_FIX_TYPES.exemplosDryRunTitulo);

    const exemplos = tiposInseguros.slice(0, 10);
    for (const o of exemplos) {
      const prefixo = o.tipo === 'tipo-inseguro-any' ? '[ERRO]' : '[AVISO]';
      log.info(
        MENSAGENS_CLI_FIX_TYPES.exemploLinha(
          prefixo,
          o.relPath,
          String(o.linha || '?'),
        ),
      );
      if (o.mensagem) {
        log.info(MENSAGENS_CLI_FIX_TYPES.exemploMensagem(o.mensagem));
      }
      // Contexto está em outras propriedades se disponível
      if (verbose && o.mensagem) {
        const match = o.mensagem.match(/variável '([^']+)'/);
        if (match) {
          log.debug(MENSAGENS_CLI_FIX_TYPES.debugVariavel(match[1]));
        }
      }
    }

    if (tiposInseguros.length > 10) {
      log.info(
        MENSAGENS_CLI_FIX_TYPES.maisOcorrencias(tiposInseguros.length - 10),
      );
    }

    console.log();
    log.info(DICAS.removerDryRun);
    log.info(DICAS.usarInterativo);
    log.info(DICAS.ajustarConfianca(minConfidence));
    return;
  }

  // Aplicar correções
  log.fase?.(MENSAGENS_CLI_FIX_TYPES.aplicandoCorrecoesAuto);

  // Importar quick fixes (exportações nomeadas)
  const { fixAnyToProperType } =
    await import('/corrections/quick-fixes/fix-any-to-proper-type.js');
  const { fixUnknownToSpecificType } =
    await import('/corrections/quick-fixes/fix-unknown-to-specific-type.js');

  if (!fixAnyToProperType || !fixUnknownToSpecificType) {
    log.erro(MENSAGENS_ERRO.modulosNaoEncontrados);
    sair(ExitCode.Failure);
    return;
  }
  const _corrigidas = 0;
  let _erros = 0;
  const _arquivosModificados = new Set<string>(); // Agrupar por arquivo para processar de forma eficiente
  const porArquivo = tiposInseguros.reduce(
    (acc: Record<string, Ocorrencia[]>, o: Ocorrencia) => {
      const arquivo = o.relPath || 'desconhecido';
      if (!acc[arquivo]) acc[arquivo] = [];
      acc[arquivo].push(o);
      return acc;
    },
    {} as Record<string, Ocorrencia[]>,
  );

  log.info(
    MENSAGENS_PROGRESSO.processandoArquivos(Object.keys(porArquivo).length),
  );
  log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

  // Importar categorizador
  const { categorizarUnknown, extractLineContext } =
    await import('/corrections/type-safety/context-analyzer.js');

  // Estatísticas de categorização
  const stats = {
    legitimo: 0,
    melhoravel: 0,
    corrigir: 0,
    totalConfianca: 0,
  };

  // Categorizar cada ocorrência
  const ocorrenciasCategorizadas: Array<{
    ocorrencia: Ocorrencia;
    categoria: 'legitimo' | 'melhoravel' | 'corrigir';
    confianca: number;
    motivo: string;
    sugestao?: string;
    variantes?: string[];
  }> = [];

  for (const [arquivo, ocorrenciasArquivo] of Object.entries(porArquivo)) {
    if (verbose) {
      log.info(
        MENSAGENS_PROGRESSO.arquivoAtual(
          arquivo,
          (ocorrenciasArquivo as Ocorrencia[]).length,
        ),
      );
    }

    for (const ocorrencia of ocorrenciasArquivo as Ocorrencia[]) {
      const tipo = ocorrencia.tipo;

      // any declaration sempre é corrigir
      if (tipo === 'tipo-inseguro-any') {
        ocorrenciasCategorizadas.push({
          ocorrencia,
          categoria: 'corrigir',
          confianca: 95,
          motivo: TEXTOS_CATEGORIZACAO_FIX_TYPES.anyMotivo,
          sugestao: TEXTOS_CATEGORIZACAO_FIX_TYPES.anySugestao,
        });
        stats.corrigir++;
        stats.totalConfianca += 95;
        if (verbose) {
          log.aviso(
            MENSAGENS_CLI_FIX_TYPES.verboseAnyDetectado(
              arquivo,
              String(ocorrencia.linha || '?'),
            ),
          );
        }
        _erros++;
        continue;
      }

      // Type assertions (as any) são CRÍTICOS - confiança 100%
      if (tipo === 'tipo-inseguro-any-assertion') {
        ocorrenciasCategorizadas.push({
          ocorrencia,
          categoria: 'corrigir',
          confianca: 100,
          motivo: TEXTOS_CATEGORIZACAO_FIX_TYPES.asAnyMotivo,
          sugestao: TEXTOS_CATEGORIZACAO_FIX_TYPES.asAnySugestao,
        });
        stats.corrigir++;
        stats.totalConfianca += 100;
        if (verbose) {
          log.erro(
            MENSAGENS_CLI_FIX_TYPES.verboseAsAnyCritico(
              arquivo,
              String(ocorrencia.linha || '?'),
            ),
          );
        }
        _erros++;
        continue;
      }

      // Angle bracket casting (<any>) são CRÍTICOS - confiança 100%
      if (tipo === 'tipo-inseguro-any-cast') {
        ocorrenciasCategorizadas.push({
          ocorrencia,
          categoria: 'corrigir',
          confianca: 100,
          motivo: TEXTOS_CATEGORIZACAO_FIX_TYPES.angleAnyMotivo,
          sugestao: TEXTOS_CATEGORIZACAO_FIX_TYPES.angleAnySugestao,
        });
        stats.corrigir++;
        stats.totalConfianca += 100;
        if (verbose) {
          log.erro(
            MENSAGENS_CLI_FIX_TYPES.verboseAngleAnyCritico(
              arquivo,
              String(ocorrencia.linha || '?'),
            ),
          );
        }
        _erros++;
        continue;
      }

      // unknown - categorizar
      if (tipo === 'tipo-inseguro-unknown') {
        // Precisamos do código fonte para categorizar
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        try {
          const fullPath = path.join(PROJECT_ROOT, arquivo);
          const codigo = await fs.readFile(fullPath, 'utf-8');
          const lineContext = extractLineContext(
            codigo,
            (ocorrencia.linha || 1) * 80,
          ); // aproximação

          const categorizacao = categorizarUnknown(
            codigo,
            arquivo,
            lineContext,
          );

          ocorrenciasCategorizadas.push({
            ocorrencia,
            ...categorizacao,
          });

          stats[categorizacao.categoria]++;
          stats.totalConfianca += categorizacao.confianca;

          if (verbose) {
            const prefixos = {
              legitimo: '[SUCESSO]',
              melhoravel: '[AVISO]',
              corrigir: '[ERRO]',
            };
            const prefixo = prefixos[categorizacao.categoria];
            log.info(
              MENSAGENS_CLI_FIX_TYPES.verboseUnknownCategoria(
                prefixo,
                arquivo,
                String(ocorrencia.linha || '?'),
                categorizacao.categoria,
                categorizacao.confianca,
              ),
            );
            log.info(
              MENSAGENS_CLI_FIX_TYPES.verboseMotivo(categorizacao.motivo),
            );
            if (categorizacao.sugestao) {
              log.info(
                MENSAGENS_CLI_FIX_TYPES.verboseSugestao(categorizacao.sugestao),
              );
            }

            // Mostrar variantes quando análise é incerta (confiança < 80%)
            if (categorizacao.variantes && categorizacao.confianca < 80) {
              log.info(MENSAGENS_CLI_FIX_TYPES.verboseVariantesTitulo);
              categorizacao.variantes.forEach((variante, idx) => {
                log.info(
                  MENSAGENS_CLI_FIX_TYPES.verboseVarianteItem(
                    idx + 1,
                    variante,
                  ),
                );
              });
            }
          }
        } catch {
          // Se não conseguir ler o arquivo, classificar como melhorável
          ocorrenciasCategorizadas.push({
            ocorrencia,
            categoria: 'melhoravel',
            confianca: 60,
            motivo: TEXTOS_CATEGORIZACAO_FIX_TYPES.semContextoMotivo,
            sugestao: TEXTOS_CATEGORIZACAO_FIX_TYPES.semContextoSugestao,
          });
          stats.melhoravel++;
          stats.totalConfianca += 60;
        }
      }
    }
  }

  // Resumo de categorização
  console.log();
  log.fase?.(MENSAGENS_RESUMO.tituloCategorizacao);
  log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

  const total = stats.legitimo + stats.melhoravel + stats.corrigir;
  const mediaConfianca =
    total > 0 ? Math.round(stats.totalConfianca / total) : 0;

  // LEGÍTIMO
  const linhasLegitimo = gerarResumoCategoria(
    'LEGITIMO',
    stats.legitimo,
    total,
  );
  log.sucesso(linhasLegitimo[0]);
  log.info(linhasLegitimo[1]);
  log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

  // MELHORÁVEL
  const linhasMelhoravel = gerarResumoCategoria(
    'MELHORAVEL',
    stats.melhoravel,
    total,
  );
  log.aviso(linhasMelhoravel[0]);
  log.info(linhasMelhoravel[1]);
  log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

  // CORRIGIR
  const linhasCorrigir = gerarResumoCategoria(
    'CORRIGIR',
    stats.corrigir,
    total,
  );
  log.erro(linhasCorrigir[0]);
  log.info(linhasCorrigir[1]);
  log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

  log.info(MENSAGENS_RESUMO.confianciaMedia(mediaConfianca));
  log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

  // Salvar detalhes em arquivo para análise
  if (verbose) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const reportPath = path.join(
      PROJECT_ROOT,
      '.oraculo',
      'fix-types-analise.json',
    );
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          stats,
          mediaConfianca,
          total,
          casos: ocorrenciasCategorizadas.map((c) => ({
            arquivo: c.ocorrencia.relPath,
            linha: c.ocorrencia.linha,
            categoria: c.categoria,
            confianca: c.confianca,
            motivo: c.motivo,
            sugestao: c.sugestao,
            variantes: c.variantes || [],
          })),
        },
        null,
        2,
      ),
    );
    log.info(MENSAGENS_CLI_FIX_TYPES.analiseDetalhadaSalva);
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
  }

  // Exibir casos de alta prioridade
  const altaPrioridade = ocorrenciasCategorizadas.filter(
    (c) => c.categoria === 'corrigir' && c.confianca >= 85,
  );

  if (altaPrioridade.length > 0) {
    log.fase?.(
      MENSAGENS_CLI_FIX_TYPES.altaConfiancaTitulo(altaPrioridade.length),
    );
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    for (const item of altaPrioridade.slice(0, 5)) {
      log.info(
        MENSAGENS_CLI_FIX_TYPES.altaConfiancaLinha(
          item.ocorrencia.relPath,
          String(item.ocorrencia.linha || '?'),
          item.confianca,
        ),
      );
      log.info(
        MENSAGENS_CLI_FIX_TYPES.altaConfiancaDetalhe(
          item.sugestao || item.motivo,
        ),
      );
    }
    if (altaPrioridade.length > 5) {
      log.info(
        MENSAGENS_CLI_FIX_TYPES.altaConfiancaMais(altaPrioridade.length - 5),
      );
    }
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
  }

  // Exibir casos incertos com variantes (baixa confiança)
  const casosIncertos = ocorrenciasCategorizadas.filter(
    (c) => c.confianca < 70 && c.variantes && c.variantes.length > 0,
  );

  if (casosIncertos.length > 0 && verbose) {
    log.fase?.(MENSAGENS_CLI_FIX_TYPES.incertosTitulo(casosIncertos.length));
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    log.info(MENSAGENS_CLI_FIX_TYPES.incertosIntro);
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    for (const item of casosIncertos.slice(0, 3)) {
      log.info(
        MENSAGENS_CLI_FIX_TYPES.incertosLinha(
          item.ocorrencia.relPath,
          String(item.ocorrencia.linha || '?'),
          item.confianca,
        ),
      );
      log.info(MENSAGENS_CLI_FIX_TYPES.verboseMotivo(item.motivo));
      if (item.variantes) {
        log.info(MENSAGENS_CLI_FIX_TYPES.verboseVariantesTitulo);
        item.variantes.forEach((variante: string, idx: number) => {
          log.info(
            MENSAGENS_CLI_FIX_TYPES.verboseVarianteItem(idx + 1, variante),
          );
        });
      }
      log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    }
    if (casosIncertos.length > 3) {
      log.info(MENSAGENS_CLI_FIX_TYPES.incertosMais(casosIncertos.length - 3));
      log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    }
  }

  // ✨ APLICAR CORREÇÕES AUTOMÁTICAS
  if (!isDryRun && altaPrioridade.length > 0) {
    console.log();
    log.fase?.(MENSAGENS_CLI_FIX_TYPES.aplicandoCorrecoesAuto);
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);

    const { aplicarCorrecoesEmLote } =
      await import('/corrections/auto-fix-engine.js');

    // Agrupar ocorrências por arquivo
    const porArquivo: Record<
      string,
      Array<{
        ocorrencia: Ocorrencia;
        categoria: 'legitimo' | 'melhoravel' | 'corrigir';
        confianca: number;
        sugestao?: string;
      }>
    > = {};

    for (const item of ocorrenciasCategorizadas) {
      const arquivo = item.ocorrencia.relPath || 'desconhecido';
      if (!porArquivo[arquivo]) {
        porArquivo[arquivo] = [];
      }
      porArquivo[arquivo].push(item);
    }

    const resultado = await aplicarCorrecoesEmLote(porArquivo, {
      dryRun: false,
      minConfianca: 85, // Apenas correções de alta confiança
      verbose: Boolean(verbose),
      interactive: false,
    });

    console.log();
    if (resultado.sucesso > 0) {
      log.sucesso(
        MENSAGENS_CLI_FIX_TYPES.correcoesResumoSucesso(resultado.sucesso),
      );

      for (const res of resultado.resultados) {
        if (res.sucesso && res.linhasModificadas > 0) {
          log.info(
            MENSAGENS_CLI_FIX_TYPES.correcoesResumoLinhaOk(
              res.arquivo,
              res.linhasModificadas,
            ),
          );
        } else if (!res.sucesso) {
          log.erro(
            MENSAGENS_CLI_FIX_TYPES.correcoesResumoLinhaErro(
              res.arquivo,
              res.erro,
            ),
          );
        }
      }
    } else {
      log.info(MENSAGENS_SUCESSO.nenhumaCorrecao);
    }

    if (resultado.falhas > 0) {
      console.log();
      log.erro(MENSAGENS_CLI_FIX_TYPES.correcoesResumoFalhas(resultado.falhas));
    }

    console.log();
    log.info(MENSAGENS_AUTOFIX.dicas.executarLint);
    log.info(MENSAGENS_AUTOFIX.dicas.executarBuild);
  } else if (isDryRun) {
    // Modo dry-run - apenas mostrar o que seria feito
    console.log();
    log.aviso(MENSAGENS_CLI_FIX_TYPES.dryRunAviso(ICONES.inicio));
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    log.info(TEMPLATE_RESUMO_FINAL.titulo);
    for (const passo of TEMPLATE_RESUMO_FINAL.passos) {
      log.info(MENSAGENS_CLI_FIX_TYPES.templatePasso(passo));
    }
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    log.info(MENSAGENS_AUTOFIX.dicas.removerDryRun);
  } else {
    // Nenhuma correção de alta prioridade
    console.log();
    log.info(MENSAGENS_SUCESSO.nenhumAltaConfianca);
    log.info(MENSAGENS_CLI_FIX_TYPES.linhaEmBranco);
    log.info(MENSAGENS_AUTOFIX.dicas.ajustarConfianca);
  }

  // Exportar relatórios se solicitado
  if (options.export || config.REPORT_EXPORT_ENABLED) {
    console.log();
    log.fase?.(MENSAGENS_CLI_FIX_TYPES.exportandoRelatorios);

    // Converter ocorrenciasCategorizadas para CasoTipoInseguro
    const casosParaExport: CasoTipoInseguro[] = ocorrenciasCategorizadas.map(
      (item) => ({
        arquivo: item.ocorrencia.relPath || 'desconhecido',
        linha: item.ocorrencia.linha,
        tipo: item.ocorrencia.tipo as
          | 'tipo-inseguro-any'
          | 'tipo-inseguro-unknown',
        categoria: item.categoria,
        confianca: item.confianca,
        motivo: item.motivo,
        sugestao: item.sugestao,
        variantes: item.variantes,
        contexto:
          'contexto' in item.ocorrencia
            ? (item.ocorrencia as { contexto?: string }).contexto
            : undefined,
      }),
    );

    const resultado = await exportarRelatoriosFixTypes({
      baseDir: PROJECT_ROOT,
      casos: casosParaExport,
      stats,
      minConfidence,
      verbose: Boolean(verbose),
    });

    if (resultado) {
      console.log();
    }
  }

  // Exit code baseado na severidade
  const temAny = porTipo['tipo-inseguro-any']?.length > 0;
  if (temAny && !isDryRun) {
    sair(ExitCode.Failure); // Exit com erro se houver any (mais severo)
    return;
  }
}
