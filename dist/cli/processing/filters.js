import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../core/config/config.js';
import { mesclarConfigExcludes } from '../../core/config/excludes-padrao.js';
export function processPatternListAchatado(raw) {
    if (!raw || !raw.length)
        return [];
    return Array.from(new Set(raw
        .flatMap((r) => r.split(/[\s,]+/))
        .map((s) => s.trim())
        .filter(Boolean)));
}
export function processPatternGroups(raw) {
    if (!raw || !raw.length)
        return [];
    return raw
        .map((grupo) => grupo
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean))
        .filter((g) => g.length > 0);
}
export function expandIncludes(list) {
    const META = /[\\*\?\{\}\[\]]/;
    const out = new Set();
    for (const p of list) {
        out.add(p);
        if (!META.test(p)) {
            out.add(`${p.replace(/[\\\/]+$/, '')}/**`);
            if (!p.includes('/') && !p.includes('\\'))
                out.add(`**/${p}/**`);
        }
    }
    return Array.from(out);
}
export function getDefaultExcludes() {
    const configIncludeExclude = config.INCLUDE_EXCLUDE_RULES;
    if (configIncludeExclude) {
        if (Array.isArray(configIncludeExclude.globalExcludeGlob) &&
            configIncludeExclude.globalExcludeGlob.length > 0) {
            return Array.from(new Set(configIncludeExclude.globalExcludeGlob));
        }
    }
    const tipoProjeto = detectarTipoProjeto();
    return mesclarConfigExcludes(null, tipoProjeto);
}
function detectarTipoProjeto() {
    try {
        const cwd = process.cwd();
        if (fs.existsSync(path.join(cwd, 'package.json'))) {
            if (fs.existsSync(path.join(cwd, 'tsconfig.json')))
                return 'typescript';
            return 'nodejs';
        }
        if (fs.existsSync(path.join(cwd, 'requirements.txt')) ||
            fs.existsSync(path.join(cwd, 'pyproject.toml'))) {
            return 'python';
        }
        if (fs.existsSync(path.join(cwd, 'pom.xml')) ||
            fs.existsSync(path.join(cwd, 'build.gradle'))) {
            return 'java';
        }
        const files = fs.readdirSync(cwd);
        if (files.some((file) => file.endsWith('.csproj')) ||
            files.some((file) => file.endsWith('.sln'))) {
            return 'dotnet';
        }
        return 'generico';
    }
    catch {
        return 'generico';
    }
}
export function configurarFiltros(includeGroupsRaw, includeListFlat, excludeList, incluiNodeModules) {
    if (includeListFlat.length) {
        config.CLI_INCLUDE_GROUPS = includeGroupsRaw;
        config.CLI_INCLUDE_PATTERNS = includeListFlat;
    }
    else {
        config.CLI_INCLUDE_GROUPS = [];
        config.CLI_INCLUDE_PATTERNS = [];
    }
    let finalExcludePatterns;
    if (excludeList.length > 0) {
        finalExcludePatterns = excludeList;
    }
    else {
        finalExcludePatterns = getDefaultExcludes();
    }
    if (incluiNodeModules) {
        finalExcludePatterns = finalExcludePatterns.filter((p) => !/node_modules/.test(p));
    }
    config.CLI_EXCLUDE_PATTERNS = finalExcludePatterns;
    sincronizarArraysExclusao(finalExcludePatterns);
}
function sincronizarArraysExclusao(_exclFiltered) {
}
//# sourceMappingURL=filters.js.map