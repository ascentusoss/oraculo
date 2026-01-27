import { parse as babelParse } from '@babel/parser';
import { log, logCore } from '../messages/index.js';
import { initializeDefaultPlugins } from '../../shared/plugins/init.js';
import { getGlobalRegistry } from '../../shared/plugins/registry.js';
import * as csstree from 'css-tree';
import { XMLParser } from 'fast-xml-parser';
import { parseDocument } from 'htmlparser2';
import { createRequire } from 'module';
let currentParsingFile;
function setCurrentParsingFile(file) {
    currentParsingFile = file;
}
export function getCurrentParsingFile() {
    return currentParsingFile || 'desconhecido';
}
const localRequire = createRequire(import.meta.url);
function parseComBabel(codigo, plugins) {
    const defaultPlugins = [
        'typescript',
        'jsx',
        'decorators-legacy',
        'importAttributes',
        'importAssertions',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'optionalChaining',
        'nullishCoalescingOperator',
        'topLevelAwait',
    ];
    const options = {
        sourceType: 'unambiguous',
        plugins: (Array.isArray(plugins)
            ? plugins
            : defaultPlugins),
    };
    try {
        return babelParse(codigo, options);
    }
    catch (e) {
        logCore.erroBabel(e.message, getCurrentParsingFile());
        return null;
    }
}
function wrapMinimal(lang, rawAst) {
    return {
        type: 'File',
        program: {
            type: 'Program',
            body: [],
            sourceType: 'script',
            directives: [],
        },
        comments: [],
        tokens: [],
        oraculoExtra: { lang, rawAst },
    };
}
function parseComTypeScript(codigo, tsx = false) {
    try {
        const ts = localRequire('typescript');
        const sf = ts.createSourceFile(tsx ? 'file.tsx' : 'file.ts', codigo, ts.ScriptTarget.Latest, false, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        return wrapMinimal(tsx ? 'tsx-tsc' : 'ts-tsc', {
            kind: sf.kind,
            statements: sf.statements?.length ?? 0,
        });
    }
    catch (e) {
        logCore.erroTs(e.message, getCurrentParsingFile());
        return null;
    }
}
function parseComXml(codigo) {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@',
        });
        const ast = parser.parse(codigo);
        return wrapMinimal('xml', ast);
    }
    catch (e) {
        logCore.erroXml(e.message, getCurrentParsingFile());
        return null;
    }
}
function parseComPhp(codigo) {
    const classes = Array.from(codigo.matchAll(/\bclass\s+([A-Za-z0-9_]+)/g)).map((m) => m[1]);
    const functions = Array.from(codigo.matchAll(/\bfunction\s+([A-Za-z0-9_]+)/g)).map((m) => m[1]);
    const namespaces = Array.from(codigo.matchAll(/\bnamespace\s+([A-Za-z0-9_\\]+)/g)).map((m) => m[1]);
    log.debug(`🐘 PHP pseudo-parse: ${classes.length} classes, ${functions.length} funções`);
    return wrapMinimal('php', { classes, functions, namespaces });
}
function parseComPython(codigo) {
    const classes = Array.from(codigo.matchAll(/^class\s+([A-Za-z0-9_]+)/gm)).map((m) => m[1]);
    const functions = Array.from(codigo.matchAll(/^def\s+([A-Za-z0-9_]+)/gm)).map((m) => m[1]);
    log.debug(`🐍 Python pseudo-parse: ${classes.length} classes, ${functions.length} funções`);
    return wrapMinimal('python', { classes, functions });
}
function parseComHtmlFunc(codigo) {
    try {
        const dom = parseDocument(codigo, { xmlMode: false });
        return wrapMinimal('html', dom);
    }
    catch (e) {
        logCore.erroHtml(e.message, getCurrentParsingFile());
        return null;
    }
}
function parseComVue(codigo) {
    try {
        const templateMatch = codigo.match(/<template\b[^>]*>([\s\S]*?)<\/template\b[^>]*>/i);
        const scriptMatch = codigo.match(/<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/i);
        const styleMatch = codigo.match(/<style\b[^>]*>([\s\S]*?)<\/style\b[^>]*>/i);
        const template = templateMatch ? templateMatch[1].trim() : '';
        const script = scriptMatch ? scriptMatch[1].trim() : '';
        const style = styleMatch ? styleMatch[1].trim() : '';
        if (script) {
            try {
                babelParse(script, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx'],
                    allowImportExportEverywhere: true,
                });
            }
            catch {
                try {
                    babelParse(script, {
                        sourceType: 'module',
                        plugins: ['jsx'],
                        allowImportExportEverywhere: true,
                    });
                }
                catch {
                }
            }
        }
        if (template) {
            try {
                parseDocument(template, { xmlMode: false });
            }
            catch {
            }
        }
        if (style) {
            try {
                csstree.parse(style, { positions: false });
            }
            catch {
            }
        }
        return wrapMinimal('vue', {
            template: template ? 'present' : null,
            script: script ? 'present' : null,
            style: style ? 'present' : null,
            hasTemplate: !!template,
            hasScript: !!script,
            hasStyle: !!style,
            templateContent: template,
            scriptContent: script,
            styleContent: style,
        });
    }
    catch (e) {
        logCore.erroHtml(e.message, getCurrentParsingFile());
        return null;
    }
}
function parseComCss(codigo) {
    try {
        const ast = csstree.parse(codigo, { positions: false });
        return wrapMinimal('css', ast);
    }
    catch (e) {
        logCore.erroCss(e.message, getCurrentParsingFile());
        return null;
    }
}
export const PARSERS = new Map([
    ['.js', parseComBabel],
    ['.jsx', parseComBabel],
    ['.ts', parseComBabel],
    ['.tsx', parseComBabel],
    ['.mjs', parseComBabel],
    ['.cjs', parseComBabel],
    ['.d.ts', () => null],
    ['.xml', parseComXml],
    ['.html', parseComHtmlFunc],
    ['.htm', parseComHtmlFunc],
    ['.vue', parseComVue],
    ['.css', parseComCss],
    ['.php', parseComPhp],
    ['.py', parseComPython],
]);
export const EXTENSOES_SUPORTADAS = Array.from(PARSERS.keys()).filter((ext) => ext !== '.d.ts');
export async function decifrarSintaxe(codigo, ext, opts = {}) {
    setCurrentParsingFile(opts.relPath);
    const parser = PARSERS.get(ext);
    if (!parser) {
        logCore.nenhumParser(ext);
        return null;
    }
    if (ext === '.ts' || ext === '.tsx') {
        const p = opts.plugins;
        if (Array.isArray(p)) {
            const lower = p.map((x) => String(x).toLowerCase());
            const hasTs = lower.includes('typescript');
            const hasFlow = lower.includes('flow');
            if (!hasTs || hasFlow) {
                const tsx = ext === '.tsx';
                const tsParsed = parseComTypeScript(codigo, tsx);
                if (tsParsed) {
                    setCurrentParsingFile(undefined);
                    return Promise.resolve(tsParsed);
                }
            }
        }
    }
    let parseResult;
    if (parser === parseComBabel) {
        parseResult = parseComBabel(codigo, opts.plugins);
    }
    else {
        parseResult = parser(codigo, opts.plugins);
    }
    if (parseResult == null &&
        (ext === '.js' || ext === '.mjs' || ext === '.cjs')) {
        try {
            const pareceFlow = /@flow\b/.test(codigo) || /\bimport\s+type\b/.test(codigo);
            if (pareceFlow) {
                const flowPlugins = [
                    'flow',
                    'jsx',
                    'decorators-legacy',
                    'importAttributes',
                    'importAssertions',
                    'classProperties',
                    'classPrivateProperties',
                    'classPrivateMethods',
                    'optionalChaining',
                    'nullishCoalescingOperator',
                    'topLevelAwait',
                ];
                parseResult = parseComBabel(codigo, flowPlugins);
            }
            if (parseResult == null) {
                const jsModernPlugins = [
                    'jsx',
                    'decorators-legacy',
                    'importAttributes',
                    'importAssertions',
                    'classProperties',
                    'classPrivateProperties',
                    'classPrivateMethods',
                    'optionalChaining',
                    'nullishCoalescingOperator',
                    'topLevelAwait',
                ];
                parseResult = parseComBabel(codigo, jsModernPlugins);
            }
        }
        catch {
        }
    }
    if (parseResult == null && (ext === '.ts' || ext === '.tsx')) {
        const tsx = ext === '.tsx';
        const tsParsed = parseComTypeScript(codigo, tsx);
        if (tsParsed) {
            setCurrentParsingFile(undefined);
            return Promise.resolve(tsParsed);
        }
    }
    if (parseResult == null &&
        opts.plugins &&
        (ext === '.ts' || ext === '.tsx')) {
        const tsx = ext === '.tsx';
        const tsParsed = parseComTypeScript(codigo, tsx);
        if (tsParsed) {
            setCurrentParsingFile(undefined);
            return Promise.resolve(tsParsed);
        }
    }
    if (opts.timeoutMs) {
        return (async () => {
            let timer = null;
            try {
                const race = Promise.race([
                    Promise.resolve(parseResult),
                    new Promise((resolve) => {
                        timer = setTimeout(() => {
                            logCore.timeoutParsing(opts.timeoutMs || 0, ext);
                            resolve(null);
                        }, opts.timeoutMs);
                    }),
                ]);
                return await race;
            }
            finally {
                if (timer)
                    clearTimeout(timer);
                setCurrentParsingFile(undefined);
            }
        })();
    }
    setCurrentParsingFile(undefined);
    return Promise.resolve(parseResult ?? null);
}
function initializePluginSystem() {
    const registry = getGlobalRegistry();
    const registeredPlugins = registry.getRegisteredPlugins();
    if (registeredPlugins.length === 0) {
        initializeDefaultPlugins();
        log.debug('🔌 Plugins padrão registrados no sistema');
    }
}
export async function parseComPlugins(codigo, extensao, opts) {
    try {
        initializePluginSystem();
        const registry = getGlobalRegistry();
        const plugin = await registry.getPluginForExtension(extensao);
        if (!plugin) {
            logCore.pluginNaoEncontrado(extensao);
            return await decifrarSintaxe(codigo, extensao, {
                plugins: opts?.plugins,
                timeoutMs: opts?.timeoutMs,
            });
        }
        logCore.usandoPlugin(plugin.name, extensao);
        const pluginOpts = {
            ...opts,
            pluginConfig: {
                ...opts?.pluginConfig,
                extension: extensao,
            },
        };
        const result = await plugin.parse(codigo, pluginOpts);
        return result;
    }
    catch (error) {
        logCore.sistemaPluginsFalhou(error.message);
        return await decifrarSintaxe(codigo, extensao, {
            plugins: opts?.plugins,
            timeoutMs: opts?.timeoutMs,
        });
    }
}
export function getPluginStats() {
    try {
        initializePluginSystem();
        const registry = getGlobalRegistry();
        const stats = registry.getStats();
        return {
            pluginsRegistrados: stats.pluginsRegistrados,
            extensoesSuportadas: stats.extensoesSuportadas,
            sistemAtivojava: stats.pluginsRegistrados > 0,
        };
    }
    catch {
        return {
            pluginsRegistrados: 0,
            extensoesSuportadas: 0,
            sistemAtivojava: false,
        };
    }
}
//# sourceMappingURL=parser.js.map