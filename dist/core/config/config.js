import path from 'node:path';
import { lerArquivoTexto } from '../../shared/persistence/persistencia.js';
import { ORACULO_DIRS, ORACULO_FILES } from '../registry/paths.js';
const ORACULO_STATE = ORACULO_DIRS.STATE;
const ZELADOR_ABANDONED = path.join(ORACULO_STATE, 'abandonados');
export const configDefault = {
    VERBOSE: false,
    LOG_LEVEL: 'info',
    DEV_MODE: process.env.NODE_ENV === 'development' ||
        process.env.ORACULO_DEV === 'true',
    AUTOANALISE_CONCURRENCY: 5,
    SAFE_MODE: process.env.VITEST ? false : process.env.ORACULO_SAFE_MODE !== '0',
    ALLOW_PLUGINS: process.env.ORACULO_ALLOW_PLUGINS === '1' || false,
    ALLOW_EXEC: process.env.ORACULO_ALLOW_EXEC === '1' || false,
    ALLOW_MUTATE_FS: true,
    GUARDIAN_ENABLED: true,
    GUARDIAN_ENFORCE_PROTECTION: true,
    GUARDIAN_BASELINE: ORACULO_FILES.GUARDIAN_BASELINE,
    GUARDIAN_ALLOW_ADDS: false,
    GUARDIAN_ALLOW_CHG: false,
    GUARDIAN_ALLOW_DELS: false,
    REPORT_SILENCE_LOGS: false,
    SUPPRESS_PARCIAL_LOGS: false,
    REPORT_EXPORT_ENABLED: false,
    REPORT_OUTPUT_DIR: ORACULO_DIRS.REPORTS,
    REPORT_EXPORT_FULL: false,
    REPORT_FRAGMENT_OCCURRENCES: 2000,
    REPORT_FRAGMENT_FILEENTRIES: 500,
    REPORT_FRAGMENT_SUMMARY_TOPN: 5,
    RELATORIO_SAUDE_TABELA_ENABLED: true,
    RELATORIO_SAUDE_DETALHADO_VERBOSE: true,
    ORACULO_STATE_DIR: ORACULO_STATE,
    ZELADOR_ABANDONED_DIR: ZELADOR_ABANDONED,
    ZELADOR_PENDING_PATH: path.join(ORACULO_STATE, 'pendentes.json'),
    ZELADOR_REACTIVATE_PATH: path.join(ORACULO_STATE, 'reativar.json'),
    ZELADOR_HISTORY_PATH: path.join(ORACULO_STATE, 'historico.json'),
    ZELADOR_REPORT_PATH: path.join(ORACULO_STATE, 'poda-oraculo.md'),
    ZELADOR_GHOST_INACTIVITY_DAYS: 30,
    CLI_INCLUDE_PATTERNS: [],
    CLI_INCLUDE_GROUPS: [],
    CLI_EXCLUDE_PATTERNS: [],
    INCLUDE_EXCLUDE_RULES: {
        globalExcludeGlob: [
            '**/node_modules/**',
            'scripts/**',
            '.pnpm/**',
            'out/**',
            'build/**',
            'dist/**',
            'coverage/**',
            '**/dist/**',
            '**/build/**',
            '**/.turbo/**',
            '**/.vercel/**',
            '**/.expo/**',
            '**/.parcel-cache/**',
            '.deprecados/**',
            '**/deprecados/**',
            '.pensando/**',
            '**/pensando/**',
            '**/.oraculo/**',
            'oraculo/**',
            'dist/**',
            '**/dist/**',
            'coverage/**',
            '**/coverage/**',
            'build/**',
            '**/build/**',
            '**/*.log',
            '**/*.lock',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml',
            '**/.git/**',
        ],
    },
    ZELADOR_LINE_THRESHOLD: 20,
    SCANNER_EXTENSOES_COM_AST: [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.mjs',
        '.cjs',
        '.java',
        '.kt',
        '.kts',
        '.gradle',
        '.gradle.kts',
        '.xml',
        '.html',
        '.htm',
        '.css',
    ],
    VIGIA_TOP_N: 10,
    ANALISE_LIMITES: {
        FUNCOES_LONGAS: {
            MAX_LINHAS: 30,
            MAX_PARAMETROS: 4,
            MAX_ANINHAMENTO: 3,
        },
        CODIGO_FRAGIL: {
            MAX_LINHAS_FUNCAO: 30,
            MAX_PARAMETROS: 4,
            MAX_NESTED_CALLBACKS: 2,
        },
    },
    ANALISE_AST_CACHE_ENABLED: true,
    ANALISE_METRICAS_ENABLED: true,
    ANALISE_TIMEOUT_POR_ANALISTA_MS: 30000,
    WORKER_POOL_ENABLED: true,
    WORKER_POOL_MAX_WORKERS: 0,
    WORKER_POOL_BATCH_SIZE: 10,
    ANALISE_METRICAS_HISTORICO_PATH: path.join(ORACULO_STATE, 'historico-metricas', 'metricas-historico.json'),
    ANALISE_METRICAS_HISTORICO_MAX: 200,
    ANALISE_PRIORIZACAO_ENABLED: true,
    ANALISE_PRIORIZACAO_PESOS: {
        duracaoMs: 1,
        ocorrencias: 2,
        penalidadeReuso: 0.5,
    },
    LOG_ESTRUTURADO: false,
    ANALISE_INCREMENTAL_ENABLED: false,
    ANALISE_INCREMENTAL_STATE_PATH: path.join(ORACULO_STATE, 'incremental-analise.json'),
    ANALISE_INCREMENTAL_VERSION: 1,
    PERF_SNAPSHOT_DIR: path.join('docs', 'perf'),
    ESTRUTURA_TARGETS: {
        TESTS_RAIZ_DIR: 'src',
        SCRIPTS_DIR: path.posix.join('src', 'scripts'),
        CONFIG_DIR: 'config',
        TYPES_DIR: 'types',
        DOCS_FRAGMENTS_DIR: path.posix.join('docs', 'fragments'),
    },
    conventions: {
        typesDirectory: path.posix.join('src', 'tipos'),
    },
    detectorMarkdown: {
        checkProveniencia: true,
        checkLicenses: true,
        checkReferences: true,
        headerLines: 30,
        whitelist: {
            paths: [],
            patterns: [],
            dirs: [],
        },
        whitelistMode: 'merge',
    },
    STRUCTURE_PLUGINS: [],
    STRUCTURE_AUTO_FIX: false,
    STRUCTURE_CONCURRENCY: 5,
    STRUCTURE_LAYERS: {},
    STRUCTURE_REVERSE_MAP_PATH: path.join(ORACULO_STATE, 'mapa-reversao.json'),
    ESTRUTURA_PLANO_MAX_FILE_SIZE: 256 * 1024,
    ESTRUTURA_ARQUIVOS_RAIZ_MAX: 10,
    STATE_DIR: ORACULO_STATE,
    ZELADOR_STATE_DIR: ORACULO_STATE,
    COMPACT_MODE: false,
    SCAN_ONLY: false,
    ANALISE_SCAN_ONLY: false,
    PARSE_ERRO_AGRUPAR: true,
    PARSE_ERRO_MAX_POR_ARQUIVO: 1,
    PARSE_ERRO_FALHA: false,
    rules: {},
    testPatterns: {
        files: [
            '**/*.test.*',
            '**/*.spec.*',
            'test/**/*',
            'tests/**/*',
            '**/__tests__/**',
        ],
        excludeFromOrphanCheck: true,
        allowAnyType: false,
    },
};
export const config = JSON.parse(JSON.stringify(configDefault));
function ehObjetoPlano(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function mesclarProfundo(target, src, fonte, diffs, prefix = '') {
    for (const k of Object.keys(src || {})) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
            continue;
        }
        const keyPath = prefix ? `${prefix}.${k}` : k;
        const srcVal = src[k];
        const tgtVal = target[k];
        if (ehObjetoPlano(srcVal) && ehObjetoPlano(tgtVal)) {
            mesclarProfundo(tgtVal, srcVal, fonte, diffs, keyPath);
        }
        else if (srcVal !== undefined) {
            if (tgtVal !== srcVal) {
                diffs[keyPath] = { from: tgtVal, to: srcVal, fonte };
            }
            target[k] = srcVal;
        }
    }
}
async function carregarArquivoConfig() {
    const candidatos = ['oraculo.config.json', 'src/config.json'];
    for (const nome of candidatos) {
        try {
            const caminho = path.join(process.cwd(), nome);
            const conteudo = await lerArquivoTexto(caminho);
            const json = conteudo && conteudo.trim() ? JSON.parse(conteudo) : null;
            if (json) {
                return converterConfigSimplificada(json);
            }
        }
        catch {
        }
    }
    return null;
}
function converterConfigSimplificada(config) {
    const resultado = { ...config };
    if (Array.isArray(config.exclude)) {
        resultado.INCLUDE_EXCLUDE_RULES = {
            globalExcludeGlob: config.exclude,
            dirRules: {},
            defaultExcludes: null,
        };
        delete resultado.exclude;
    }
    if (config.languages && typeof config.languages === 'object') {
        const langs = config.languages;
        resultado.languageSupport = {};
        const langDefaults = {
            javascript: { parser: 'babel', plugin: 'core' },
            typescript: { parser: 'babel', plugin: 'core' },
            html: { parser: 'htmlparser2', plugin: 'core' },
            css: { parser: 'css-tree', plugin: 'core' },
            xml: { parser: 'fast-xml-parser', plugin: 'core' },
            php: { parser: 'heuristic', plugin: 'core' },
            python: { parser: 'heuristic', plugin: 'core' },
        };
        for (const [lang, enabled] of Object.entries(langs)) {
            const defaults = langDefaults[lang];
            if (defaults) {
                resultado.languageSupport[lang] = {
                    enabled,
                    ...defaults,
                };
            }
        }
        const enabledPlugins = ['core'];
        resultado.plugins = {
            enabled: enabledPlugins,
            autoload: true,
            registry: '/plugins',
        };
        delete resultado.languages;
    }
    if (config.suppress && typeof config.suppress === 'object') {
        const suppress = config.suppress;
        if (Array.isArray(suppress.rules)) {
            resultado.suppressRules = suppress.rules;
        }
        if (suppress.severity && typeof suppress.severity === 'object') {
            resultado.suppressBySeverity = suppress.severity;
        }
        if (Array.isArray(suppress.paths)) {
            resultado.suppressByPath = suppress.paths;
        }
        delete resultado.suppress;
    }
    return resultado;
}
function sincronizarIgnorados() {
    const dyn = (config.INCLUDE_EXCLUDE_RULES || {});
    const glob = Array.isArray(dyn.globalExcludeGlob)
        ? dyn.globalExcludeGlob
        : [];
    const _itemList = Array.from(new Set(glob.map((g) => String(g))));
    delete config.ZELADOR_IGNORE_PATTERNS;
    delete config
        .GUARDIAN_IGNORE_PATTERNS;
}
function carregarEnvConfig() {
    const resultado = {};
    const stack = [
        { obj: configDefault, prefix: '' },
    ];
    while (stack.length) {
        const popped = stack.pop();
        if (!popped)
            break;
        const { obj, prefix } = popped;
        for (const k of Object.keys(obj)) {
            const keyPath = prefix ? `${prefix}.${k}` : k;
            const envName = `ORACULO_${keyPath.replace(/\./g, '_').toUpperCase()}`;
            const currentVal = obj[k];
            if (ehObjetoPlano(currentVal)) {
                stack.push({ obj: currentVal, prefix: keyPath });
            }
            else {
                const rawEnv = process.env[envName];
                if (rawEnv !== undefined) {
                    let val = rawEnv;
                    if (/^(true|false)$/i.test(rawEnv))
                        val = rawEnv.toLowerCase() === 'true';
                    else if (/^-?\d+(\.\d+)?$/.test(rawEnv))
                        val = Number(rawEnv);
                    atribuirPorCaminho(resultado, keyPath, val);
                }
            }
        }
    }
    return resultado;
}
function isPrototypePollutingKey(key) {
    return key === '__proto__' || key === 'constructor' || key === 'prototype';
}
function atribuirPorCaminho(base, keyPath, value) {
    const parts = keyPath.split('.');
    let cursor = base;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (isPrototypePollutingKey(p)) {
            return;
        }
        let next = cursor[p];
        if (!ehObjetoPlano(next)) {
            next = {};
            cursor[p] = next;
        }
        cursor = next;
    }
    const lastKey = parts[parts.length - 1];
    if (isPrototypePollutingKey(lastKey)) {
        return;
    }
    cursor[lastKey] = value;
}
export async function inicializarConfigDinamica(overridesCli) {
    const diffs = {};
    const arquivo = await carregarArquivoConfig();
    if (arquivo) {
        mesclarProfundo(config, arquivo, 'arquivo', diffs);
    }
    const envCfg = carregarEnvConfig();
    if (Object.keys(envCfg).length)
        mesclarProfundo(config, envCfg, 'env', diffs);
    if (overridesCli && Object.keys(overridesCli).length)
        mesclarProfundo(config, overridesCli, 'cli', diffs);
    if (config.ANALISE_SCAN_ONLY && !config.SCAN_ONLY)
        config.SCAN_ONLY = true;
    else if (config.SCAN_ONLY && !config.ANALISE_SCAN_ONLY)
        config.ANALISE_SCAN_ONLY = true;
    sincronizarIgnorados();
    config.__OVERRIDES__ = diffs;
    return diffs;
}
export function aplicarConfigParcial(partial) {
    const diffs = {};
    mesclarProfundo(config, partial, 'programatico', diffs);
    if (config.ANALISE_SCAN_ONLY && !config.SCAN_ONLY)
        config.SCAN_ONLY = true;
    else if (config.SCAN_ONLY && !config.ANALISE_SCAN_ONLY)
        config.ANALISE_SCAN_ONLY = true;
    sincronizarIgnorados();
    config.__OVERRIDES__ = { ...(config.__OVERRIDES__ || {}), ...diffs };
    return diffs;
}
if (!process.env.VITEST) {
    void inicializarConfigDinamica();
}
//# sourceMappingURL=config.js.map