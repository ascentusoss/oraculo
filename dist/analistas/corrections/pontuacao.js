import { criarOcorrencia } from '../../types/index.js';
const ASCII_EXTENDED_MIN = 128;
const LIMITE_CARACTERES_INCOMUNS_PADRAO = 10;
const ESPACAMENTO_CORRECAO_COUNT = 1;
const CONTEXTO_TYPESCRIPT_LOOKBACK = 50;
const CONTEXTO_TYPESCRIPT_LOOKAHEAD = 50;
const CONFIANCA_UNICODE = 90;
const CONFIANCA_PONTUACAO = 95;
const CONFIANCA_ESPACAMENTO = 85;
const CONFIANCA_CARACTERES_INCOMUNS = 70;
const COMMON_REPLACEMENTS = {
    '\u201c': '"',
    '\u201d': '"',
    '\u2018': "'",
    '\u2019': "'",
    '\u2013': '-',
    '\u2014': '-',
    '\u00A0': ' ',
    '\u00B4': "'",
};
const REPEATABLE_TO_SINGLE = new Set([
    ',',
    '.',
    '!',
    '?',
    ':',
    ';',
    '-',
    '_',
    '*',
]);
const MULTI_PUNCT_RE = /([,\.!?:;_\-\*]){2,}/g;
const SPACE_BEFORE_PUNCT_RE = /\s+([,.:;!?])/g;
const NO_SPACE_AFTER_PUNCT_RE = /([,.:;!?])([^\s\)\]\}])/g;
function isTypeScriptContext(src, index) {
    const before = src.substring(Math.max(0, index - CONTEXTO_TYPESCRIPT_LOOKBACK), index);
    const after = src.substring(index, Math.min(src.length, index + CONTEXTO_TYPESCRIPT_LOOKAHEAD));
    const tsPatterns = [
        /\?\s*:\s*$/,
        /:\s*\?/,
        /\(\?\s*:\s*$/,
        /interface\s+\w+\s*{/,
        /type\s+\w+\s*=/,
        /<[^>]*$/,
    ];
    return tsPatterns.some((pattern) => pattern.test(before) || pattern.test(after));
}
function isInStringOrComment(src, index) {
    const before = src.substring(0, index);
    const singleQuotes = (before.match(/'/g) || []).length;
    const doubleQuotes = (before.match(/"/g) || []).length;
    const backticks = (before.match(/`/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        return true;
    }
    const lastLineBreak = before.lastIndexOf('\n');
    const currentLine = before.substring(lastLineBreak + 1);
    if (currentLine.includes('//')) {
        return true;
    }
    const lastBlockCommentStart = before.lastIndexOf('/*');
    const lastBlockCommentEnd = before.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
        return true;
    }
    return false;
}
const CONFIGURACAO_PADRAO = {
    normalizarUnicode: true,
    colapsarPontuacaoRepetida: true,
    corrigirEspacamento: true,
    balancearParenteses: false,
    detectarCaracteresIncomuns: true,
    limiteCaracteresIncomuns: LIMITE_CARACTERES_INCOMUNS_PADRAO,
};
function normalizeUnicode(input) {
    let normalized = input.normalize('NFKC');
    let changed = false;
    for (const [pattern, replacement] of Object.entries(COMMON_REPLACEMENTS)) {
        if (normalized.includes(pattern)) {
            normalized = normalized.split(pattern).join(replacement);
            changed = true;
        }
    }
    return { text: normalized, changed };
}
function collapseRepeatedPunct(s) {
    let count = 0;
    let lastIndex = 0;
    const parts = [];
    MULTI_PUNCT_RE.lastIndex = 0;
    let match;
    while ((match = MULTI_PUNCT_RE.exec(s)) !== null) {
        const matchIndex = match.index;
        const matchStr = match[0];
        const ch = matchStr[0];
        if (isInStringOrComment(s, matchIndex)) {
            parts.push(s.substring(lastIndex, matchIndex + matchStr.length));
            lastIndex = matchIndex + matchStr.length;
            continue;
        }
        if (ch === ':' && isTypeScriptContext(s, matchIndex)) {
            parts.push(s.substring(lastIndex, matchIndex + matchStr.length));
            lastIndex = matchIndex + matchStr.length;
            continue;
        }
        parts.push(s.substring(lastIndex, matchIndex));
        if (REPEATABLE_TO_SINGLE.has(ch)) {
            parts.push(ch);
            count++;
        }
        else {
            parts.push(matchStr);
        }
        lastIndex = matchIndex + matchStr.length;
    }
    parts.push(s.substring(lastIndex));
    const text = parts.join('');
    return { text, changed: count > 0, count };
}
function fixSpacingAroundPunct(s) {
    const t1 = s.replace(SPACE_BEFORE_PUNCT_RE, '$1');
    const t2 = t1.replace(NO_SPACE_AFTER_PUNCT_RE, '$1 $2');
    const changed = s !== t2;
    const count = changed ? ESPACAMENTO_CORRECAO_COUNT : 0;
    return { text: t2, changed, count };
}
function detectUncommonChars(text, limite) {
    const issues = [];
    for (let i = 0; i < text.length && issues.length < (limite ?? Infinity); i++) {
        const ch = text[i];
        const code = ch.codePointAt(0) ?? 0;
        if (code >= ASCII_EXTENDED_MIN) {
            const name = (() => {
                try {
                    if (typeof Intl !== 'undefined') {
                        const intlApi = Intl;
                        const DisplayNamesCtor = intlApi.DisplayNames;
                        if (DisplayNamesCtor) {
                            const displayNames = new DisplayNamesCtor(['en'], {
                                type: 'language',
                            });
                            return typeof displayNames.of === 'function'
                                ? (displayNames.of(ch) ?? '')
                                : '';
                        }
                    }
                    return '';
                }
                catch {
                    return '';
                }
            })();
            issues.push({
                tipo: 'caracteres-incomuns',
                posicao: i,
                comprimento: 1,
                descricao: `Caractere incomum: ${ch} (${name || ch})`,
                sugestao: 'Considere substituir por equivalente ASCII',
                confianca: CONFIANCA_CARACTERES_INCOMUNS,
            });
        }
    }
    return issues;
}
function analisarTexto(src, config = CONFIGURACAO_PADRAO) {
    const problemas = [];
    if (config.normalizarUnicode) {
        const norm = normalizeUnicode(src);
        if (norm.changed) {
            problemas.push({
                tipo: 'unicode-invalido',
                posicao: 0,
                comprimento: src.length,
                descricao: 'Texto contém caracteres Unicode que podem ser normalizados',
                sugestao: 'Aplicar normalização Unicode NFKC',
                confianca: CONFIANCA_UNICODE,
            });
        }
    }
    if (config.colapsarPontuacaoRepetida) {
        const collapsed = collapseRepeatedPunct(src);
        if (collapsed.changed) {
            problemas.push({
                tipo: 'pontuacao-repetida',
                posicao: 0,
                comprimento: src.length,
                descricao: `Encontrados ${collapsed.count} casos de pontuação repetida`,
                sugestao: 'Colapsar pontuação repetida para caracteres únicos',
                confianca: CONFIANCA_PONTUACAO,
            });
        }
    }
    if (config.corrigirEspacamento) {
        const spacing = fixSpacingAroundPunct(src);
        if (spacing.changed) {
            problemas.push({
                tipo: 'espacamento-incorreto',
                posicao: 0,
                comprimento: src.length,
                descricao: `Encontrados ${spacing.count} problemas de espaçamento em pontuação`,
                sugestao: 'Corrigir espaçamento antes/depois de pontuação',
                confianca: CONFIANCA_ESPACAMENTO,
            });
        }
    }
    if (config.detectarCaracteresIncomuns) {
        const uncommon = detectUncommonChars(src, config.limiteCaracteresIncomuns ?? undefined);
        problemas.push(...uncommon);
    }
    return problemas;
}
function calcularLinha(src, posOrIndex, match) {
    if (typeof posOrIndex === 'number') {
        const before = src.substring(0, posOrIndex);
        return before.split('\n').length;
    }
    if (match) {
        const idx = match.index;
        if (typeof idx === 'number') {
            const before = src.substring(0, idx);
            return before.split('\n').length;
        }
    }
    return 1;
}
export const analistaPontuacao = {
    nome: 'pontuacao-fix',
    categoria: 'formatacao',
    descricao: 'Detecta problemas de pontuação, caracteres estranhos e formatação de texto',
    test: (relPath) => {
        return /\.(ts|js|tsx|jsx|mjs|cjs|md|txt|json)$/.test(relPath);
    },
    aplicar: (src, relPath) => {
        if (!src)
            return [];
        const problemas = analisarTexto(src);
        const ocorrencias = [];
        for (const problema of problemas) {
            const linha = calcularLinha(src, problema.posicao);
            const linhas = src.split('\n');
            const contexto = linhas[linha - 1] || '';
            const ocorrencia = criarOcorrencia({
                tipo: problema.tipo,
                nivel: (problema.confianca ?? 0) > 80 ? 'aviso' : 'info',
                mensagem: problema.descricao,
                relPath,
                linha,
            });
            const ocorrenciaExtendida = ocorrencia;
            ocorrenciaExtendida.sugestao = problema.sugestao;
            ocorrenciaExtendida.confianca = problema.confianca;
            ocorrenciaExtendida.contexto = contexto;
            ocorrencias.push(ocorrencia);
        }
        return ocorrencias;
    },
};
export default analistaPontuacao;
//# sourceMappingURL=pontuacao.js.map