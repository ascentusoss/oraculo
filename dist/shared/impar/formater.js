import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { XMLValidator } from 'fast-xml-parser';
import { getFormatterForPath, registerFormatter, } from './formatter-registry.js';
import { getSyntaxInfoForPath } from './syntax-map.js';
function normalizarFimDeLinha(code) {
    return code.replace(/\r\n?/g, '\n');
}
function removerBom(code) {
    return code.length > 0 && code.charCodeAt(0) === 0xfeff
        ? code.slice(1)
        : code;
}
function normalizarNewlinesFinais(code) {
    const normalized = normalizarFimDeLinha(code);
    return `${normalized.replace(/\n+$/g, '')}\n`;
}
function removerEspacosFinaisPorLinha(code) {
    return removerEspacosFinaisPorLinhaComProtecao(code);
}
function removerEspacosFinaisPorLinhaComProtecao(code, protectedLines) {
    return code
        .split('\n')
        .map((l, idx) => {
        const lineNo = idx + 1;
        if (protectedLines && protectedLines.has(lineNo))
            return l;
        return l.replace(/[ \t]+$/g, '');
    })
        .join('\n');
}
function matchMarkdownFence(line) {
    const trimmedLeft = line.replace(/^\s+/, '');
    const m = trimmedLeft.match(/^([`~])\1{2,}/);
    if (!m)
        return null;
    const ch = (m[1] ?? '`');
    const len = (m[0] ?? '').length;
    const rest = trimmedLeft.slice(len);
    return { ch, len, rest };
}
function isMarkdownFenceCloser(match, fenceChar, fenceLen) {
    return (fenceChar !== null &&
        match.ch === fenceChar &&
        match.len >= fenceLen &&
        match.rest.trim() === '');
}
function isJsTsFile(relPath) {
    const rp = (relPath ?? '').toLowerCase();
    return (rp.endsWith('.ts') ||
        rp.endsWith('.tsx') ||
        rp.endsWith('.cts') ||
        rp.endsWith('.mts') ||
        rp.endsWith('.js') ||
        rp.endsWith('.jsx') ||
        rp.endsWith('.mjs') ||
        rp.endsWith('.cjs'));
}
function getProtectedLinesFromTemplateLiterals(code, relPath) {
    try {
        const req = createRequire(import.meta.url);
        const parser = req('/parser');
        const rp = (relPath ?? '').toLowerCase();
        const plugins = [
            'importMeta',
            'dynamicImport',
            'topLevelAwait',
            'classProperties',
            'classPrivateProperties',
            'classPrivateMethods',
            'classStaticBlock',
            'optionalChaining',
            'nullishCoalescingOperator',
            'numericSeparator',
            'logicalAssignment',
            'privateIn',
            'objectRestSpread',
            'decorators-legacy',
        ];
        const isTs = rp.endsWith('.ts') ||
            rp.endsWith('.tsx') ||
            rp.endsWith('.cts') ||
            rp.endsWith('.mts');
        const isJsx = rp.endsWith('.jsx') || rp.endsWith('.tsx');
        if (isTs)
            plugins.push('typescript');
        if (isJsx)
            plugins.push('jsx');
        const ast = parser.parse(code, {
            sourceType: 'unambiguous',
            errorRecovery: true,
            allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true,
            plugins,
        });
        const protectedLines = new Set();
        const seen = new Set();
        const isObject = (v) => typeof v === 'object' && v !== null;
        const walk = (node) => {
            if (!isObject(node))
                return;
            if (seen.has(node))
                return;
            seen.add(node);
            const anyNode = node;
            if (anyNode.type === 'TemplateLiteral') {
                const loc = anyNode.loc;
                if (loc?.start?.line && loc?.end?.line) {
                    for (let ln = loc.start.line; ln <= loc.end.line; ln++) {
                        protectedLines.add(ln);
                    }
                }
            }
            for (const k of Object.keys(anyNode)) {
                if (k === 'loc' || k === 'start' || k === 'end')
                    continue;
                const v = anyNode[k];
                if (Array.isArray(v)) {
                    for (const item of v)
                        walk(item);
                    continue;
                }
                if (isObject(v)) {
                    const child = v;
                    if (typeof child.type === 'string')
                        walk(child);
                }
            }
        };
        walk(ast);
        return protectedLines.size > 0 ? protectedLines : null;
    }
    catch {
        return null;
    }
}
function limitarLinhasEmBranco(code, maxConsecutivas = 2, protectedLines) {
    const lines = normalizarFimDeLinha(code).split('\n');
    const out = [];
    let consecutivas = 0;
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const lineNo = i + 1;
        if (protectedLines && protectedLines.has(lineNo)) {
            out.push(line);
            consecutivas = 0;
            continue;
        }
        const isBlank = line.trim() === '';
        if (isBlank) {
            consecutivas += 1;
            if (consecutivas > maxConsecutivas) {
                changed = true;
                continue;
            }
        }
        else {
            consecutivas = 0;
        }
        out.push(line);
    }
    return { code: out.join('\n'), changed };
}
function assegurarLinhaVaziaAposTitulosMarkdown(code) {
    const lines = normalizarFimDeLinha(code).split('\n');
    const out = [];
    let changed = false;
    let inFence = false;
    let fenceChar = null;
    let fenceLen = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const fence = matchMarkdownFence(line);
        if (!inFence && fence) {
            inFence = true;
            fenceChar = fence.ch;
            fenceLen = fence.len;
            out.push(line);
            continue;
        }
        if (inFence && fence && isMarkdownFenceCloser(fence, fenceChar, fenceLen)) {
            inFence = false;
            fenceChar = null;
            fenceLen = 0;
            out.push(line);
            continue;
        }
        if (inFence) {
            out.push(line);
            continue;
        }
        out.push(line);
        const ehHeading = /^#{1,6}\s+\S/.test(line.trim());
        const proxima = lines[i + 1];
        const precisaEspaco = ehHeading && proxima !== undefined && proxima.trim() !== '';
        if (precisaEspaco) {
            out.push('');
            changed = true;
        }
    }
    return { code: out.join('\n'), changed };
}
function stripDiacritics(input) {
    return input
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .normalize('NFC');
}
function normalizarCercasMarkdown(code) {
    const lines = normalizarFimDeLinha(code).split('\n');
    let changed = false;
    const out = lines.map((line) => {
        const typo = line.match(/^(\s*)``è(.*)$/);
        if (typo) {
            const prefix = typo[1] ?? '';
            const after = typo[2] ?? '';
            const normalized = `${prefix}\`\`\`${after}`;
            if (normalized !== line)
                changed = true;
            return normalized;
        }
        const m = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (!m)
            return line;
        const prefix = m[1] ?? '';
        const fence = m[2] ?? '';
        const afterFence = m[3] ?? '';
        const info = afterFence.match(/^(\s*)(\S+)(.*)$/);
        if (!info)
            return line;
        const lead = info[1] ?? '';
        const token = info[2] ?? '';
        const tail = info[3] ?? '';
        const shouldNormalizeToken = /[^\x00-\x7F]/.test(token);
        if (!shouldNormalizeToken)
            return line;
        const normalizedToken = stripDiacritics(token);
        const normalized = `${prefix}${fence}${lead}${normalizedToken}${tail}`;
        if (normalized !== line)
            changed = true;
        return normalized;
    });
    return { code: out.join('\n'), changed };
}
function corrigirHtmlInlineEmMarkdown(text) {
    let changed = false;
    const fixed = text.replace(/<[^>\n]+>/g, (tag) => {
        if (tag.startsWith('<!--') || tag.startsWith('<!'))
            return tag;
        let t = tag;
        t = t.replace(/^<\s+/, '<').replace(/^<\/\s+/, '</');
        t = t.replace(/\s+\/>$/, '/>').replace(/\s+>$/, '>');
        t = t.replace(/^<\/\s+/, '</');
        if (t !== tag)
            changed = true;
        return t;
    });
    return { text: fixed, changed };
}
function corrigirEnfaseMarkdown(text) {
    let changed = false;
    let out = text;
    const apply = (re, replacer) => {
        const next = out.replace(re, replacer);
        if (next !== out)
            changed = true;
        out = next;
    };
    apply(/\*\*([^\s*][^*\n]*?)\*\*\*(?!\*)/g, '**$1**');
    apply(/(^|[^*])\*([^\s*][^*\n]*?)\*\*(?!\*)/g, '$1*$2*');
    apply(/(^|[^*])\*([^\s*][^*\n]*?)\*\*\*(?!\*)/g, '$1*$2*');
    return { text: out, changed };
}
function corrigirMarkdownInlineForaDeCodigo(code) {
    const lines = normalizarFimDeLinha(code).split('\n');
    const out = [];
    let changed = false;
    let inFence = false;
    let fenceChar = null;
    let fenceLen = 0;
    const processOutsideCodeSpans = (text) => {
        let i = 0;
        let acc = '';
        while (i < text.length) {
            const tickStart = text.indexOf('`', i);
            if (tickStart === -1) {
                const chunk = text.slice(i);
                let next = chunk;
                const e = corrigirEnfaseMarkdown(next);
                next = e.text;
                const h = corrigirHtmlInlineEmMarkdown(next);
                next = h.text;
                if (next !== chunk)
                    changed = true;
                acc += next;
                break;
            }
            const chunk = text.slice(i, tickStart);
            let next = chunk;
            const e = corrigirEnfaseMarkdown(next);
            next = e.text;
            const h = corrigirHtmlInlineEmMarkdown(next);
            next = h.text;
            if (next !== chunk)
                changed = true;
            acc += next;
            let runEnd = tickStart;
            while (runEnd < text.length && text[runEnd] === '`')
                runEnd++;
            const run = text.slice(tickStart, runEnd);
            const closeIndex = text.indexOf(run, runEnd);
            if (closeIndex === -1) {
                acc += text.slice(tickStart);
                break;
            }
            acc += text.slice(tickStart, closeIndex + run.length);
            i = closeIndex + run.length;
        }
        return acc;
    };
    for (const line of lines) {
        const fence = matchMarkdownFence(line);
        if (!inFence && fence) {
            inFence = true;
            fenceChar = fence.ch;
            fenceLen = fence.len;
            out.push(line);
            continue;
        }
        if (inFence && fence && isMarkdownFenceCloser(fence, fenceChar, fenceLen)) {
            inFence = false;
            fenceChar = null;
            fenceLen = 0;
            out.push(line);
            continue;
        }
        if (inFence) {
            out.push(line);
            continue;
        }
        out.push(processOutsideCodeSpans(line));
    }
    return { code: out.join('\n'), changed };
}
function limitarLinhasEmBrancoMarkdown(code, maxConsecutivas = 2) {
    const lines = normalizarFimDeLinha(code).split('\n');
    const out = [];
    let consecutivas = 0;
    let changed = false;
    let inFence = false;
    let fenceChar = null;
    let fenceLen = 0;
    for (const line of lines) {
        const fence = matchMarkdownFence(line);
        if (!inFence && fence) {
            inFence = true;
            fenceChar = fence.ch;
            fenceLen = fence.len;
            consecutivas = 0;
            out.push(line);
            continue;
        }
        if (inFence && fence && isMarkdownFenceCloser(fence, fenceChar, fenceLen)) {
            inFence = false;
            fenceChar = null;
            fenceLen = 0;
            consecutivas = 0;
            out.push(line);
            continue;
        }
        if (inFence) {
            out.push(line);
            continue;
        }
        const isBlank = line.trim() === '';
        if (isBlank) {
            consecutivas += 1;
            if (consecutivas > maxConsecutivas) {
                changed = true;
                continue;
            }
        }
        else {
            consecutivas = 0;
        }
        out.push(line);
    }
    return { code: out.join('\n'), changed };
}
function normalizarSeparadoresDeSecao(code, opts = {}) {
    const lines = normalizarFimDeLinha(code).split('\n');
    const out = [];
    let changed = false;
    const specialTitlesBySymbol = {
        FormatadorMessages: 'MENSAGENS FORMATADOR (MIN)',
        SvgMessages: 'MENSAGENS SVG (OTIMIZAÇÃO)',
    };
    const toUpperTitle = (raw) => {
        const trimmed = raw.trim();
        if (!trimmed)
            return trimmed;
        const withSpaces = trimmed
            .replace(/([a-z\d])([A-Z])/g, '$1 $2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            .replace(/[_\-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const upper = withSpaces.toUpperCase();
        return upper
            .replace(/\bJSON\b/g, 'JSON')
            .replace(/\bHTML\b/g, 'HTML')
            .replace(/\bCSS\b/g, 'CSS')
            .replace(/\bXML\b/g, 'XML')
            .replace(/\bSVG\b/g, 'SVG')
            .replace(/\bXXE\b/g, 'XXE');
    };
    const inferTitleFromNextSymbol = (fromIndex) => {
        for (let j = fromIndex + 1; j < Math.min(lines.length, fromIndex + 35); j++) {
            const l = (lines[j] ?? '').trim();
            if (!l)
                continue;
            if (l.startsWith('//'))
                continue;
            if (l.startsWith('/*'))
                continue;
            const m = l.match(/^(?:export\s+)?(?:const|function|class|interface|type)\s+([A-Za-z_$][\w$]*)\b/);
            if (!m)
                continue;
            const symbol = m[1] ?? '';
            if (!symbol)
                continue;
            const special = specialTitlesBySymbol[symbol];
            if (special)
                return special;
            if (symbol.endsWith('Messages')) {
                const base = symbol.slice(0, -'Messages'.length);
                const baseTitle = toUpperTitle(base);
                return baseTitle ? `MENSAGENS ${baseTitle}` : 'MENSAGENS';
            }
            return toUpperTitle(symbol);
        }
        const relPath = (opts.relPath ?? '').toLowerCase();
        if (relPath.includes('/messages/') || relPath.includes('messages'))
            return 'MENSAGENS';
        return null;
    };
    const parseNovoSeparadorComMarcacao = (line) => {
        const m = line.match(/^\s*\/\*\s*-{10,}\s*substituir\s+por\s+titulo\s+(?:\((.+?)\))?\s*-{10,}\s*\*\/\s*$/i);
        if (!m)
            return null;
        const raw = (m[1] ?? '').trim();
        return { titulo: raw ? raw : null };
    };
    const isSeparadorSemTitulo = (line) => {
        return (/^\s*\/\*\s*-{10,}\s*substituir\s+por\s+titulo\s*-{10,}\s*\*\/\s*$/i.test(line) ||
            /^\s*\/\*\s*-{10,}\s*-\s*-{10,}\s*\*\/\s*$/.test(line) ||
            /^\s*\/\*\s*-{10,}\s*\s*-{10,}\s*\*\/\s*$/i.test(line));
    };
    const buildSeparatorWithTitle = (title) => {
        return `  /* -------------------------- ${title} -------------------------- */`;
    };
    const isDivider = (line) => /^\s*\/\/\s*(?:[=\-_*]){8,}\s*$/.test(line) ||
        /^\s*\/\*\s*(?:[=\-_*]){8,}\s*\*\/\s*$/.test(line);
    const extractTitleFromLineComment = (line) => {
        const m = line.match(/^\s*\/\/\s*(.+?)\s*$/);
        if (!m)
            return null;
        const t = m[1].trim();
        if (!t)
            return null;
        if (/^(?:[=\-_*]){5,}$/.test(t))
            return null;
        return t;
    };
    const extractTitleFromBlockComment = (line) => {
        const m = line.match(/^\s*\/\*\s*(.+?)\s*\*\/\s*$/);
        if (!m)
            return null;
        const t = m[1].trim();
        if (!t)
            return null;
        if (/^(?:[=\-_*]){5,}$/.test(t))
            return null;
        return t;
    };
    const extractTitleFromSingleLine = (line) => {
        const m = line.match(/^\s*\/\/\s*(?:[=\-_*]){5,}\s*(.+?)\s*(?:[=\-_*]){5,}\s*$/);
        if (!m)
            return null;
        const t = m[1].trim();
        return t ? t : null;
    };
    const extractTitleFromSingleBlockLine = (line) => {
        const m = line.match(/^\s*\/\*\s*(?:[=\-_*]){5,}\s*(.+?)\s*(?:[=\-_*]){5,}\s*\*\/\s*$/);
        if (!m)
            return null;
        const t = m[1].trim();
        return t ? t : null;
    };
    const buildSeparator = (originalTitle) => buildSeparatorWithTitle(originalTitle);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const lineNo = i + 1;
        if (opts.protectedLines && opts.protectedLines.has(lineNo)) {
            out.push(line);
            continue;
        }
        if (isSeparadorSemTitulo(line)) {
            const inferred = inferTitleFromNextSymbol(i);
            if (inferred) {
                out.push(buildSeparatorWithTitle(inferred));
                changed = true;
            }
            else {
                out.push(line);
            }
            continue;
        }
        const novo = parseNovoSeparadorComMarcacao(line);
        if (novo) {
            if (novo.titulo) {
                out.push(buildSeparatorWithTitle(novo.titulo));
                changed = true;
            }
            else {
                const inferred = inferTitleFromNextSymbol(i);
                if (inferred) {
                    out.push(buildSeparatorWithTitle(inferred));
                    changed = true;
                }
                else {
                    out.push(line);
                }
            }
            continue;
        }
        if (isDivider(line) &&
            i + 2 < lines.length &&
            isDivider(lines[i + 2] ?? '')) {
            if (opts.protectedLines &&
                (opts.protectedLines.has(i + 1) ||
                    opts.protectedLines.has(i + 2) ||
                    opts.protectedLines.has(i + 3))) {
                out.push(line);
                continue;
            }
            const middle = lines[i + 1] ?? '';
            const title = extractTitleFromLineComment(middle) ??
                extractTitleFromBlockComment(middle);
            if (title) {
                out.push(buildSeparator(title));
                i += 2;
                changed = true;
                continue;
            }
        }
        const singleLine = extractTitleFromSingleLine(line);
        const singleBlock = extractTitleFromSingleBlockLine(line);
        const single = singleLine ?? singleBlock;
        if (single) {
            out.push(buildSeparator(single));
            changed = true;
            continue;
        }
        out.push(line);
    }
    return { code: out.join('\n'), changed };
}
function formatarCodeMinimo(code, opts = {}) {
    const normalized = normalizarFimDeLinha(removerBom(code));
    const protectedLines = opts.relPath && isJsTsFile(opts.relPath)
        ? getProtectedLinesFromTemplateLiterals(normalized, opts.relPath)
        : null;
    const semEspacosFinais = removerEspacosFinaisPorLinhaComProtecao(normalized, protectedLines);
    const shouldNormalizeSeparators = opts.normalizarSeparadoresDeSecao ?? true;
    const { code: maybeSeparadores, changed: changedSeparators } = shouldNormalizeSeparators
        ? normalizarSeparadoresDeSecao(semEspacosFinais, {
            relPath: opts.relPath,
            protectedLines,
        })
        : { code: semEspacosFinais, changed: false };
    const { code: semBlanks, changed: changedBlanks } = limitarLinhasEmBranco(maybeSeparadores, 2, protectedLines);
    const formatted = normalizarNewlinesFinais(semBlanks);
    const baseline = normalizarNewlinesFinais(normalized);
    const changed = formatted !== baseline;
    return {
        ok: true,
        parser: opts.parser ?? 'code',
        formatted,
        changed,
        reason: changedSeparators
            ? 'normalizacao-separadores'
            : changedBlanks
                ? 'limpeza-linhas-em-branco'
                : 'normalizacao-basica',
    };
}
function formatarJsonMinimo(code) {
    try {
        const normalizedInput = normalizarFimDeLinha(removerBom(code));
        const parsed = JSON.parse(normalizedInput);
        const formatted = normalizarNewlinesFinais(JSON.stringify(parsed, null, 2));
        const normalizedForComparison = normalizarNewlinesFinais(normalizedInput);
        const changed = formatted !== normalizedForComparison;
        return { ok: true, parser: 'json', formatted, changed };
    }
    catch (err) {
        return {
            ok: false,
            parser: 'json',
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
function formatarMarkdownMinimo(code) {
    const normalized = normalizarFimDeLinha(code);
    const trimmed = removerEspacosFinaisPorLinha(normalized);
    const { code: cercasNormalizadas, changed: changedFences } = normalizarCercasMarkdown(trimmed);
    const { code: markdownCorrigido, changed: changedInline } = corrigirMarkdownInlineForaDeCodigo(cercasNormalizadas);
    const { code: comEspacoTitulos, changed: changedHeadings } = assegurarLinhaVaziaAposTitulosMarkdown(markdownCorrigido);
    const { code: semBlanks, changed: changedBlanks } = limitarLinhasEmBrancoMarkdown(comEspacoTitulos, 2);
    const formatted = normalizarNewlinesFinais(semBlanks);
    return {
        ok: true,
        parser: 'markdown',
        formatted,
        changed: formatted !== normalizarNewlinesFinais(normalized),
        reason: changedFences || changedInline || changedHeadings || changedBlanks
            ? 'estilo-oraculo-markdown'
            : 'normalizacao-basica',
    };
}
function formatarYamlMinimo(code) {
    const normalized = normalizarFimDeLinha(code);
    const trimmed = removerEspacosFinaisPorLinha(normalized);
    const { code: semBlanks, changed: changedBlanks } = limitarLinhasEmBranco(trimmed, 2);
    const formatted = normalizarNewlinesFinais(semBlanks);
    return {
        ok: true,
        parser: 'yaml',
        formatted,
        changed: formatted !== normalizarNewlinesFinais(normalized),
        reason: changedBlanks ? 'estilo-oraculo-yaml' : 'normalizacao-basica',
    };
}
function tokenizeXml(src) {
    const re = /(<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\/?[^>\n]+?>)/gi;
    const out = [];
    let last = 0;
    for (const m of src.matchAll(re)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        if (start > last)
            out.push({ kind: 'text', value: src.slice(last, start) });
        out.push({ kind: 'tag', value: m[0] ?? '' });
        last = start + (m[0]?.length ?? 0);
    }
    if (last < src.length)
        out.push({ kind: 'text', value: src.slice(last) });
    return out;
}
function normalizeXmlTagToken(tag) {
    if (tag.startsWith('<!--') || tag.startsWith('<![CDATA['))
        return { tag, changed: false };
    if (tag.startsWith('<?'))
        return { tag, changed: false };
    if (tag.startsWith('<!'))
        return { tag, changed: false };
    let out = tag;
    const original = tag;
    out = out.replace(/^<\s+/, '<');
    out = out.replace(/^<\/\s+/, '</');
    out = out.replace(/\s+\/>$/, '/>');
    out = out.replace(/\s+>$/, '>');
    let buf = '';
    let inQuote = null;
    let prevWasSpace = false;
    for (let i = 0; i < out.length; i++) {
        const ch = out[i] ?? '';
        if (inQuote) {
            buf += ch;
            if (ch === inQuote)
                inQuote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            inQuote = ch;
            buf += ch;
            prevWasSpace = false;
            continue;
        }
        if (/\s/.test(ch)) {
            if (!prevWasSpace) {
                buf += ' ';
                prevWasSpace = true;
            }
            continue;
        }
        prevWasSpace = false;
        buf += ch;
    }
    out = buf;
    out = out.replace(/^<\s+/, '<');
    out = out.replace(/^<\/\s+/, '</');
    out = out.replace(/\s+\/>$/, '/>');
    out = out.replace(/\s+>$/, '>');
    return { tag: out, changed: out !== original };
}
function hasXmlMixedContent(tokens) {
    for (const t of tokens) {
        if (t.kind !== 'text')
            continue;
        if (/[\S]/.test(t.value))
            return true;
    }
    return false;
}
function prettyPrintXmlIfSafe(xml) {
    const tokens = tokenizeXml(xml);
    if (hasXmlMixedContent(tokens))
        return { xml, changed: false };
    let changed = false;
    let indent = 0;
    const indentStr = (n) => '  '.repeat(Math.max(0, n));
    const outLines = [];
    const pushLine = (line) => {
        if (!line)
            return;
        outLines.push(line);
    };
    for (const tok of tokens) {
        if (tok.kind === 'text') {
            continue;
        }
        const raw = tok.value.trim();
        if (!raw)
            continue;
        const isClosing = /^<\//.test(raw);
        const isSelfClosing = /\/>$/.test(raw);
        const isDecl = /^<\?xml\b/i.test(raw) || /^<\?/.test(raw);
        const isDoctype = /^<!DOCTYPE\b/i.test(raw);
        const isComment = /^<!--/.test(raw);
        const isCdata = /^<!\[CDATA\[/.test(raw);
        if (isClosing)
            indent = Math.max(0, indent - 1);
        const line = `${indentStr(indent)}${raw}`;
        pushLine(line);
        if (!isClosing &&
            !isSelfClosing &&
            !isDecl &&
            !isDoctype &&
            !isComment &&
            !isCdata) {
            indent += 1;
        }
    }
    const out = `${outLines.join('\n').trimEnd()}\n`;
    if (out !== xml)
        changed = true;
    return { xml: out, changed };
}
function formatarXmlMinimo(code) {
    const normalized = normalizarFimDeLinha(removerBom(code));
    const semEspacosFinais = removerEspacosFinaisPorLinha(normalized);
    const tokens = tokenizeXml(semEspacosFinais);
    let changedTokens = false;
    const rebuilt = tokens
        .map((t) => {
        if (t.kind === 'text')
            return t.value;
        const r = normalizeXmlTagToken(t.value);
        if (r.changed)
            changedTokens = true;
        return r.tag;
    })
        .join('');
    let pretty = rebuilt;
    let changedPretty = false;
    const valid = XMLValidator.validate(pretty);
    if (valid === true) {
        const pp = prettyPrintXmlIfSafe(pretty);
        pretty = pp.xml;
        changedPretty = pp.changed;
    }
    else {
        pretty = `${pretty.trimEnd()}\n`;
    }
    const formatted = normalizarNewlinesFinais(pretty);
    const baseline = normalizarNewlinesFinais(normalized);
    return {
        ok: true,
        parser: 'xml',
        formatted,
        changed: formatted !== baseline,
        reason: changedPretty
            ? 'xml-pretty'
            : changedTokens
                ? 'xml-normalizacao-tags'
                : 'normalizacao-basica',
    };
}
export function formatarPrettierMinimo(params) {
    const relPath = (params.relPath ?? '').toLowerCase();
    const code = params.code;
    const temComentariosJsonc = (src) => {
        const normalized = normalizarFimDeLinha(src);
        return /(^|\n)\s*\/\//.test(normalized) || /(^|\n)\s*\/\*/.test(normalized);
    };
    if (relPath.endsWith('.json')) {
        if (temComentariosJsonc(code)) {
            return formatarCodeMinimo(code, {
                normalizarSeparadoresDeSecao: false,
                relPath,
            });
        }
        return formatarJsonMinimo(code);
    }
    if (relPath.endsWith('.md') || relPath.endsWith('.markdown')) {
        return formatarMarkdownMinimo(code);
    }
    if (relPath.endsWith('.yml') || relPath.endsWith('.yaml')) {
        return formatarYamlMinimo(code);
    }
    if (relPath.endsWith('.ts') ||
        relPath.endsWith('.tsx') ||
        relPath.endsWith('.cts') ||
        relPath.endsWith('.mts') ||
        relPath.endsWith('.js') ||
        relPath.endsWith('.jsx') ||
        relPath.endsWith('.mjs') ||
        relPath.endsWith('.cjs')) {
        return formatarCodeMinimo(code, {
            normalizarSeparadoresDeSecao: true,
            relPath,
        });
    }
    if (relPath.endsWith('.html') || relPath.endsWith('.htm')) {
        return formatarCodeMinimo(code, {
            normalizarSeparadoresDeSecao: false,
            parser: 'html',
        });
    }
    if (relPath.endsWith('.xml')) {
        return formatarXmlMinimo(code);
    }
    if (relPath.endsWith('.css')) {
        return formatarCodeMinimo(code, {
            normalizarSeparadoresDeSecao: true,
            parser: 'css',
        });
    }
    if (relPath.endsWith('.py')) {
        return formatarCodeMinimo(code, {
            normalizarSeparadoresDeSecao: false,
            parser: 'python',
        });
    }
    if (relPath.endsWith('.php')) {
        return formatarCodeMinimo(code, {
            normalizarSeparadoresDeSecao: false,
            parser: 'php',
        });
    }
    return {
        ok: true,
        parser: 'unknown',
        formatted: code,
        changed: false,
    };
}
const prettierCache = new Map();
async function carregarPrettierDoProjeto(baseDir) {
    const base = baseDir || process.cwd();
    const cached = prettierCache.get(base);
    if (cached)
        return cached;
    const loader = (async () => {
        const tryImportPrettier = async (resolved) => {
            try {
                const mod = (await import(resolved));
                const api = (mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod);
                if (!api ||
                    typeof api.format !== 'function' ||
                    typeof api.resolveConfig !== 'function') {
                    return null;
                }
                return api;
            }
            catch {
                return null;
            }
        };
        const tryResolveFrom = async (req) => {
            try {
                const resolved = req.resolve('prettier');
                return await tryImportPrettier(resolved);
            }
            catch {
                return null;
            }
        };
        try {
            const projectPkg = path.join(base, 'package.json');
            if (fs.existsSync(projectPkg)) {
                const api = await tryResolveFrom(createRequire(projectPkg));
                if (api)
                    return api;
            }
        }
        catch {
        }
        {
            const api = await tryResolveFrom(createRequire(import.meta.url));
            if (api)
                return api;
        }
        const feedbackDir = process.env.ORACULO_PRETTIER_FEEDBACK_DIR ||
            path.join(base, 'feedback', 'prettier');
        const feedbackPkg = path.join(feedbackDir, 'package.json');
        if (fs.existsSync(feedbackPkg)) {
            const candidates = [
                path.join(feedbackDir, 'index.mjs'),
                path.join(feedbackDir, 'index.cjs'),
            ];
            for (const p of candidates) {
                if (!fs.existsSync(p))
                    continue;
                const api = await tryImportPrettier(p);
                if (api)
                    return api;
            }
        }
        return null;
    })();
    prettierCache.set(base, loader);
    return loader;
}
function inferPrettierParser(relPath, code) {
    const info = getSyntaxInfoForPath(relPath ?? '');
    if (!info)
        return null;
    if (!info.formatavel)
        return null;
    const rp = (relPath ?? '').toLowerCase();
    if (rp.endsWith('.json')) {
        const src = code ?? '';
        const normalized = normalizarFimDeLinha(src);
        const temComentarios = /(^|\n)\s*\/\//.test(normalized) || /(^|\n)\s*\/\*/.test(normalized);
        return temComentarios ? 'jsonc' : 'json';
    }
    return info.parser ?? null;
}
export async function formatarComPrettierProjeto(params) {
    const baseDir = params.baseDir || process.cwd();
    const relPath = params.relPath;
    const absPath = path.resolve(baseDir, relPath);
    const prettier = await carregarPrettierDoProjeto(baseDir);
    if (!prettier) {
        return {
            ok: true,
            parser: 'unknown',
            formatted: params.code,
            changed: false,
            reason: 'prettier-nao-disponivel',
        };
    }
    const parser = inferPrettierParser(relPath, params.code);
    if (!parser) {
        return {
            ok: true,
            parser: 'unknown',
            formatted: params.code,
            changed: false,
            reason: 'prettier-parser-desconhecido',
        };
    }
    try {
        const resolvedConfig = await prettier.resolveConfig(absPath, {
            editorconfig: true,
        });
        const inferSingleQuoteFromCode = (src) => {
            try {
                const singles = (src.match(/'/g) || []).length;
                const doubles = (src.match(/"/g) || []).length;
                return singles > doubles;
            }
            catch {
                return false;
            }
        };
        const options = {
            ...(resolvedConfig || {}),
            filepath: absPath,
            parser,
        };
        if (!resolvedConfig ||
            !Object.prototype.hasOwnProperty.call(resolvedConfig, 'singleQuote')) {
            if (parser === 'babel' || parser === 'typescript') {
                options.singleQuote = inferSingleQuoteFromCode(params.code);
            }
        }
        const out = await prettier.format(params.code, options);
        const formatted = String(out);
        return {
            ok: true,
            parser: 'code',
            formatted,
            changed: formatted !== params.code,
            reason: 'prettier-projeto',
        };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, parser: 'code', error: msg };
    }
}
registerFormatter('.json', (code, _relPath) => formatarJsonMinimo(code));
registerFormatter('.md', (code, _relPath) => formatarMarkdownMinimo(code));
registerFormatter('.markdown', (code, _relPath) => formatarMarkdownMinimo(code));
registerFormatter('.yml', (code, _relPath) => formatarYamlMinimo(code));
registerFormatter('.yaml', (code, _relPath) => formatarYamlMinimo(code));
registerFormatter('.xml', (code, _relPath) => formatarXmlMinimo(code));
registerFormatter('.html', (code, _relPath) => formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'html',
}));
registerFormatter('.htm', (code, _relPath) => formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'html',
}));
registerFormatter('.css', (code, _relPath) => formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: true,
    parser: 'css',
}));
registerFormatter('.py', (code, _relPath) => formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'python',
}));
registerFormatter('.php', (code, _relPath) => formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: false,
    parser: 'php',
}));
registerFormatter('.svg', (code, _relPath) => formatarXmlMinimo(code));
registerFormatter('.java', (code, _relPath) => formatarCodeMinimo(code, {
    normalizarSeparadoresDeSecao: true,
    parser: 'code',
}));
export function getRegisteredFormatter(relPath) {
    return getFormatterForPath(relPath);
}
//# sourceMappingURL=formater.js.map