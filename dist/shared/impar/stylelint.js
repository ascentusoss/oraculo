import * as csstree from 'css-tree';
function normalizeWhitespace(input) {
    return input.replace(/\s+/g, ' ').trim();
}
function isLikelyHttpUrlLine(line) {
    return /https?:\/\//i.test(line);
}
function hasHttpUrl(input) {
    return /\bhttp:\/\//i.test(input);
}
function checkNoInvalidDoubleSlashComments(code) {
    const out = [];
    const lines = code.split(/\n/);
    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i] ?? '';
        const idx = line.indexOf('//');
        if (idx === -1)
            continue;
        if (isLikelyHttpUrlLine(line))
            continue;
        out.push({
            rule: 'no-invalid-double-slash-comments',
            severity: 'warning',
            text: 'Comentário // detectado em CSS. CSS não suporta // (apenas /* */).',
            line: lineNo,
            column: idx + 1,
        });
    }
    return out;
}
function hasCssVar(value) {
    return /\bvar\(/i.test(value);
}
function hasGradient(value) {
    return /gradient/i.test(value);
}
function hasImageSet(value) {
    return /image-set\(/i.test(value);
}
export function isLikelyIntentionalDuplicate(prop, prevValue, newValue, ctx) {
    const normalizedProp = prop.toLowerCase();
    if (/(100)?(vh|dvh|vw|dvw)/i.test(prevValue) ||
        /(100)?(vh|dvh|vw|dvw)/i.test(newValue)) {
        return true;
    }
    if (hasCssVar(prevValue) || hasCssVar(newValue)) {
        return true;
    }
    if (/(^#|rgb|hsl|color)/i.test(prevValue) &&
        /(^#|rgb|hsl|color)/i.test(newValue) &&
        prevValue !== newValue) {
        return true;
    }
    const gradientPrev = hasGradient(prevValue);
    const gradientNew = hasGradient(newValue);
    const isBackgroundProp = normalizedProp === 'background' || normalizedProp === 'background-image';
    if ((gradientPrev && gradientNew && prevValue !== newValue) ||
        (isBackgroundProp && (gradientPrev || gradientNew))) {
        return true;
    }
    if (isBackgroundProp && (hasImageSet(prevValue) || hasImageSet(newValue))) {
        return true;
    }
    const inFontFace = (ctx?.currentAtRule || '').toLowerCase() === 'font-face';
    if (inFontFace && normalizedProp === 'src') {
        return true;
    }
    const vendorProp = normalizedProp.replace(/^(-webkit|-moz|-ms|-o)-/, '');
    if (vendorProp !== normalizedProp) {
        return true;
    }
    if (normalizedProp === 'display' &&
        (prevValue === 'flex' || prevValue === 'grid') &&
        (newValue === 'flex' || newValue === 'grid')) {
        return false;
    }
    return false;
}
export function lintCssLikeStylelint(opts) {
    const code = opts.code;
    const warnings = [];
    if (!code.trim()) {
        warnings.push({
            rule: 'no-empty-source',
            severity: 'warning',
            text: 'Arquivo CSS vazio.',
            line: 1,
            column: 1,
        });
        return warnings;
    }
    warnings.push(...checkNoInvalidDoubleSlashComments(code));
    let ast;
    try {
        ast = csstree.parse(code, {
            filename: opts.relPath,
            positions: true,
            parseCustomProperty: true,
        });
    }
    catch (e) {
        warnings.push({
            rule: 'syntax-error',
            severity: 'error',
            text: `Erro de parse CSS: ${e.message}`,
        });
        return warnings;
    }
    const importSeen = new Set();
    const selectorSeenByScope = new Set();
    const keyframesSeen = new Set();
    const atruleStack = [];
    function currentScopeKey() {
        if (!atruleStack.length)
            return '';
        return atruleStack
            .map((a) => {
            const p = a.prelude ? ` ${a.prelude}` : '';
            return `@${a.name}${p}`;
        })
            .join(' | ');
    }
    csstree.walk(ast, {
        enter: (node) => {
            if (node?.type === 'Atrule' &&
                String(node.name || '').toLowerCase() === 'import') {
                const prelude = node.prelude
                    ? normalizeWhitespace(csstree.generate(node.prelude))
                    : '';
                const key = prelude;
                if (key) {
                    if (hasHttpUrl(key)) {
                        warnings.push({
                            rule: 'no-http-at-import-rules',
                            severity: 'warning',
                            text: '@import via HTTP detectado; prefira HTTPS ou bundling local.',
                            line: node.loc?.start?.line,
                            column: node.loc?.start?.column,
                        });
                    }
                    if (importSeen.has(key)) {
                        warnings.push({
                            rule: 'no-duplicate-at-import-rules',
                            severity: 'warning',
                            text: `@import duplicado detectado (${key}).`,
                            line: node.loc?.start?.line,
                            column: node.loc?.start?.column,
                        });
                    }
                    else {
                        importSeen.add(key);
                    }
                }
            }
            if (node?.type === 'Atrule') {
                const name = String(node.name || '').toLowerCase();
                const isKeyframes = name === 'keyframes' ||
                    name === '-webkit-keyframes' ||
                    name === '-moz-keyframes';
                if (isKeyframes) {
                    const prelude = node.prelude
                        ? normalizeWhitespace(csstree.generate(node.prelude))
                        : '';
                    const key = `${name}:${prelude}`;
                    if (keyframesSeen.has(key)) {
                        warnings.push({
                            rule: 'no-duplicate-keyframes',
                            severity: 'warning',
                            text: `Declaração @keyframes duplicada detectada (${prelude}).`,
                            line: node.loc?.start?.line,
                            column: node.loc?.start?.column,
                        });
                    }
                    else if (prelude) {
                        keyframesSeen.add(key);
                    }
                }
            }
            if (node?.type === 'Atrule' && node.block) {
                const name = String(node.name || '').toLowerCase();
                const prelude = node.prelude
                    ? normalizeWhitespace(csstree.generate(node.prelude))
                    : '';
                atruleStack.push({ name, prelude });
            }
            if (node?.type === 'Rule' && node?.prelude) {
                const selector = normalizeWhitespace(csstree.generate(node.prelude));
                if (selector) {
                    const key = `${currentScopeKey()}||${selector}`;
                    if (selectorSeenByScope.has(key)) {
                        warnings.push({
                            rule: 'no-duplicate-selectors',
                            severity: 'warning',
                            text: `Seletor duplicado detectado (${selector}). Considere consolidar regras.`,
                            line: node.loc?.start?.line,
                            column: node.loc?.start?.column,
                        });
                    }
                    else {
                        selectorSeenByScope.add(key);
                    }
                }
            }
            if ((node?.type === 'Rule' || node?.type === 'Atrule') &&
                node?.block?.children) {
                const children = node.block.children;
                const isEmpty = typeof children.getSize === 'function'
                    ? children.getSize() === 0
                    : false;
                if (isEmpty) {
                    warnings.push({
                        rule: 'block-no-empty',
                        severity: 'warning',
                        text: 'Bloco CSS vazio detectado.',
                        line: node.loc?.start?.line,
                        column: node.loc?.start?.column,
                    });
                }
            }
        },
        leave: (node) => {
            if (node?.type === 'Atrule' && node.block) {
                atruleStack.pop();
            }
        },
    });
    const conflictProps = new Set(['display', 'position', 'float', 'clear']);
    const atruleStackForDecl = [];
    const declStack = [];
    csstree.walk(ast, {
        enter: (node) => {
            if (node?.type === 'Atrule' && node.block) {
                const name = String(node.name || '').toLowerCase();
                const prelude = node.prelude
                    ? normalizeWhitespace(csstree.generate(node.prelude))
                    : '';
                atruleStackForDecl.push({ name, prelude });
            }
            if ((node?.type === 'Rule' || node?.type === 'Atrule') &&
                node.block?.children) {
                const name = node.type === 'Atrule' ? String(node.name || '').toLowerCase() : '';
                const prelude = node.type === 'Atrule' && node.prelude
                    ? normalizeWhitespace(csstree.generate(node.prelude))
                    : '';
                declStack.push({
                    nodeType: node.type,
                    name,
                    prelude,
                    seen: new Map(),
                });
            }
            if (node?.type !== 'Declaration')
                return;
            const current = declStack[declStack.length - 1];
            const prop = String(node.property || '').toLowerCase();
            const value = node.value
                ? normalizeWhitespace(csstree.generate(node.value))
                : '';
            const loc = node.loc?.start;
            if (node.important === true) {
                warnings.push({
                    rule: 'declaration-no-important',
                    severity: 'warning',
                    text: 'Uso de !important detectado; prefira especificidade adequada.',
                    line: loc?.line,
                    column: loc?.column,
                });
            }
            if (/\burl\(\s*['"]?http:\/\//i.test(value)) {
                warnings.push({
                    rule: 'no-http-url',
                    severity: 'warning',
                    text: 'Recurso externo via HTTP em url(); prefira HTTPS.',
                    line: loc?.line,
                    column: loc?.column,
                });
            }
            if (!current)
                return;
            const prev = current.seen.get(prop);
            if (!prev) {
                current.seen.set(prop, { value, line: loc?.line, column: loc?.column });
                return;
            }
            const duplicateCtx = {
                atruleStack: [...atruleStackForDecl],
                currentAtRule: current.name,
                currentAtRulePrelude: current.prelude,
            };
            if (isLikelyIntentionalDuplicate(prop, prev.value, value, duplicateCtx))
                return;
            const same = prev.value === value;
            const isStructuralConflict = conflictProps.has(prop) && !same;
            warnings.push({
                rule: 'declaration-block-no-duplicate-properties',
                severity: same || isStructuralConflict ? 'error' : 'warning',
                text: same
                    ? `Propriedade duplicada com valor idêntico (${prop}).`
                    : `Propriedade duplicada (${prop}) com valores diferentes: "${prev.value}" vs "${value}".`,
                line: loc?.line,
                column: loc?.column,
            });
        },
        leave: (node) => {
            if ((node?.type === 'Rule' || node?.type === 'Atrule') &&
                node.block?.children) {
                declStack.pop();
            }
            if (node?.type === 'Atrule' && node.block) {
                atruleStackForDecl.pop();
            }
        },
    });
    return warnings;
}
//# sourceMappingURL=stylelint.js.map