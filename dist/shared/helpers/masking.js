export function maskKeepingNewlines(src, start, end) {
    const before = src.slice(0, start);
    const mid = src.slice(start, end).replace(/[^\n]/g, ' ');
    const after = src.slice(end);
    return before + mid + after;
}
export function maskJsComments(src) {
    let out = src;
    for (const m of out.matchAll(/\/\*[\s\S]*?\*\//g)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    for (const m of out.matchAll(/(^|[^:])\/\/.*$/gm)) {
        const start = (m.index ?? -1) + (m[1] ? m[1].length : 0);
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + (m[0]?.length ?? 0) - (m[1] ? m[1].length : 0));
    }
    return out;
}
export function maskHtmlComments(src) {
    let out = src;
    for (const m of out.matchAll(/<!--([\s\S]*?)-->/g)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    return out;
}
export function maskTagBlocks(src, tag) {
    let out = src;
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    for (const m of out.matchAll(re)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    return out;
}
export function maskXmlNonCode(src) {
    let out = src;
    for (const m of out.matchAll(/<!--[\s\S]*?-->/g)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    for (const m of out.matchAll(/<!\[CDATA\[[\s\S]*?\]\]>/g)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    return out;
}
export function maskPythonStringsAndComments(src) {
    let out = maskPythonComments(src);
    for (const m of out.matchAll(/([ruRUfFbB]{0,3})("""|''')[\s\S]*?\2/g)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    for (const m of out.matchAll(/([ruRUfFbB]{0,3})("([^"\\\n]|\\.)*"|'([^'\\\n]|\\.)*')/g)) {
        const start = m.index ?? -1;
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + m[0].length);
    }
    return out;
}
export function maskPythonComments(src) {
    let out = src;
    for (const m of out.matchAll(/(^|[^\\])#.*$/gm)) {
        const start = (m.index ?? -1) + (m[1] ? m[1].length : 0);
        if (start < 0)
            continue;
        out = maskKeepingNewlines(out, start, start + (m[0]?.length ?? 0) - (m[1] ? m[1].length : 0));
    }
    return out;
}
//# sourceMappingURL=masking.js.map