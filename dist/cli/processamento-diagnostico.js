import fs from 'node:fs';
import path from 'node:path';
import { detectarArquetipos } from '../analistas/detectores/detector-arquetipos.js';
import { normalizarOcorrenciaParaJson } from './diagnostico/normalizar-ocorrencias-json.js';
import { exibirBlocoFiltros, listarAnalistas, } from './processing/display.js';
import { configurarFiltros, expandIncludes, processPatternGroups, processPatternListAchatado, } from './processing/filters.js';
import chalk from '../core/config/chalk-safe.js';
import { config } from '../core/config/config.js';
import { executarInquisicao, iniciarInquisicao, prepararComAst, registrarUltimasMetricas, } from '../core/execution/inquisidor.js';
import { CliProcessamentoDiagnosticoMessages } from '../core/messages/cli/cli-processamento-diagnostico-messages.js';
import { ExcecoesMessages } from '../core/messages/core/excecoes-messages.js';
import { log, logGuardian, logRelatorio, logSistema, MENSAGENS_AUTOFIX, } from '../core/messages/index.js';
import { aplicarSupressaoOcorrencias } from '../core/parsing/filters.js';
import { scanSystemIntegrity } from '../guardian/sentinela.js';
import { emitirConselhoOracular } from '../relatorios/conselheiro-oracular.js';
import { gerarRelatorioMarkdown } from '../relatorios/gerador-relatorio.js';
import fragmentarRelatorio from '../shared/data-processing/fragmentar-relatorio.js';
import { stringifyJsonEscaped } from '../shared/data-processing/json.js';
import { dedupeOcorrencias } from '../shared/data-processing/ocorrencias.js';
import { asTecnicas, converterResultadoGuardian, IntegridadeStatus, } from '../types/index.js';
let salvarEstado;
async function getSalvarEstado() {
    if (salvarEstado)
        return salvarEstado;
    const candidates = process.env.VITEST
        ? [
            '@shared/persistence/persistencia.js',
            '@shared/persistence/persistencia.ts',
        ]
        : ['@shared/persistence/persistencia.js'];
    for (const p of candidates) {
        try {
            const mod = await import(p).catch(() => undefined);
            if (mod && typeof mod.salvarEstado === 'function') {
                salvarEstado = mod.salvarEstado;
                break;
            }
        }
        catch { }
    }
    if (!salvarEstado) {
        const mod = await import('../shared/persistence/persistencia.js');
        salvarEstado = mod.salvarEstado;
    }
    return salvarEstado;
}
export { configurarFiltros, getDefaultExcludes, } from './processing/filters.js';
const DETECT_TIMEOUT_MS = process.env.VITEST ? 1000 : 30000;
async function detectarArquetiposComTimeout(ctx, baseDir, options) {
    try {
        const detectPromise = detectarArquetipos(ctx, baseDir, options).catch((e) => {
            try {
                if (config.DEV_MODE &&
                    typeof log.erro === 'function') {
                    const msg = e instanceof Error ? e.message : String(e);
                    log.erro(`Falha detector arquetipos: ${msg}`);
                }
            }
            catch { }
            return undefined;
        });
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(undefined), DETECT_TIMEOUT_MS));
        return (await Promise.race([detectPromise, timeoutPromise]));
    }
    catch {
        return undefined;
    }
}
export async function processarDiagnostico(opts) {
    config.GUARDIAN_ENABLED = opts.guardianCheck ?? false;
    config.VERBOSE = opts.full ?? false;
    if (opts.compact !== undefined) {
        config.COMPACT_MODE = Boolean(opts.compact);
    }
    else {
        config.COMPACT_MODE = !opts.full;
    }
    if (opts.logLevel &&
        ['erro', 'aviso', 'info', 'debug'].includes(opts.logLevel)) {
        config.LOG_LEVEL = opts.logLevel;
    }
    const includeGroupsRaw = processPatternGroups(opts.include);
    const includeGroupsExpanded = includeGroupsRaw.map((g) => expandIncludes(g));
    const includeListFlat = includeGroupsExpanded.flat();
    const excludeList = processPatternListAchatado(opts.exclude);
    const incluiNodeModules = includeListFlat.some((p) => /node_modules/.test(p));
    exibirBlocoFiltros(includeGroupsExpanded, includeListFlat, excludeList, incluiNodeModules);
    configurarFiltros(includeGroupsRaw, includeListFlat, excludeList, incluiNodeModules);
    let iniciouDiagnostico = false;
    const baseDir = process.cwd();
    let guardianResultado;
    let fileEntries = [];
    let totalOcorrencias = 0;
    let _jsonEmitted = false;
    if (opts.listarAnalistas && !opts.json) {
        await listarAnalistas();
    }
    try {
        if (opts.json) {
        }
        else if (!iniciouDiagnostico && !config.COMPACT_MODE) {
            log.fase?.('Iniciando diagnóstico completo');
            iniciouDiagnostico = true;
        }
        else if (!iniciouDiagnostico && config.COMPACT_MODE) {
            log.fase?.('Diagnóstico (modo compacto)');
            iniciouDiagnostico = true;
        }
        log.fase?.('Varredura');
        const leituraInicial = await iniciarInquisicao(baseDir, {
            incluirMetadados: false,
            skipExec: true,
        });
        fileEntries = leituraInicial.fileEntries;
        if (opts.criarArquetipo) {
            try {
                const norm = (p) => p.replace(/\\/g, '/');
                const dirSet = new Set();
                const arquivosRaiz = [];
                for (const fe of fileEntries) {
                    const rel = norm(fe.relPath || fe.fullPath || '');
                    if (!rel)
                        continue;
                    if (!rel.includes('/')) {
                        arquivosRaiz.push(rel);
                    }
                    const parts = rel.split('/');
                    if (parts.length > 1) {
                        for (let i = 1; i < parts.length; i++) {
                            const d = parts.slice(0, i).join('/');
                            if (d)
                                dirSet.add(d);
                        }
                    }
                }
                let nomeProjeto = path.basename(baseDir);
                try {
                    const pkg = fileEntries.find((fe) => /(^|[\\/])package\.json$/.test(fe.relPath || fe.fullPath));
                    if (pkg && typeof pkg.content === 'string' && pkg.content.trim()) {
                        const parsed = JSON.parse(pkg.content);
                        if (parsed &&
                            typeof parsed.name === 'string' &&
                            parsed.name.trim()) {
                            nomeProjeto = parsed.name.trim();
                        }
                    }
                    else {
                        const pkgPath = path.join(baseDir, 'package.json');
                        try {
                            const raw = await fs.promises.readFile(pkgPath, 'utf-8');
                            const parsed = JSON.parse(raw);
                            if (parsed &&
                                typeof parsed.name === 'string' &&
                                parsed.name.trim()) {
                                nomeProjeto = parsed.name.trim();
                            }
                        }
                        catch { }
                    }
                }
                catch { }
                const estruturaDetectada = Array.from(dirSet);
                const { criarTemplateArquetipoPersonalizado, salvarArquetipoPersonalizado, } = await import('../analistas/js-ts/arquetipos-personalizados.js');
                const arquetipo = criarTemplateArquetipoPersonalizado(nomeProjeto, estruturaDetectada, arquivosRaiz, 'generico');
                if (opts.salvarArquetipo) {
                    await salvarArquetipoPersonalizado(arquetipo, baseDir);
                }
                else if (config.VERBOSE) {
                    log.info(CliProcessamentoDiagnosticoMessages.templateArquetipoPreview);
                }
            }
            catch (e) {
                log.aviso(`Falha ao gerar/salvar arquétipo personalizado: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        if (config.GUARDIAN_ENABLED) {
            log.fase?.('Verificando integridade do Oráculo');
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
            }
            catch (err) {
                logGuardian.bloqueado();
                if (config.GUARDIAN_ENFORCE_PROTECTION &&
                    typeof err === 'object' &&
                    err &&
                    'detalhes' in err &&
                    Array.isArray(err.detalhes)) {
                    err.detalhes.forEach((d) => {
                        logGuardian.aviso(d);
                    });
                    if (!process.env.VITEST) {
                        try {
                            process.exit(1);
                        }
                        catch (e) {
                            throw e;
                        }
                        throw new Error(ExcecoesMessages.exit1);
                    }
                }
                else {
                    logGuardian.modoPermissivo();
                }
            }
        }
        if (config.SCAN_ONLY) {
            log.info(chalk.bold(`\n`));
            logGuardian.scanOnly(fileEntries.length);
            if (config.REPORT_EXPORT_ENABLED) {
                try {
                    const ts = new Date().toISOString().replace(/[:.]/g, '-');
                    const dir = typeof config.REPORT_OUTPUT_DIR === 'string'
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
                    log.sucesso(CliProcessamentoDiagnosticoMessages.relatorioScanSalvo(dir));
                }
                catch (e) {
                    const msg = CliProcessamentoDiagnosticoMessages.falhaExportarRelatorioScanOnly(e.message);
                    log.erro(msg);
                }
            }
            if (opts.json) {
                console.log(JSON.stringify({
                    modo: 'scan-only',
                    totalArquivos: fileEntries.length,
                }));
            }
            if (!process.env.VITEST && !opts.json)
                process.exit(0);
            else if (!process.env.VITEST && opts.json)
                process.exitCode = 0;
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
        const fastMode = Boolean(opts['fast']);
        log.fase?.('Preparando AST');
        let fileEntriesComAst = await prepararComAst(fileEntries, baseDir);
        if (fastMode) {
            fileEntriesComAst = fileEntriesComAst.filter((fe) => {
                const rel = (fe.relPath || fe.fullPath || '')
                    .replace(/\\/g, '/')
                    .toLowerCase();
                const isTest = /(^|\/)tests?(\/|\.)/.test(rel) ||
                    /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(rel) ||
                    /__tests__/.test(rel);
                const isConfig = /config|\.config\.|\.rc\.|package\.json|tsconfig|eslint|prettier|vitest|jest|babel/.test(rel);
                const isSrc = /(^|\/)src\//.test(rel);
                return isSrc && !isTest && !isConfig;
            });
        }
        const arquetiposResultado = await detectarArquetiposComTimeout({ arquivos: fileEntriesComAst, baseDir }, baseDir, {
            quiet: opts.json,
        });
        const registro = (await import('../analistas/registry/registry.js'))
            .registroAnalistas;
        let tecnicas = asTecnicas(registro);
        if (fastMode) {
            const fmIncludeSrc = config.fastMode &&
                config.fastMode;
            const includeList = Array.isArray(fmIncludeSrc?.analystsInclude)
                ? fmIncludeSrc
                    .analystsInclude
                : [];
            const fmExcludeSrc = config.fastMode &&
                config.fastMode;
            const excludeList = Array.isArray(fmExcludeSrc?.analystsExclude)
                ? fmExcludeSrc
                    .analystsExclude
                : [];
            tecnicas = asTecnicas(registro.filter((a) => {
                const nomeRaw = a.nome || '';
                const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const nome = norm(nomeRaw);
                const matchInclude = includeList.length
                    ? includeList.some((n) => {
                        const nn = norm(n);
                        return (nome.includes(nn) ||
                            nomeRaw.toLowerCase().includes(n.toLowerCase()));
                    })
                    : true;
                const matchExclude = excludeList.some((n) => {
                    const nn = norm(n);
                    return (nome.includes(nn) ||
                        nomeRaw.toLowerCase().includes(n.toLowerCase()));
                });
                return matchInclude && !matchExclude;
            }));
        }
        log.fase?.('Executando analistas');
        try {
            const verifyCycles = Boolean(opts['verifyCycles'] ||
                config['SPECIAL_VERIFY_CYCLES']);
            config['SPECIAL_VERIFY_CYCLES'] =
                verifyCycles;
        }
        catch { }
        const resultadoExecucao = await executarInquisicao(fileEntriesComAst, tecnicas, baseDir, converterResultadoGuardian(guardianResultado), {
            verbose: config.VERBOSE,
            compact: config.COMPACT_MODE,
            fast: opts.fast ?? false,
        });
        registrarUltimasMetricas(resultadoExecucao.metricas);
        let ocorrenciasFiltradas = dedupeOcorrencias(resultadoExecucao.ocorrencias || []);
        const trustCompiler = Boolean(opts['trustCompiler'] ||
            config['SPECIAL_TRUST_COMPILER']);
        if (trustCompiler) {
            try {
                const hasTs = fs.existsSync(path.join(baseDir, 'tsconfig.json'));
                let tsOk = true;
                if (hasTs) {
                    tsOk = true;
                }
                if (tsOk) {
                    ocorrenciasFiltradas = ocorrenciasFiltradas.filter((o) => {
                        const regra = o.tipo || '';
                        const cobertas = [/import.*nao.*usado/i, /tipo-inseguro.*unknown/i];
                        return !cobertas.some((r) => r.test(regra));
                    });
                }
            }
            catch { }
        }
        try {
            const byLoc = new Map();
            for (const o of ocorrenciasFiltradas) {
                const key = `${o.relPath || ''}:${o.linha || 0}`;
                const tipo = String(o.tipo || '');
                if (!byLoc.has(key))
                    byLoc.set(key, { tipos: new Set(), items: [] });
                const entry = byLoc.get(key);
                if (!entry)
                    continue;
                entry.tipos.add(tipo);
                entry.items.push(o);
            }
            for (const [, entry] of byLoc) {
                const tipos = Array.from(entry.tipos);
                const hasTypeUnsafe = tipos.some((t) => t.startsWith('tipo-inseguro'));
                const hasComplexity = tipos.some((t) => /complexidade|funcoes-longas/i.test(t));
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
        }
        catch { }
        ocorrenciasFiltradas = aplicarSupressaoOcorrencias(ocorrenciasFiltradas, config || undefined);
        const totalOcorrenciasProcessadas = ocorrenciasFiltradas.length;
        if (opts.fix && !opts.autoFix) {
            opts.autoFix = true;
            logSistema.processamentoFixDetectada();
        }
        if (opts.fixSafe && !opts.autoFixConservative) {
            opts.autoFixConservative = true;
            opts.autoFix = true;
            log.info(MENSAGENS_AUTOFIX.flags.fixSafe);
        }
        if (opts.autoFix) {
            try {
                const { findQuickFixes, applyQuickFix } = await import('../core/config/auto/fix-config.js');
                const { getAutoFixConfig } = await import('../core/config/auto/auto-fix-config.js');
                let autoFixMode = opts.autoFixMode || 'balanced';
                if (opts.autoFixConservative) {
                    autoFixMode = 'conservative';
                    opts.autoFix = true;
                }
                const autoFixConfig = getAutoFixConfig(autoFixMode);
                if (autoFixMode === 'conservative') {
                    log.info(MENSAGENS_AUTOFIX.logs.modoConservador);
                }
                else if (autoFixMode === 'aggressive') {
                    log.aviso(CliProcessamentoDiagnosticoMessages.autoFixModoAgressivo);
                }
                const quickFixesDisponiveis = ocorrenciasFiltradas.filter((occ) => occ.tipo === 'auto-fix-disponivel' ||
                    occ.tipo === 'QUICK_FIX_DISPONIVEL');
                if (quickFixesDisponiveis.length === 0) {
                    logSistema.autoFixNenhumaCorrecao();
                }
                else {
                    logSistema.autoFixAplicando(autoFixMode);
                    let arquivosCorrigidos = 0;
                    let totalCorrecoes = 0;
                    let correcoesPuladas = 0;
                    const correcoesPorArquivo = new Map();
                    for (const fix of quickFixesDisponiveis) {
                        const arquivo = fix.relPath || fix.arquivo;
                        if (!arquivo)
                            continue;
                        if (!correcoesPorArquivo.has(arquivo)) {
                            correcoesPorArquivo.set(arquivo, []);
                        }
                        correcoesPorArquivo.get(arquivo)?.push(fix);
                    }
                    const maxFixesPerFile = autoFixConfig?.maxFixesPerFile ?? Infinity;
                    for (const [arquivo, _fixes] of correcoesPorArquivo) {
                        try {
                            const fileEntry = fileEntriesComAst.find((fe) => fe.relPath === arquivo || fe.fullPath === arquivo);
                            if (!fileEntry || typeof fileEntry.content !== 'string') {
                                logSistema.autoFixArquivoNaoEncontrado(arquivo);
                                continue;
                            }
                            let codigoCorrigido = fileEntry.content;
                            let corrigiuAlgo = false;
                            let correcoesPorArquivoCount = 0;
                            const quickFixesEncontrados = findQuickFixes(codigoCorrigido, undefined, autoFixConfig, arquivo);
                            for (const quickFix of quickFixesEncontrados) {
                                const maxFixesPerFile = autoFixConfig?.maxFixesPerFile ?? Infinity;
                                if (correcoesPorArquivoCount >= maxFixesPerFile) {
                                    correcoesPuladas += quickFix.matches.length;
                                    break;
                                }
                                for (const match of quickFix.matches) {
                                    try {
                                        const novocodigo = applyQuickFix(codigoCorrigido, quickFix, match);
                                        if (novocodigo !== codigoCorrigido) {
                                            codigoCorrigido = novocodigo;
                                            corrigiuAlgo = true;
                                            totalCorrecoes++;
                                            correcoesPorArquivoCount++;
                                            if (config.VERBOSE) {
                                                logSistema.autoFixAplicada(quickFix.title, quickFix.confidence);
                                            }
                                        }
                                    }
                                    catch (err) {
                                        logSistema.autoFixFalha(quickFix.id, err instanceof Error ? err.message : String(err));
                                    }
                                    if (correcoesPorArquivoCount >= maxFixesPerFile) {
                                        break;
                                    }
                                }
                            }
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
                        }
                        catch (err) {
                            log.erro(`❌ Erro ao corrigir ${arquivo}: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                    if (arquivosCorrigidos > 0) {
                        const estatisticas = [
                            `${totalCorrecoes} correções aplicadas em ${arquivosCorrigidos} arquivo(s)`,
                        ];
                        if (correcoesPuladas > 0) {
                            estatisticas.push(`${correcoesPuladas} correções puladas (limite por arquivo: ${maxFixesPerFile === Infinity ? '∞' : maxFixesPerFile})`);
                        }
                        if (autoFixMode === 'conservative') {
                            estatisticas.push('modo conservador (alta confiança apenas)');
                        }
                        logSistema.autoFixEstatisticas(estatisticas);
                        if (process.env.ORACULO_ESLINT_VALIDATION !== '0' &&
                            autoFixConfig.validateAfterFix) {
                            try {
                                log.info(MENSAGENS_AUTOFIX.logs.validacaoEslint);
                                const { spawn } = await import('node:child_process');
                                const arquivosParaValidar = Array.from(correcoesPorArquivo.keys());
                                if (arquivosParaValidar.length > 0) {
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
                                            }
                                            else {
                                                if (config.VERBOSE && stdout) {
                                                    logSistema.processamentoESLintOutput(stdout);
                                                }
                                                logSistema.autoFixESLintAjustes();
                                                resolve(void 0);
                                            }
                                        });
                                        proc.on('error', (err) => {
                                            logSistema.autoFixESLintFalha(err.message);
                                            resolve(void 0);
                                        });
                                    });
                                }
                            }
                            catch (err) {
                                log.aviso(`⚠️  Validação ESLint não executada: ${err instanceof Error ? err.message : String(err)}`);
                            }
                        }
                    }
                    else {
                        logSistema.autoFixNenhumaAplicada();
                    }
                    const ocorrenciasSemQuickFixes = ocorrenciasFiltradas.filter((occ) => occ.tipo !== 'auto-fix-disponivel' &&
                        occ.tipo !== 'QUICK_FIX_DISPONIVEL');
                    totalOcorrencias = ocorrenciasSemQuickFixes.length;
                }
            }
            catch (err) {
                log.erro(`❌ Falha ao executar auto-fix: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        else {
            totalOcorrencias = ocorrenciasFiltradas.length;
        }
        const tiposOcorrencias = new Map();
        const nivelOcorrencias = new Map();
        ocorrenciasFiltradas.forEach((ocorrencia) => {
            const tipo = ocorrencia.tipo || 'DESCONHECIDO';
            const nivel = ocorrencia.nivel || 'info';
            tiposOcorrencias.set(tipo, (tiposOcorrencias.get(tipo) || 0) + 1);
            nivelOcorrencias.set(nivel, (nivelOcorrencias.get(nivel) || 0) + 1);
        });
        if (tiposOcorrencias.size > 0 && !opts.json) {
            if (opts.executive) {
                try {
                    const criticos = nivelOcorrencias.get('erro') || 0;
                    const altos = nivelOcorrencias.get('alto') || 0;
                    const total = totalOcorrenciasProcessadas;
                    const arquivoCount = new Map();
                    for (const oc of ocorrenciasFiltradas) {
                        const pathKey = (oc.relPath ||
                            oc.arquivo ||
                            'desconhecido');
                        const nivel = oc.nivel || 'info';
                        if (nivel === 'erro' || nivel === 'alto') {
                            arquivoCount.set(pathKey, (arquivoCount.get(pathKey) || 0) + 1);
                        }
                    }
                    const topArquivos = Array.from(arquivoCount.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);
                    const header = CliProcessamentoDiagnosticoMessages.resumoExecutivoHeader(total, criticos, altos);
                    if (typeof log.imprimirBloco ===
                        'function') {
                        const linhas = [
                            CliProcessamentoDiagnosticoMessages.resumoExecutivoCriticos(criticos),
                            CliProcessamentoDiagnosticoMessages.resumoExecutivoAltos(altos),
                            CliProcessamentoDiagnosticoMessages.linhaEmBranco,
                            CliProcessamentoDiagnosticoMessages.resumoExecutivoTopArquivosErrosAltos,
                            ...topArquivos.map(([f, c]) => CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(f, c)),
                            CliProcessamentoDiagnosticoMessages.linhaEmBranco,
                            CliProcessamentoDiagnosticoMessages.resumoExecutivoAcaoSugerida,
                        ];
                        log.imprimirBloco(header, linhas);
                    }
                    else {
                        log.info(header);
                        if (topArquivos.length > 0) {
                            log.info(CliProcessamentoDiagnosticoMessages.resumoExecutivoTopArquivosErrosAltos);
                            topArquivos.forEach(([f, c]) => log.info(CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(f, c)));
                        }
                        log.info(CliProcessamentoDiagnosticoMessages.resumoExecutivoAcaoSugerida);
                    }
                }
                catch {
                }
            }
            else if (!config.VERBOSE && !config.DEV_MODE) {
                logSistema.processamentoResumoOcorrencias(totalOcorrenciasProcessadas);
                const topTipos = Array.from(tiposOcorrencias.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                console.log(CliProcessamentoDiagnosticoMessages.linhaEmBranco);
                console.log(CliProcessamentoDiagnosticoMessages.principaisTiposTitulo);
                topTipos.forEach(([tipo, count]) => {
                    console.log(CliProcessamentoDiagnosticoMessages.principaisTiposLinha(tipo, count));
                });
                try {
                    const arquivoCount = new Map();
                    for (const oc of ocorrenciasFiltradas) {
                        const pathKey = (oc.relPath ||
                            oc.arquivo ||
                            'desconhecido');
                        arquivoCount.set(pathKey, (arquivoCount.get(pathKey) || 0) + 1);
                    }
                    const topArquivos = Array.from(arquivoCount.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);
                    if (topArquivos.length > 0) {
                        console.log(CliProcessamentoDiagnosticoMessages.linhaEmBranco);
                        console.log(CliProcessamentoDiagnosticoMessages.topArquivosTitulo);
                        topArquivos.forEach(([f, c]) => console.log(CliProcessamentoDiagnosticoMessages.topArquivosLinha(f, c)));
                    }
                }
                catch {
                }
                console.log(CliProcessamentoDiagnosticoMessages.linhaEmBranco);
                logSistema.processamentoDicasContextuais();
                const totalTodos = tiposOcorrencias.get('TODO_PENDENTE') || 0;
                const totalQuickFixes = (tiposOcorrencias.get('QUICK_FIX_DISPONIVEL') || 0) +
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
                }
                else if (totalQuickFixes > 0) {
                    logSistema.processamentoQuickFixesMuitos(totalQuickFixes);
                    logSistema.processamentoQuickFixesComando();
                    logSistema.processamentoQuickFixesExecutar();
                }
                if (totalTodos > 50) {
                    logSistema.processamentoTodosMuitos(totalTodos);
                }
                else if (totalTodos > 0) {
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
            }
            else {
                logSistema.processamentoDetalhamentoOcorrencias(totalOcorrenciasProcessadas);
                log.info(CliProcessamentoDiagnosticoMessages.porTipoTitulo);
                Array.from(tiposOcorrencias.entries())
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([tipo, count]) => {
                    log.info(CliProcessamentoDiagnosticoMessages.porTipoLinha(tipo, count));
                });
                log.info(CliProcessamentoDiagnosticoMessages.porSeveridadeTitulo);
                Array.from(nivelOcorrencias.entries())
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([nivel, count]) => {
                    const emoji = nivel === 'erro' ? '🔴' : nivel === 'aviso' ? '🟡' : '🔵';
                    log.info(CliProcessamentoDiagnosticoMessages.porSeveridadeLinha(emoji, nivel, count));
                });
                try {
                    const arquivosCount = new Map();
                    for (const oc of ocorrenciasFiltradas) {
                        const key = (oc.relPath || oc.arquivo || 'desconhecido');
                        arquivosCount.set(key, (arquivosCount.get(key) || 0) + 1);
                    }
                    const topArquivosAll = Array.from(arquivosCount.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10);
                    if (topArquivosAll.length) {
                        if (typeof log.imprimirBloco ===
                            'function') {
                            const linhas = [
                                CliProcessamentoDiagnosticoMessages.topArquivosPorOcorrenciasTitulo,
                                ...topArquivosAll.map(([f, c]) => CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(f, c)),
                            ];
                            log.imprimirBloco(CliProcessamentoDiagnosticoMessages.arquivosMaisOcorrenciasTitulo, linhas);
                        }
                        else {
                            log.info(CliProcessamentoDiagnosticoMessages.topArquivosPorOcorrenciasTitulo);
                            topArquivosAll.forEach(([f, c]) => log.info(CliProcessamentoDiagnosticoMessages.resumoExecutivoBulletTopArquivo(f, c)));
                        }
                    }
                    const criticosOuAltos = [];
                    for (const oc of ocorrenciasFiltradas) {
                        const nivel = (oc.nivel || 'info').toString().toLowerCase();
                        if (nivel === 'erro' || nivel === 'alto') {
                            criticosOuAltos.push({
                                arquivo: (oc.relPath || oc.arquivo || 'desconhecido'),
                                tipo: (oc.tipo || 'desconhecido'),
                                nivel,
                                linha: typeof oc.linha === 'number' ? oc.linha : undefined,
                                coluna: typeof oc.coluna ===
                                    'number'
                                    ? oc.coluna
                                    : undefined,
                            });
                        }
                    }
                    const ordemNivel = (n) => n === 'erro' ? 3 : n === 'alto' ? 2 : n === 'aviso' ? 1 : 0;
                    const topCriticos = criticosOuAltos
                        .sort((a, b) => ordemNivel(b.nivel) - ordemNivel(a.nivel))
                        .slice(0, 10);
                    if (topCriticos.length) {
                        if (typeof log.imprimirBloco ===
                            'function') {
                            const linhas = topCriticos.map((c) => {
                                const pos = typeof c.linha === 'number'
                                    ? `:${c.linha}${typeof c.coluna === 'number' ? `:${c.coluna}` : ''}`
                                    : '';
                                return CliProcessamentoDiagnosticoMessages.topCriticosLinha(c.nivel.toUpperCase(), c.tipo, c.arquivo, pos);
                            });
                            log.imprimirBloco(CliProcessamentoDiagnosticoMessages.topCriticosTitulo, linhas);
                        }
                        else {
                            log.info(CliProcessamentoDiagnosticoMessages.topCriticosTituloComDoisPontos);
                            topCriticos.forEach((c) => {
                                const pos = typeof c.linha === 'number'
                                    ? `:${c.linha}${typeof c.coluna === 'number' ? `:${c.coluna}` : ''}`
                                    : '';
                                log.info(CliProcessamentoDiagnosticoMessages.topCriticosLinha(c.nivel.toUpperCase(), c.tipo, c.arquivo, pos));
                            });
                        }
                    }
                    const SAMPLE_MAX = 50;
                    const sample = ocorrenciasFiltradas
                        .slice(0, SAMPLE_MAX)
                        .map((o) => `${o.relPath}:${o.linha ?? ''} [${o.nivel ?? ''}] ${String(o.mensagem ?? '').replace(/\n/g, ' ')}`);
                    if (sample.length) {
                        if (typeof log.imprimirBloco ===
                            'function') {
                            log.imprimirBloco(CliProcessamentoDiagnosticoMessages.amostraBlocoTitulo(sample.length), sample.slice(0, 20));
                        }
                        else {
                            log.info(CliProcessamentoDiagnosticoMessages.amostraOcorrenciasTitulo);
                            sample
                                .slice(0, 20)
                                .forEach((s) => log.info(CliProcessamentoDiagnosticoMessages.amostraLinhaIndentada(s)));
                        }
                        if (ocorrenciasFiltradas.length > SAMPLE_MAX) {
                            log.info(CliProcessamentoDiagnosticoMessages.amostraMaisLinhas(SAMPLE_MAX, ocorrenciasFiltradas.length));
                        }
                    }
                }
                catch {
                }
            }
        }
        if (config.VERBOSE || config.DEV_MODE) {
            if (config.DEV_MODE && !opts.json && resultadoExecucao.metricas) {
                if (resultadoExecucao.metricas.analistas) {
                    const analistasComOcorrencias = resultadoExecucao.metricas.analistas.filter((a) => (a.ocorrencias ?? 0) > 0);
                    logSistema.processamentoAnalistasProblemas(analistasComOcorrencias.length);
                    analistasComOcorrencias.forEach((analista) => {
                        log.info(CliProcessamentoDiagnosticoMessages.analistaOcorrenciasLinha(analista.nome, analista.ocorrencias, analista.duracaoMs.toFixed(1)));
                    });
                }
            }
        }
        try {
            if (!opts.json && !config.SCAN_ONLY && totalOcorrencias === 0) {
                logRelatorio.repositorioImpecavel();
            }
        }
        catch { }
        if (process.env.VITEST && !opts.json) {
            log.info(CliProcessamentoDiagnosticoMessages.diagnosticoConcluido);
        }
        if (arquetiposResultado) {
            if (config.VERBOSE && arquetiposResultado.candidatos?.length > 0) {
                log.info(CliProcessamentoDiagnosticoMessages.arquetiposDetectados(arquetiposResultado.candidatos.length));
            }
            if (!config.VERBOSE &&
                config.COMPACT_MODE &&
                arquetiposResultado.candidatos?.length > 0) {
                const topCandidato = arquetiposResultado.candidatos[0];
                log.info(CliProcessamentoDiagnosticoMessages.arquetiposCompact(topCandidato.nome, topCandidato.confidence));
            }
            if (!config.VERBOSE && arquetiposResultado.candidatos?.length > 0) {
                log.info(CliProcessamentoDiagnosticoMessages.arquetiposCandidatosEncontrados(arquetiposResultado.candidatos.length));
            }
            if (config.VERBOSE && arquetiposResultado.candidatos?.length > 0) {
                const candidatoTop = arquetiposResultado.candidatos[0];
                log.info(CliProcessamentoDiagnosticoMessages.arquetiposCandidatosTitulo);
                for (const candidato of arquetiposResultado.candidatos.slice(0, 3)) {
                    log.info(CliProcessamentoDiagnosticoMessages.arquetiposCandidatoLinha(candidato.nome, candidato.confidence));
                }
                if (candidatoTop.planoSugestao) {
                    const plano = candidatoTop.planoSugestao;
                    if (plano.mover && plano.mover.length > 0) {
                        log.info(CliProcessamentoDiagnosticoMessages.planoSugestaoMove(plano.mover.length));
                    }
                    else {
                        log.info(CliProcessamentoDiagnosticoMessages.planoSugestaoNenhumMove);
                    }
                    if (plano.conflitos && plano.conflitos.length > 0) {
                        log.info(CliProcessamentoDiagnosticoMessages.conflitos(plano.conflitos.length));
                    }
                }
                if (candidatoTop.anomalias && candidatoTop.anomalias.length > 0) {
                    const tituloAnomalias = CliProcessamentoDiagnosticoMessages.anomaliasTitulo;
                    const linhasAnomalias = [];
                    for (const anomalia of candidatoTop.anomalias.slice(0, 8)) {
                        linhasAnomalias.push(CliProcessamentoDiagnosticoMessages.anomaliaLinha(anomalia.path, anomalia.motivo));
                    }
                    if (candidatoTop.anomalias.length > 8) {
                        linhasAnomalias.push(CliProcessamentoDiagnosticoMessages.anomaliasMais(candidatoTop.anomalias.length - 8));
                    }
                    if (typeof log.imprimirBloco ===
                        'function') {
                        log.imprimirBloco(tituloAnomalias, linhasAnomalias);
                    }
                    else {
                        log.info(CliProcessamentoDiagnosticoMessages.anomaliasTituloComDoisPontos);
                        for (const linha of linhasAnomalias) {
                            log.info(CliProcessamentoDiagnosticoMessages.amostraLinhaIndentada(linha));
                        }
                    }
                    if (candidatoTop.anomalias.length > 8) {
                        log.aviso(CliProcessamentoDiagnosticoMessages.anomaliasOcultasAviso(candidatoTop.anomalias.length - 8));
                    }
                }
                if (arquetiposResultado.drift) {
                    const drift = arquetiposResultado.drift;
                    if (drift.alterouArquetipo) {
                        log.info(CliProcessamentoDiagnosticoMessages.driftAlterou(drift.anterior, drift.atual));
                    }
                    else {
                        log.info(CliProcessamentoDiagnosticoMessages.driftMantido(drift.atual));
                    }
                    if (drift.arquivosRaizNovos && drift.arquivosRaizNovos.length > 0) {
                        const novosStr = drift.arquivosRaizNovos.length > 3
                            ? `${drift.arquivosRaizNovos.slice(0, 3).join(', ')}…`
                            : drift.arquivosRaizNovos.join(', ');
                        log.info(CliProcessamentoDiagnosticoMessages.driftNovos(novosStr));
                    }
                    if (drift.arquivosRaizRemovidos &&
                        drift.arquivosRaizRemovidos.length > 0) {
                        const removidosStr = drift.arquivosRaizRemovidos.length > 3
                            ? `${drift.arquivosRaizRemovidos.slice(0, 3).join(', ')}…`
                            : drift.arquivosRaizRemovidos.join(', ');
                        log.info(CliProcessamentoDiagnosticoMessages.driftRemovidos(removidosStr));
                    }
                }
            }
            else if (config.VERBOSE) {
                const candidatosCount = arquetiposResultado
                    ? arquetiposResultado.candidatos?.length || 0
                    : 0;
                log.info(`DEBUG: arquetiposResultado=${!!arquetiposResultado}, candidatos=${candidatosCount}`);
            }
            if (!opts.json &&
                arquetiposResultado &&
                (arquetiposResultado.baseline || arquetiposResultado.drift)) {
                const linhasEstrutura = [];
                if (arquetiposResultado.baseline) {
                    const baseline = arquetiposResultado.baseline;
                    linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.baselineArquetipo(baseline.arquetipo, baseline.confidence));
                    linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.baselineCriadoEm(new Date(baseline.timestamp).toLocaleString('pt-BR')));
                }
                else {
                    log.aviso(CliProcessamentoDiagnosticoMessages.baselineDesconhecidoAviso);
                    linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.baselineArquetipoDesconhecido);
                }
                if (arquetiposResultado.drift) {
                    const drift = arquetiposResultado.drift;
                    if (drift.alterouArquetipo) {
                        linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.driftDetectado(drift.anterior, drift.atual));
                    }
                    else {
                        linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.arquetipoMantido(drift.atual));
                    }
                    if (drift.arquivosRaizNovos && drift.arquivosRaizNovos.length > 0) {
                        linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.novosArquivosRaiz(drift.arquivosRaizNovos.join(', ')));
                    }
                    if (drift.arquivosRaizRemovidos &&
                        drift.arquivosRaizRemovidos.length > 0) {
                        linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.arquivosRemovidosRaiz(drift.arquivosRaizRemovidos.join(', ')));
                    }
                }
                if (arquetiposResultado.candidatos &&
                    arquetiposResultado.candidatos.length > 0) {
                    const top = arquetiposResultado.candidatos[0];
                    linhasEstrutura.push(CliProcessamentoDiagnosticoMessages.candidatoPrincipal(top.nome, top.confidence));
                }
                const tituloEstrutura = CliProcessamentoDiagnosticoMessages.resumoEstruturaTitulo;
                if (typeof log.imprimirBloco ===
                    'function') {
                    let larguraEstrutura;
                    if (typeof log.calcularLargura ===
                        'function') {
                        larguraEstrutura = log.calcularLargura(tituloEstrutura, linhasEstrutura, config.COMPACT_MODE ? 84 : 96);
                        if (typeof larguraEstrutura !== 'number' ||
                            isNaN(larguraEstrutura)) {
                            larguraEstrutura = config.COMPACT_MODE ? 84 : 96;
                        }
                    }
                    else {
                        larguraEstrutura = config.COMPACT_MODE ? 84 : 96;
                    }
                    log.imprimirBloco(tituloEstrutura, linhasEstrutura, undefined, larguraEstrutura);
                }
            }
            if (config.DEV_MODE &&
                typeof log.debug === 'function') {
                try {
                    log.debug(CliProcessamentoDiagnosticoMessages.debugAboutToEmitJson(JSON.stringify(opts)));
                }
                catch { }
            }
            if (opts.json) {
                const ocorrenciasOriginais = ocorrenciasFiltradas;
                const todosPorArquivo = new Map();
                const naoTodos = [];
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
                    }
                    else {
                        naoTodos.push(ocorrencia);
                    }
                }
                const todosAgregados = [];
                for (const [, todos] of todosPorArquivo) {
                    if (todos.length === 1) {
                        todosAgregados.push(todos[0]);
                    }
                    else if (todos.length > 1) {
                        const primeira = todos[0];
                        const mensagemAgregada = CliProcessamentoDiagnosticoMessages.todosPendentesEncontrados(todos.length);
                        todosAgregados.push({
                            ...primeira,
                            mensagem: mensagemAgregada,
                            linha: Math.min(...todos.map((t) => t.linha || 0)),
                        });
                    }
                }
                let todasOcorrencias = [...naoTodos, ...todosAgregados];
                todasOcorrencias = dedupeOcorrencias(todasOcorrencias);
                const ocorrenciasParaJson = todasOcorrencias
                    .map((o) => normalizarOcorrenciaParaJson(o))
                    .filter((o) => {
                    const nivel = (o.nivel || 'info');
                    return nivel === 'erro' || o.tipo === 'PARSE_ERRO';
                });
                const totalOcorrenciasJson = ocorrenciasParaJson.length;
                const tiposOcorrencias = {};
                const parseErros = {
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
                const parseErrosGlobais = globalThis
                    .__ORACULO_PARSE_ERROS__ || [];
                const parseErrosOriginais = globalThis
                    .__ORACULO_PARSE_ERROS_ORIGINAIS__ || 0;
                if (parseErrosGlobais.length > 0 || parseErrosOriginais > 0) {
                    parseErros.totalOriginais = Math.max(parseErros.totalOriginais, parseErrosOriginais);
                    if (parseErrosGlobais.length > 0) {
                        parseErros.totalExibidos = Math.min(parseErros.totalOriginais, parseErrosGlobais.length);
                    }
                    if (parseErrosOriginais > 0) {
                        totalOcorrencias = Math.max(totalOcorrencias, parseErrosOriginais);
                    }
                }
                parseErros.agregados = Math.max(0, parseErros.totalOriginais - parseErros.totalExibidos);
                let status = 'ok';
                if (totalOcorrenciasJson > 0) {
                    status = 'problemas';
                    if (parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA) {
                        status = 'erro';
                    }
                }
                const saidaJson = {
                    status: status,
                    totalOcorrencias: totalOcorrenciasJson,
                    guardian: guardianResultado ? 'verificado' : 'nao-verificado',
                    tiposOcorrencias,
                    parseErros,
                    ocorrencias: ocorrenciasParaJson,
                    linguagens: { total: 0, extensoes: {} },
                };
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
                const computeLinguagens = (fes) => {
                    const extensoes = {};
                    let sem_ext = 0;
                    for (const f of fes || []) {
                        const rel = f.relPath || f.fullPath || '';
                        const base = rel.split(/[\\/]/).pop() || '';
                        const idx = base.lastIndexOf('.');
                        if (idx === -1) {
                            sem_ext++;
                        }
                        else {
                            const ext = base.slice(idx + 1) || 'sem_ext';
                            extensoes[ext] = (extensoes[ext] || 0) + 1;
                        }
                    }
                    return {
                        total: (fes || []).length,
                        extensoes: { ...extensoes, sem_ext },
                    };
                };
                const linguagensFinal = computeLinguagens(fileEntriesComAst || fileEntries);
                saidaJson.linguagens = linguagensFinal;
                try {
                    const schemaMeta = {
                        schemaVersion: '1.0.0',
                        oraculoVersion: '0.0.0',
                        timestamp: new Date().toISOString(),
                    };
                    const saidaComMeta = { ...schemaMeta, ...saidaJson };
                    const asciiOnly = Boolean((opts && opts.jsonAscii) ||
                        false);
                    console.log(stringifyJsonEscaped(saidaComMeta, 2, { asciiOnly }));
                    _jsonEmitted = true;
                }
                catch (e) {
                    console.error(CliProcessamentoDiagnosticoMessages.errorGeneratingJson, e);
                    console.log(CliProcessamentoDiagnosticoMessages.fallbackJson, JSON.stringify(saidaJson));
                    _jsonEmitted = true;
                }
                if (!process.env.VITEST) {
                    const erros = (nivelOcorrencias.get('erro') || 0);
                    const exitCode = parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA
                        ? 2
                        : erros > 0
                            ? 1
                            : 0;
                    process.exit(exitCode);
                }
            }
            if (!opts.json && !config.SCAN_ONLY) {
                if (totalOcorrencias > 0 && ocorrenciasFiltradas) {
                    if (opts.executive) {
                        const { gerarResumoExecutivo } = await import('../relatorios/filtro-inteligente.js');
                        const resumoExec = gerarResumoExecutivo(ocorrenciasFiltradas);
                        if (resumoExec.detalhes.length > 0) {
                            const linhasExec = resumoExec.detalhes.map((problema) => `${problema.icone} ${problema.titulo.padEnd(25)} ${problema.quantidade.toString().padStart(6)}`);
                            const tituloExec = CliProcessamentoDiagnosticoMessages.resumoExecutivoTitulo(resumoExec.problemasCriticos + resumoExec.problemasAltos);
                            const cabecalhoExec = [
                                `${CliProcessamentoDiagnosticoMessages.cabecalhoExecProblema.padEnd(30)}${CliProcessamentoDiagnosticoMessages.cabecalhoExecQtd.padStart(6)}`,
                            ];
                            if ('imprimirBloco' in log &&
                                typeof log.imprimirBloco === 'function') {
                                log.imprimirBloco(tituloExec, [
                                    ...cabecalhoExec,
                                    ...linhasExec,
                                ]);
                            }
                            console.log(CliProcessamentoDiagnosticoMessages.dicaUseFull(totalOcorrencias));
                        }
                        else {
                            console.log(CliProcessamentoDiagnosticoMessages.projetoBomEstado(totalOcorrencias));
                            if (resumoExec.quickFixes > 0) {
                                console.log(CliProcessamentoDiagnosticoMessages.quickFixesDisponiveis(resumoExec.quickFixes));
                            }
                        }
                    }
                    else {
                        const tiposResumo = {};
                        for (const ocorrencia of ocorrenciasFiltradas) {
                            const tipo = ocorrencia.tipo || 'desconhecido';
                            tiposResumo[tipo] = (tiposResumo[tipo] || 0) + 1;
                        }
                        const linhasResumo = Object.entries(tiposResumo).map(([tipo, qtd]) => `${tipo.padEnd(20)} ${qtd.toString().padStart(8)}`);
                        const tituloResumo = CliProcessamentoDiagnosticoMessages.resumoTiposTitulo;
                        const cabecalho = [
                            `${CliProcessamentoDiagnosticoMessages.cabecalhoResumoTipo.padEnd(20)}${CliProcessamentoDiagnosticoMessages.cabecalhoResumoQuantidade.padStart(8)}`,
                        ];
                        if ('imprimirBloco' in log &&
                            typeof log.imprimirBloco === 'function') {
                            log.imprimirBloco(tituloResumo, [...cabecalho, ...linhasResumo]);
                        }
                    }
                }
                if (!config.COMPACT_MODE &&
                    !process.env.__ORACULO_TUDO_PRONTO_EMITIDO) {
                    log.info(CliProcessamentoDiagnosticoMessages.tudoPronto);
                    process.env.__ORACULO_TUDO_PRONTO_EMITIDO = '1';
                }
                if (process.env.VITEST) {
                    log.info(CliProcessamentoDiagnosticoMessages.diagnosticoConcluido);
                }
            }
        }
        if (!opts.json && !config.SCAN_ONLY) {
            log.fase?.('Gerando relatórios');
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
                    const dir = typeof config.REPORT_OUTPUT_DIR === 'string'
                        ? config.REPORT_OUTPUT_DIR
                        : path.join(baseDir, 'oraculo-reports');
                    const fs = await import('node:fs');
                    await fs.promises.mkdir(dir, { recursive: true });
                    const outputPath = path.join(dir, `oraculo-diagnostico-${ts}.md`);
                    const resultadoCompleto = {
                        ...resultadoExecucao,
                        fileEntries: fileEntriesComAst,
                        guardian: guardianResultado,
                    };
                    try {
                        const metricasOriginais = resultadoExecucao.metricas;
                        const analistasAgregados = {};
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
                        const metricasResumidas = {
                            totalArquivos: metricasOriginais?.totalArquivos,
                            tempoParsingMs: metricasOriginais?.tempoParsingMs,
                            tempoAnaliseMs: metricasOriginais?.tempoAnaliseMs,
                            cacheAstHits: metricasOriginais?.cacheAstHits,
                            cacheAstMiss: metricasOriginais?.cacheAstMiss,
                            analistas: analistasResumidos,
                        };
                        const ocorrenciasLimpas = dedupeOcorrencias(resultadoExecucao.ocorrencias || [])
                            .slice(0, 2000)
                            .map((oc) => {
                            const ocAny = oc;
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
                            baselineModificado: Boolean(guardianResultado &&
                                guardianResultado.baselineModificado),
                            metricas: metricasResumidas,
                            ocorrencias: ocorrenciasLimpas,
                        };
                        const salvar = await getSalvarEstado();
                        await salvar(path.join(dir, `oraculo-relatorio-summary-${ts}.json`), relatorioSummary);
                        let fragmentResult = undefined;
                        if (config.REPORT_EXPORT_FULL) {
                            const relatorioFull = {
                                timestamp: new Date().toISOString(),
                                totalOcorrencias,
                                baselineModificado: Boolean(guardianResultado &&
                                    guardianResultado.baselineModificado),
                                resultado: resultadoCompleto,
                            };
                            try {
                                fragmentResult = await fragmentarRelatorio(relatorioFull, dir, ts, {
                                    maxOcorrenciasPerShard: config.REPORT_FRAGMENT_OCCURRENCES,
                                    maxFileEntriesPerShard: config.REPORT_FRAGMENT_FILEENTRIES,
                                });
                                log.info(CliProcessamentoDiagnosticoMessages.relatorioFullFragmentado(fragmentResult.manifestFile));
                            }
                            catch {
                                await salvar(path.join(dir, `oraculo-relatorio-full-${ts}.json`), relatorioFull);
                            }
                        }
                        try {
                            await gerarRelatorioMarkdown(resultadoCompleto, outputPath, !opts.full, {
                                manifestFile: fragmentResult?.manifestFile,
                                relatoriosDir: dir,
                                ts,
                                hadFull: Boolean(fragmentResult),
                            });
                        }
                        catch (e) {
                            log.aviso(CliProcessamentoDiagnosticoMessages.falhaGerarRelatorioMarkdownMetadados(e.message));
                            await gerarRelatorioMarkdown(resultadoCompleto, outputPath, !opts.full);
                        }
                        try {
                            const { exportarRelatorioSvgOtimizacao } = await import('./diagnostico/exporters/svg-otimizacao-exporter.js');
                            await exportarRelatorioSvgOtimizacao({
                                entries: fileEntriesComAst,
                                relatoriosDir: dir,
                                ts,
                            });
                        }
                        catch {
                        }
                        log.sucesso(CliProcessamentoDiagnosticoMessages.relatoriosExportadosPara(dir));
                    }
                    catch (e) {
                        log.erro(CliProcessamentoDiagnosticoMessages.falhaSalvarRelatorioJson(e.message));
                    }
                }
            }
            catch (e) {
                log.erro(CliProcessamentoDiagnosticoMessages.falhaExportarRelatorios(e.message));
            }
        }
        if (!opts.json && !config.SCAN_ONLY) {
            try {
                if (totalOcorrencias > 0 && resultadoExecucao && ocorrenciasFiltradas) {
                    const tiposResumo = {};
                    for (const ocorrencia of ocorrenciasFiltradas) {
                        const tipo = ocorrencia.tipo || 'desconhecido';
                        tiposResumo[tipo] = (tiposResumo[tipo] || 0) + 1;
                    }
                    const linhasResumo = Object.entries(tiposResumo).map(([tipo, qtd]) => `${tipo.padEnd(20)} ${qtd.toString().padStart(8)}`);
                    const tituloResumo = CliProcessamentoDiagnosticoMessages.resumoTiposTitulo;
                    const cabecalho = [
                        `${CliProcessamentoDiagnosticoMessages.cabecalhoResumoTipo.padEnd(20)}${CliProcessamentoDiagnosticoMessages.cabecalhoResumoQuantidade.padStart(8)}`,
                    ];
                    if ('imprimirBloco' in log &&
                        typeof log.imprimirBloco === 'function') {
                        log.imprimirBloco(tituloResumo, [...cabecalho, ...linhasResumo]);
                    }
                }
                if (!config.COMPACT_MODE &&
                    !process.env.__ORACULO_TUDO_PRONTO_EMITIDO) {
                    log.info(CliProcessamentoDiagnosticoMessages.tudoPronto);
                    process.env.__ORACULO_TUDO_PRONTO_EMITIDO = '1';
                }
            }
            catch { }
        }
        if (opts.json) {
            const ocorrenciasOriginais = dedupeOcorrencias(resultadoExecucao.ocorrencias || []);
            const todosPorArquivo = new Map();
            const naoTodos = [];
            for (const ocorrencia of ocorrenciasOriginais) {
                if (ocorrencia.tipo === 'TODO_PENDENTE') {
                    const relPath = ocorrencia.relPath || 'desconhecido';
                    if (!todosPorArquivo.has(relPath))
                        todosPorArquivo.set(relPath, []);
                    const ocorrenciasArquivo = todosPorArquivo.get(relPath);
                    if (ocorrenciasArquivo)
                        ocorrenciasArquivo.push(ocorrencia);
                }
                else {
                    naoTodos.push(ocorrencia);
                }
            }
            try {
                if (!opts.json && !config.SCAN_ONLY && totalOcorrencias === 0) {
                    logRelatorio.repositorioImpecavel();
                }
            }
            catch { }
            const todosAgregados = [];
            for (const [, todos] of todosPorArquivo) {
                if (todos.length === 1)
                    todosAgregados.push(todos[0]);
                else if (todos.length > 1) {
                    const primeira = todos[0];
                    const mensagemAgregada = CliProcessamentoDiagnosticoMessages.todosPendentesEncontrados(todos.length);
                    todosAgregados.push({
                        ...primeira,
                        mensagem: mensagemAgregada,
                        linha: Math.min(...todos.map((t) => t.linha || 0)),
                    });
                }
            }
            let todasOcorrencias = [...naoTodos, ...todosAgregados];
            todasOcorrencias = dedupeOcorrencias(todasOcorrencias);
            const ocorrenciasParaJson = todasOcorrencias.filter((o) => {
                const nivel = (o.nivel || 'info');
                return nivel === 'erro' || o.tipo === 'PARSE_ERRO';
            });
            const tiposOcorrencias = {};
            const parseErros = {
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
            const parseErrosGlobais = globalThis
                .__ORACULO_PARSE_ERROS__ || [];
            const parseErrosOriginais = globalThis
                .__ORACULO_PARSE_ERROS_ORIGINAIS__ || 0;
            if (parseErrosGlobais.length > 0 || parseErrosOriginais > 0) {
                parseErros.totalOriginais = Math.max(parseErros.totalOriginais, parseErrosOriginais);
                if (parseErrosGlobais.length > 0) {
                    parseErros.totalExibidos = Math.min(parseErros.totalOriginais, parseErrosGlobais.length);
                }
                if (parseErrosOriginais > 0) {
                    totalOcorrencias = Math.max(totalOcorrencias, parseErrosOriginais);
                }
            }
            parseErros.agregados = Math.max(0, parseErros.totalOriginais - parseErros.totalExibidos);
            let status = 'ok';
            if (ocorrenciasParaJson.length > 0) {
                status = 'problemas';
                if (parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA)
                    status = 'erro';
            }
            const saidaJson = {
                status: status,
                totalOcorrencias: ocorrenciasParaJson.length,
                guardian: guardianResultado ? 'verificado' : 'nao-verificado',
                tiposOcorrencias,
                parseErros,
                ocorrencias: ocorrenciasParaJson,
                linguagens: { total: 0, extensoes: {} },
            };
            const computeLinguagens = (fes) => {
                const extensoes = {};
                let sem_ext = 0;
                for (const f of fes || []) {
                    const rel = f.relPath || f.fullPath || '';
                    const base = rel.split(/[\\/\\\\]/).pop() || '';
                    const idx = base.lastIndexOf('.');
                    if (idx === -1) {
                        sem_ext++;
                    }
                    else {
                        const ext = base.slice(idx + 1) || 'sem_ext';
                        extensoes[ext] = (extensoes[ext] || 0) + 1;
                    }
                }
                return {
                    total: (fes || []).length,
                    extensoes: { ...extensoes, sem_ext },
                };
            };
            const linguagensFinal = computeLinguagens(fileEntriesComAst || fileEntries);
            saidaJson.linguagens = linguagensFinal;
            if (!_jsonEmitted) {
                try {
                    let pkgVersion = '0.0.0';
                    try {
                        const pkgRaw = await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf-8');
                        const pkgObj = JSON.parse(pkgRaw);
                        if (pkgObj && typeof pkgObj.version === 'string')
                            pkgVersion = pkgObj.version;
                    }
                    catch { }
                    const schemaMeta = {
                        schemaVersion: '1.0.0',
                        oraculoVersion: pkgVersion,
                        timestamp: new Date().toISOString(),
                    };
                    const saidaComMeta = { ...schemaMeta, ...saidaJson };
                    const asciiOnly = Boolean((opts && opts.jsonAscii) ||
                        false);
                    console.log(stringifyJsonEscaped(saidaComMeta, 2, { asciiOnly }));
                    _jsonEmitted = true;
                    if (config.REPORT_EXPORT_ENABLED) {
                        try {
                            const ts = new Date().toISOString().replace(/[:.]/g, '-');
                            const dir = typeof config.REPORT_OUTPUT_DIR === 'string'
                                ? config.REPORT_OUTPUT_DIR
                                : path.join(baseDir, 'oraculo-reports');
                            const fs = await import('node:fs');
                            await fs.promises.mkdir(dir, { recursive: true });
                            const salvar = await getSalvarEstado();
                            await salvar(path.join(dir, `oraculo-diagnostico-${ts}.json`), saidaComMeta);
                            log.sucesso(CliProcessamentoDiagnosticoMessages.relatoriosExportadosPara(dir));
                        }
                        catch (e) {
                            log.erro(CliProcessamentoDiagnosticoMessages.falhaSalvarRelatorioJson(e.message));
                        }
                    }
                }
                catch (e) {
                    console.error(CliProcessamentoDiagnosticoMessages.errorGeneratingJson, e);
                    console.log(CliProcessamentoDiagnosticoMessages.fallbackJson, JSON.stringify(saidaJson));
                    _jsonEmitted = true;
                }
            }
            if (!process.env.VITEST) {
                const erros = (nivelOcorrencias.get('erro') || 0);
                const exitCode = parseErros.totalOriginais > 0 && config.PARSE_ERRO_FALHA
                    ? 2
                    : erros > 0
                        ? 1
                        : 0;
                process.exit(exitCode);
            }
        }
    }
    catch (error) {
        try {
            if (error &&
                typeof error === 'object' &&
                'message' in error &&
                typeof error.message === 'string' &&
                String(error.message).startsWith('exit:')) {
                throw error;
            }
        }
        catch (re) {
            throw re;
        }
        const errMsg = typeof error === 'string'
            ? error
            : error instanceof Error
                ? error.message
                : (() => {
                    try {
                        return JSON.stringify(error);
                    }
                    catch {
                        return String(error);
                    }
                })();
        log.erro(CliProcessamentoDiagnosticoMessages.erroFatalDiagnostico(errMsg));
        if (config.DEV_MODE) {
            console.error(error);
        }
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
    try {
        if (!opts.json && !config.SCAN_ONLY && totalOcorrencias === 0) {
            logRelatorio.repositorioImpecavel();
        }
    }
    catch { }
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
//# sourceMappingURL=processamento-diagnostico.js.map