import { promises as fs } from 'node:fs';
import { config } from '../config/config.js';
import { ExcecoesMessages } from '../messages/core/excecoes-messages.js';
import { logScanner } from '../messages/log/log-helper.js';
import { lerArquivoTexto, lerEstado, } from '../../shared/persistence/persistencia.js';
import micromatch from 'micromatch';
import path from 'path';
export async function scanRepository(baseDir, options = {}) {
    logScanner.iniciarVarredura(baseDir);
    const toPosix = (s) => s.replace(/\\+/g, '/');
    const trimDotSlash = (s) => s.replace(/^\.\/?/, '');
    const { includeContent = true, filter = () => true, onProgress = () => {
        return undefined;
    }, } = options;
    const efetivoIncluirConteudo = includeContent && !config.SCAN_ONLY;
    const fileMap = {};
    const statCache = new Map();
    const gruposRaw = config
        .CLI_INCLUDE_GROUPS || [];
    const includeGroups = Array.isArray(gruposRaw) ? gruposRaw : [];
    const includeGroupsNorm = includeGroups.map((g) => (g || []).map((p) => toPosix(trimDotSlash(String(p || '')))));
    const includePatterns = Array.isArray(config.CLI_INCLUDE_PATTERNS)
        ? config.CLI_INCLUDE_PATTERNS
        : [];
    const includePatternsNorm = includePatterns.map((p) => toPosix(trimDotSlash(String(p || ''))));
    const excludePatternsNorm = (Array.isArray(config.CLI_EXCLUDE_PATTERNS)
        ? config.CLI_EXCLUDE_PATTERNS
        : []).map((p) => toPosix(String(p || '')));
    const legacyExcludes = config.INCLUDE_EXCLUDE_RULES?.globalExcludeGlob || [];
    const ignorePatternsNorm = legacyExcludes.map((p) => toPosix(String(p || '')));
    const hasInclude = includeGroupsNorm.length > 0 || includePatternsNorm.length > 0;
    const pedeOcorrenciasGlobais = hasInclude
        ? [...includePatternsNorm, ...includeGroupsNorm.flat()].some((p) => p.startsWith('**/'))
        : false;
    const includeNodeModulesExplicit = hasInclude
        ? [...includePatternsNorm, ...includeGroupsNorm.flat()].some((p) => /(^|\/)node_modules(\/|$)/.test(String(p || '')))
        : false;
    function calcularIncludeRoots(padroes, grupos) {
        const roots = new Set();
        const candidatos = new Set();
        if (Array.isArray(padroes))
            padroes.forEach((p) => candidatos.add(toPosix(trimDotSlash(p))));
        if (Array.isArray(grupos))
            for (const g of grupos)
                g.forEach((p) => candidatos.add(toPosix(trimDotSlash(p))));
        if (candidatos.size === 0)
            return [];
        const META = /[\\*\?\{\}\[\]]/;
        for (const raw of candidatos) {
            let p = String(raw).trim();
            if (!p)
                continue;
            p = toPosix(trimDotSlash(p));
            let anchor = '';
            if (p.includes('/**'))
                anchor = p.slice(0, p.indexOf('/**'));
            else if (p.includes('/*'))
                anchor = p.slice(0, p.indexOf('/*'));
            else if (p.includes('/'))
                anchor = p.split('/')[0];
            else
                anchor = '';
            anchor = anchor.replace(/\/+/g, '/').replace(/\/$/, '');
            if (anchor && anchor !== '.' && anchor !== '**' && !META.test(anchor)) {
                const baseNorm = toPosix(String(baseDir)).replace(/\/$/, '');
                const rootPosix = `${baseNorm}/${anchor}`.replace(/\/+/g, '/');
                roots.add(rootPosix);
            }
        }
        return Array.from(roots);
    }
    function matchInclude(relPath) {
        const matchesPattern = (rp, p) => {
            if (!p)
                return false;
            if (micromatch.isMatch(rp, [p]))
                return true;
            if (p.endsWith('/**')) {
                const base = p.slice(0, -3);
                if (base && rp.startsWith(base))
                    return true;
            }
            const META = /[\\*\?\{\}\[\]]/;
            if (!META.test(p)) {
                const pat = p.replace(/\/+$|\/+$|^\.\/?/g, '').replace(/\/+/g, '/');
                if (!pat)
                    return false;
                if (pat.includes('/')) {
                    if (rp === pat)
                        return true;
                    if (rp.startsWith(`${pat}/`))
                        return true;
                    if (rp.includes(`/${pat}/`))
                        return true;
                    if (rp.endsWith(`/${pat}`))
                        return true;
                    return false;
                }
                if (rp === pat)
                    return true;
                if (rp.startsWith(`${pat}/`))
                    return true;
                if (rp.includes(`/${pat}/`))
                    return true;
                if (rp.endsWith(`/${pat}`))
                    return true;
                return false;
            }
            return false;
        };
        const baseFromPattern = (p) => {
            let b = p.trim();
            b = b.replace(/^\*\*\//, '');
            b = b.replace(/\/\*\*$/, '');
            b = b.replace(/^\.\/?/, '');
            b = b.replace(/\/+/g, '/').replace(/\/$/, '');
            return b;
        };
        if (includeGroupsNorm.length > 0) {
            for (const g of includeGroupsNorm) {
                const porBase = new Map();
                for (const p of g) {
                    const base = baseFromPattern(p);
                    const patternVariants = porBase.get(base) || [];
                    patternVariants.push(p);
                    porBase.set(base, patternVariants);
                }
                const allBasesMatch = Array.from(porBase.values()).every((lista) => lista.some((p) => matchesPattern(relPath, p)));
                if (allBasesMatch)
                    return true;
            }
            return false;
        }
        if (includePatternsNorm.length &&
            micromatch.isMatch(relPath, includePatternsNorm))
            return true;
        for (const p of includePatternsNorm || [])
            if (matchesPattern(relPath, p))
                return true;
        return false;
    }
    async function scan(dir) {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
            entries.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (err) {
            onProgress(JSON.stringify({
                tipo: 'erro',
                acao: 'acessar',
                caminho: dir,
                mensagem: typeof err === 'object' && err && 'message' in err
                    ? err.message
                    : String(err),
            }));
            return;
        }
        onProgress(JSON.stringify({ tipo: 'diretorio', acao: 'examinar', caminho: dir }));
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPathRaw = path.relative(baseDir, fullPath);
            const relPath = toPosix(relPathRaw);
            const isTestLike = (p) => {
                const rp = toPosix(p);
                if (/(^|\/)__(tests|mocks)__(\/|$)/.test(rp))
                    return true;
                if (/(^|\/)(tests?|test)(\/|$)/.test(rp))
                    return true;
                if (/\.(test|spec)\.[jt]sx?$/.test(rp))
                    return true;
                return false;
            };
            if (isTestLike(relPath)) {
                continue;
            }
            if (entry.isDirectory() && !entry.isSymbolicLink()) {
                if (!hasInclude && micromatch.isMatch(relPath, excludePatternsNorm)) {
                    continue;
                }
                if (!hasInclude && micromatch.isMatch(relPath, ignorePatternsNorm)) {
                    continue;
                }
                if (/(^|\/)node_modules(\/|$)/.test(relPath) &&
                    !includeNodeModulesExplicit) {
                    continue;
                }
                await scan(fullPath);
            }
            else {
                if (hasInclude && !matchInclude(relPath)) {
                    continue;
                }
                if (!hasInclude && micromatch.isMatch(relPath, excludePatternsNorm)) {
                    continue;
                }
                if (!hasInclude && micromatch.isMatch(relPath, ignorePatternsNorm)) {
                    continue;
                }
                if (!filter(relPath, entry)) {
                    continue;
                }
                try {
                    let stat = statCache.get(fullPath);
                    if (!stat) {
                        try {
                            stat = await fs.stat(fullPath);
                            statCache.set(fullPath, stat);
                        }
                        catch (e) {
                            onProgress(JSON.stringify({
                                tipo: 'erro',
                                acao: 'ler',
                                caminho: relPath,
                                mensagem: typeof e === 'object' && e && 'message' in e
                                    ? e.message
                                    : String(e),
                            }));
                            continue;
                        }
                    }
                    if (stat == null) {
                        throw new Error(ExcecoesMessages.statIndefinidoPara(fullPath));
                    }
                    let mtimeMs = 0;
                    if (typeof stat === 'object' &&
                        stat &&
                        'mtimeMs' in stat) {
                        const mm = stat.mtimeMs;
                        if (typeof mm === 'number')
                            mtimeMs = mm;
                    }
                    let content = null;
                    if (efetivoIncluirConteudo) {
                        const emTeste = !!process.env.VITEST;
                        try {
                            if (emTeste) {
                                content = await lerEstado(fullPath);
                            }
                            else {
                                content = await lerArquivoTexto(fullPath);
                            }
                        }
                        catch (e) {
                            onProgress(JSON.stringify({
                                tipo: 'erro',
                                acao: 'ler',
                                caminho: relPath,
                                mensagem: typeof e === 'object' && e && 'message' in e
                                    ? e.message
                                    : String(e),
                            }));
                            content = null;
                        }
                    }
                    const entryObj = {
                        fullPath,
                        relPath,
                        content,
                        ultimaModificacao: mtimeMs,
                    };
                    fileMap[relPath] = entryObj;
                    if (!config.REPORT_SILENCE_LOGS) {
                        onProgress(`✅ Arquivo lido: ${relPath}`);
                    }
                }
                catch (err) {
                    onProgress(JSON.stringify({
                        tipo: 'erro',
                        acao: 'ler',
                        caminho: relPath,
                        mensagem: typeof err === 'object' && err && 'message' in err
                            ? err.message
                            : String(err),
                    }));
                }
            }
        }
    }
    let startDirs = hasInclude
        ? calcularIncludeRoots(config.CLI_INCLUDE_PATTERNS, config
            .CLI_INCLUDE_GROUPS)
        : [];
    if (hasInclude && pedeOcorrenciasGlobais) {
        const baseNorm = toPosix(String(baseDir)).replace(/\/$/, '');
        if (!startDirs.includes(baseNorm))
            startDirs = [baseNorm, ...startDirs];
    }
    if (hasInclude && startDirs.length === 0) {
        await scan(baseDir);
        return fileMap;
    }
    if (startDirs.length === 0) {
        await scan(baseDir);
    }
    else {
        const vistos = new Set();
        for (const d of startDirs) {
            let norm = d;
            if (/[\\\/]$/.test(norm))
                norm = norm.replace(/[\\\/]+$/, '');
            if (vistos.has(norm))
                continue;
            vistos.add(norm);
            try {
                await fs.readdir(norm);
                await scan(norm);
                continue;
            }
            catch {
            }
            try {
                let st = statCache.get(norm);
                if (!st) {
                    st = await fs.stat(norm);
                    statCache.set(norm, st);
                }
                let isDir = false;
                if (st &&
                    typeof st
                        .isDirectory === 'function') {
                    isDir = st.isDirectory();
                }
                else {
                    try {
                        await fs.readdir(norm);
                        isDir = true;
                    }
                    catch {
                        isDir = false;
                    }
                }
                if (isDir) {
                    await scan(norm);
                }
                else {
                    try {
                        await fs.readdir(norm);
                        await scan(norm);
                        continue;
                    }
                    catch {
                    }
                    const relPathRaw = path.relative(baseDir, norm);
                    const relPath = toPosix(relPathRaw);
                    if (hasInclude && !matchInclude(relPath)) {
                        continue;
                    }
                    if (!hasInclude && micromatch.isMatch(relPath, excludePatternsNorm)) {
                        continue;
                    }
                    if (!hasInclude && micromatch.isMatch(relPath, ignorePatternsNorm)) {
                        continue;
                    }
                    const fakeDirent = {
                        name: path.basename(norm),
                        isDirectory: () => false,
                        isSymbolicLink: () => false,
                    };
                    if (!filter(relPath, fakeDirent))
                        continue;
                    let content = null;
                    if (efetivoIncluirConteudo) {
                        const emTeste = !!process.env.VITEST;
                        try {
                            if (emTeste)
                                content = await lerEstado(norm);
                            else
                                content = await lerArquivoTexto(norm);
                        }
                        catch (e) {
                            onProgress(JSON.stringify({
                                tipo: 'erro',
                                acao: 'ler',
                                caminho: relPath,
                                mensagem: typeof e === 'object' && e && 'message' in e
                                    ? e.message
                                    : String(e),
                            }));
                            content = null;
                        }
                    }
                    fileMap[relPath] = {
                        fullPath: norm,
                        relPath,
                        content,
                        ultimaModificacao: (st && 'mtimeMs' in st ? st.mtimeMs : Date.now()) ||
                            Date.now(),
                    };
                    if (!config.REPORT_SILENCE_LOGS) {
                        onProgress(`✅ Arquivo lido: ${relPath}`);
                    }
                }
            }
            catch (e) {
                onProgress(JSON.stringify({
                    tipo: 'erro',
                    acao: 'acessar',
                    caminho: norm,
                    mensagem: typeof e === 'object' && e && 'message' in e
                        ? e.message
                        : String(e),
                }));
            }
        }
    }
    const totalArquivos = Object.keys(fileMap).length;
    const totalDiretorios = new Set(Object.values(fileMap).map((f) => path.dirname(f.relPath))).size;
    logScanner.completo(totalArquivos, totalDiretorios);
    return fileMap;
}
//# sourceMappingURL=scanner.js.map