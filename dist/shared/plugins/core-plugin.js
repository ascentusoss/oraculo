import { parse as babelParse } from '@babel/parser';
import { log, logCore } from '../../core/messages/index.js';
import { getCurrentParsingFile } from '../../core/parsing/parser.js';
import * as csstree from 'css-tree';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { parseDocument } from 'htmlparser2';
import { createRequire } from 'module';
const localRequire = createRequire(import.meta.url);
export class CorePlugin {
    name = 'core';
    version = '0.2.0';
    extensions = [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.mjs',
        '.cjs',
        '.html',
        '.htm',
        '.css',
        '.xml',
        '.php',
        '.py',
        '.d.ts',
    ];
    async parse(codigo, opts) {
        const ext = this.inferExtension(codigo, opts);
        switch (ext) {
            case '.js':
            case '.jsx':
            case '.mjs':
            case '.cjs':
                return this.parseJavaScript(codigo, opts);
            case '.ts':
            case '.tsx':
                return this.parseTypeScript(codigo, opts);
            case '.d.ts':
                return null;
            case '.html':
            case '.htm':
                return this.parseHtml(codigo);
            case '.css':
                return this.parseCss(codigo);
            case '.xml':
                return this.parseXml(codigo);
            case '.php':
                return this.parsePhp(codigo);
            case '.py':
                return this.parsePython(codigo);
            default:
                logCore.extensaoNaoSuportada(ext);
                return null;
        }
    }
    parseJavaScript(codigo, opts) {
        let result = this.parseComBabel(codigo, opts?.plugins);
        if (result === null) {
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
                result = this.parseComBabel(codigo, flowPlugins);
            }
            if (result === null) {
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
                result = this.parseComBabel(codigo, jsModernPlugins);
            }
        }
        return result;
    }
    parseTypeScript(codigo, opts) {
        const ext = this.inferExtension(codigo, opts);
        const isTsx = ext === '.tsx';
        let result = this.parseComBabel(codigo, opts?.plugins);
        if (result === null) {
            result = this.parseComTypeScriptCompiler(codigo, isTsx);
        }
        return result;
    }
    parseComBabel(codigo, plugins) {
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
    parseComTypeScriptCompiler(codigo, tsx = false) {
        try {
            const ts = localRequire('typescript');
            const sf = ts.createSourceFile(tsx ? 'file.tsx' : 'file.ts', codigo, ts.ScriptTarget.Latest, false, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
            return this.wrapMinimal(tsx ? 'tsx-tsc' : 'ts-tsc', {
                kind: sf.kind,
                statements: sf.statements?.length ?? 0,
            });
        }
        catch (e) {
            logCore.erroTs(e.message, getCurrentParsingFile());
            return null;
        }
    }
    parseHtml(codigo) {
        try {
            const dom = parseDocument(codigo, { xmlMode: false });
            return this.wrapMinimal('html', dom);
        }
        catch (e) {
            logCore.erroHtml(e.message, getCurrentParsingFile());
            return null;
        }
    }
    parseCss(codigo) {
        try {
            const ast = csstree.parse(codigo, { positions: false });
            return this.wrapMinimal('css', ast);
        }
        catch (e) {
            logCore.erroCss(e.message, getCurrentParsingFile());
            return null;
        }
    }
    parseXml(codigo) {
        try {
            const isValid = XMLValidator.validate(codigo);
            if (isValid !== true) {
                log.debug(`⚠️ XML inválido: ${typeof isValid === 'object' ? isValid.err?.msg : 'desconhecido'}`);
                return null;
            }
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@',
            });
            const ast = parser.parse(codigo);
            return this.wrapMinimal('xml', ast);
        }
        catch (e) {
            logCore.erroXml(e.message, getCurrentParsingFile());
            return null;
        }
    }
    parsePhp(codigo) {
        try {
            const classes = Array.from(codigo.matchAll(/\bclass\s+([A-Za-z0-9_]+)/g)).map((m) => m[1]);
            const functions = Array.from(codigo.matchAll(/\bfunction\s+([A-Za-z0-9_]+)/g)).map((m) => m[1]);
            const namespaces = Array.from(codigo.matchAll(/\bnamespace\s+([A-Za-z0-9_\\]+)/g)).map((m) => m[1]);
            log.debug(`🐘 PHP pseudo-parse: ${classes.length} classes, ${functions.length} funções`);
            return this.wrapMinimal('php', { classes, functions, namespaces });
        }
        catch (e) {
            log.debug(`⚠️ Erro ao parsear PHP: ${e.message}`);
            return null;
        }
    }
    parsePython(codigo) {
        try {
            const classes = Array.from(codigo.matchAll(/^class\s+([A-Za-z0-9_]+)/gm)).map((m) => m[1]);
            const functions = Array.from(codigo.matchAll(/^def\s+([A-Za-z0-9_]+)/gm)).map((m) => m[1]);
            log.debug(`🐍 Python pseudo-parse: ${classes.length} classes, ${functions.length} funções`);
            return this.wrapMinimal('python', { classes, functions });
        }
        catch (e) {
            log.debug(`⚠️ Erro ao parsear Python: ${e.message}`);
            return null;
        }
    }
    wrapMinimal(lang, rawAst) {
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
            oraculoExtra: { lang, rawAst: rawAst },
        };
    }
    inferExtension(codigo, opts) {
        if (opts?.pluginConfig?.extension) {
            return opts.pluginConfig.extension;
        }
        if (/^<\?php/.test(codigo.trim())) {
            return '.php';
        }
        if (/^(import |from .+ import |def |class )/m.test(codigo)) {
            return '.py';
        }
        if (/\bfrom\s+['"][^'"]+\.tsx?['"]/.test(codigo) || /<[A-Z]/.test(codigo)) {
            return codigo.includes('interface ') || codigo.includes('type ')
                ? '.tsx'
                : '.jsx';
        }
        if (/\binterface\s+\w+|\btype\s+\w+\s*=/.test(codigo)) {
            return '.ts';
        }
        if (/^<\?xml/.test(codigo.trim())) {
            return '.xml';
        }
        if (/<[a-z][\w-]*/.test(codigo)) {
            return '.html';
        }
        if (/\{[\s\S]*\}/.test(codigo) && /[a-z-]+\s*:/.test(codigo)) {
            return '.css';
        }
        return '.js';
    }
    validate(codigo) {
        if (!codigo || typeof codigo !== 'string') {
            return false;
        }
        if (/[\x00-\x08\x0E-\x1F\x7F]/.test(codigo)) {
            return false;
        }
        return true;
    }
}
const corePlugin = new CorePlugin();
export default corePlugin;
//# sourceMappingURL=core-plugin.js.map