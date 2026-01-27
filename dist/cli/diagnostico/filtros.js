import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../core/config/config.js';
import { mesclarConfigExcludes } from '../../core/config/excludes-padrao.js';
export function processPatternListAchatado(raw) {
    if (!raw || raw.length === 0)
        return [];
    return Array.from(new Set(raw
        .flatMap((r) => r.split(/[\s,]+/))
        .map((s) => s.trim())
        .filter(Boolean)));
}
export function processPatternGroups(raw) {
    if (!raw || raw.length === 0)
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
            const normalized = p.replace(/[\\\/]+$/, '');
            out.add(`${normalized}/**`);
            if (!p.includes('/') && !p.includes('\\')) {
                out.add(`**/${normalized}/**`);
            }
        }
    }
    return Array.from(out);
}
export function detectarTipoProjeto(baseDir = process.cwd()) {
    try {
        if (fs.existsSync(path.join(baseDir, 'tsconfig.json')) &&
            fs.existsSync(path.join(baseDir, 'package.json'))) {
            return 'typescript';
        }
        if (fs.existsSync(path.join(baseDir, 'package.json'))) {
            return 'nodejs';
        }
        if (fs.existsSync(path.join(baseDir, 'requirements.txt')) ||
            fs.existsSync(path.join(baseDir, 'pyproject.toml')) ||
            fs.existsSync(path.join(baseDir, 'setup.py'))) {
            return 'python';
        }
        if (fs.existsSync(path.join(baseDir, 'pom.xml')) ||
            fs.existsSync(path.join(baseDir, 'build.gradle')) ||
            fs.existsSync(path.join(baseDir, 'build.gradle.kts'))) {
            return 'java';
        }
        const files = fs.readdirSync(baseDir);
        if (files.some((f) => f.endsWith('.csproj')) ||
            files.some((f) => f.endsWith('.sln'))) {
            return 'dotnet';
        }
        return 'generico';
    }
    catch {
        return 'generico';
    }
}
export function getDefaultExcludes(tipoProjeto) {
    const configIncludeExclude = config.INCLUDE_EXCLUDE_RULES;
    if (configIncludeExclude?.globalExcludeGlob) {
        if (Array.isArray(configIncludeExclude.globalExcludeGlob) &&
            configIncludeExclude.globalExcludeGlob.length > 0) {
            return Array.from(new Set(configIncludeExclude.globalExcludeGlob));
        }
    }
    const tipo = tipoProjeto || detectarTipoProjeto();
    return mesclarConfigExcludes(null, tipo);
}
export function processarFiltros(opcoes) {
    const tipoProjeto = detectarTipoProjeto();
    const includeGroups = processPatternGroups(opcoes.include);
    const includeFlat = includeGroups.flat();
    const includeExpanded = expandIncludes(includeFlat);
    const excludeFlat = processPatternListAchatado(opcoes.exclude);
    let excludePatterns;
    if (excludeFlat.length > 0) {
        excludePatterns = excludeFlat;
    }
    else {
        excludePatterns = getDefaultExcludes(tipoProjeto);
    }
    let incluiNodeModules = opcoes.forceIncludeNodeModules || false;
    if (includeFlat.some((p) => /node_modules/.test(p))) {
        incluiNodeModules = true;
    }
    if (incluiNodeModules) {
        excludePatterns = excludePatterns.filter((p) => !/node_modules/.test(p));
    }
    if (opcoes.forceIncludeTests && !includeFlat.some((p) => /tests?/.test(p))) {
        includeExpanded.push('tests/**', 'test/**', '**/*.test.*', '**/*.spec.*');
    }
    return {
        includeGroups,
        includeFlat: includeExpanded,
        excludePatterns,
        incluiNodeModules,
        tipoProjeto,
    };
}
export function aplicarFiltrosAoConfig(filtros) {
    if (filtros.includeFlat.length > 0) {
        config.CLI_INCLUDE_GROUPS = filtros.includeGroups;
        config.CLI_INCLUDE_PATTERNS = filtros.includeFlat;
    }
    else {
        config.CLI_INCLUDE_GROUPS = [];
        config.CLI_INCLUDE_PATTERNS = [];
    }
    config.CLI_EXCLUDE_PATTERNS = filtros.excludePatterns;
}
export function configurarFiltros(opcoes) {
    const filtros = processarFiltros(opcoes);
    aplicarFiltrosAoConfig(filtros);
    return filtros;
}
//# sourceMappingURL=filtros.js.map