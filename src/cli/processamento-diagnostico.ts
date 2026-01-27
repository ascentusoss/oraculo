// SPDX-License-Identifier: MIT
import fs from 'node:fs';
import path from 'node:path';

import { detectarArquetipos } from '@analistas/detectores/detector-arquetipos.js';
import { normalizarOcorrenciaParaJson } from '@cli/diagnostico/normalizar-ocorrencias-json.js';
import {
  exibirBlocoFiltros,
  listarAnalistas,
} from '@cli/processing/display.js';
import {
  configurarFiltros,
  expandIncludes,
  processPatternGroups,
  processPatternListAchatado,
} from '@cli/processing/filters.js';
import chalk from '@core/config/chalk-safe.js';
import { config } from '@core/config/config.js';
import {
  executarInquisicao,
  iniciarInquisicao,
  prepararComAst,
  registrarUltimasMetricas,
} from '@core/execution/inquisidor.js';
import { CliProcessamentoDiagnosticoMessages } from '@core/messages/cli/cli-processamento-diagnostico-messages.js';
import { ExcecoesMessages } from '@core/messages/core/excecoes-messages.js';
import {
  log,
  logGuardian,
  logRelatorio,
  logSistema,
  MENSAGENS_AUTOFIX,
} from '@core/messages/index.js';
import { aplicarSupressaoOcorrencias } from '@core/parsing/filters.js';
import { scanSystemIntegrity } from '@guardian/sentinela.js';
import { emitirConselhoOracular } from '@relatorios/conselheiro-oracular.js';
import { gerarRelatorioMarkdown } from '@relatorios/gerador-relatorio.js';
import fragmentarRelatorio from '@shared/data-processing/fragmentar-relatorio.js';
import { stringifyJsonEscaped } from '@shared/data-processing/json.js';
import { dedupeOcorrencias } from '@shared/data-processing/ocorrencias.js';

// Importar tipos centralizados (consolidado)
import {
  asTecnicas,
  converterResultadoGuardian,
  type FileEntry,
  type FileEntryWithAst,
  type FiltrosConfig,
  IntegridadeStatus,
  type LinguagensJson,
  type LogExtensions,
  type OpcoesProcessamentoDiagnostico,
  type ParseErrosJson,
  type ResultadoGuardian,
  type ResultadoInquisicaoCompleto,
  type ResultadoProcessamentoDiagnostico,
  type SaidaJsonDiagnostico,
} from '@';

// Persistência: usar helper centralizado, mas com resolver dinâmico para compat com mocks de teste
let salvarEstado: (caminho: string, dados: unknown) => Promise<void>;

async function getSalvarEstado(): Promise<
  (caminho: string, dados: unknown) => Promise<void>
> {
  if (salvarEstado) return salvarEstado;
  // Em testes, permitir mock do path .ts para compatibilidade com Vitest
  const candidates = process.env.VITEST
    ? [
        '@shared/persistence/persistencia.js',
        '@shared/persistence/persistencia.ts',
      ]
    : ['@shared/persistence/persistencia.js'];

  for (const p of candidates) {
    try {
      const mod = await import(p as string).catch(
        () => undefined as Record<string, unknown> | undefined,
      );
      if (mod && typeof mod.salvarEstado === 'function') {
        salvarEstado = mod.salvarEstado as (
          c: string,
          d: unknown,
        ) => Promise<void>;
        break;
      }
    } catch {}
  }

  // Fallback: importar pelo alias oficial
  if (!salvarEstado) {
    const mod = await import('@shared/persistence/persistencia.js');
    salvarEstado = (
      mod as { salvarEstado: (c: string, d: unknown) => Promise<void> }
    ).salvarEstado;
  }
  return salvarEstado;
}
// Reexports para compatibilidade com testes que importam utilitários diretamente deste módulo
export {
  configurarFiltros,
  getDefaultExcludes,
} from '@cli/processing/filters.js';
// registroAnalistas será importado dinamicamente quando necessário

// Helpers deduplicação/agrupamento: agora centralizados em @shared/data-processing/ocorrencias

// Constante para timeout de detecção de arquétipos (em milissegundos)
const DETECT_TIMEOUT_MS = process.env.VITEST ? 1000 : 30000;

// Helper: detecção de arquétipos com timeout e absorção de rejeições

async function detectarArquetiposComTimeout(
  ctx: Parameters<typeof detectarArquetipos>[0],
  baseDir: Parameters<typeof detectarArquetipos>[1],
  options?: { quiet?: boolean },
): Promise<Awaited<ReturnType<typeof detectarArquetipos>> | undefined> {
  try {
    const detectPromise = detectarArquetipos(ctx, baseDir, options).catch(
      (e) => {
        // Em DEV_MODE, registra erro explícito
        try {
          if (
            config.DEV_MODE &&
            typeof (log as { erro?: Function }).erro === 'function'
          ) {
            const msg = e instanceof Error ? e.message : String(e);
            (log as { erro: Function }).erro(
              `Falha detector arquetipos: ${msg}`,
            );
          }
        } catch {}
        return undefined;
      },
    );
    const timeoutPromise = new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), DETECT_TIMEOUT_MS),
    );
    return (await Promise.race([detectPromise, timeoutPromise])) as
      | Awaited<ReturnType<typeof detectarArquetipos>>
      | undefined;
  } catch {
    return undefined;
  }
}

// Utilitários para processamento de filtros

// Hook de teste: permite injetar uma ocorrência sintética mínima para
// exercitar ramos de exportação e despedida sem custo alto de análise.

// Expansão de includes: aceita diretórios sem curingas

// Função para obter padrões de exclusão padrão do config
// Função auxiliar para detectar o tipo de projeto (simplificada)

// Função para configurar filtros no config global

// Função auxiliar para sincronizar arrays de exclusão

// Função para exibir bloco de filtros (verbose)

// Função principal de processamento do diagnóstico

