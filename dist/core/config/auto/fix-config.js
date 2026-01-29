import { otimizarSvgLikeSvgo, shouldSugerirOtimizacaoSvg, } from '../../../shared/impar/svgs.js';
import { hasMinimumConfidence, isCategoryAllowed, shouldExcludeFile, } from './auto-fix-config.js';
function _isInComment(match, fullCode) {
    const lines = fullCode.split('\n');
    const matchStart = typeof match.index === 'number' ? match.index : fullCode.indexOf(match[0]);
    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = pos;
        const lineEnd = pos + line.length;
        if (matchStart >= lineStart && matchStart <= lineEnd) {
            const before = line.substring(0, Math.max(0, matchStart - lineStart));
            if (/\/\//.test(before))
                return true;
            const blockStart = fullCode.lastIndexOf('/*', matchStart);
            const blockEnd = fullCode.indexOf('*/', matchStart);
            if (blockStart !== -1 && (blockEnd === -1 || blockEnd > matchStart))
                return true;
        }
        pos = lineEnd + 1;
    }
    return false;
}
function _isInTodoComment(match, fullCode) {
    const lines = fullCode.split('\n');
    const matchStart = typeof match.index === 'number' ? match.index : fullCode.indexOf(match[0]);
    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = pos;
        const lineEnd = pos + line.length;
        if (matchStart >= lineStart && matchStart <= lineEnd) {
            if (/TODO|FIXME|XXX|HACK/i.test(line))
                return true;
        }
        pos = lineEnd + 1;
    }
    return false;
}
function _isCriticalSystemFile(fullCode) {
    const criticalIndicators = [
        'SPDX-License-Identifier',
        '/configuracao',
        'operario-estrutura',
        'corretor-estrutura',
        'config.js',
        'executor.js',
        'quick-fix-registry',
        'mapa-reversao',
        'persistence/persistencia',
    ];
    return criticalIndicators.some((i) => fullCode.includes(i));
}
export const quickFixRegistry = [
    {
        id: 'svg-optimize-svgo-like',
        title: 'Otimizar SVG (Oráculo)',
        description: 'Remove prolog/doctype/comentários/metadata e colapsa whitespace entre tags para reduzir tamanho do SVG.',
        pattern: /^[\s\S]+$/,
        category: 'performance',
        confidence: 95,
        shouldApply: (_match, fullCode, _lineContext, filePath) => {
            const pareceSvg = /<svg\b/i.test(fullCode);
            const isSvgPath = typeof filePath === 'string' ? /\.svg$/i.test(filePath) : false;
            if (!isSvgPath && !pareceSvg)
                return false;
            const opt = otimizarSvgLikeSvgo({ svg: fullCode });
            if (!opt.changed)
                return false;
            if (!shouldSugerirOtimizacaoSvg(opt.originalBytes, opt.optimizedBytes))
                return false;
            return true;
        },
        fix: (_match, fullCode) => {
            const opt = otimizarSvgLikeSvgo({ svg: fullCode });
            return opt.data;
        },
    },
    {
        id: 'svg-add-viewbox-safe',
        title: 'Adicionar viewBox (quando seguro)',
        description: 'Quando o SVG tem width/height numéricos e não tem viewBox, adiciona viewBox="0 0 width height".',
        pattern: /^[\s\S]+$/,
        category: 'performance',
        confidence: 92,
        shouldApply: (_match, fullCode, _lineContext, filePath) => {
            const pareceSvg = /<svg\b/i.test(fullCode);
            const isSvgPath = typeof filePath === 'string' ? /\.svg$/i.test(filePath) : false;
            if (!isSvgPath && !pareceSvg)
                return false;
            if (/\bviewBox\s*=\s*['"][^'"]+['"]/i.test(fullCode))
                return false;
            const width = fullCode.match(/\bwidth\s*=\s*['"]([^'"]+)['"]/i)?.[1] ?? '';
            const height = fullCode.match(/\bheight\s*=\s*['"]([^'"]+)['"]/i)?.[1] ?? '';
            const parse = (v) => {
                const m = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/i.exec(v);
                return m ? Number(m[1]) : null;
            };
            const w = parse(width);
            const h = parse(height);
            return w !== null && h !== null && w > 0 && h > 0;
        },
        fix: (_match, fullCode) => {
            const tagMatch = /<svg\b[^>]*>/i.exec(fullCode);
            if (!tagMatch)
                return fullCode;
            const tag = tagMatch[0];
            if (/\bviewBox\s*=\s*['"][^'"]+['"]/i.test(tag))
                return fullCode;
            const width = fullCode.match(/\bwidth\s*=\s*['"]([^'"]+)['"]/i)?.[1] ?? '';
            const height = fullCode.match(/\bheight\s*=\s*['"]([^'"]+)['"]/i)?.[1] ?? '';
            const parse = (v) => {
                const m = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/i.exec(v);
                return m ? m[1] : null;
            };
            const w = parse(width);
            const h = parse(height);
            if (!w || !h)
                return fullCode;
            const viewBoxAttr = ` viewBox="0 0 ${w} ${h}"`;
            const updatedTag = tag.replace(/<svg\b/i, `<svg${viewBoxAttr}`);
            return fullCode.replace(tag, updatedTag);
        },
    },
];
export function findQuickFixes(code, problemType, config, filePath) {
    const results = [];
    if (config && filePath && shouldExcludeFile(filePath, config))
        return results;
    for (const fix of quickFixRegistry) {
        if (config && !isCategoryAllowed(fix.category, config))
            continue;
        if (config && !hasMinimumConfidence(fix.confidence, config))
            continue;
        if (problemType && !fix.id.includes(problemType))
            continue;
        const matches = [];
        fix.pattern.lastIndex = 0;
        let match;
        while ((match = fix.pattern.exec(code)) !== null) {
            if (fix.shouldApply) {
                const lines = code.split('\n');
                const matchPos = match.index ?? 0;
                const linesBefore = code.substring(0, matchPos).split('\n');
                const lineContext = lines[linesBefore.length - 1] || '';
                const ok = fix.shouldApply(match, code, lineContext, filePath);
                if (!ok) {
                    if (!fix.pattern.global)
                        break;
                    continue;
                }
            }
            matches.push(match);
            if (config &&
                typeof config.maxFixesPerFile === 'number' &&
                matches.length >= config.maxFixesPerFile)
                break;
            if (!fix.pattern.global)
                break;
        }
        if (matches.length > 0)
            results.push({ ...fix, matches });
    }
    return results;
}
export function applyQuickFix(code, fix, match) {
    return fix.fix(match, code);
}
//# sourceMappingURL=fix-config.js.map