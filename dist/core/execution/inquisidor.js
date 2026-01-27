import { promises as fs } from 'node:fs';
import { registroAnalistas } from '../../analistas/registry/registry.js';
import { config } from '../config/config.js';
import { isMetaPath } from '../config/paths.js';
import { InquisidorMessages } from '../messages/core/inquisidor-messages.js';
import { log } from '../messages/index.js';
import { lerEstado } from '../../shared/persistence/persistencia.js';
import * as path from 'path';
import { ocorrenciaParseErro } from '../../types/index.js';
import { executarInquisicao as executarExecucao, registrarUltimasMetricas, } from './executor.js';
import { scanRepository } from './scanner.js';
const SIMBOLOS_FALLBACK = {
    info: 'ℹ️',
    sucesso: '✅',
    erro: '❌',
    aviso: '⚠️',
    debug: '🐞',
    fase: '🔶',
    passo: '▫️',
    scan: '🔍',
    guardian: '🛡️',
    pasta: '📂',
};
const S = typeof log.simbolos === 'object'
    ? log.simbolos
    : SIMBOLOS_FALLBACK;
const __infoDestaque = (mensagem) => {
    const l = log;
    if (typeof l.infoDestaque === 'function')
        return l.infoDestaque(mensagem);
    return l.info(mensagem);
};
const EXTENSOES_COM_AST = new Set(Array.isArray(config.SCANNER_EXTENSOES_COM_AST)
    ? config.SCANNER_EXTENSOES_COM_AST
    : ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
export const tecnicas = registroAnalistas;
export async function prepararComAst(entries, baseDir) {
    const globalStore = globalThis;
    const cache = globalStore.__ORACULO_AST_CACHE__ || new Map();
    if (!globalStore.__ORACULO_AST_CACHE__)
        globalStore.__ORACULO_AST_CACHE__ = cache;
    const metricas = globalStore.__ORACULO_METRICAS__ || {
        parsingTimeMs: 0,
        cacheHits: 0,
        cacheMiss: 0,
    };
    metricas.parsingTimeMs = 0;
    metricas.cacheHits = 0;
    metricas.cacheMiss = 0;
    globalStore.__ORACULO_METRICAS__ = metricas;
    return Promise.all(entries.map(async (entry) => {
        let ast = undefined;
        const ext = path.extname(entry.relPath);
        const absPath = typeof entry.fullPath === 'string'
            ? entry.fullPath
            : path.resolve(baseDir, entry.relPath);
        let stats;
        try {
            stats = await fs.stat(absPath);
        }
        catch {
            stats = undefined;
        }
        const nomeLower = entry.relPath.toLowerCase();
        const extEfetiva = nomeLower.endsWith('.d.ts')
            ? '.d.ts'
            : nomeLower.endsWith('.map')
                ? '.map'
                : ext;
        if (entry.content && EXTENSOES_COM_AST.has(extEfetiva)) {
            const chave = entry.relPath;
            if (config.ANALISE_AST_CACHE_ENABLED && stats) {
                const anterior = cache.get(chave);
                if (anterior &&
                    anterior.mtimeMs === stats.mtimeMs &&
                    anterior.size === stats.size) {
                    ast = anterior.ast;
                    metricas.cacheHits++;
                }
            }
            try {
                if (!ast) {
                    const inicioParse = performance.now();
                    const parsed = await import('../parsing/parser.js').then((m) => m.decifrarSintaxe(entry.content || '', extEfetiva, {
                        relPath: entry.relPath,
                    }));
                    if (parsed && typeof parsed === 'object') {
                        if (Object.keys(parsed)
                            .length > 0) {
                            ast = {};
                        }
                    }
                    else if (parsed == null) {
                        const inNodeModules = /(^|\/)node_modules(\/|\\)/.test(entry.relPath);
                        if (inNodeModules) {
                            ast = {};
                        }
                        else {
                            const globalStore2 = globalStore;
                            const lista = globalStore2.__ORACULO_PARSE_ERROS__ || [];
                            try {
                                const babel = await import('@babel/parser');
                                try {
                                    const parseOpts = {
                                        sourceType: 'unambiguous',
                                        plugins: [
                                            'typescript',
                                            'jsx',
                                            'decorators-legacy',
                                            'classProperties',
                                        ],
                                    };
                                    babel.parse(entry.content || '', parseOpts);
                                    lista.push(ocorrenciaParseErro({
                                        mensagem: InquisidorMessages.parseAstNaoGerada,
                                        relPath: entry.relPath,
                                        origem: 'parser',
                                    }));
                                }
                                catch (e) {
                                    const err = e;
                                    const linha = typeof err.loc?.line === 'number'
                                        ? err.loc.line
                                        : undefined;
                                    const coluna = typeof err.loc?.column === 'number'
                                        ? err.loc.column
                                        : undefined;
                                    const detalhe = err && err.message ? String(err.message) : undefined;
                                    lista.push(ocorrenciaParseErro({
                                        mensagem: InquisidorMessages.parseErro(detalhe || InquisidorMessages.parseAstNaoGerada),
                                        relPath: entry.relPath,
                                        origem: 'parser',
                                        linha,
                                        coluna,
                                        detalhe,
                                    }));
                                }
                            }
                            catch {
                                lista.push(ocorrenciaParseErro({
                                    mensagem: InquisidorMessages.parseAstNaoGerada,
                                    relPath: entry.relPath,
                                    origem: 'parser',
                                }));
                            }
                            globalStore2.__ORACULO_PARSE_ERROS__ = lista;
                        }
                    }
                    metricas.parsingTimeMs += performance.now() - inicioParse;
                    metricas.cacheMiss++;
                    if (config.ANALISE_AST_CACHE_ENABLED && stats) {
                        cache.set(entry.relPath, {
                            mtimeMs: stats.mtimeMs,
                            size: stats.size,
                            ast,
                        });
                    }
                }
            }
            catch (e) {
                const err = e;
                log.erro(InquisidorMessages.falhaGerarAst(entry.relPath, err.message));
                const lista = globalStore.__ORACULO_PARSE_ERROS__ || [];
                lista.push(ocorrenciaParseErro({
                    mensagem: InquisidorMessages.parseErro(err.message),
                    relPath: entry.relPath,
                    origem: 'parser',
                }));
                globalStore.__ORACULO_PARSE_ERROS__ = lista;
            }
        }
        return {
            ...entry,
            ast,
            content: entry.content ?? null,
            fullPath: typeof entry.fullPath === 'string'
                ? entry.fullPath
                : path.resolve(baseDir, entry.relPath),
        };
    }));
}
export async function iniciarInquisicao(baseDir = process.cwd(), options = {}) {
    const { includeContent = true, incluirMetadados = true, skipExec = false, } = options;
    log.info(`${S.scan} Iniciando a Inquisição do Oráculo em: ${baseDir}`);
    const fileMap = await scanRepository(baseDir, {
        includeContent,
        onProgress: (msg) => {
            try {
                const progressData = JSON.parse(msg);
                if (progressData.tipo === 'diretorio') {
                    const g = globalThis;
                    g.__ORACULO_DIR_COUNT__ = (g.__ORACULO_DIR_COUNT__ || 0) + 1;
                    const SAMPLE_MAX = 5;
                    if (!g.__ORACULO_DIR_SAMPLES__)
                        g.__ORACULO_DIR_SAMPLES__ = [];
                    if (g.__ORACULO_DIR_SAMPLES__.length < SAMPLE_MAX) {
                        g.__ORACULO_DIR_SAMPLES__.push(progressData.caminho);
                    }
                }
                else if (progressData.tipo === 'erro') {
                    log.erro(`Erro ao ${progressData.acao} ${progressData.caminho}: ${progressData.mensagem}`);
                }
            }
            catch {
                if (msg && msg.includes('⚠️'))
                    log.aviso(msg);
            }
        },
    });
    let fileEntries;
    let entriesBase = Object.values(fileMap);
    const metaSet = new Set(entriesBase.filter((e) => isMetaPath(e.relPath)).map((e) => e.relPath));
    if (config.ANALISE_PRIORIZACAO_ENABLED &&
        config.ANALISE_INCREMENTAL_STATE_PATH) {
        try {
            const inc = await lerEstado(config.ANALISE_INCREMENTAL_STATE_PATH).catch(() => null);
            if (inc && inc.arquivos) {
                const pesos = (config.ANALISE_PRIORIZACAO_PESOS || {
                    duracaoMs: 1,
                    ocorrencias: 2,
                    penalidadeReuso: 0.5,
                });
                const scored = entriesBase.map((e) => {
                    const hist = inc.arquivos[e.relPath];
                    if (!hist)
                        return { ...e, __score: 0 };
                    let dur = 0;
                    let occ = 0;
                    if (hist.analistas) {
                        for (const a of Object.values(hist.analistas)) {
                            dur += a.duracaoMs;
                            occ += a.ocorrencias;
                        }
                    }
                    else {
                        occ = hist.ocorrencias?.length || 0;
                    }
                    const reuso = hist.reaproveitadoCount || 0;
                    const score = dur * pesos.duracaoMs +
                        occ * pesos.ocorrencias -
                        reuso * pesos.penalidadeReuso;
                    return { ...e, __score: score };
                });
                scored.sort((a, b) => b.__score -
                    a.__score);
                const prioritarios = [];
                const metas = [];
                for (const s of scored)
                    (metaSet.has(s.relPath) ? metas : prioritarios).push(s);
                const reconstituido = [...prioritarios, ...metas];
                entriesBase = reconstituido;
                const somentePrioritarios = reconstituido.filter((e) => !metaSet.has(e.relPath));
                if (config.LOG_ESTRUTURADO) {
                    log.info(JSON.stringify({
                        tipo: 'priorizacao',
                        estrategia: 'historico-incremental',
                        top: somentePrioritarios.slice(0, 10).map((e) => ({
                            arq: e.relPath,
                            score: e.__score,
                        })),
                        metaEmpurrados: metas.length,
                    }));
                }
                else {
                    const exibidos = somentePrioritarios
                        .slice(0, 5)
                        .map((e) => e.relPath)
                        .join(', ') || '—';
                    log.info(`🧮 Priorização aplicada (top 5 sem meta): ${exibidos}`);
                    if (metas.length) {
                        log.info(`   (${S.info} ${metas.length} arquivos meta movidos para o final da fila)`);
                    }
                }
            }
        }
        catch (e) {
            if (config.DEV_MODE)
                log.erro(`Falha priorização: ${e.message}`);
        }
    }
    if (incluirMetadados) {
        fileEntries = await prepararComAst(entriesBase, baseDir);
    }
    else {
        fileEntries = entriesBase.map((entry) => ({
            ...entry,
            ast: undefined,
            fullPath: typeof entry.fullPath === 'string'
                ? entry.fullPath
                : path.resolve(baseDir, entry.relPath),
        }));
    }
    try {
        const g = globalThis;
        const totalDirs = g.__ORACULO_DIR_COUNT__ || 0;
        const amostra = Array.isArray(g.__ORACULO_DIR_SAMPLES__)
            ? g.__ORACULO_DIR_SAMPLES__
            : [];
        if (config.LOG_ESTRUTURADO) {
            log.info(JSON.stringify({
                tipo: 'varredura_preliminar',
                totalDiretorios: totalDirs,
                amostraDiretorios: amostra,
            }));
        }
        else {
        }
    }
    catch {
    }
    let totalArquivos = fileEntries.length;
    let ocorrencias = [];
    if (!skipExec) {
        const execRes = await executarExecucao(fileEntries, tecnicas, baseDir, undefined);
        totalArquivos = execRes.totalArquivos;
        ocorrencias = execRes.ocorrencias;
    }
    const parseErros = globalThis
        .__ORACULO_PARSE_ERROS__ || [];
    if (parseErros.length) {
        globalThis.__ORACULO_PARSE_ERROS_ORIGINAIS__ = parseErros.length;
        if (config.PARSE_ERRO_AGRUPAR) {
            const porArquivo = {};
            for (const pe of parseErros) {
                const k = pe.relPath || '__desconhecido__';
                (porArquivo[k] = porArquivo[k] || []).push(pe);
            }
            for (const [arq, lista] of Object.entries(porArquivo)) {
                if (lista.length <= (config.PARSE_ERRO_MAX_POR_ARQUIVO || 1)) {
                    ocorrencias.push(...lista);
                }
                else {
                    ocorrencias.push(ocorrenciaParseErro({
                        mensagem: InquisidorMessages.parseErrosAgregados(lista.length),
                        relPath: arq || '',
                        origem: 'parser',
                    }));
                }
            }
        }
        else {
            ocorrencias.push(...parseErros);
        }
    }
    if (!skipExec) {
        log.sucesso(`🔮 Inquisição concluída. Total de ocorrências: ${ocorrencias.length}`);
    }
    else if (!config.COMPACT_MODE) {
        __infoDestaque(`Varredura concluída: total de arquivos: ${fileEntries.length}`);
    }
    return {
        totalArquivos,
        ocorrencias,
        arquivosAnalisados: fileEntries.map((f) => f.relPath),
        timestamp: Date.now(),
        duracaoMs: 0,
        fileEntries,
        guardian: undefined,
    };
}
export { executarExecucao as executarInquisicao, registrarUltimasMetricas };
//# sourceMappingURL=inquisidor.js.map