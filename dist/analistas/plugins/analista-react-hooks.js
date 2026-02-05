import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { AnalystOrigins, AnalystTypes, ReactHooksMessages, SeverityLevels, } from '../../core/messages/core/plugin-messages.js';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_REACT_HOOKS === '1';
function hasHooksUsage(src) {
    return /use(State|Effect|Memo|Callback|Reducer|Ref|LayoutEffect|ImperativeHandle|Transition)/.test(src);
}
function warn(message, relPath, line, nivel = SeverityLevels.warning) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel,
        origem: AnalystOrigins.reactHooks,
        tipo: AnalystTypes.reactHooks,
    });
}
function extractHookCallContent(src, startIndex) {
    let depth = 0;
    let started = false;
    let content = '';
    for (let i = startIndex; i < src.length; i++) {
        const char = src[i];
        if (char === '(') {
            depth++;
            started = true;
        }
        else if (char === ')') {
            depth--;
        }
        if (started) {
            content += char;
        }
        if (started && depth === 0) {
            break;
        }
    }
    return content;
}
function collectHookIssues(src, relPath) {
    const ocorrencias = [];
    const effectMatches = [...src.matchAll(/use(Layout)?Effect\s*\(/g)];
    effectMatches.forEach((m) => {
        const hookStart = m.index ?? 0;
        const fullCall = extractHookCallContent(src, hookStart + m[0].length - 1);
        const hasDepsArg = /,\s*(\[[\s\S]*?\]|\w+)\s*\)$/.test(fullCall);
        const skip = /no-deps-ok|eslint-disable-next-line\s+react-hooks\/exhaustive-deps/i.test(fullCall);
        if (!hasDepsArg && !skip) {
            const line = src.slice(0, hookStart).split(/\n/).length;
            ocorrencias.push(warn(ReactHooksMessages.useEffectNoDeps, relPath, line));
        }
    });
    const memoMatches = [...src.matchAll(/use(Memo|Callback)\s*\(/g)];
    memoMatches.forEach((m) => {
        const hookStart = m.index ?? 0;
        const fullCall = extractHookCallContent(src, hookStart + m[0].length - 1);
        const hasDepsArg = /,\s*(\[[\s\S]*?\]|\w+)\s*\)$/.test(fullCall);
        const skip = /no-deps-ok|eslint-disable-next-line\s+react-hooks\/exhaustive-deps/i.test(fullCall);
        if (!hasDepsArg && !skip) {
            const line = src.slice(0, hookStart).split(/\n/).length;
            ocorrencias.push(warn(ReactHooksMessages.memoCallbackNoDeps, relPath, line));
        }
    });
    const conditionalHooks = [
        ...src.matchAll(/(if|for|while)\s*\([^)]*\)\s*\{[\s\S]{0,160}?use[A-Z][A-Za-z0-9_]*/g),
    ];
    conditionalHooks.forEach((m) => {
        const line = src.slice(0, m.index || 0).split(/\n/).length;
        ocorrencias.push(warn(ReactHooksMessages.hookInConditional, relPath, line));
    });
    return ocorrencias;
}
const traverseFn = traverse;
function parseHooksWithBabel(src, relPath) {
    const lower = relPath.toLowerCase();
    const isTs = lower.endsWith('.ts') || lower.endsWith('.tsx');
    const isJsxLike = lower.endsWith('.tsx') || lower.endsWith('.jsx');
    try {
        const plugins = [
            'decorators-legacy',
            'classProperties',
            'classPrivateProperties',
            'classPrivateMethods',
            'optionalChaining',
            'nullishCoalescingOperator',
            'topLevelAwait',
            'importAttributes',
            'importAssertions',
        ];
        if (isTs)
            plugins.unshift('typescript');
        if (isJsxLike)
            plugins.unshift('jsx');
        const ast = babelParse(src, {
            sourceType: 'unambiguous',
            errorRecovery: true,
            plugins,
        });
        const out = [];
        const seen = new Set();
        const pushOnce = (m) => {
            const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
            if (seen.has(k))
                return;
            seen.add(k);
            out.push(m);
        };
        const isHookCallee = (callee) => {
            if (t.isIdentifier(callee))
                return { name: String(callee.name) };
            if (t.isMemberExpression(callee)) {
                const obj = callee.object;
                const prop = callee.property;
                const objName = t.isIdentifier(obj) ? String(obj.name) : '';
                const propName = t.isIdentifier(prop) ? String(prop.name) : '';
                if (objName === 'React' && propName)
                    return { name: propName };
            }
            return null;
        };
        const isEffectLike = (name) => name === 'useEffect' || name === 'useLayoutEffect';
        const isMemoLike = (name) => name === 'useMemo' || name === 'useCallback';
        const isAnyHook = (name) => /^use[A-Z0-9_]/.test(name);
        const inConditionalOrLoop = (path) => {
            return Boolean(path.findParent((p) => p.isIfStatement() ||
                p.isForStatement() ||
                p.isWhileStatement() ||
                p.isDoWhileStatement() ||
                p.isSwitchStatement()));
        };
        const visitor = {
            CallExpression(path) {
                try {
                    const calleeInfo = isHookCallee(path.node.callee);
                    if (!calleeInfo)
                        return;
                    const name = calleeInfo.name;
                    const locLine = path.node.loc?.start?.line;
                    if (isEffectLike(name) && path.node.arguments.length < 2) {
                        pushOnce(warn(ReactHooksMessages.useEffectNoDeps, relPath, locLine));
                    }
                    if (isMemoLike(name) && path.node.arguments.length < 2) {
                        pushOnce(warn(ReactHooksMessages.memoCallbackNoDeps, relPath, locLine));
                    }
                    if (isAnyHook(name) && inConditionalOrLoop(path)) {
                        pushOnce(warn(ReactHooksMessages.hookInConditional, relPath, locLine));
                    }
                }
                catch {
                }
            },
        };
        traverseFn(ast, visitor);
        return out;
    }
    catch {
        return null;
    }
}
export const analistaReactHooks = criarAnalista({
    nome: 'analista-react-hooks',
    categoria: 'framework',
    descricao: 'Heurísticas leves de Hooks (sem ESLint).',
    global: false,
    test: (relPath) => /\.(jsx|tsx|js|ts)$/i.test(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        if (relPath.includes('src/analistas/plugins/analista-react-hooks.ts'))
            return null;
        if (!hasHooksUsage(src))
            return null;
        const astMsgs = parseHooksWithBabel(src, relPath);
        if (astMsgs !== null)
            return astMsgs.length ? astMsgs : null;
        const msgs = collectHookIssues(src, relPath);
        return msgs.length ? msgs : null;
    },
});
export default analistaReactHooks;
//# sourceMappingURL=analista-react-hooks.js.map