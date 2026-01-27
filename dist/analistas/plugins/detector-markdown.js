import { promises as fs } from 'node:fs';
import { config } from '../../core/config/config.js';
import { log } from '../../core/messages/index.js';
const LICENSE_PATTERNS = {
    incompativeis: [
        /\bGPL\b/i,
        /\bAGPL\b/i,
        /\bLGPL\b/i,
        /Creative\s+Commons/i,
        /\bCC-BY\b/i,
        /All\s+rights\s+reserved/i,
    ],
    cessaoDireitos: [
        /cess(?:ã|a)o\s+de\s+direitos/i,
        /transfer(?:ê|e)ncia\s+de\s+direitos/i,
    ],
    referenciasRisco: [
        /Stack\s*Overflow/i,
        /stackoverflow\.com/i,
        /\bassign\b/i,
        /\bcession\b/i,
    ],
};
const DEFAULT_WHITELIST = {
    paths: [
        '.github/copilot-instructions.md',
        'docs/POLICY-PROVENIENCIA.md',
        'docs/partials/AVISO-PROVENIENCIA.md',
    ],
    patterns: ['**/relatorios/**', 'docs/historico/**', 'tests/**', 'tmp*.md'],
    dirs: [
        'pre-public',
        'preview-oraculo',
        '.abandonados',
        '.deprecados',
        'relatorios',
    ],
};
function createRiskRegex() {
    const allPatterns = [
        ...LICENSE_PATTERNS.incompativeis,
        ...LICENSE_PATTERNS.cessaoDireitos,
        ...LICENSE_PATTERNS.referenciasRisco,
    ]
        .map((r) => r.source)
        .join('|');
    return new RegExp(allPatterns, 'i');
}
function hasProvenienciaHeader(content, headerLines = 30) {
    const head = content.split(/\r?\n/).slice(0, headerLines).join('\n');
    return /Proveni[eê]ncia\s+e\s+Autoria/i.test(head);
}
function isWhitelisted(relPath, whitelist) {
    const normalized = relPath.replace(/\\/g, '/');
    if (whitelist.paths.some((p) => normalized === p || normalized.endsWith(`/${p}`))) {
        return true;
    }
    if (whitelist.dirs.some((dir) => normalized.startsWith(`${dir}/`))) {
        return true;
    }
    for (const pattern of whitelist.patterns) {
        if (pattern.includes('**')) {
            const parts = pattern.split('**');
            if (parts.every((part) => normalized.includes(part.replace(/\*/g, '')))) {
                return true;
            }
        }
        else if (pattern.startsWith('*')) {
            if (normalized.endsWith(pattern.substring(1))) {
                return true;
            }
        }
        else if (pattern.includes('*')) {
            const [prefix, suffix] = pattern.split('*');
            if (normalized.startsWith(prefix) && normalized.endsWith(suffix)) {
                return true;
            }
        }
    }
    return false;
}
function hasRiskReferenceMarker(content) {
    return /<!--\s*RISCO_REFERENCIA_OK\s*-->/i.test(content);
}
function hasOraculoIgnoreMarker(content, key) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`<!--\\s*oraculo-ignore\\s*:\\s*${escaped}\\s*-->`, 'i').test(content);
}
function mergeWhitelist(base, override, mode) {
    const o = override || {};
    if (mode === 'replace') {
        return {
            paths: Array.isArray(o.paths) ? o.paths : [],
            patterns: Array.isArray(o.patterns) ? o.patterns : [],
            dirs: Array.isArray(o.dirs) ? o.dirs : [],
        };
    }
    const uniq = (arr) => Array.from(new Set(arr.map(String)));
    const opaths = Array.isArray(o.paths) ? o.paths : [];
    const opatterns = Array.isArray(o.patterns) ? o.patterns : [];
    const odirs = Array.isArray(o.dirs) ? o.dirs : [];
    return {
        paths: uniq([...(base.paths || []), ...opaths]),
        patterns: uniq([...(base.patterns || []), ...opatterns]),
        dirs: uniq([...(base.dirs || []), ...odirs]),
    };
}
function isBenignProvenienciaOnly(content) {
    const rxCessao = /cess(?:ã|a)o\s+de\s+direitos/i;
    const rxOthers = new RegExp([
        '\\bGPL\\b',
        '\\bAGPL\\b',
        '\\bLGPL\\b',
        'Creative\\s+Commons',
        '\\bCC-BY\\b',
        'Stack\\s*Overflow',
        'stackoverflow\\.com',
        'All\\s+rights\\s+reserved',
        'transfer(?:ê|e)ncia\\s+de\\s+direitos',
        '\\bassign\\b',
        '\\bcession\\b',
    ].join('|'), 'i');
    const hasCessao = rxCessao.test(content);
    const hasOthers = rxOthers.test(content);
    const hasAviso = /Proveni[eê]ncia\s+e\s+Autoria/i.test(content);
    return hasAviso && hasCessao && !hasOthers;
}
async function analisarArquivoMarkdown(fullPath, relPath, options) {
    const whitelist = options.whitelist || DEFAULT_WHITELIST;
    const problemas = [];
    let content;
    try {
        content = await fs.readFile(fullPath, 'utf-8');
    }
    catch (error) {
        return {
            relPath,
            fullPath,
            problemas: [
                {
                    tipo: 'formato-invalido',
                    descricao: `Erro ao ler arquivo: ${error.message}`,
                    severidade: 'medio',
                },
            ],
            temProveniencia: false,
            whitelisted: false,
            temRiscoOk: false,
        };
    }
    const whitelisted = isWhitelisted(relPath, whitelist);
    const temRiscoOk = hasRiskReferenceMarker(content);
    const temProveniencia = hasProvenienciaHeader(content, options.headerLines || 30);
    const ignoreLicenseCheck = hasOraculoIgnoreMarker(content, 'license-check');
    if (options.checkProveniencia !== false && !temProveniencia && !whitelisted) {
        problemas.push({
            tipo: 'falta-proveniencia',
            descricao: 'Arquivo não possui aviso de Proveniência e Autoria nas primeiras linhas',
            severidade: 'alto',
            sugestao: 'Adicione o aviso usando scripts/add-disclaimer-md.js',
        });
    }
    if (options.checkLicenses !== false || options.checkReferences !== false) {
        const riskRegex = createRiskRegex();
        const hasRisk = riskRegex.test(content);
        if (hasRisk &&
            !isBenignProvenienciaOnly(content) &&
            !whitelisted &&
            !temRiscoOk) {
            const lines = content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (options.checkLicenses !== false && !ignoreLicenseCheck) {
                    for (const pattern of LICENSE_PATTERNS.incompativeis) {
                        if (pattern.test(line)) {
                            problemas.push({
                                tipo: 'licenca-incompativel',
                                descricao: `Licença potencialmente incompatível: ${pattern.source}`,
                                severidade: 'critico',
                                linha: i + 1,
                                trecho: line.trim().substring(0, 100),
                                sugestao: 'Verifique compatibilidade com licença MIT do projeto',
                            });
                        }
                    }
                }
                if (options.checkReferences !== false) {
                    for (const pattern of LICENSE_PATTERNS.cessaoDireitos) {
                        if (pattern.test(line)) {
                            problemas.push({
                                tipo: 'referencia-risco',
                                descricao: 'Referência a cessão de direitos detectada',
                                severidade: 'alto',
                                linha: i + 1,
                                trecho: line.trim().substring(0, 100),
                                sugestao: 'Verifique se não há implicações legais',
                            });
                        }
                    }
                    for (const pattern of LICENSE_PATTERNS.referenciasRisco) {
                        if (pattern.test(line)) {
                            problemas.push({
                                tipo: 'referencia-risco',
                                descricao: `Referência externa detectada: ${pattern.source}`,
                                severidade: 'medio',
                                linha: i + 1,
                                trecho: line.trim().substring(0, 100),
                                sugestao: 'Adicione marcador <!-- RISCO_REFERENCIA_OK --> se referência for válida',
                            });
                        }
                    }
                }
            }
        }
    }
    return {
        relPath,
        fullPath,
        problemas,
        temProveniencia,
        whitelisted,
        temRiscoOk,
    };
}
function converterParaOcorrencias(analise) {
    const ocorrencias = [];
    for (const problema of analise.problemas) {
        let nivel;
        switch (problema.severidade) {
            case 'critico':
            case 'alto':
                nivel = 'erro';
                break;
            case 'medio':
                nivel = 'aviso';
                break;
            default:
                nivel = 'info';
        }
        ocorrencias.push({
            tipo: `markdown-${problema.tipo}`,
            nivel,
            mensagem: problema.descricao,
            relPath: analise.relPath,
            linha: problema.linha,
            contexto: problema.trecho,
            sugestao: problema.sugestao,
        });
    }
    return ocorrencias;
}
export const detectorMarkdown = {
    nome: 'detector-markdown',
    categoria: 'documentacao',
    descricao: 'Detecta problemas de compliance em arquivos Markdown',
    test: (relPath) => {
        return relPath.toLowerCase().endsWith('.md');
    },
    aplicar: async (src, relPath, _ast, fullPath) => {
        if (!fullPath) {
            log.aviso(`detector-markdown: fullPath não fornecido para ${relPath}`);
            return [];
        }
        const cfg = config
            .detectorMarkdown;
        const whitelistMode = cfg?.whitelistMode === 'replace' || cfg?.whitelistMode === 'merge'
            ? cfg.whitelistMode
            : 'merge';
        const options = {
            checkProveniencia: cfg?.checkProveniencia ?? true,
            checkLicenses: cfg?.checkLicenses ?? true,
            checkReferences: cfg?.checkReferences ?? true,
            headerLines: typeof cfg?.headerLines === 'number' ? cfg.headerLines : 30,
            whitelist: mergeWhitelist(DEFAULT_WHITELIST, cfg?.whitelist, whitelistMode),
        };
        try {
            const analise = await analisarArquivoMarkdown(fullPath, relPath, options);
            return converterParaOcorrencias(analise);
        }
        catch (error) {
            log.erro(`Erro ao analisar Markdown ${relPath}: ${error.message}`);
            return [];
        }
    },
};
export { analisarArquivoMarkdown };
//# sourceMappingURL=detector-markdown.js.map