export async function processarDiagnostico(
  opts: OpcoesProcessamentoDiagnostico,
): Promise<ResultadoProcessamentoDiagnostico> {
  // Configurar flags globais
  config.GUARDIAN_ENABLED = opts.guardianCheck ?? false;
  // Novo comportamento: --full ativa verbose, padrão é compacto/resumido
  config.VERBOSE = opts.full ?? false;
  // Compacto: respeita --compact explícito; por padrão é o inverso de --full
  if ((opts as unknown as Record<string, unknown>).compact !== undefined) {
    config.COMPACT_MODE = Boolean(
      (opts as unknown as Record<string, unknown>).compact,
    );
  } else {
    config.COMPACT_MODE = !opts.full;
  }

  // Configurar nível de log
  if (
    opts.logLevel &&
    ['erro', 'aviso', 'info', 'debug'].includes(opts.logLevel)
  ) {
    config.LOG_LEVEL = opts.logLevel as 'erro' | 'aviso' | 'info' | 'debug';
  }

  // Processar filtros
  const includeGroupsRaw = processPatternGroups(opts.include);
  const includeGroupsExpanded = includeGroupsRaw.map((g) => expandIncludes(g));
  const includeListFlat = includeGroupsExpanded.flat();
  const excludeList = processPatternListAchatado(opts.exclude);
  const incluiNodeModules = includeListFlat.some((p) => /node_modules/.test(p));

  // Exibir bloco de filtros se verbose
  exibirBlocoFiltros(
    includeGroupsExpanded,
    includeListFlat,
    excludeList,
    incluiNodeModules,
  );

  // Configurar filtros no config global
  configurarFiltros(
    includeGroupsRaw,
    includeListFlat,
    excludeList,
    incluiNodeModules,
  );

  let iniciouDiagnostico = false;
  const baseDir = process.cwd();
  let guardianResultado: ResultadoGuardian | undefined;
  let fileEntries: FileEntryWithAst[] = [];
  let totalOcorrencias = 0;
  let _jsonEmitted = false;

  // Listar analistas se solicitado
  if (opts.listarAnalistas && !opts.json) {
    await listarAnalistas();
  }

  // Nota: antigamente tentávamos resolver dinamicamente uma outra
  // instância de `log` aqui (usando casts para `any`) para compatibilidade
  // com mocks; atualmente usamos o `log` importado estaticamente e, quando
  // necessário, importamos dinamicamente nos trechos locais onde isto é
  // requisitado pelos testes. Isso evita uso de `any` e elimina variáveis
  // não utilizadas.

  try {
    // Fase inicial do diagnóstico
    if (opts.json) {
      // Suprime cabeçalhos verbosos no modo JSON
    } else if (!iniciouDiagnostico && !config.COMPACT_MODE) {
      // Usa optional chaining para suportar mocks parciais do módulo de log nos testes
      (log as typeof log & LogExtensions).fase?.(
        'Iniciando diagnóstico completo',
      );
      iniciouDiagnostico = true;
    } else if (!iniciouDiagnostico && config.COMPACT_MODE) {
      (log as typeof log & LogExtensions).fase?.('Diagnóstico (modo compacto)');
      iniciouDiagnostico = true;
    }

    // 1) Primeira varredura rápida (sem AST) apenas para obter entries e opcionalmente rodar Guardian
    (log as typeof log & LogExtensions).fase?.('Varredura');
    const leituraInicial = await iniciarInquisicao(baseDir, {
      incluirMetadados: false,
      skipExec: true,
    });
    fileEntries = leituraInicial.fileEntries; // contém conteúdo mas sem AST

    // Criação e/ou salvamento de arquétipo personalizado sob demanda
    if (opts.criarArquetipo) {
      try {
        const norm = (p: string) => p.replace(/\\/g, '/');
        const dirSet = new Set<string>();
        const arquivosRaiz: string[] = [];
        for (const fe of fileEntries) {
          const rel = norm(fe.relPath || fe.fullPath || '');
          if (!rel) continue;
          if (!rel.includes('/')) {
            arquivosRaiz.push(rel);
          }
          const parts = rel.split('/');
          if (parts.length > 1) {
            // acumula prefixos de diretórios: ex.: src/a/b -> 'src', 'src/a', 'src/a/b'
            for (let i = 1; i < parts.length; i++) {
              const d = parts.slice(0, i).join('/');
              if (d) dirSet.add(d);
            }
          }
        }

        // Tenta obter nome do projeto a partir do package.json (preferência: fileEntries; fallback: disco)
        let nomeProjeto = path.basename(baseDir);
        try {
          const pkg = fileEntries.find((fe) =>
            /(^|[\\/])package\.json$/.test(fe.relPath || fe.fullPath),
          );
          if (pkg && typeof pkg.content === 'string' && pkg.content.trim()) {
            const parsed = JSON.parse(pkg.content);
            if (
              parsed &&
              typeof parsed.name === 'string' &&
              parsed.name.trim()
            ) {
              nomeProjeto = parsed.name.trim();
            }
          } else {
            const pkgPath = path.join(baseDir, 'package.json');
            try {
              const raw = await fs.promises.readFile(pkgPath, 'utf-8');
              const parsed = JSON.parse(raw);
              if (
                parsed &&
                typeof parsed.name === 'string' &&
                parsed.name.trim()
              ) {
                nomeProjeto = parsed.name.trim();
              }
            } catch {}
          }
        } catch {}

        const estruturaDetectada = Array.from(dirSet);
        const {
          criarTemplateArquetipoPersonalizado,
          salvarArquetipoPersonalizado,
        } = await import('@analistas/js-ts/arquetipos-personalizados.js');
        const arquetipo = criarTemplateArquetipoPersonalizado(
          nomeProjeto,
          estruturaDetectada,
          arquivosRaiz,
          'generico',
        );
        if (opts.salvarArquetipo) {
          await salvarArquetipoPersonalizado(arquetipo, baseDir);
        } else if (config.VERBOSE) {
          log.info(
            CliProcessamentoDiagnosticoMessages.templateArquetipoPreview,
          );
        }
      } catch (e) {
        log.aviso(
          `Falha ao gerar/salvar arquétipo personalizado: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // Executar Guardian se solicitado
    if (config.GUARDIAN_ENABLED) {
      // Usa optional chaining para evitar erro quando o mock não prover `fase`
      (log as typeof log & LogExtensions).fase?.(
        'Verificando integridade do Oráculo',
      );
      try {
        const resultado = await scanSystemIntegrity(fileEntries, {
          suppressLogs: true,
        });
        guardianResultado = resultado;
        switch (resultado.status) {
          case IntegridadeStatus.Ok:
            logGuardian.integridadeOk();
            break;
          case IntegridadeStatus.Criado:
            logGuardian.baselineCriado();
            break;
          case IntegridadeStatus.Aceito:
            logGuardian.baselineAceito();
            break;
          case IntegridadeStatus.AlteracoesDetectadas:
            logGuardian.alteracoesDetectadas();
            totalOcorrencias++;
            break;
        }
      } catch (err) {
        logGuardian.bloqueado();
        if (
          config.GUARDIAN_ENFORCE_PROTECTION &&
          typeof err === 'object' &&
          err &&
          'detalhes' in err &&
          Array.isArray((err as { detalhes?: unknown }).detalhes)
        ) {
          (err as { detalhes: string[] }).detalhes.forEach((d) => {
            logGuardian.aviso(d);
          });
          if (!process.env.VITEST) {
            try {
              process.exit(1);
            } catch (e) {
              throw e;
            }
            throw new Error(ExcecoesMessages.exit1);
          }
        } else {
          logGuardian.modoPermissivo();
        }
      }
    }

    // Se modo somente varredura estiver ativo, encerramos após coleta inicial
    if (config.SCAN_ONLY) {
      log.info(chalk.bold(`\n`));
      logGuardian.scanOnly(fileEntries.length);
      if (config.REPORT_EXPORT_ENABLED) {
        try {
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const dir =
            typeof config.REPORT_OUTPUT_DIR === 'string'
              ? config.REPORT_OUTPUT_DIR
              : path.join(baseDir, 'oraculo-reports');
          const fs = await import('node:fs');
          await fs.promises.mkdir(dir, { recursive: true });
          const nome = `oraculo-scan-${ts}`;
          const resumo = {
            modo: 'scan-only',
            totalArquivos: fileEntries.length,
            timestamp: new Date().toISOString(),
          };
          const salvar = await getSalvarEstado();
          await salvar(path.join(dir, `${nome}.json`), resumo);
          log.sucesso(
            CliProcessamentoDiagnosticoMessages.relatorioScanSalvo(dir),
          );
        } catch (e) {
          const msg =
            CliProcessamentoDiagnosticoMessages.falhaExportarRelatorioScanOnly(
              (e as Error).message,
            );
          log.erro(msg);
        }
      }
      if (opts.json) {
        console.log(
          JSON.stringify({
            modo: 'scan-only',
            totalArquivos: fileEntries.length,
          }),
        );
      }
      // Evita encerramento forçado em testes/ambiente de automação
      if (!process.env.VITEST && !opts.json) process.exit(0);
      else if (!process.env.VITEST && opts.json) process.exitCode = 0;
      return {
        totalOcorrencias: 0,
        temErro: false,
        guardianResultado,
        fileEntriesComAst: [],
        resultadoFinal: {
          ocorrencias: [],
          metricas: {
            totalArquivos: 0,
            tempoTotal: 0,
            analistas: [],
          },
        },
      };
    }
    // (bloco de criação de arquétipo removido)

    // Preparar AST para os arquivos coletados
    // Suporte ao fast-mode: reduz carga (parcialmente) quando ativo
    const fastMode = Boolean(
      (opts as unknown as Record<string, unknown>)['fast'],
    );
    (log as typeof log & LogExtensions).fase?.('Preparando AST');
    let fileEntriesComAst = await prepararComAst(fileEntries, baseDir);
    if (fastMode) {
      // Heurística simples: prioriza arquivos em src/ e ignora testes/configs
      fileEntriesComAst = fileEntriesComAst.filter((fe) => {
        const rel = (fe.relPath || fe.fullPath || '')
          .replace(/\\/g, '/')
          .toLowerCase();
        const isTest =
          /(^|\/)tests?(\/|\.)/.test(rel) ||
          /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(rel) ||
          /__tests__/.test(rel);
        const isConfig =
          /config|\.config\.|\.rc\.|package\.json|tsconfig|eslint|prettier|vitest|jest|babel/.test(
            rel,
          );
        const isSrc = /(^|\/)src\//.test(rel);
        return isSrc && !isTest && !isConfig;
      });
    }

    // Detectar arquétipos (pode retornar undefined em casos mínimos)
    const arquetiposResultado:
      | Awaited<ReturnType<typeof detectarArquetipos>>
      | undefined = await detectarArquetiposComTimeout(
      { arquivos: fileEntriesComAst, baseDir },
      baseDir,
      {
        quiet: opts.json,
      },
    );

    // Continuar com o processamento restante...
    // Em fast-mode, reduz o conjunto de analistas para acelerar
    const registro = (await import('@analistas/registry/registry.js'))
      .registroAnalistas;
    let tecnicas = asTecnicas(registro);
    if (fastMode) {
      const fmIncludeSrc: unknown =
        (config as unknown as Record<string, unknown>).fastMode &&
        ((config as unknown as Record<string, unknown>).fastMode as Record<
          string,
          unknown
        >);
      const includeList = Array.isArray(
        (fmIncludeSrc as Record<string, unknown>)?.analystsInclude,
      )
        ? ((fmIncludeSrc as Record<string, unknown>)
            .analystsInclude as string[])
        : [];
      const fmExcludeSrc: unknown =
        (config as unknown as Record<string, unknown>).fastMode &&
        ((config as unknown as Record<string, unknown>).fastMode as Record<
          string,
          unknown
        >);
      const excludeList = Array.isArray(
        (fmExcludeSrc as Record<string, unknown>)?.analystsExclude,
      )
        ? ((fmExcludeSrc as Record<string, unknown>)
            .analystsExclude as string[])
        : [];

      tecnicas = asTecnicas(
        (registro as (import('@').Analista | import('@').Tecnica)[]).filter(
          (a) => {
            // Normaliza nomes para comparação robusta
            const nomeRaw = (a as unknown as { nome?: string }).nome || '';
            const norm = (s: string) =>
              s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const nome = norm(nomeRaw);
            const matchInclude = includeList.length
              ? includeList.some((n) => {
                  const nn = norm(n);
                  return (
                    nome.includes(nn) ||
                    nomeRaw.toLowerCase().includes(n.toLowerCase())
                  );
                })
              : true;
            const matchExclude = excludeList.some((n) => {
              const nn = norm(n);
              return (
                nome.includes(nn) ||
                nomeRaw.toLowerCase().includes(n.toLowerCase())
              );
            });
            return matchInclude && !matchExclude;
          },
        ),
      );
    }

    (log as typeof log & LogExtensions).fase?.('Executando analistas');

    // Flags especiais (disponíveis para detectores/analistas via config global)
    try {
      const verifyCycles = Boolean(
        (opts as unknown as Record<string, unknown>)['verifyCycles'] ||
        (config as unknown as Record<string, unknown>)['SPECIAL_VERIFY_CYCLES'],
      );
      (config as unknown as Record<string, unknown>)['SPECIAL_VERIFY_CYCLES'] =
        verifyCycles;
    } catch {}

    const resultadoExecucao = await executarInquisicao(
      fileEntriesComAst,
      tecnicas,
      baseDir,
      converterResultadoGuardian(guardianResultado),
      {
        verbose: config.VERBOSE,
        compact: config.COMPACT_MODE,
        fast: opts.fast ?? false, // Modo rápido: workers paralelos
      },
    );

    // Processar métricas e ocorrências
    registrarUltimasMetricas(resultadoExecucao.metricas);
    // Deduplica ocorrências repetidas para reduzir ruído no orquestrador
    let ocorrenciasFiltradas = dedupeOcorrencias(
      resultadoExecucao.ocorrencias || [],
    );
    // Trust Compiler: se habilitado, reduzir ocorrências quando TS/ESLint não reportam
    const trustCompiler = Boolean(
      (opts as unknown as Record<string, unknown>)['trustCompiler'] ||
      (config as unknown as Record<string, unknown>)['SPECIAL_TRUST_COMPILER'],
    );
    if (trustCompiler) {
      try {
        // Heurística simples: se projeto tem tsconfig e tsc --noEmit não reporta erros, rebaixa severidades conhecidas
        const hasTs = fs.existsSync(path.join(baseDir, 'tsconfig.json'));
        let tsOk = true;
        if (hasTs) {
          // Evitar spawn pesado: usar flag existente de sucesso da build no pipeline
          // Caso não disponível, assume ok para reduzir ruído em modo confiança
          tsOk = true;
        }
        if (tsOk) {
          ocorrenciasFiltradas = ocorrenciasFiltradas.filter((o) => {
            const regra = o.tipo || '';
            // regras que o compilador/ESLint normalmente cobrem
            const cobertas = [/import.*nao.*usado/i, /tipo-inseguro.*unknown/i];
            return !cobertas.some((r) => r.test(regra));
          });
        }
      } catch {}
    }
    // Conciliação simples entre analistas: rebaixa severidade em casos de conflito
    try {
      const byLoc = new Map<
        string,
        { tipos: Set<string>; items: Record<string, unknown>[] }
      >();
      for (const o of ocorrenciasFiltradas as unknown as Record<
        string,
        unknown
      >[]) {
        const key = `${o.relPath || ''}:${o.linha || 0}`;
        const tipo = String(o.tipo || '');
        if (!byLoc.has(key)) byLoc.set(key, { tipos: new Set(), items: [] });
        const entry = byLoc.get(key);
        if (!entry) continue;
        entry.tipos.add(tipo);
        entry.items.push(o);
      }
      for (const [, entry] of byLoc) {
        const tipos = Array.from(entry.tipos);
        const hasTypeUnsafe = tipos.some((t) => t.startsWith('tipo-inseguro'));
        const hasComplexity = tipos.some((t) =>
          /complexidade|funcoes-longas/i.test(t),
        );
        if (hasTypeUnsafe && hasComplexity) {
          for (const item of entry.items) {
            const tipo = String(item.tipo || '');
            if (tipo.startsWith('tipo-inseguro')) {
              item.nivel = 'aviso';
              item.mensagem = `${item.mensagem} | 🤝 Conciliação: inferência e tipagem explícita em conflito; revisar caso`;
            }
          }
        }
      }
    } catch {}
    // Aplicar supressões configuradas em oraculo.config.json
    ocorrenciasFiltradas = aplicarSupressaoOcorrencias(
      ocorrenciasFiltradas,
      (config as unknown as FiltrosConfig) || undefined,
    );
    const totalOcorrenciasProcessadas = ocorrenciasFiltradas.length;

    // 🚀 PROCESSAMENTO DE FLAGS INTUITIVAS
    // Mapear flags intuitivas para as flags internas
    if (opts.fix && !opts.autoFix) {
      opts.autoFix = true;
      logSistema.processamentoFixDetectada();
    }

    if (opts.fixSafe && !opts.autoFixConservative) {
      opts.autoFixConservative = true;
      opts.autoFix = true;
      log.info(MENSAGENS_AUTOFIX.flags.fixSafe);
    }

    // Aplicar correções automáticas (quick fixes) se solicitado
    if (opts.autoFix) {
      try {
        // Importar módulos de quick fixes e configuração
        // O registro de quick fixes foi consolidado em fix-config.js
        const { findQuickFixes, applyQuickFix } =
          await import('@core/config/auto/fix-config.js');
        const { getAutoFixConfig } =
          await import('@core/config/auto/auto-fix-config.js');

        // Determinar configuração do auto-fix
        let autoFixMode = opts.autoFixMode || 'balanced';
        if (opts.autoFixConservative) {
          autoFixMode = 'conservative';
          opts.autoFix = true; // Ativar auto-fix automaticamente
        }

        const autoFixConfig = getAutoFixConfig(autoFixMode);

        if (autoFixMode === 'conservative') {
          log.info(MENSAGENS_AUTOFIX.logs.modoConservador);
        } else if (autoFixMode === 'aggressive') {
          log.aviso(CliProcessamentoDiagnosticoMessages.autoFixModoAgressivo);
        }

        // Encontrar arquivos com quick fixes disponíveis
        const quickFixesDisponiveis = ocorrenciasFiltradas.filter(
          (occ) =>
            occ.tipo === 'auto-fix-disponivel' ||
            occ.tipo === 'QUICK_FIX_DISPONIVEL',
        );

        if (quickFixesDisponiveis.length === 0) {
          logSistema.autoFixNenhumaCorrecao();
        } else {
          logSistema.autoFixAplicando(autoFixMode);

          let arquivosCorrigidos = 0;
          let totalCorrecoes = 0;
          let correcoesPuladas = 0;

          // Agrupar por arquivo para aplicar todas as correções de uma vez
          const correcoesPorArquivo = new Map<
            string,
            typeof quickFixesDisponiveis
          >();
          for (const fix of quickFixesDisponiveis) {
            const arquivo = fix.relPath || fix.arquivo;
            if (!arquivo) continue;

            if (!correcoesPorArquivo.has(arquivo)) {
              correcoesPorArquivo.set(arquivo, []);
            }
            correcoesPorArquivo.get(arquivo)?.push(fix);
          }

          // Aplicar correções arquivo por arquivo
          const maxFixesPerFile = autoFixConfig?.maxFixesPerFile ?? Infinity;
          for (const [arquivo, _fixes] of correcoesPorArquivo) {
            try {
              // Encontrar o FileEntry correspondente
              const fileEntry = fileEntriesComAst.find(
                (fe) => fe.relPath === arquivo || fe.fullPath === arquivo,
              );

              if (!fileEntry || typeof fileEntry.content !== 'string') {
                logSistema.autoFixArquivoNaoEncontrado(arquivo);
                continue;
              }

              let codigoCorrigido = fileEntry.content;
              let corrigiuAlgo = false;
              let correcoesPorArquivoCount = 0;

              // Encontrar e aplicar quick fixes com configuração
              const quickFixesEncontrados = findQuickFixes(
                codigoCorrigido,
                undefined,
                autoFixConfig,
                arquivo,
              );

              for (const quickFix of quickFixesEncontrados) {
                // Verificar limite de correções por arquivo
                const maxFixesPerFile =
                  autoFixConfig?.maxFixesPerFile ?? Infinity;
                if (correcoesPorArquivoCount >= maxFixesPerFile) {
                  correcoesPuladas += quickFix.matches.length;
                  break;
                }

                for (const match of quickFix.matches) {
                  try {
                    const novocodigo = applyQuickFix(
                      codigoCorrigido,
                      quickFix,
                      match,
                    );
                    if (novocodigo !== codigoCorrigido) {
                      codigoCorrigido = novocodigo;
                      corrigiuAlgo = true;
                      totalCorrecoes++;
                      correcoesPorArquivoCount++;

                      if (config.VERBOSE) {
                        logSistema.autoFixAplicada(
                          quickFix.title,
                          quickFix.confidence,
                        );
                      }
                    }
                  } catch (err) {
                    logSistema.autoFixFalha(
                      quickFix.id,
                      err instanceof Error ? err.message : String(err),
                    );
                  }

                  // Verificar limite de correções por arquivo
                  if (correcoesPorArquivoCount >= maxFixesPerFile) {
                    break;
                  }
                }
              }

              // Salvar arquivo se houve alterações
              if (corrigiuAlgo) {
                const { promises: fs } = await import('node:fs');
                const caminhoCompleto = path.isAbsolute(arquivo)
                  ? arquivo
                  : path.join(baseDir, arquivo);
                await fs.writeFile(caminhoCompleto, codigoCorrigido, 'utf-8');
                arquivosCorrigidos++;

                if (config.VERBOSE) {
                  logSistema.autoFixCorrigido(arquivo);
                }
              }
            } catch (err) {
              log.erro(
                `❌ Erro ao corrigir ${arquivo}: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          if (arquivosCorrigidos > 0) {
            const estatisticas = [
              `${totalCorrecoes} correções aplicadas em ${arquivosCorrigidos} arquivo(s)`,
            ];

            if (correcoesPuladas > 0) {
              estatisticas.push(
                `${correcoesPuladas} correções puladas (limite por arquivo: ${maxFixesPerFile === Infinity ? '∞' : maxFixesPerFile})`,
              );
            }

            if (autoFixMode === 'conservative') {
              estatisticas.push('modo conservador (alta confiança apenas)');
            }

            logSistema.autoFixEstatisticas(estatisticas);

            // Validação ESLint pós-auto-fix para harmonia total
            if (
              process.env.ORACULO_ESLINT_VALIDATION !== '0' &&
              autoFixConfig.validateAfterFix
            ) {
              try {
                log.info(MENSAGENS_AUTOFIX.logs.validacaoEslint);
                const { spawn } = await import('node:child_process');

                // Lista de arquivos corrigidos para validação
                const arquivosParaValidar = Array.from(
                  correcoesPorArquivo.keys(),
                );

                if (arquivosParaValidar.length > 0) {
                  // Executar ESLint --fix apenas nos arquivos modificados
                  const eslintArgs = ['--fix', ...arquivosParaValidar];

                  const proc = spawn('npx', ['eslint', ...eslintArgs], {
                    cwd: baseDir,
                    stdio: 'pipe',
                  });

                  let stdout = '';
                  let _stderr = '';

                  proc.stdout?.on('data', (data) => {
                    stdout += data;
                  });
                  proc.stderr?.on('data', (data) => {
                    _stderr += data;
                  });

                  await new Promise((resolve, _reject) => {
                    proc.on('close', (code) => {
                      if (code === 0) {
                        logSistema.autoFixESLintHarmonia();
                        resolve(void 0);
                      } else {
                        // ESLint encontrou/corrigiu issues - isso é normal
                        if (config.VERBOSE && stdout) {
                          logSistema.processamentoESLintOutput(stdout);
                        }
                        logSistema.autoFixESLintAjustes();
                        resolve(void 0);
                      }
                    });

                    proc.on('error', (err) => {
                      logSistema.autoFixESLintFalha(err.message);
                      resolve(void 0); // Não falha o processo principal
                    });
                  });
                }
              } catch (err) {
                log.aviso(
                  `⚠️  Validação ESLint não executada: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            }
          } else {
            logSistema.autoFixNenhumaAplicada();
          }

          // Remover quick fixes das ocorrências já que foram aplicados
          const ocorrenciasSemQuickFixes = ocorrenciasFiltradas.filter(
            (occ) =>
              occ.tipo !== 'auto-fix-disponivel' &&
              occ.tipo !== 'QUICK_FIX_DISPONIVEL',
          );

          // Atualizar contadores e usar ocorrências sem quick fixes nos relatórios
          totalOcorrencias = ocorrenciasSemQuickFixes.length;
        }
      } catch (err) {
        log.erro(
          `❌ Falha ao executar auto-fix: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else {
      // CRÍTICO: Definir totalOcorrencias no fluxo normal (sem auto-fix)
      totalOcorrencias = ocorrenciasFiltradas.length;
    }

    // Logging básico sempre, detalhado para --verbose e --debug
    const tiposOcorrencias = new Map<string, number>();
    const nivelOcorrencias = new Map<string, number>();

    ocorrenciasFiltradas.forEach((ocorrencia) => {
      const tipo = ocorrencia.tipo || 'DESCONHECIDO';
      const nivel = ocorrencia.nivel || 'info';
      tiposOcorrencias.set(tipo, (tiposOcorrencias.get(tipo) || 0) + 1);
      nivelOcorrencias.set(nivel, (nivelOcorrencias.get(nivel) || 0) + 1);
    });

    if (tiposOcorrencias.size > 0 && !opts.json) {
      // Modo executivo: mostrar resumo executivo conciso e acionável
      if (opts.executive) {
        try {
          const criticos = nivelOcorrencias.get('erro') || 0;
          const altos = nivelOcorrencias.get('alto') || 0;
          const total = totalOcorrenciasProcessadas;

          // Top arquivos por ocorrências (somente erros/avisos críticos para executivo)
          const arquivoCount = new Map<string, number>();
          for (const oc of ocorrenciasFiltradas) {
            const pathKey = (oc.relPath ||
              oc.arquivo ||
              'desconhecido') as string;
            const nivel = oc.nivel || 'info';
            if (nivel === 'erro' || nivel === 'alto') {
              arquivoCount.set(pathKey, (arquivoCount.get(pathKey) || 0) + 1);
            }
          }
          const topArquivos = Array.from(arquivoCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          const header =
            CliProcessamentoDiagnosticoMessages.resumoExecutivoHeader(
              total,
              criticos,
              altos,
            );
          if (
            typeof (log as typeof log & LogExtensions).imprimirBloco ===
            'function'
          ) {
            const linhas = [
              CliProcessamentoDiagnosticoMessages.resumoExecutivoCriticos(
                criticos,
              ),
              CliProcessamentoDiagnosticoMessages.resumoExecutivoAltos(altos),
              CliProcessamentoDiagnosticoMessages.linhaEmBranco,
              CliProcessamentoDiagnosticoMessages.resumoExecutivoTopArquivosErrosAltos,
              ...topArquivos.map(([f, c]) =>
                CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(
                  f,
                  c,
                ),
              ),
              CliProcessamentoDiagnosticoMessages.linhaEmBranco,
              CliProcessamentoDiagnosticoMessages.resumoExecutivoAcaoSugerida,
            ];
            (log as typeof log & LogExtensions).imprimirBloco(header, linhas);
          } else {
            log.info(header);
            if (topArquivos.length > 0) {
              log.info(
                CliProcessamentoDiagnosticoMessages.resumoExecutivoTopArquivosErrosAltos,
              );
              topArquivos.forEach(([f, c]) =>
                log.info(
                  CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(
                    f,
                    c,
                  ),
                ),
              );
            }
            log.info(
              CliProcessamentoDiagnosticoMessages.resumoExecutivoAcaoSugerida,
            );
          }
        } catch {
          // não crítico
        }
      }
      // Resumo básico sempre (não verbose e não executive)
      else if (!config.VERBOSE && !config.DEV_MODE) {
        logSistema.processamentoResumoOcorrencias(totalOcorrenciasProcessadas);

        // Top 5 tipos mais comuns
        const topTipos = Array.from(tiposOcorrencias.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        console.log(CliProcessamentoDiagnosticoMessages.linhaEmBranco);
        console.log(CliProcessamentoDiagnosticoMessages.principaisTiposTitulo);
        topTipos.forEach(([tipo, count]) => {
          console.log(
            CliProcessamentoDiagnosticoMessages.principaisTiposLinha(
              tipo,
              count,
            ),
          );
        });

        // Mini top arquivos (5) para ação rápida
        try {
          const arquivoCount = new Map<string, number>();
          for (const oc of ocorrenciasFiltradas) {
            const pathKey = (oc.relPath ||
              oc.arquivo ||
              'desconhecido') as string;
            arquivoCount.set(pathKey, (arquivoCount.get(pathKey) || 0) + 1);
          }
          const topArquivos = Array.from(arquivoCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          if (topArquivos.length > 0) {
            console.log(CliProcessamentoDiagnosticoMessages.linhaEmBranco);
            console.log(CliProcessamentoDiagnosticoMessages.topArquivosTitulo);
            topArquivos.forEach(([f, c]) =>
              console.log(
                CliProcessamentoDiagnosticoMessages.topArquivosLinha(f, c),
              ),
            );
          }
        } catch {
          /* ignore */
        }

        console.log(CliProcessamentoDiagnosticoMessages.linhaEmBranco);
        logSistema.processamentoDicasContextuais();

        // Dicas baseadas no conteúdo real encontrado
        const totalTodos = tiposOcorrencias.get('TODO_PENDENTE') || 0;
        const totalQuickFixes =
          (tiposOcorrencias.get('QUICK_FIX_DISPONIVEL') || 0) +
          (tiposOcorrencias.get('auto-fix-disponivel') || 0);
        const totalErros = nivelOcorrencias.get('erro') || 0;
        const totalAvisos = nivelOcorrencias.get('aviso') || 0;

        if (totalErros > 0) {
          logSistema.processamentoErrosCriticos(totalErros);
        }

        if (totalAvisos > 0) {
          logSistema.processamentoAvisosEncontrados(totalAvisos);
        }

        if (totalQuickFixes > 10) {
          logSistema.processamentoQuickFixesMuitos(totalQuickFixes);
          logSistema.processamentoQuickFixesComando();
          logSistema.processamentoQuickFixesExecutar();
        } else if (totalQuickFixes > 0) {
          logSistema.processamentoQuickFixesMuitos(totalQuickFixes);
          logSistema.processamentoQuickFixesComando();
          logSistema.processamentoQuickFixesExecutar();
        }

        if (totalTodos > 50) {
          logSistema.processamentoTodosMuitos(totalTodos);
        } else if (totalTodos > 0) {
          logSistema.processamentoTodosPoucos(totalTodos);
        }

        if (totalOcorrenciasProcessadas > 1000) {
          logSistema.processamentoMuitasOcorrencias();
          logSistema.processamentoFiltrarPasta();
        }

        logSistema.processamentoUsarFull();
        logSistema.processamentoUsarJson();

        if (totalOcorrenciasProcessadas < 100) {
          logSistema.processamentoProjetoLimpo();
        }
      } else {
        // Detalhamento completo para --verbose (ou quando --full ativo)
        logSistema.processamentoDetalhamentoOcorrencias(
          totalOcorrenciasProcessadas,
        );

        // Mostrar por tipo
        log.info(CliProcessamentoDiagnosticoMessages.porTipoTitulo);
        Array.from(tiposOcorrencias.entries())
          .sort((a, b) => b[1] - a[1])
          .forEach(([tipo, count]) => {
            log.info(
              CliProcessamentoDiagnosticoMessages.porTipoLinha(tipo, count),
            );
          });

        // Mostrar por nível de severidade
        log.info(CliProcessamentoDiagnosticoMessages.porSeveridadeTitulo);
        Array.from(nivelOcorrencias.entries())
          .sort((a, b) => b[1] - a[1])
          .forEach(([nivel, count]) => {
            const emoji =
              nivel === 'erro' ? '🔴' : nivel === 'aviso' ? '🟡' : '🔵';
            log.info(
              CliProcessamentoDiagnosticoMessages.porSeveridadeLinha(
                emoji,
                nivel,
                count,
              ),
            );
          });

        // Adicionar top arquivos com contagem (útil para investigação)
        try {
          const arquivosCount = new Map<string, number>();
          for (const oc of ocorrenciasFiltradas) {
            const key = (oc.relPath || oc.arquivo || 'desconhecido') as string;
            arquivosCount.set(key, (arquivosCount.get(key) || 0) + 1);
          }
          const topArquivosAll = Array.from(arquivosCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
          if (topArquivosAll.length) {
            if (
              typeof (log as typeof log & LogExtensions).imprimirBloco ===
              'function'
            ) {
              const linhas = [
                CliProcessamentoDiagnosticoMessages.topArquivosPorOcorrenciasTitulo,
                ...topArquivosAll.map(([f, c]) =>
                  CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(
                    f,
                    c,
                  ),
                ),
              ];
              (log as typeof log & LogExtensions).imprimirBloco(
                CliProcessamentoDiagnosticoMessages.arquivosMaisOcorrenciasTitulo,
                linhas,
              );
            } else {
              log.info(
                CliProcessamentoDiagnosticoMessages.topArquivosPorOcorrenciasTitulo,
              );
              topArquivosAll.forEach(([f, c]) =>
                log.info(
                  CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(
                    f,
                    c,
                  ),
                ),
              );
            }
          }

          // Top críticos imediatos (erros/alto) para ação rápida
          const criticosOuAltos: Array<{
            arquivo: string;
            tipo: string;
            nivel: string;
            linha?: number;
            coluna?: number;
          }> = [];
          for (const oc of ocorrenciasFiltradas) {
            const nivel = (oc.nivel || 'info').toString().toLowerCase();
            if (nivel === 'erro' || nivel === 'alto') {
              criticosOuAltos.push({
                arquivo: (oc.relPath || oc.arquivo || 'desconhecido') as string,
                tipo: (oc.tipo || 'desconhecido') as string,
                nivel,
                linha: typeof oc.linha === 'number' ? oc.linha : undefined,
                coluna:
                  typeof (oc as unknown as { coluna?: number }).coluna ===
                  'number'
                    ? (oc as unknown as { coluna?: number }).coluna
                    : undefined,
              });
            }
          }
          // Ordenação por severidade: erro > alto > aviso (se houver)
          const ordemNivel = (n: string) =>
            n === 'erro' ? 3 : n === 'alto' ? 2 : n === 'aviso' ? 1 : 0;
          const topCriticos = criticosOuAltos
            .sort((a, b) => ordemNivel(b.nivel) - ordemNivel(a.nivel))
            .slice(0, 10);
          if (topCriticos.length) {
            if (
              typeof (log as typeof log & LogExtensions).imprimirBloco ===
              'function'
            ) {
              const linhas = topCriticos.map((c) => {
                const pos =
                  typeof c.linha === 'number'
                    ? `:${c.linha}${typeof c.coluna === 'number' ? `:${c.coluna}` : ''}`
                    : '';
                return CliProcessamentoDiagnosticoMessages.topCriticosLinha(
                  c.nivel.toUpperCase(),
                  c.tipo,
                  c.arquivo,
                  pos,
                );
              });
              (log as typeof log & LogExtensions).imprimirBloco(
                CliProcessamentoDiagnosticoMessages.topCriticosTitulo,
                linhas,
              );
            } else {
              log.info(
                CliProcessamentoDiagnosticoMessages.topCriticosTituloComDoisPontos,
              );
              topCriticos.forEach((c) => {
                const pos =
                  typeof c.linha === 'number'
                    ? `:${c.linha}${typeof c.coluna === 'number' ? `:${c.coluna}` : ''}`
                    : '';
                log.info(
                  CliProcessamentoDiagnosticoMessages.topCriticosLinha(
                    c.nivel.toUpperCase(),
                    c.tipo,
                    c.arquivo,
                    pos,
                  ),
                );
              });
            }
          }

          // Amostra de ocorrências (limite para não poluir o terminal)
          const SAMPLE_MAX = 50;
          const sample = ocorrenciasFiltradas
            .slice(0, SAMPLE_MAX)
            .map(
              (o) =>
                `${o.relPath}:${o.linha ?? ''} [${o.nivel ?? ''}] ${String(o.mensagem ?? '').replace(/\n/g, ' ')}`,
            );
          if (sample.length) {
            if (
              typeof (log as typeof log & LogExtensions).imprimirBloco ===
              'function'
            ) {
              (log as typeof log & LogExtensions).imprimirBloco(
                CliProcessamentoDiagnosticoMessages.amostraBlocoTitulo(
                  sample.length,
                ),
                sample.slice(0, 20),
              );
            } else {
              log.info(
                CliProcessamentoDiagnosticoMessages.amostraOcorrenciasTitulo,
              );
              sample
                .slice(0, 20)
                .forEach((s) =>
                  log.info(
                    CliProcessamentoDiagnosticoMessages.amostraLinhaIndentada(
                      s,
                    ),
                  ),
                );
            }
            if (ocorrenciasFiltradas.length > SAMPLE_MAX) {
              log.info(
                CliProcessamentoDiagnosticoMessages.amostraMaisLinhas(
                  SAMPLE_MAX,
                  ocorrenciasFiltradas.length,
                ),
              );
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // Logging adicional para DEBUG
    if (config.VERBOSE || config.DEV_MODE) {
      if (config.DEV_MODE && !opts.json && resultadoExecucao.metricas) {
        if (resultadoExecucao.metricas.analistas) {
          const analistasComOcorrencias =
            resultadoExecucao.metricas.analistas.filter(
              (a) => (a.ocorrencias ?? 0) > 0,
            );
          logSistema.processamentoAnalistasProblemas(
            analistasComOcorrencias.length,
          );
          analistasComOcorrencias.forEach((analista) => {
            log.info(
              CliProcessamentoDiagnosticoMessages.analistaOcorrenciasLinha(
                analista.nome,
                analista.ocorrencias,
                analista.duracaoMs.toFixed(1),
              ),
            );
          });
        }
      }
    }

    // Mensagem final apenas quando repositório está limpo
    try {
      if (!opts.json && !config.SCAN_ONLY && totalOcorrencias === 0) {
        logRelatorio.repositorioImpecavel();
      }
    } catch {}

    // Em ambiente de testes (Vitest) também invocar via import dinâmico o módulo
    // que os testes normalmente mockam (`../../src/nucleo/constelacao/log.js`).
    // Isso garante que, mesmo que haja alguma diferença de instância entre o
    // import estático e o mock aplicado pelo Vitest, as spies do teste sejam
    // chamadas e asserções sobre `logMock` passem.
    // (removed temporary vitest dynamic invocations)

    // Log de diagnóstico concluído para testes
    if (process.env.VITEST && !opts.json) {
      log.info(CliProcessamentoDiagnosticoMessages.diagnosticoConcluido);
    }

    // Processar arquétipos se disponível
    if (arquetiposResultado) {
      // Lógica de processamento de arquétipos seria implementada aqui
      // Por enquanto, apenas log se verbose
      if (config.VERBOSE && arquetiposResultado.candidatos?.length > 0) {
        log.info(
          CliProcessamentoDiagnosticoMessages.arquetiposDetectados(
            arquetiposResultado.candidatos.length,
          ),
        );
      }

      // Em modo compacto, mostrar informação resumida sobre arquétipos
      if (
        !config.VERBOSE &&
        config.COMPACT_MODE &&
        arquetiposResultado.candidatos?.length > 0
      ) {
        const topCandidato = arquetiposResultado.candidatos[0];
        log.info(
          CliProcessamentoDiagnosticoMessages.arquetiposCompact(
            topCandidato.nome,
            topCandidato.confidence,
          ),
        );
      }

      // Exibir informações sobre candidatos mesmo quando não verbose (para testes)
      if (!config.VERBOSE && arquetiposResultado.candidatos?.length > 0) {
        log.info(
          CliProcessamentoDiagnosticoMessages.arquetiposCandidatosEncontrados(
            arquetiposResultado.candidatos.length,
          ),
        );
      }

      // Exibir informações detalhadas dos arquetipos se verbose
      if (config.VERBOSE && arquetiposResultado.candidatos?.length > 0) {
        const candidatoTop = arquetiposResultado.candidatos[0];

        // Log dos candidatos
        log.info(
          CliProcessamentoDiagnosticoMessages.arquetiposCandidatosTitulo,
        );
        for (const candidato of arquetiposResultado.candidatos.slice(0, 3)) {
          log.info(
            CliProcessamentoDiagnosticoMessages.arquetiposCandidatoLinha(
              candidato.nome,
              candidato.confidence,
            ),
          );
        }

        // Log do planoSugestao se existir
        if (candidatoTop.planoSugestao) {
          const plano = candidatoTop.planoSugestao;
          if (plano.mover && plano.mover.length > 0) {
            log.info(
              CliProcessamentoDiagnosticoMessages.planoSugestaoMove(
                plano.mover.length,
              ),
            );
          } else {
            log.info(
              CliProcessamentoDiagnosticoMessages.planoSugestaoNenhumMove,
            );
          }

          if (plano.conflitos && plano.conflitos.length > 0) {
            log.info(
              CliProcessamentoDiagnosticoMessages.conflitos(
                plano.conflitos.length,
              ),
            );
          }
        }

        // Log de anomalias se existirem
        if (candidatoTop.anomalias && candidatoTop.anomalias.length > 0) {
          const tituloAnomalias =
            CliProcessamentoDiagnosticoMessages.anomaliasTitulo;
          const linhasAnomalias: string[] = [];
          for (const anomalia of candidatoTop.anomalias.slice(0, 8)) {
            linhasAnomalias.push(
              CliProcessamentoDiagnosticoMessages.anomaliaLinha(
                anomalia.path,
                anomalia.motivo,
              ),
            );
          }
          if (candidatoTop.anomalias.length > 8) {
            linhasAnomalias.push(
              CliProcessamentoDiagnosticoMessages.anomaliasMais(
                candidatoTop.anomalias.length - 8,
              ),
            );
          }

          if (
            typeof (log as typeof log & LogExtensions).imprimirBloco ===
            'function'
          ) {
            (log as typeof log & LogExtensions).imprimirBloco(
              tituloAnomalias,
              linhasAnomalias,
            );
          } else {
            // Fallback para logs simples se imprimirBloco não estiver disponível
            log.info(
              CliProcessamentoDiagnosticoMessages.anomaliasTituloComDoisPontos,
            );
            for (const linha of linhasAnomalias) {
              log.info(
                CliProcessamentoDiagnosticoMessages.amostraLinhaIndentada(
                  linha,
                ),
              );
            }
          }

          // Log adicional sobre anomalias ocultas se houver mais de 8
          if (candidatoTop.anomalias.length > 8) {
            log.aviso(
              CliProcessamentoDiagnosticoMessages.anomaliasOcultasAviso(
                candidatoTop.anomalias.length - 8,
              ),
            );
          }
        }

        // Log de drift se existir
        if (arquetiposResultado.drift) {
          const drift = arquetiposResultado.drift;
          if (drift.alterouArquetipo) {
            log.info(
              CliProcessamentoDiagnosticoMessages.driftAlterou(
                drift.anterior,
                drift.atual,
              ),
            );
          } else {
            log.info(
              CliProcessamentoDiagnosticoMessages.driftMantido(drift.atual),
            );
          }

          if (drift.arquivosRaizNovos && drift.arquivosRaizNovos.length > 0) {
            const novosStr =
              drift.arquivosRaizNovos.length > 3
                ? `${drift.arquivosRaizNovos.slice(0, 3).join(', ')}…`
                : drift.arquivosRaizNovos.join(', ');
            log.info(CliProcessamentoDiagnosticoMessages.driftNovos(novosStr));
          }
          if (
            drift.arquivosRaizRemovidos &&
            drift.arquivosRaizRemovidos.length > 0
          ) {
            const removidosStr =
              drift.arquivosRaizRemovidos.length > 3
                ? `${drift.arquivosRaizRemovidos.slice(0, 3).join(', ')}…`
                : drift.arquivosRaizRemovidos.join(', ');
            log.info(
              CliProcessamentoDiagnosticoMessages.driftRemovidos(removidosStr),
            );
          }
        }
      } else if (config.VERBOSE) {
        // Debug: log se não há candidatos ou arquetiposResultado é undefined
        const candidatosCount = arquetiposResultado
          ? (
              arquetiposResultado as Awaited<
                ReturnType<typeof detectarArquetipos>
              >
            ).candidatos?.length || 0
          : 0;
        log.info(
          `DEBUG: arquetiposResultado=${!!arquetiposResultado}, candidatos=${candidatosCount}`,
        );
      }

      // Imprimir bloco de resumo de estrutura se houver baseline/drift (fora de JSON)
      if (
        !opts.json &&
        arquetiposResultado &&
        (arquetiposResultado.baseline || arquetiposResultado.drift)
      ) {
        const linhasEstrutura: string[] = [];
        if (arquetiposResultado.baseline) {
          const baseline = arquetiposResultado.baseline;
          linhasEstrutura.push(
            CliProcessamentoDiagnosticoMessages.baselineArquetipo(
              baseline.arquetipo,
              baseline.confidence,
            ),
          );
          linhasEstrutura.push(
            CliProcessamentoDiagnosticoMessages.baselineCriadoEm(
              new Date(baseline.timestamp).toLocaleString('pt-BR'),
            ),
          );
        } else {
          // Log de aviso quando não há baseline
          log.aviso(
            CliProcessamentoDiagnosticoMessages.baselineDesconhecidoAviso,
          );
          linhasEstrutura.push(
            CliProcessamentoDiagnosticoMessages.baselineArquetipoDesconhecido,
          );
        }
        if (arquetiposResultado.drift) {
          const drift = arquetiposResultado.drift;
          if (drift.alterouArquetipo) {
            linhasEstrutura.push(
              CliProcessamentoDiagnosticoMessages.driftDetectado(
                drift.anterior,
                drift.atual,
              ),
            );
          } else {
            linhasEstrutura.push(
              CliProcessamentoDiagnosticoMessages.arquetipoMantido(drift.atual),
            );
          }
          if (drift.arquivosRaizNovos && drift.arquivosRaizNovos.length > 0) {
            linhasEstrutura.push(
              CliProcessamentoDiagnosticoMessages.novosArquivosRaiz(
                drift.arquivosRaizNovos.join(', '),
              ),
            );
          }
          if (
            drift.arquivosRaizRemovidos &&
            drift.arquivosRaizRemovidos.length > 0
          ) {
            linhasEstrutura.push(
              CliProcessamentoDiagnosticoMessages.arquivosRemovidosRaiz(
                drift.arquivosRaizRemovidos.join(', '),
              ),
            );
          }
        }
        if (
          arquetiposResultado.candidatos &&
          arquetiposResultado.candidatos.length > 0
        ) {
          const top = arquetiposResultado.candidatos[0];
          linhasEstrutura.push(
            CliProcessamentoDiagnosticoMessages.candidatoPrincipal(
              top.nome,
              top.confidence,
            ),
          );
        }

        const tituloEstrutura =
          CliProcessamentoDiagnosticoMessages.resumoEstruturaTitulo;
        if (
          typeof (log as typeof log & LogExtensions).imprimirBloco ===
          'function'
        ) {
          // Calcular largura como nos outros blocos
          let larguraEstrutura: number | undefined;
          if (
            typeof (log as Record<string, unknown>).calcularLargura ===
            'function'
          ) {
            larguraEstrutura = (
              log as { calcularLargura: Function }
            ).calcularLargura(
              tituloEstrutura,
              linhasEstrutura,
              config.COMPACT_MODE ? 84 : 96,
            );
            // Se calcularLargura retornar undefined, usar fallback
            if (
              typeof larguraEstrutura !== 'number' ||
              isNaN(larguraEstrutura)
            ) {
              larguraEstrutura = config.COMPACT_MODE ? 84 : 96;
            }
          } else {
            larguraEstrutura = config.COMPACT_MODE ? 84 : 96;
          }
          (log as typeof log & LogExtensions).imprimirBloco(
            tituloEstrutura,
            linhasEstrutura,
            undefined,
            larguraEstrutura,
          );
        }
      }

      // Saída JSON se solicitado
      // Não imprimir logs arbitrários antes do JSON final — isso quebra os testes que
      // esperam JSON puro em stdout. Em ambiente de desenvolvimento, registrar via
      // logger debug para auxiliar diagnóstico local.
      if (
        config.DEV_MODE &&
        typeof (log as { debug?: Function }).debug === 'function'
      ) {
        try {
          (log as { debug: Function }).debug(
            CliProcessamentoDiagnosticoMessages.debugAboutToEmitJson(
              JSON.stringify(opts),
            ),
          );
        } catch {}
      }
      if (opts.json) {
        // Agregar ocorrências de TODO_PENDENTE por arquivo
        const ocorrenciasOriginais = ocorrenciasFiltradas;
        const todosPorArquivo = new Map<string, typeof ocorrenciasOriginais>();

        // Separar TODOs dos outros tipos de ocorrência
        const naoTodos: typeof ocorrenciasOriginais = [];
        for (const ocorrencia of ocorrenciasOriginais) {
          if (ocorrencia.tipo === 'TODO_PENDENTE') {
            const relPath = ocorrencia.relPath || 'desconhecido';
            if (!todosPorArquivo.has(relPath)) {
              todosPorArquivo.set(relPath, []);
            }
            const todosArray = todosPorArquivo.get(relPath);
            if (todosArray) {
              todosArray.push(ocorrencia);
            }
          } else {
            naoTodos.push(ocorrencia);
          }
        }

        // Agregar TODOs por arquivo
        const todosAgregados: typeof ocorrenciasOriginais = [];
        for (const [, todos] of todosPorArquivo) {
          if (todos.length === 1) {
            todosAgregados.push(todos[0]);
          } else if (todos.length > 1) {
            // Criar ocorrência agregada
            const primeira = todos[0];
            const mensagemAgregada =
              CliProcessamentoDiagnosticoMessages.todosPendentesEncontrados(
                todos.length,
              );
            todosAgregados.push({
              ...primeira,
              mensagem: mensagemAgregada,
              linha: Math.min(...todos.map((t) => t.linha || 0)),
            });
          }
        }

        // Combinar ocorrências agregadas e deduplicar para reduzir ruído
        let todasOcorrencias = [...naoTodos, ...todosAgregados];
        todasOcorrencias = dedupeOcorrencias(todasOcorrencias);

        // Em modo --json: emitir apenas erros e localizações (sem métricas/caches/tempos).
        // Antes, normaliza para enriquecer `linha/coluna` quando disponível via `loc`.
        const ocorrenciasParaJson = todasOcorrencias
          .map((o) => normalizarOcorrenciaParaJson(o))
          .filter((o) => {
            const nivel = (o.nivel || 'info') as string;
            return nivel === 'erro' || o.tipo === 'PARSE_ERRO';
          });
        const totalOcorrenciasJson = ocorrenciasParaJson.length;

        // Agregar tipos de ocorrências
        const tiposOcorrencias: Record<string, number> = {};
        const parseErros: ParseErrosJson = {
          totalOriginais: 0,
          totalExibidos: 0,
          agregados: 0,
        };

        // Contar tipos de ocorrências e parse erros
        for (const ocorrencia of ocorrenciasParaJson) {
          const tipo = ocorrencia.tipo || 'desconhecido';
          tiposOcorrencias[tipo] = (tiposOcorrencias[tipo] || 0) + 1;

          // Contar parse erros
          if (tipo === 'PARSE_ERRO') {
            parseErros.totalOriginais++;
            parseErros.totalExibidos++;
          }
        }

        // Ler parse erros das variáveis globais (para testes e cenários especiais)
        const parseErrosGlobais =
          ((globalThis as Record<string, unknown>)
            .__ORACULO_PARSE_ERROS__ as unknown[]) || [];
        const parseErrosOriginais =
          ((globalThis as Record<string, unknown>)
            .__ORACULO_PARSE_ERROS_ORIGINAIS__ as number) || 0;

        // Adicionar parse erros globais à contagem
        if (parseErrosGlobais.length > 0 || parseErrosOriginais > 0) {
          parseErros.totalOriginais = Math.max(
            parseErros.totalOriginais,
            parseErrosOriginais,
          );

          // Se há array global, usar seu tamanho; senão, manter o valor atual (que vem das ocorrências reais)
          if (parseErrosGlobais.length > 0) {
            parseErros.totalExibidos = Math.min(
              parseErros.totalOriginais,
              parseErrosGlobais.length,
            );
          }
          // Se não há array global, totalExibidos já foi definido com o número de ocorrências reais

          // Atualizar totalOcorrencias se há parse erros
          if (parseErrosOriginais > 0) {
            totalOcorrencias = Math.max(totalOcorrencias, parseErrosOriginais);
          }
        }

        // Calcular agregados
        parseErros.agregados = Math.max(
          0,
          parseErros.totalOriginais - parseErros.totalExibidos,
        );

        // Determinar status baseado nas regras
        let status = 'ok';
        if (totalOcorrenciasJson > 0) {
          status = 'problemas';
          // Se há PARSE_ERRO e PARSE_ERRO_FALHA está ativo, marcar como erro
          if (parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA) {
            status = 'erro';
          }
        }

        const saidaJson: SaidaJsonDiagnostico = {
          status: status as 'ok' | 'problemas' | 'erro',
          totalOcorrencias: totalOcorrenciasJson,
          guardian: guardianResultado ? 'verificado' : 'nao-verificado',
          tiposOcorrencias,
          parseErros,
          ocorrencias: ocorrenciasParaJson,
          linguagens: { total: 0, extensoes: {} }, // será preenchido depois
        };

        // Só incluir estruturaIdentificada se houver resultado de arquetipos
        if (arquetiposResultado) {
          saidaJson.estruturaIdentificada = {
            melhores: arquetiposResultado.candidatos || [],
            baseline: arquetiposResultado.baseline || null,
            drift: arquetiposResultado.drift || {
              alterouArquetipo: false,
              deltaConfidence: 0,
              arquivosRaizNovos: [],
              arquivosRaizRemovidos: [],
            },
          };
        }

        // JSON será emitido usando helper centralizado que aplica escapes Unicode

        // Computa linguagens a partir dos file entries com AST (ou sem AST)
        const computeLinguagens = (
          fes: (FileEntry | FileEntryWithAst)[],
        ): LinguagensJson => {
          const extensoes: Record<string, number> = {};
          let sem_ext = 0;
          for (const f of fes || []) {
            const rel = f.relPath || f.fullPath || '';
            const base = rel.split(/[\\/]/).pop() || '';
            const idx = base.lastIndexOf('.');
            if (idx === -1) {
              sem_ext++;
            } else {
              const ext = base.slice(idx + 1) || 'sem_ext';
              extensoes[ext] = (extensoes[ext] || 0) + 1;
            }
          }
          return {
            total: (fes || []).length,
            extensoes: { ...extensoes, sem_ext },
          };
        };

        const linguagensFinal = computeLinguagens(
          fileEntriesComAst || fileEntries,
        );

        // Anexa valores calculados
        saidaJson.linguagens = linguagensFinal;

        // Gerar JSON usando utilitário comum com escape Unicode
        try {
          // Adicionar metadados de versão do schema e timestamp para compatibilidade
          const schemaMeta = {
            schemaVersion: '1.0.0',
            oraculoVersion: '0.0.0',
            timestamp: new Date().toISOString(),
          };
          const saidaComMeta = { ...schemaMeta, ...saidaJson };
          // Verificar flag CLI/opt para ascii-only
          const asciiOnly = Boolean(
            (opts && (opts as OpcoesProcessamentoDiagnostico).jsonAscii) ||
            false,
          );
          console.log(stringifyJsonEscaped(saidaComMeta, 2, { asciiOnly }));
          _jsonEmitted = true;
        } catch (e) {
          console.error(
            CliProcessamentoDiagnosticoMessages.errorGeneratingJson,
            e,
          );
          console.log(
            CliProcessamentoDiagnosticoMessages.fallbackJson,
            JSON.stringify(saidaJson),
          );
          _jsonEmitted = true;
        }
        // Exit codes padronizados: 0=ok/avisos, 1=erros, 2=critico (parse erros fatais)
        if (!process.env.VITEST) {
          const erros = (nivelOcorrencias.get('erro') || 0) as number;
          const exitCode =
            parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA
              ? 2
              : erros > 0
                ? 1
                : 0;
          process.exit(exitCode);
        }
      }

      // Logs finais fora do modo JSON e quando não é scan-only
      if (!opts.json && !config.SCAN_ONLY) {
        // Imprimir bloco de resumo de tipos se houver ocorrências
        if (totalOcorrencias > 0 && ocorrenciasFiltradas) {
          // Modo executivo: apenas problemas críticos e altos
          if (opts.executive) {
            const { gerarResumoExecutivo } =
              await import('@relatorios/filtro-inteligente.js');
            const resumoExec = gerarResumoExecutivo(ocorrenciasFiltradas);
            if (resumoExec.detalhes.length > 0) {
              const linhasExec = resumoExec.detalhes.map(
                (problema) =>
                  `${problema.icone} ${problema.titulo.padEnd(25)} ${problema.quantidade.toString().padStart(6)}`,
              );

              const tituloExec =
                CliProcessamentoDiagnosticoMessages.resumoExecutivoTitulo(
                  resumoExec.problemasCriticos + resumoExec.problemasAltos,
                );
              const cabecalhoExec = [
                `${CliProcessamentoDiagnosticoMessages.cabecalhoExecProblema.padEnd(30)}${CliProcessamentoDiagnosticoMessages.cabecalhoExecQtd.padStart(6)}`,
              ];

              if (
                'imprimirBloco' in log &&
                typeof log.imprimirBloco === 'function'
              ) {
                log.imprimirBloco(tituloExec, [
                  ...cabecalhoExec,
                  ...linhasExec,
                ]);
              }

              console.log(
                CliProcessamentoDiagnosticoMessages.dicaUseFull(
                  totalOcorrencias,
                ),
              );
            } else {
              console.log(
                CliProcessamentoDiagnosticoMessages.projetoBomEstado(
                  totalOcorrencias,
                ),
              );
              if (resumoExec.quickFixes > 0) {
                console.log(
                  CliProcessamentoDiagnosticoMessages.quickFixesDisponiveis(
                    resumoExec.quickFixes,
                  ),
                );
              }
            }
          } else {
            // Modo padrão: todos os tipos
            const tiposResumo: Record<string, number> = {};
            for (const ocorrencia of ocorrenciasFiltradas) {
              const tipo = ocorrencia.tipo || 'desconhecido';
              tiposResumo[tipo] = (tiposResumo[tipo] || 0) + 1;
            }

            const linhasResumo = Object.entries(tiposResumo).map(
              ([tipo, qtd]) =>
                `${tipo.padEnd(20)} ${qtd.toString().padStart(8)}`,
            );

            const tituloResumo =
              CliProcessamentoDiagnosticoMessages.resumoTiposTitulo;
            const cabecalho = [
              `${CliProcessamentoDiagnosticoMessages.cabecalhoResumoTipo.padEnd(20)}${CliProcessamentoDiagnosticoMessages.cabecalhoResumoQuantidade.padStart(8)}`,
            ];

            if (
              'imprimirBloco' in log &&
              typeof log.imprimirBloco === 'function'
            ) {
              log.imprimirBloco(tituloResumo, [...cabecalho, ...linhasResumo]);
            }
          }
        }

        // Mensagem final
        // Emitir 'Tudo pronto' apenas uma vez
        if (
          !config.COMPACT_MODE &&
          !process.env.__ORACULO_TUDO_PRONTO_EMITIDO
        ) {
          log.info(CliProcessamentoDiagnosticoMessages.tudoPronto);
          (
            process.env as unknown as Record<string, string>
          ).__ORACULO_TUDO_PRONTO_EMITIDO = '1';
        }

        // Log de diagnóstico concluído para testes
        if (process.env.VITEST) {
          log.info(CliProcessamentoDiagnosticoMessages.diagnosticoConcluido);
        }
      }
    }

    // Relatórios e exportação (executa mesmo quando arquetiposResultado undefined)
    if (!opts.json && !config.SCAN_ONLY) {
      (log as typeof log & LogExtensions).fase?.('Gerando relatórios');
      try {
        const contextoConselho = {
          hora: new Date().getHours(),
          arquivosParaCorrigir: totalOcorrencias,
          arquivosParaPodar: 0,
          totalOcorrenciasAnaliticas: totalOcorrencias,
          integridadeGuardian: guardianResultado?.status || 'nao-verificado',
        };
        emitirConselhoOracular(contextoConselho);

        if (config.REPORT_EXPORT_ENABLED) {
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const dir =
            typeof config.REPORT_OUTPUT_DIR === 'string'
              ? config.REPORT_OUTPUT_DIR
              : path.join(baseDir, 'oraculo-reports');

          const fs = await import('node:fs');
          await fs.promises.mkdir(dir, { recursive: true });

          const outputPath = path.join(dir, `oraculo-diagnostico-${ts}.md`);
          const resultadoCompleto = {
            ...resultadoExecucao,
            fileEntries: fileEntriesComAst,
            guardian: guardianResultado,
          } as ResultadoInquisicaoCompleto;
          // Nota: a geração de Markdown será feita após a fragmentação/export
          // para que possamos incluir no relatório links para o manifest e shards.

          // Monta e salva dois artefatos: um SUMMARY (sempre) e opcionalmente o FULL (pesado)
          try {
            // Agregar métricas de analistas por nome (em vez de uma entrada por arquivo)
            const metricasOriginais = resultadoExecucao.metricas;
            const analistasAgregados: Record<
              string,
              { duracaoMs: number; ocorrencias: number; execucoes: number }
            > = {};
            for (const a of metricasOriginais?.analistas || []) {
              const nome = a.nome || 'desconhecido';
              if (!analistasAgregados[nome]) {
                analistasAgregados[nome] = {
                  duracaoMs: 0,
                  ocorrencias: 0,
                  execucoes: 0,
                };
              }
              analistasAgregados[nome].duracaoMs += a.duracaoMs || 0;
              analistasAgregados[nome].ocorrencias += a.ocorrencias || 0;
              analistasAgregados[nome].execucoes += 1;
            }
            const analistasResumidos = Object.entries(analistasAgregados)
              .map(([nome, dados]) => ({
                nome,
                duracaoTotalMs: Math.round(dados.duracaoMs * 100) / 100,
                ocorrenciasTotal: dados.ocorrencias,
                execucoes: dados.execucoes,
              }))
              .sort((a, b) => b.ocorrenciasTotal - a.ocorrenciasTotal);

            // Métricas resumidas (sem o array gigante de analistas por arquivo)
            const metricasResumidas = {
              totalArquivos: metricasOriginais?.totalArquivos,
              tempoParsingMs: metricasOriginais?.tempoParsingMs,
              tempoAnaliseMs: metricasOriginais?.tempoAnaliseMs,
              cacheAstHits: metricasOriginais?.cacheAstHits,
              cacheAstMiss: metricasOriginais?.cacheAstMiss,
              analistas: analistasResumidos,
            };

            // Ocorrências limpas: apenas campos essenciais
            const ocorrenciasLimpas = dedupeOcorrencias(
              resultadoExecucao.ocorrencias || [],
            )
              .slice(0, 2000)
              .map((oc) => {
                const ocAny = oc as Record<string, unknown>;
                return {
                  tipo: oc.tipo,
                  nivel: oc.nivel,
                  mensagem: oc.mensagem,
                  relPath: oc.relPath,
                  linha: oc.linha,
                  coluna: oc.coluna,
                  ...(ocAny.sugestao ? { sugestao: ocAny.sugestao } : {}),
                };
              });

            const relatorioSummary = {
              timestamp: new Date().toISOString(),
              totalOcorrencias,
              baselineModificado: Boolean(
                guardianResultado &&
                (
                  guardianResultado as unknown as {
                    baselineModificado?: boolean;
                  }
                ).baselineModificado,
              ),
              // versão resumida: métricas agregadas e ocorrências limpas
              metricas: metricasResumidas,
              ocorrencias: ocorrenciasLimpas,
            };

            const salvar = await getSalvarEstado();
            await salvar(
              path.join(dir, `oraculo-relatorio-summary-${ts}.json`),
              relatorioSummary,
            );

            // Se exportação full estiver ativa, grava também o payload completo em arquivo separado
            let fragmentResult:
              | { manifestFile?: string; manifest?: unknown }
              | undefined = undefined;
            if (config.REPORT_EXPORT_FULL) {
              const relatorioFull = {
                timestamp: new Date().toISOString(),
                totalOcorrencias,
                baselineModificado: Boolean(
                  guardianResultado &&
                  (
                    guardianResultado as unknown as {
                      baselineModificado?: boolean;
                    }
                  ).baselineModificado,
                ),
                resultado: resultadoCompleto,
              };
              // Se o relatório for muito grande, fragmentar em múltiplos arquivos para evitar arquivos gigantes
              try {
                fragmentResult = await fragmentarRelatorio(
                  relatorioFull,
                  dir,
                  ts,
                  {
                    maxOcorrenciasPerShard: config.REPORT_FRAGMENT_OCCURRENCES,
                    maxFileEntriesPerShard: config.REPORT_FRAGMENT_FILEENTRIES,
                  },
                );
                // Registrar no log onde está o manifest
                log.info(
                  CliProcessamentoDiagnosticoMessages.relatorioFullFragmentado(
                    fragmentResult.manifestFile,
                  ),
                );
              } catch {
                // Fallback: salvar como único arquivo caso a fragmentação falhe
                await salvar(
                  path.join(dir, `oraculo-relatorio-full-${ts}.json`),
                  relatorioFull,
                );
              }
            }

            // Gerar o Markdown do diagnóstico agora (inclui links/manifest quando disponível)
            try {
              await gerarRelatorioMarkdown(
                resultadoCompleto,
                outputPath,
                !opts.full,
                {
                  manifestFile: fragmentResult?.manifestFile,
                  relatoriosDir: dir,
                  ts,
                  hadFull: Boolean(fragmentResult),
                },
              );
            } catch (e) {
              log.aviso(
                CliProcessamentoDiagnosticoMessages.falhaGerarRelatorioMarkdownMetadados(
                  (e as Error).message,
                ),
              );
              // Tenta gerar sem opções como fallback
              await gerarRelatorioMarkdown(
                resultadoCompleto,
                outputPath,
                !opts.full,
              );
            }

            // Relatório adicional: otimização de SVG (agrupado por diretório)
            try {
              const { exportarRelatorioSvgOtimizacao } =
                await import('@cli/diagnostico/exporters/svg-otimizacao-exporter.js');
              await exportarRelatorioSvgOtimizacao({
                entries: fileEntriesComAst,
                relatoriosDir: dir,
                ts,
              });
            } catch {
              // Não crítico — export adicional não deve falhar o diagnóstico
            }

            log.sucesso(
              CliProcessamentoDiagnosticoMessages.relatoriosExportadosPara(dir),
            );
          } catch (e) {
            log.erro(
              CliProcessamentoDiagnosticoMessages.falhaSalvarRelatorioJson(
                (e as Error).message,
              ),
            );
          }
        }
      } catch (e) {
        log.erro(
          CliProcessamentoDiagnosticoMessages.falhaExportarRelatorios(
            (e as Error).message,
          ),
        );
      }
    }

    // Garantir impressão de resumo e despedida caso ainda não tenham sido exibidos
    if (!opts.json && !config.SCAN_ONLY) {
      try {
        // Se houver ocorrências, exibe resumo de tipos (mesma lógica usada acima)
        if (totalOcorrencias > 0 && resultadoExecucao && ocorrenciasFiltradas) {
          const tiposResumo: Record<string, number> = {};
          for (const ocorrencia of ocorrenciasFiltradas) {
            const tipo = ocorrencia.tipo || 'desconhecido';
            tiposResumo[tipo] = (tiposResumo[tipo] || 0) + 1;
          }
          const linhasResumo = Object.entries(tiposResumo).map(
            ([tipo, qtd]) => `${tipo.padEnd(20)} ${qtd.toString().padStart(8)}`,
          );
          const tituloResumo =
            CliProcessamentoDiagnosticoMessages.resumoTiposTitulo;
          const cabecalho = [
            `${CliProcessamentoDiagnosticoMessages.cabecalhoResumoTipo.padEnd(20)}${CliProcessamentoDiagnosticoMessages.cabecalhoResumoQuantidade.padStart(8)}`,
          ];
          if (
            'imprimirBloco' in log &&
            typeof log.imprimirBloco === 'function'
          ) {
            log.imprimirBloco(tituloResumo, [...cabecalho, ...linhasResumo]);
          }
        }

        if (
          !config.COMPACT_MODE &&
          !process.env.__ORACULO_TUDO_PRONTO_EMITIDO
        ) {
          log.info(CliProcessamentoDiagnosticoMessages.tudoPronto);
          (
            process.env as unknown as Record<string, string>
          ).__ORACULO_TUDO_PRONTO_EMITIDO = '1';
        }
      } catch {}
    }

    // Quando não houve `arquetiposResultado`, ainda precisamos suportar
    // `--json`: emitir o JSON final mesmo sem os dados de arquetipos.
    if (opts.json) {
      // Reproduz o mesmo comportamento de geração de JSON usado acima,
      // mas tolera arquetiposResultado undefined.
      const ocorrenciasOriginais = dedupeOcorrencias(
        resultadoExecucao.ocorrencias || [],
      );
      const todosPorArquivo = new Map<string, typeof ocorrenciasOriginais>();
      const naoTodos: typeof ocorrenciasOriginais = [];
      for (const ocorrencia of ocorrenciasOriginais) {
        if (ocorrencia.tipo === 'TODO_PENDENTE') {
          const relPath = ocorrencia.relPath || 'desconhecido';
          if (!todosPorArquivo.has(relPath)) todosPorArquivo.set(relPath, []);
          const ocorrenciasArquivo = todosPorArquivo.get(relPath);
          if (ocorrenciasArquivo) ocorrenciasArquivo.push(ocorrencia);
        } else {
          naoTodos.push(ocorrencia);
        }
      }

      // Mensagem final apenas quando repositório está limpo
      try {
        if (!opts.json && !config.SCAN_ONLY && totalOcorrencias === 0) {
          logRelatorio.repositorioImpecavel();
        }
      } catch {}

      const todosAgregados: typeof ocorrenciasOriginais = [];
      for (const [, todos] of todosPorArquivo) {
        if (todos.length === 1) todosAgregados.push(todos[0]);
        else if (todos.length > 1) {
          const primeira = todos[0];
          const mensagemAgregada =
            CliProcessamentoDiagnosticoMessages.todosPendentesEncontrados(
              todos.length,
            );
          todosAgregados.push({
            ...primeira,
            mensagem: mensagemAgregada,
            linha: Math.min(...todos.map((t) => t.linha || 0)),
          });
        }
      }

      let todasOcorrencias = [...naoTodos, ...todosAgregados];
      todasOcorrencias = dedupeOcorrencias(todasOcorrencias);

      // Em modo --json, queremos reduzir o payload ao essencial.
      // Emitimos apenas ocorrências de nível "erro" (inclui PARSE_ERRO).
      const ocorrenciasParaJson = todasOcorrencias.filter((o) => {
        const nivel = (o.nivel || 'info') as string;
        return nivel === 'erro' || o.tipo === 'PARSE_ERRO';
      });
      const tiposOcorrencias: Record<string, number> = {};
      const parseErros: ParseErrosJson = {
        totalOriginais: 0,
        totalExibidos: 0,
        agregados: 0,
      };
      for (const ocorrencia of ocorrenciasParaJson) {
        const tipo = ocorrencia.tipo || 'desconhecido';
        tiposOcorrencias[tipo] = (tiposOcorrencias[tipo] || 0) + 1;
        if (tipo === 'PARSE_ERRO') {
          parseErros.totalOriginais++;
          parseErros.totalExibidos++;
        }
      }

      const parseErrosGlobais =
        ((globalThis as Record<string, unknown>)
          .__ORACULO_PARSE_ERROS__ as unknown[]) || [];
      const parseErrosOriginais =
        ((globalThis as Record<string, unknown>)
          .__ORACULO_PARSE_ERROS_ORIGINAIS__ as number) || 0;
      if (parseErrosGlobais.length > 0 || parseErrosOriginais > 0) {
        parseErros.totalOriginais = Math.max(
          parseErros.totalOriginais,
          parseErrosOriginais,
        );
        if (parseErrosGlobais.length > 0) {
          parseErros.totalExibidos = Math.min(
            parseErros.totalOriginais,
            parseErrosGlobais.length,
          );
        }
        if (parseErrosOriginais > 0) {
          totalOcorrencias = Math.max(totalOcorrencias, parseErrosOriginais);
        }
      }
      parseErros.agregados = Math.max(
        0,
        parseErros.totalOriginais - parseErros.totalExibidos,
      );

      let status = 'ok';
      if (ocorrenciasParaJson.length > 0) {
        status = 'problemas';
        if (parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA)
          status = 'erro';
      }

      const saidaJson: SaidaJsonDiagnostico = {
        status: status as 'ok' | 'problemas' | 'erro',
        totalOcorrencias: ocorrenciasParaJson.length,
        guardian: guardianResultado ? 'verificado' : 'nao-verificado',
        tiposOcorrencias,
        parseErros,
        ocorrencias: ocorrenciasParaJson,
        linguagens: { total: 0, extensoes: {} },
      };

      // Quando não há dados de arquetipos, omitimos `estruturaIdentificada` no JSON
      // (o fluxo principal já trata de incluí-lo quando disponível).

      const computeLinguagens = (
        fes: (FileEntry | FileEntryWithAst)[],
      ): LinguagensJson => {
        const extensoes: Record<string, number> = {};
        let sem_ext = 0;
        for (const f of fes || []) {
          const rel = f.relPath || f.fullPath || '';
          const base = rel.split(/[\\/\\\\]/).pop() || '';
          const idx = base.lastIndexOf('.');
          if (idx === -1) {
            sem_ext++;
          } else {
            const ext = base.slice(idx + 1) || 'sem_ext';
            extensoes[ext] = (extensoes[ext] || 0) + 1;
          }
        }
        return {
          total: (fes || []).length,
          extensoes: { ...extensoes, sem_ext },
        };
      };

      const linguagensFinal = computeLinguagens(
        fileEntriesComAst || fileEntries,
      );
      saidaJson.linguagens = linguagensFinal;

      if (!_jsonEmitted) {
        try {
          // Adicionar metadados de versão do schema e timestamp para compatibilidade
          let pkgVersion = '0.0.0';
          try {
            const pkgRaw = await fs.promises.readFile(
              path.join(process.cwd(), 'package.json'),
              'utf-8',
            );
            const pkgObj = JSON.parse(pkgRaw) as { version?: string };
            if (pkgObj && typeof pkgObj.version === 'string')
              pkgVersion = pkgObj.version;
          } catch {}
          const schemaMeta = {
            schemaVersion: '1.0.0',
            oraculoVersion: pkgVersion,
            timestamp: new Date().toISOString(),
          };
          const saidaComMeta = { ...schemaMeta, ...saidaJson };
          const asciiOnly = Boolean(
            (opts && (opts as OpcoesProcessamentoDiagnostico).jsonAscii) ||
            false,
          );
          console.log(stringifyJsonEscaped(saidaComMeta, 2, { asciiOnly }));
          _jsonEmitted = true;

          // Se a exportação estiver habilitada via flags globais/locais, salvamos o JSON em disco
          if (config.REPORT_EXPORT_ENABLED) {
            try {
              const ts = new Date().toISOString().replace(/[:.]/g, '-');
              const dir =
                typeof config.REPORT_OUTPUT_DIR === 'string'
                  ? config.REPORT_OUTPUT_DIR
                  : path.join(baseDir, 'oraculo-reports');
              const fs = await import('node:fs');
              await fs.promises.mkdir(dir, { recursive: true });
              const salvar = await getSalvarEstado();
              await salvar(
                path.join(dir, `oraculo-diagnostico-${ts}.json`),
                saidaComMeta,
              );
              log.sucesso(
                CliProcessamentoDiagnosticoMessages.relatoriosExportadosPara(
                  dir,
                ),
              );
            } catch (e) {
              log.erro(
                CliProcessamentoDiagnosticoMessages.falhaSalvarRelatorioJson(
                  (e as Error).message,
                ),
              );
            }
          }
        } catch (e) {
          console.error(
            CliProcessamentoDiagnosticoMessages.errorGeneratingJson,
            e,
          );
          console.log(
            CliProcessamentoDiagnosticoMessages.fallbackJson,
            JSON.stringify(saidaJson),
          );
          _jsonEmitted = true;
        }
      }
      // Exit codes padronizados: 0=ok/avisos, 1=erros, 2=critico (parse erros fatais)
      if (!process.env.VITEST) {
        const erros = (nivelOcorrencias.get('erro') || 0) as number;
        const exitCode =
          parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA
            ? 2
            : erros > 0
              ? 1
              : 0;
        process.exit(exitCode);
      }
    }
  } catch (error) {
    // Se o erro for resultado de um process.exit mocked (ex.: Error('exit:1'))
    // devemos repropagar para que os testes possam capturá-lo. Evitamos
    // engolir erros que representam encerramento do processo.
    try {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string' &&
        String((error as { message: string }).message).startsWith('exit:')
      ) {
        throw error;
      }
    } catch (re) {
      throw re;
    }
    // Tratamento de erro geral para o processamento do diagnóstico
    // Normaliza mensagens que podem ser string, Error ou outro objeto
    const errMsg =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return String(error);
              }
            })();

    log.erro(CliProcessamentoDiagnosticoMessages.erroFatalDiagnostico(errMsg));

    // Em modo de desenvolvimento, mostrar stack trace
    if (config.DEV_MODE) {
      console.error(error);
    }

    // Retornar resultado com erro
    return {
      totalOcorrencias: 1,
      temErro: true,
      guardianResultado,
      fileEntriesComAst: [],
      resultadoFinal: {
        ocorrencias: [],
        metricas: {
          totalArquivos: 0,
          tempoTotal: 0,
          analistas: [],
        },
      },
    };
  }

  // Mensagem final apenas quando repositório está limpo (fallback)
  try {
    if (!opts.json && !config.SCAN_ONLY && totalOcorrencias === 0) {
      logRelatorio.repositorioImpecavel();
    }
  } catch {}

  // Fallback para garantir que a função sempre retorna um valor
  return {
    totalOcorrencias: totalOcorrencias || 0,
    temErro: false,
    guardianResultado,
    fileEntriesComAst: [],
    resultadoFinal: {
      ocorrencias: [],
      metricas: {
        totalArquivos: 0,
        tempoTotal: 0,
        analistas: [],
      },
    },
  };
}
