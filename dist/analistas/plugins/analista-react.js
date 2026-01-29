import { parse as babelParse } from '/parser';
import traverse from '/traverse';
import * as t from '/types';
import { AnalystOrigins, AnalystTypes, ReactMessages, SeverityLevels, } from '../../core/messages/core/plugin-messages.js';
import { createLineLookup } from '../../shared/helpers/line-lookup.js';
import { maskJsComments } from '../../shared/helpers/masking.js';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_REACT === '1';
function hasJSX(src) {
    const hasTagLike = /(^|[^A-Za-z0-9_$])<([A-Za-z][A-Za-z0-9]*)\b/.test(src);
    const hasFragment = /<>|<\/>|<\/\s*>|<\/\s*Fragment\s*>/i.test(src);
    return hasTagLike || hasFragment || /React\.createElement/.test(src);
}
const traverseFn = traverse;
function warn(message, relPath, line, nivel = SeverityLevels.warning) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel,
        origem: AnalystOrigins.react,
        tipo: AnalystTypes.react,
    });
}
function collectReactIssues(src, relPath) {
    const ocorrencias = [];
    const lineOf = createLineLookup(src).lineAt;
    for (const match of src.matchAll(/<a[^>]*target=['"]?_blank['"]?[^>]*>/gi)) {
        const hasRelSafe = /rel=['"][^'"]*(noopener|noreferrer)[^'"]*['"]/i.test(match[0]);
        if (!hasRelSafe) {
            const line = lineOf(match.index);
            ocorrencias.push(warn(ReactMessages.linkTargetBlank, relPath, line));
        }
    }
    for (const match of src.matchAll(/dangerouslySetInnerHTML/gi)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(ReactMessages.dangerouslySetInnerHTML, relPath, line));
    }
    for (const match of src.matchAll(/<img[^>]*>/gi)) {
        const hasAlt = /\salt=/.test(match[0]);
        const ariaHidden = /\saria-hidden=['"]true['"]/i.test(match[0]);
        const rolePresentation = /\srole=['"](presentation|none)['"]/i.test(match[0]);
        if (!hasAlt && !ariaHidden && !rolePresentation) {
            const line = lineOf(match.index);
            ocorrencias.push(warn(ReactMessages.imgWithoutAlt, relPath, line));
        }
    }
    for (const match of src.matchAll(/\b(fetch|axios\.get|axios\.post|axios\.[a-z]+)\s*\(\s*['"]http:\/\//gi)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(ReactMessages.httpFetch, relPath, line));
    }
    for (const match of src.matchAll(/(api[key]?|token|secret|senha|password|passphrase)\s*[:=]\s*['"]([A-Za-z0-9\/_+=.-]{16,})['"]/gi)) {
        const valor = match[2] || '';
        if (valor.length < 24 || /^https?:\/\//i.test(valor))
            continue;
        const line = lineOf(match.index);
        ocorrencias.push(warn(ReactMessages.hardcodedCredential, relPath, line));
    }
    const usesNextRouter = /useRouter|router\.(push|replace)/.test(src);
    for (const match of src.matchAll(/location\.href\s*=\s*([^;]+)/gi)) {
        const assignedValue = match[1] || '';
        const line = lineOf(match.index);
        const isStaticString = /^['"`][^'"\`]*['"`]$/.test(assignedValue.trim());
        const isInternalNavigation = /^['"`]\//.test(assignedValue.trim());
        if (!isStaticString && !isInternalNavigation && !usesNextRouter) {
            ocorrencias.push(warn(ReactMessages.locationHrefRedirect, relPath, line));
        }
    }
    return ocorrencias;
}
function normalizeStringValue(v) {
    return typeof v === 'string' ? v : '';
}
function isBabelNode(v) {
    return typeof v === 'object' && v !== null && 'type' in v;
}
function attrsToFlatList(attrs) {
    if (!Array.isArray(attrs))
        return [];
    return attrs
        .filter(isBabelNode)
        .filter((a) => t.isJSXAttribute(a))
        .filter((a) => t.isJSXIdentifier(a.name))
        .map((a) => {
        const name = String(a.name.name);
        let value;
        if (!a.value)
            value = null;
        else if (t.isStringLiteral(a.value))
            value = a.value.value;
        else if (t.isJSXExpressionContainer(a.value)) {
            const expr = a.value.expression;
            if (t.isStringLiteral(expr))
                value = expr.value;
        }
        return { name, value };
    });
}
function findAttr(attrs, name) {
    const n = name.toLowerCase();
    return attrs.find((a) => a.name.toLowerCase() === n) ?? null;
}
function isSensitiveKeyName(key) {
    return /(api[key]?|token|secret|senha|password|passphrase)/i.test(key);
}
function parseReactWithBabel(scan, relPath) {
    const lower = relPath.toLowerCase();
    const isTs = lower.endsWith('.ts') || lower.endsWith('.tsx');
    const isJsxLike = lower.endsWith('.tsx') || lower.endsWith('.jsx');
    const isJsFamily = /\.(js|mjs|cjs|jsx)$/i.test(lower);
    if (lower.endsWith('.ts') && !isJsxLike)
        return null;
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
        if (isJsxLike || isJsFamily)
            plugins.unshift('jsx');
        const ast = babelParse(scan, {
            sourceType: 'unambiguous',
            errorRecovery: true,
            plugins,
        });
        const ocorrencias = [];
        const seen = new Set();
        const pushOnce = (m) => {
            const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
            if (seen.has(k))
                return;
            seen.add(k);
            ocorrencias.push(m);
        };
        const visitor = {
            JSXOpeningElement(path) {
                try {
                    const node = path.node;
                    const locLine = node.loc?.start?.line;
                    const nameNode = node.name;
                    const tag = t.isJSXIdentifier(nameNode) ? String(nameNode.name) : '';
                    if (!tag)
                        return;
                    const attrs = attrsToFlatList(node.attributes);
                    if (tag.toLowerCase() === 'a') {
                        const target = findAttr(attrs, 'target');
                        const targetVal = normalizeStringValue(target?.value);
                        if (target && targetVal === '_blank') {
                            const rel = findAttr(attrs, 'rel');
                            const relVal = normalizeStringValue(rel?.value);
                            const safe = /(noopener|noreferrer)/i.test(relVal);
                            if (!safe)
                                pushOnce(warn(ReactMessages.linkTargetBlank, relPath, locLine));
                        }
                    }
                    if (tag.toLowerCase() === 'img') {
                        const alt = findAttr(attrs, 'alt');
                        const ariaHidden = findAttr(attrs, 'aria-hidden');
                        const role = findAttr(attrs, 'role');
                        const ariaHiddenVal = normalizeStringValue(ariaHidden?.value);
                        const roleVal = normalizeStringValue(role?.value);
                        const decorative = ariaHiddenVal === 'true' ||
                            /^(presentation|none)$/i.test(roleVal);
                        if (!alt && !decorative) {
                            pushOnce(warn(ReactMessages.imgWithoutAlt, relPath, locLine));
                        }
                    }
                    if (findAttr(attrs, 'dangerouslySetInnerHTML')) {
                        pushOnce(warn(ReactMessages.dangerouslySetInnerHTML, relPath, locLine));
                    }
                    for (const a of node.attributes) {
                        try {
                            if (!t.isJSXAttribute(a) || !t.isJSXIdentifier(a.name))
                                continue;
                            const attrName = String(a.name.name);
                            if (a.value && t.isJSXExpressionContainer(a.value)) {
                                const expr = a.value.expression;
                                if (t.isArrowFunctionExpression(expr) ||
                                    t.isFunctionExpression(expr)) {
                                    pushOnce(warn(ReactMessages.inlineHandlerJsx, relPath, locLine));
                                }
                                if (attrName === 'key' &&
                                    t.isJSXExpressionContainer(a.value) &&
                                    t.isIdentifier(a.value.expression)) {
                                    const id = a.value.expression.name;
                                    if (['i', 'index', 'idx'].includes(id)) {
                                        pushOnce(warn(ReactMessages.indexAsKey, relPath, locLine));
                                    }
                                }
                            }
                        }
                        catch {
                        }
                    }
                }
                catch {
                }
            },
            CallExpression(path) {
                try {
                    const node = path.node;
                    const locLine = node.loc?.start?.line;
                    const args = node.arguments;
                    const first = args[0];
                    const firstStr = t.isStringLiteral(first) ? String(first.value) : '';
                    if (t.isIdentifier(node.callee) && node.callee.name === 'fetch') {
                        if (/^http:\/\//i.test(firstStr))
                            pushOnce(warn(ReactMessages.httpFetch, relPath, locLine));
                        return;
                    }
                    if (t.isMemberExpression(node.callee)) {
                        const obj = node.callee.object;
                        const prop = node.callee.property;
                        const objName = t.isIdentifier(obj) ? String(obj.name) : '';
                        const propName = t.isIdentifier(prop) ? String(prop.name) : '';
                        if (objName === 'axios' && propName) {
                            if (/^http:\/\//i.test(firstStr))
                                pushOnce(warn(ReactMessages.httpFetch, relPath, locLine));
                        }
                        if (propName === 'map' && args.length >= 1) {
                            const cb = args[0];
                            const checkCallback = (fn) => {
                                try {
                                    const body = fn.body;
                                    const checkJsxNode = (jsx) => {
                                        if (t.isJSXElement(jsx)) {
                                            const hasKey = jsx.openingElement.attributes.some((a) => t.isJSXAttribute(a) &&
                                                t.isJSXIdentifier(a.name) &&
                                                String(a.name.name) === 'key');
                                            if (!hasKey) {
                                                pushOnce(warn(ReactMessages.listItemNoKey, relPath, jsx.loc?.start?.line ?? locLine));
                                            }
                                        }
                                        else {
                                            pushOnce(warn(ReactMessages.listItemNoKey, relPath, jsx.loc?.start?.line ?? locLine));
                                        }
                                    };
                                    if (t.isJSXElement(body) || t.isJSXFragment(body)) {
                                        checkJsxNode(body);
                                    }
                                    else if (t.isBlockStatement(body)) {
                                        for (const stmt of body.body) {
                                            if (t.isReturnStatement(stmt) && stmt.argument) {
                                                if (t.isJSXElement(stmt.argument) ||
                                                    t.isJSXFragment(stmt.argument)) {
                                                    checkJsxNode(stmt.argument);
                                                }
                                            }
                                        }
                                    }
                                }
                                catch {
                                }
                            };
                            if (t.isFunctionExpression(cb))
                                checkCallback(cb);
                            if (t.isArrowFunctionExpression(cb))
                                checkCallback(cb);
                        }
                    }
                }
                catch {
                }
            },
            AssignmentExpression(path) {
                try {
                    const node = path.node;
                    const locLine = node.loc?.start?.line;
                    const left = node.left;
                    if (!t.isMemberExpression(left))
                        return;
                    const obj = left.object;
                    const prop = left.property;
                    const objName = t.isIdentifier(obj) ? String(obj.name) : '';
                    const propName = t.isIdentifier(prop) ? String(prop.name) : '';
                    if (objName === 'location' && propName === 'href') {
                        const right = node.right;
                        let isSafe = false;
                        if (t.isStringLiteral(right)) {
                            const val = right.value;
                            isSafe =
                                val.startsWith('/') ||
                                    val.startsWith('./') ||
                                    val.startsWith('../');
                        }
                        if (!isSafe) {
                            pushOnce(warn(ReactMessages.locationHrefRedirect, relPath, locLine));
                        }
                    }
                }
                catch {
                }
            },
            ObjectProperty(path) {
                try {
                    const node = path.node;
                    const locLine = node.loc?.start?.line;
                    const key = node.key;
                    const value = node.value;
                    const keyName = t.isIdentifier(key)
                        ? String(key.name)
                        : t.isStringLiteral(key)
                            ? String(key.value)
                            : '';
                    if (!keyName || !isSensitiveKeyName(keyName))
                        return;
                    if (!t.isStringLiteral(value))
                        return;
                    const s = String(value.value || '');
                    if (s.length < 24)
                        return;
                    if (/^https?:\/\//i.test(s))
                        return;
                    pushOnce(warn(ReactMessages.hardcodedCredential, relPath, locLine));
                }
                catch {
                }
            },
        };
        traverseFn(ast, visitor);
        return ocorrencias.length ? ocorrencias : null;
    }
    catch {
        return null;
    }
}
export const analistaReact = criarAnalista({
    nome: 'analista-react',
    categoria: 'framework',
    descricao: 'Heurísticas leves de React (sem ESLint).',
    global: false,
    test: (relPath) => /\.(jsx|tsx|js|ts)$/i.test(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        if (relPath.includes('src/analistas/plugins/analista-react.ts'))
            return null;
        const scan = maskJsComments(src);
        if (/\.ts$/i.test(relPath) && !/\.tsx$/i.test(relPath)) {
            const hasStrongJsxEvidence = /<\/[A-Za-z][^>]*>/.test(scan) ||
                /\/>/.test(scan) ||
                /React\.createElement/.test(scan);
            if (!hasStrongJsxEvidence)
                return null;
        }
        if (!hasJSX(scan))
            return null;
        const astMsgs = parseReactWithBabel(scan, relPath) ?? [];
        const heuristicMsgs = collectReactIssues(scan, relPath);
        if (!astMsgs.length && !heuristicMsgs.length)
            return null;
        const seen = new Set();
        const merged = [];
        const pushOnce = (m) => {
            const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
            if (seen.has(k))
                return;
            seen.add(k);
            merged.push(m);
        };
        astMsgs.forEach(pushOnce);
        heuristicMsgs.forEach(pushOnce);
        return merged.length ? merged : null;
    },
});
export default analistaReact;
//# sourceMappingURL=analista-react.js.map