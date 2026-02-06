import { AnalystOrigins, AnalystTypes, HtmlMessages, SeverityLevels, } from '../../core/messages/core/plugin-messages.js';
import { createLineLookup } from '../../shared/helpers/line-lookup.js';
import { maskHtmlComments, maskTagBlocks } from '../../shared/helpers/masking.js';
import { parseDocument } from 'htmlparser2';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_HTML === '1';
function warn(message, relPath, line) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel: SeverityLevels.warning,
        origem: AnalystOrigins.html,
        tipo: AnalystTypes.html,
    });
}
function isElement(n) {
    return n.type === 'tag';
}
function getAttr(el, name) {
    const attrs = el.attribs || {};
    const v = attrs[name] ?? attrs[name.toLowerCase()] ?? '';
    return typeof v === 'string' ? v : '';
}
function hasAnyDataAttr(el) {
    const attrs = el.attribs || {};
    return Object.keys(attrs).some((k) => k.toLowerCase().startsWith('data-'));
}
function walk(node, visit) {
    visit(node);
    const children = node.children;
    if (Array.isArray(children)) {
        for (const c of children)
            walk(c, visit);
    }
}
function collectHtmlIssuesAst(src, relPath) {
    const ocorrencias = [];
    const isTemplate = /\.(template\.html|\.component\.html)$/i.test(relPath);
    const lineOf = createLineLookup(src).lineAt;
    const doc = parseDocument(src, {
        xmlMode: false,
        withStartIndices: true,
        withEndIndices: true,
        recognizeSelfClosing: true,
    });
    let hasDoctype = false;
    let hasTitle = false;
    let hasViewport = false;
    let hasCharset = false;
    let htmlLangOk = false;
    let lastHeadingLevel = 0;
    let h1Count = 0;
    const isInlineEvent = (attr) => {
        const a = attr.toLowerCase();
        return (a === 'onclick' ||
            a === 'onchange' ||
            a === 'onsubmit' ||
            a === 'onload' ||
            a === 'onerror' ||
            a === 'onmouseover' ||
            a === 'onmouseout' ||
            a === 'onkeyup' ||
            a === 'onkeydown' ||
            a === 'onfocus' ||
            a === 'onblur' ||
            a === 'oninput');
    };
    const startLineOf = (n) => {
        const i = typeof n.startIndex ===
            'number'
            ? n
                .startIndex
            : 0;
        return lineOf(i);
    };
    walk(doc, (n) => {
        if (n.type === 'directive') {
            const data = String(n.data || '');
            if (/^!doctype\s+html\b/i.test(data))
                hasDoctype = true;
            return;
        }
        if (!isElement(n))
            return;
        const tag = String(n.name || '').toLowerCase();
        const line = startLineOf(n);
        if (tag === 'html' && !isTemplate) {
            const lang = getAttr(n, 'lang');
            if (lang)
                htmlLangOk = true;
        }
        if (tag === 'title' && !isTemplate) {
            hasTitle = true;
        }
        if (tag === 'meta' && !isTemplate) {
            const charset = getAttr(n, 'charset');
            if (charset)
                hasCharset = true;
            const httpEquiv = getAttr(n, 'http-equiv').toLowerCase();
            const content = getAttr(n, 'content');
            if (httpEquiv === 'content-type' && /charset\s*=\s*utf-8/i.test(content))
                hasCharset = true;
            const name = getAttr(n, 'name').toLowerCase();
            if (name === 'viewport')
                hasViewport = true;
        }
        if (/^h[1-6]$/.test(tag) && !isTemplate) {
            const level = parseInt(tag.charAt(1), 10);
            if (level === 1)
                h1Count++;
            if (level > lastHeadingLevel + 1 && lastHeadingLevel > 0) {
                ocorrencias.push(warn(HtmlMessages.headingSkipped(level, lastHeadingLevel + 1), relPath, line));
            }
            lastHeadingLevel = level;
        }
        if (tag === 'button') {
            const text = n.children?.some((c) => c.type === 'text' && String(c.data || '').trim().length > 0);
            const ariaLabel = !!getAttr(n, 'aria-label');
            const title = !!getAttr(n, 'title');
            if (!text && !ariaLabel && !title) {
                ocorrencias.push(warn(HtmlMessages.buttonWithoutText, relPath, line));
            }
        }
        if (tag === 'table') {
            const hasCaption = n.children?.some((c) => c.type === 'tag' &&
                String(c.name).toLowerCase() === 'caption');
            const ariaLabel = !!getAttr(n, 'aria-label');
            if (!hasCaption && !ariaLabel) {
                ocorrencias.push(warn(HtmlMessages.tableWithoutCaption, relPath, line));
            }
        }
        if (tag === 'iframe') {
            const title = getAttr(n, 'title');
            if (!title) {
                ocorrencias.push(warn(HtmlMessages.iframeWithoutTitle, relPath, line));
            }
        }
        if (tag === 'a') {
            const target = getAttr(n, 'target');
            if (target === '_blank') {
                const rel = getAttr(n, 'rel');
                const safe = /(noopener|noreferrer)/i.test(rel);
                if (!safe)
                    ocorrencias.push(warn(HtmlMessages.linkTargetBlank, relPath, line));
            }
            const attrs = n.attribs || {};
            const hasHref = Object.prototype.hasOwnProperty.call(attrs, 'href');
            const href = getAttr(n, 'href');
            if (!hasHref || href === '' || href === '#') {
                const hasOnClick = Object.keys(attrs).some((k) => k.toLowerCase() === 'onclick');
                const role = getAttr(n, 'role').toLowerCase();
                const tabindex = getAttr(n, 'tabindex');
                const isRoleButton = role === 'button';
                if (!hasOnClick && !isRoleButton && !tabindex) {
                    ocorrencias.push(warn(HtmlMessages.linkNoHref, relPath, line));
                }
            }
        }
        if (tag === 'img') {
            const alt = getAttr(n, 'alt');
            const ariaHidden = getAttr(n, 'aria-hidden').toLowerCase() === 'true';
            const ariaLabel = !!getAttr(n, 'aria-label');
            const role = getAttr(n, 'role').toLowerCase();
            const decorative = ariaHidden || ariaLabel || role === 'presentation' || role === 'none';
            const srcAttr = getAttr(n, 'src');
            const isSvg = /\.svg(\?|#|$)/i.test(srcAttr);
            const attrs = n.attribs || {};
            const dataAttr = Object.keys(attrs).some((k) => /^(data-)?(decorative|icon|symbol)$/i.test(k));
            if (!alt && !decorative && !dataAttr && !isSvg) {
                ocorrencias.push(warn(HtmlMessages.imgWithoutAlt, relPath, line));
            }
            const loading = getAttr(n, 'loading');
            if (!loading && !isTemplate) {
                ocorrencias.push(warn(HtmlMessages.imgWithoutLoading, relPath, line));
            }
            const width = getAttr(n, 'width');
            const height = getAttr(n, 'height');
            if (!width || !height) {
                ocorrencias.push(warn(HtmlMessages.imgWithoutDimensions, relPath, line));
            }
        }
        if (tag === 'form') {
            const method = getAttr(n, 'method');
            const action = getAttr(n, 'action');
            if (!method)
                ocorrencias.push(warn(HtmlMessages.formWithoutMethod, relPath, line));
            if (!action && !hasAnyDataAttr(n)) {
                ocorrencias.push(warn(HtmlMessages.formWithoutAction, relPath, line));
            }
        }
        if (tag === 'input') {
            const type = getAttr(n, 'type').toLowerCase();
            const name = getAttr(n, 'name');
            const ariaLabel = getAttr(n, 'aria-label');
            const isHidden = type === 'hidden';
            const isButton = type === 'button' || type === 'submit' || type === 'reset';
            if (!isHidden && !isButton && !ariaLabel && !name) {
                ocorrencias.push(warn(HtmlMessages.inputWithoutLabel, relPath, line));
            }
            if (!type) {
                ocorrencias.push(warn(HtmlMessages.inputWithoutType, relPath, line));
            }
            if (type === 'password') {
                const autocomplete = getAttr(n, 'autocomplete');
                if (!autocomplete) {
                    ocorrencias.push(warn(HtmlMessages.passwordWithoutAutocomplete, relPath, line));
                }
            }
        }
        const attrs = n?.attribs || {};
        for (const k of Object.keys(attrs)) {
            if (isInlineEvent(k)) {
                ocorrencias.push(warn(HtmlMessages.inlineHandler, relPath, line));
                break;
            }
        }
        if (tag === 'script') {
            const srcAttr = getAttr(n, 'src');
            const children = n.children || [];
            const textNodes = children.filter((c) => c.type === 'text');
            const text = textNodes
                .map((c) => String(c.data || ''))
                .join('');
            if (!srcAttr && text.trim().length > 0) {
                ocorrencias.push(warn(HtmlMessages.inlineScript, relPath, line));
                if (text.length > 1000) {
                    ocorrencias.push(warn(HtmlMessages.largeInlineScript, relPath, line));
                }
            }
            if (srcAttr && !isTemplate) {
                const defer = getAttr(n, 'defer');
                const async = getAttr(n, 'async');
                if (!defer && !async) {
                    ocorrencias.push(warn(HtmlMessages.scriptWithoutDefer, relPath, line));
                }
            }
        }
        if (tag === 'style') {
            const children = n.children || [];
            const textNodes = children.filter((c) => c.type === 'text');
            const text = textNodes
                .map((c) => String(c.data || ''))
                .join('');
            if (text.trim().length > 0) {
                ocorrencias.push(warn(HtmlMessages.inlineStyle, relPath, line));
            }
        }
    });
    if (!isTemplate) {
        if (!hasDoctype)
            ocorrencias.push(warn(HtmlMessages.doctype, relPath, 1));
        if (!htmlLangOk)
            ocorrencias.push(warn(HtmlMessages.htmlLang, relPath, 1));
        if (!hasCharset)
            ocorrencias.push(warn(HtmlMessages.metaCharset, relPath, 1));
        if (!hasViewport)
            ocorrencias.push(warn(HtmlMessages.viewport, relPath, 1));
        if (!hasTitle)
            ocorrencias.push(warn(HtmlMessages.title, relPath, 1));
        if (h1Count > 1)
            ocorrencias.push(warn(HtmlMessages.multipleH1, relPath, 1));
    }
    return ocorrencias;
}
function collectHtmlIssuesRegex(src, relPath) {
    const ocorrencias = [];
    const isTemplate = /\.(template\.html|\.component\.html)$/i.test(relPath);
    const lineOfScan = createLineLookup(src).lineAt;
    const scan = maskHtmlComments(maskTagBlocks(maskTagBlocks(src, 'script'), 'style'));
    const lineOfMasked = createLineLookup(scan).lineAt;
    const scanNoScriptStyle = maskHtmlComments(src);
    if (!/<!DOCTYPE\s+html>/i.test(scan) && !isTemplate) {
        ocorrencias.push(warn(HtmlMessages.doctype, relPath, 1));
    }
    const htmlTag = scan.match(/<html[^>]*>/i);
    if (htmlTag && !isTemplate) {
        const hasLang = /\slang=['"][^'" >]+['"]/i.test(htmlTag[0]);
        if (!hasLang) {
            ocorrencias.push(warn(HtmlMessages.htmlLang, relPath, lineOfMasked(htmlTag.index)));
        }
    }
    const hasCharsetAttr = /<meta\s+[^>]*\bcharset\s*=\s*['"]?[^'">\s]+/i.test(scan);
    const hasCharsetInContentType = /<meta\s+[^>]*http-equiv\s*=\s*['"]content-type['"][^>]*>/i.test(scan) &&
        /charset\s*=\s*utf-8/i.test(scan);
    if (!hasCharsetAttr && !hasCharsetInContentType && !isTemplate) {
        ocorrencias.push(warn(HtmlMessages.metaCharset, relPath, 1));
    }
    if (!/<meta\s+[^>]*name=["']viewport["']/i.test(scan) && !isTemplate) {
        ocorrencias.push(warn(HtmlMessages.viewport, relPath, 1));
    }
    if (!/<title>[^<]*<\/title>/i.test(scan) && !isTemplate) {
        ocorrencias.push(warn(HtmlMessages.title, relPath, 1));
    }
    for (const m of scan.matchAll(/<a[^>]*target=['"]?_blank['"]?[^>]*>/gi)) {
        const hasRelSafe = /rel=['"][^'"]*(noopener|noreferrer)[^'"]*['"]/i.test(m[0]);
        if (!hasRelSafe) {
            ocorrencias.push(warn(HtmlMessages.linkTargetBlank, relPath, lineOfMasked(m.index)));
        }
    }
    for (const m of scan.matchAll(/<img[^>]*>/gi)) {
        const isSvg = /\.svg/i.test(m[0]);
        const hasAlt = /\salt=/.test(m[0]);
        const ariaHidden = /\saria-hidden=['"]true['"]/i.test(m[0]);
        const ariaLabel = /\saria-label=/i.test(m[0]);
        const rolePresentation = /\srole=['"](presentation|none)['"]/i.test(m[0]);
        const dataAttr = /\s(?:data-)?(?:decorative|icon|symbol)=/i.test(m[0]);
        if (!hasAlt &&
            !ariaHidden &&
            !ariaLabel &&
            !rolePresentation &&
            !dataAttr &&
            !isSvg) {
            ocorrencias.push(warn(HtmlMessages.imgWithoutAlt, relPath, lineOfMasked(m.index)));
        }
    }
    for (const m of scan.matchAll(/\son(?:click|change|submit|load|error|mouseover|mouseout|keyup|keydown|focus|blur|input)=/gi)) {
        ocorrencias.push(warn(HtmlMessages.inlineHandler, relPath, lineOfMasked(m.index)));
    }
    for (const m of scan.matchAll(/<form[^>]*>/gi)) {
        const hasMethod = /\smethod=/i.test(m[0]);
        const hasAction = /\saction=/i.test(m[0]);
        if (!hasMethod) {
            ocorrencias.push(warn(HtmlMessages.formWithoutMethod, relPath, lineOfMasked(m.index)));
        }
        if (!hasAction && !/<form[^>]*data-/i.test(m[0])) {
            ocorrencias.push(warn(HtmlMessages.formWithoutAction, relPath, lineOfMasked(m.index)));
        }
    }
    for (const m of scan.matchAll(/<input[^>]*>/gi)) {
        const hasAriaLabel = /\saria-label=/i.test(m[0]);
        const hasName = /\sname=/i.test(m[0]);
        const isHidden = /\stype=['"]?hidden['"]?/i.test(m[0]);
        const isButton = /\stype=['"]?(button|submit|reset)['"]/i.test(m[0]);
        if (!isHidden && !isButton && !hasAriaLabel && !hasName) {
            ocorrencias.push(warn(HtmlMessages.inputWithoutLabel, relPath, lineOfMasked(m.index)));
        }
        if (/\stype=['"]?password['"]?\s/.test(m[0]) &&
            !/\sautocomplete=/i.test(m[0])) {
            ocorrencias.push(warn(HtmlMessages.passwordWithoutAutocomplete, relPath, lineOfMasked(m.index)));
        }
    }
    for (const m of scan.matchAll(/<a[^>]*>/gi)) {
        const hasHref = /\shref=/.test(m[0]);
        const href = /\shref=['"]([^'"]*)['"]/i.exec(m[0]);
        if (!hasHref || href?.[1] === '' || href?.[1] === '#') {
            const hasOnClick = /\sonclick\s*=/.test(m[0]);
            const hasRoleButton = /\srole=['"]button['"]/i.test(m[0]);
            const hasTabIndex = /\stabindex\s*=/.test(m[0]);
            if (!hasOnClick && !hasRoleButton && !hasTabIndex) {
                ocorrencias.push(warn(HtmlMessages.linkNoHref, relPath, lineOfMasked(m.index)));
            }
        }
    }
    for (const m of src.matchAll(/<script[^>]*>[\s\S]*?<\/\s*script\b[^>]*\s*>/gi)) {
        if (typeof m.index === 'number') {
            const idx = m.index;
            if ((scanNoScriptStyle[idx] ?? ' ') !== '<') {
                continue;
            }
        }
        const isExternal = /\ssrc=/.test(m[0]);
        const isEmpty = /<script\b[^>]*>\s*<\/\s*script\b[^>]*\s*>/i.test(m[0]);
        if (!isExternal && !isEmpty) {
            ocorrencias.push(warn(HtmlMessages.inlineScript, relPath, lineOfScan(m.index)));
        }
    }
    for (const m of src.matchAll(/<style[^>]*>[\s\S]*?<\/\s*style\b[^>]*\s*>/gi)) {
        if (typeof m.index === 'number') {
            const idx = m.index;
            if ((scanNoScriptStyle[idx] ?? ' ') !== '<') {
                continue;
            }
        }
        const isEmpty = /<style\b[^>]*>\s*<\/\s*style[^>]*>/i.test(m[0]);
        if (!isEmpty) {
            ocorrencias.push(warn(HtmlMessages.inlineStyle, relPath, lineOfScan(m.index)));
        }
    }
    return ocorrencias;
}
function collectHtmlIssues(src, relPath) {
    try {
        return collectHtmlIssuesAst(src, relPath);
    }
    catch {
        return collectHtmlIssuesRegex(src, relPath);
    }
}
export const analistaHtml = criarAnalista({
    nome: 'analista-html',
    categoria: 'markup',
    descricao: 'Heurísticas leves para HTML com convenções padrão.',
    global: false,
    test: (relPath) => /\.(html|htm)$/i.test(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        const msgs = collectHtmlIssues(src, relPath);
        return msgs.length ? msgs : null;
    },
});
export default analistaHtml;
//# sourceMappingURL=analista-html.js.map