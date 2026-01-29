import { AnalystOrigins, AnalystTypes, CssMessages, SeverityLevels, } from '../../core/messages/core/plugin-messages.js';
import { isLikelyIntentionalDuplicate, lintCssLikeStylelint, } from '../../shared/impar/stylelint.js';
import postcss, {} from 'postcss';
import postcssSass from 'postcss-sass';
import postcssScss from 'postcss-scss';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = globalThis
    .process?.env?.ORACULO_DISABLE_PLUGIN_CSS === '1';
function warn(message, relPath, line, nivelArg = SeverityLevels.warning) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel: nivelArg,
        origem: AnalystOrigins.css,
        tipo: AnalystTypes.css,
    });
}
function collectCssIssues(src, relPath) {
    const ocorrencias = [];
    const lines = src.split(/\n/);
    const stack = [];
    lines.forEach((lineText, idx) => {
        const line = idx + 1;
        const trimmed = lineText.trim();
        const opens = (trimmed.match(/\{/g) || []).length;
        for (let i = 0; i < opens; i++) {
            const ctx = //i.test(trimmed) ? 'font-face' : undefined;
            stack.push({ props: {}, context: ctx });
        }
        const current = stack[stack.length - 1];
        if (current) {
            const propMatch = /^([a-zA-Z-]+)\s*:\s*([^;]+)?/.exec(trimmed);
            if (propMatch) {
                const prop = propMatch[1].toLowerCase();
                const value = (propMatch[2] || '').trim();
                const prev = current.props[prop];
                if (prev) {
                    const ctx = current.context
                        ? { currentAtRule: current.context }
                        : undefined;
                    if (isLikelyIntentionalDuplicate(prop, prev.value, value, ctx)) {
                    }
                    else if (prev.value === value) {
                        ocorrencias.push(warn(CssMessages.duplicatePropertySame(prop), relPath, line));
                    }
                    else {
                        ocorrencias.push(warn(CssMessages.duplicatePropertyDifferent(prop, prev.value, value), relPath, line));
                    }
                }
                else {
                    current.props[prop] = { line, value };
                }
            }
        }
        if (/!important/.test(trimmed)) {
            ocorrencias.push(warn(CssMessages.importantUsage, relPath, line));
        }
        if (/^\s+[^;]*http:\/\//i.test(trimmed)) {
            ocorrencias.push(warn(CssMessages.httpImport, relPath, line));
        }
        if (/url\(\s*['"]?http:\/\//i.test(trimmed)) {
            ocorrencias.push(warn(CssMessages.httpUrl, relPath, line));
        }
        const closes = (trimmed.match(/\}/g) || []).length;
        for (let i = 0; i < closes; i++) {
            if (stack.length)
                stack.pop();
        }
    });
    return ocorrencias;
}
function collectCssIssuesLikeStylelint(src, relPath) {
    const warnings = lintCssLikeStylelint({ code: src, relPath });
    if (!warnings.length)
        return null;
    return warnings.map((w) => {
        const nivel = w.severity === 'error' ? SeverityLevels.error : SeverityLevels.warning;
        return warn(w.text, relPath, w.line, nivel);
    });
}
function normalizeCssValue(value) {
    return value.replace(/\s+/g, ' ').trim();
}
function canonicalizeDecls(decls) {
    const map = new Map();
    decls.forEach((d) => {
        const prop = d.prop.trim().toLowerCase();
        const value = normalizeCssValue(d.value);
        if (!prop || !value)
            return;
        map.set(prop, value);
    });
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return {
        signature: sorted.map(([p, v]) => `${p}:${v}`).join(';'),
        count: sorted.length,
    };
}
function splitSimpleSelectors(selectorText) {
    return selectorText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => /^(\.[A-Za-z0-9_-]+|#[A-Za-z0-9_-]+)$/.test(s));
}
function parseWithPostCssRoots(src, relPath) {
    const isScss = /\.scss$/i.test(relPath);
    const isSass = /\.sass$/i.test(relPath);
    const syntax = isScss
        ? postcssScss
        : isSass
            ? postcssSass
            : undefined;
    try {
        const result = postcss().process(src, {
            from: relPath,
            ...(syntax ? { syntax } : {}),
        });
        const rootUnknown = result.root;
        const rootAny = rootUnknown;
        if (rootAny &&
            rootAny.type === 'document' &&
            Array.isArray(rootAny.nodes)) {
            const roots = rootAny.nodes.filter((n) => {
                const t = n?.type;
                return t === 'root';
            });
            return roots.length ? roots : null;
        }
        return [result.root];
    }
    catch {
        return null;
    }
}
function getNodeLine(node) {
    const line = node?.source?.start?.line;
    return typeof line === 'number' && Number.isFinite(line) ? line : undefined;
}
function formatAtRuleContext(n) {
    const name = String(n.name || '').toLowerCase();
    const params = String(n.params || '').trim();
    return `@${name}${params ? ` ${params}` : ''}`;
}
function normalizePropKey(prop) {
    return prop.startsWith('--') ? prop : prop.toLowerCase();
}
const KNOWN_CSS_PROPERTIES = new Set([
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-width',
    'border-style',
    'border-color',
    'box-sizing',
    'float',
    'clear',
    'overflow',
    'overflow-x',
    'overflow-y',
    'z-index',
    'visibility',
    'flex',
    'flex-direction',
    'flex-wrap',
    'flex-flow',
    'justify-content',
    'align-items',
    'align-content',
    'align-self',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'order',
    'grid',
    'grid-template-columns',
    'grid-template-rows',
    'grid-template-areas',
    'grid-column',
    'grid-row',
    'grid-area',
    'gap',
    'row-gap',
    'column-gap',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-variant',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-decoration',
    'text-transform',
    'text-indent',
    'white-space',
    'word-break',
    'word-wrap',
    'color',
    'background',
    'background-color',
    'background-image',
    'background-repeat',
    'background-position',
    'background-size',
    'cursor',
    'opacity',
    'transform',
    'transition',
    'animation',
    'list-style',
    'vertical-align',
    'text-overflow',
    'box-shadow',
    'border-radius',
    'outline',
    'content',
    'counter-reset',
    'counter-increment',
]);
function isValidCssProperty(prop) {
    const normalized = prop.toLowerCase();
    if (normalized.startsWith('--') || normalized.startsWith('-')) {
        return true;
    }
    return KNOWN_CSS_PROPERTIES.has(normalized);
}
function detectCssHacks(value) {
    const hacks = [
        { pattern: /\\9/, name: 'backslash-9 hack' },
        { pattern: /_property/, name: 'underscore hack' },
        { pattern: /\*property/, name: 'star hack' },
        { pattern: /property\\\0\//, name: 'null byte hack' },
        { pattern: /expression\(/, name: 'IE expression' },
    ];
    for (const hack of hacks) {
        if (hack.pattern.test(value)) {
            return hack.name;
        }
    }
    return null;
}
function collectCssIssuesFromPostCssAst(root, relPath) {
    const ocorrencias = [];
    const seen = new Set();
    const pushOnce = (m) => {
        const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
        if (seen.has(k))
            return;
        seen.add(k);
        ocorrencias.push(m);
    };
    const byContextAndSignature = new Map();
    const visit = (container, ctxAtRules, ctxSelectors) => {
        const props = {};
        const inFontFace = ctxAtRules.some((c) => c.toLowerCase().startsWith(''));
        container.nodes?.forEach((node) => {
            if (node.type === 'decl') {
                const decl = node;
                const propRaw = String(decl.prop || '').trim();
                if (!propRaw || propRaw.startsWith('$')) {
                    return;
                }
                const propKey = normalizePropKey(propRaw);
                const value = normalizeCssValue(`${String(decl.value || '')}${decl.important ? ' !important' : ''}`);
                const line = getNodeLine(decl);
                const prev = props[propKey];
                if (prev) {
                    const ctx = inFontFace
                        ? { currentAtRule: 'font-face' }
                        : undefined;
                    if (isLikelyIntentionalDuplicate(propKey, prev.value, value, ctx)) {
                    }
                    else if (prev.value === value) {
                        pushOnce(warn(CssMessages.duplicatePropertySame(propRaw), relPath, line));
                    }
                    else {
                        pushOnce(warn(CssMessages.duplicatePropertyDifferent(propRaw, prev.value, value), relPath, line));
                    }
                }
                props[propKey] = { value, line };
                if (!isValidCssProperty(propRaw)) {
                    pushOnce(warn(CssMessages.invalidProperty(propRaw), relPath, line));
                }
                const hack = detectCssHacks(String(decl.value || ''));
                if (hack) {
                    pushOnce(warn(CssMessages.cssHackDetected(hack), relPath, line));
                }
                if (decl.important) {
                    pushOnce(warn(CssMessages.importantUsage, relPath, line));
                }
                if (/url\(\s*['"]?http:\/\//i.test(String(decl.value || ''))) {
                    pushOnce(warn(CssMessages.httpUrl, relPath, line));
                }
            }
        });
        if (container.type === 'rule') {
            const rule = container;
            const selectorText = String(rule.selector || '');
            const simpleSelectors = splitSimpleSelectors(selectorText);
            if (simpleSelectors.length) {
                const decls = [];
                rule.nodes?.forEach((n) => {
                    if (n.type !== 'decl')
                        return;
                    const d = n;
                    const prop = String(d.prop || '').trim();
                    if (!prop || prop.startsWith('$'))
                        return;
                    const value = `${String(d.value || '')}${d.important ? ' !important' : ''}`;
                    decls.push({ prop, value });
                });
                if (decls.length === 0) {
                    pushOnce(warn(CssMessages.emptyRule, relPath, getNodeLine(rule)));
                }
                const { signature, count } = canonicalizeDecls(decls);
                if (signature && count >= 3) {
                    const ctxKey = [...ctxAtRules, ...ctxSelectors].join('|');
                    const key = `${ctxKey}||${signature}`;
                    const entry = byContextAndSignature.get(key) ?? {
                        declCount: count,
                        hits: [],
                    };
                    const line = getNodeLine(rule);
                    simpleSelectors.forEach((sel) => entry.hits.push({ selector: sel, line }));
                    byContextAndSignature.set(key, entry);
                }
            }
            else if (selectorText.trim()) {
                try {
                    const invalidChars = /[{}[\]()]/;
                    if (invalidChars.test(selectorText)) {
                        pushOnce(warn(CssMessages.malformedSelector(selectorText.trim()), relPath, getNodeLine(rule)));
                    }
                }
                catch {
                    pushOnce(warn(CssMessages.malformedSelector(selectorText.trim()), relPath, getNodeLine(rule)));
                }
            }
        }
        container.nodes?.forEach((node) => {
            if (node.type === 'atrule') {
                const at = node;
                const name = String(at.name || '').toLowerCase();
                const line = getNodeLine(at);
                if (name === 'import' &&
                    /^\s*(url\()?\s*['"]?http:\/\//i.test(String(at.params || ''))) {
                    pushOnce(warn(CssMessages.httpImport, relPath, line));
                }
                if (at.nodes && at.nodes.length) {
                    visit(at, [...ctxAtRules, formatAtRuleContext(at)], ctxSelectors);
                }
                return;
            }
            if (node.type === 'rule') {
                const r = node;
                const nextSelectors = container.type === 'rule'
                    ? [
                        ...ctxSelectors,
                        `sel ${String(container.selector || '').trim()}`,
                    ]
                    : ctxSelectors;
                visit(r, ctxAtRules, nextSelectors);
            }
        });
    };
    visit(root, [], []);
    for (const { declCount, hits } of byContextAndSignature.values()) {
        const selectors = [...new Set(hits.map((h) => h.selector))];
        if (selectors.length < 2)
            continue;
        const line = hits
            .map((h) => h.line)
            .filter((n) => typeof n === 'number' && Number.isFinite(n))
            .sort((a, b) => a - b)[0];
        pushOnce(warn(CssMessages.unifySelectors(selectors, declCount), relPath, line));
        const ids = selectors.filter((s) => s.startsWith('#'));
        ids.slice(0, 3).forEach((idSel) => {
            pushOnce(warn(CssMessages.idSelectorPreferClass(idSel), relPath, line, SeverityLevels.info));
        });
    }
    return ocorrencias;
}
export const analistaCss = criarAnalista({
    nome: 'analista-css',
    categoria: 'estilo',
    descricao: 'Lint de CSS do Oráculo (com fallback heurístico).',
    global: false,
    test: (relPath) => /\.(css|scss|sass)$/i.test(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        const isCss = /\.css$/i.test(relPath);
        const roots = parseWithPostCssRoots(src, relPath);
        const astIssues = roots
            ? roots.flatMap((r) => collectCssIssuesFromPostCssAst(r, relPath))
            : [];
        const cssLint = isCss
            ? (collectCssIssuesLikeStylelint(src, relPath) ?? [])
            : [];
        const seen = new Set();
        const merged = [];
        const pushOnce = (m) => {
            const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
            if (seen.has(k))
                return;
            seen.add(k);
            merged.push(m);
        };
        cssLint.forEach(pushOnce);
        astIssues.forEach(pushOnce);
        if (merged.length)
            return merged;
        const fallback = collectCssIssues(src, relPath);
        return fallback.length ? fallback : null;
    },
});
export default analistaCss;
//# sourceMappingURL=analista-css.js.map