import path from 'node:path';
export function reescreverImports(conteudo, arquivoDe, arquivoPara) {
    const padrao = /(import\s+[^'";]+from\s*['"]([^'"\n]+)['"]\s*;?|export\s+\*?\s*from\s*['"]([^'"\n]+)['"];?|require\(\s*['"]([^'"\n]+)['"]\s*\))/g;
    const norm = (p) => path.posix.normalize(p.replace(/\\/g, '/'));
    const baseDe = path.posix.dirname(norm(arquivoDe));
    const basePara = path.posix.dirname(norm(arquivoPara));
    const reescritos = [];
    const novoConteudo = conteudo.replace(padrao, (full, _i1, gFrom, gExport, gReq) => {
        const spec = gFrom || gExport || gReq;
        if (!spec)
            return full;
        const isRelative = spec.startsWith('./') || spec.startsWith('../');
        const isAliasRoot = spec.startsWith('@/');
        const isProjectAlias = /^@(?:analistas|arquitetos|cli|relatorios|tipos|zeladores)\//.test(spec);
        if (!isAliasRoot &&
            !isProjectAlias &&
            !spec.includes('/src/') &&
            !isRelative)
            return full;
        let alvoAntigo;
        if (isAliasRoot || isProjectAlias || spec.includes('/src/')) {
            let specNormalized = spec;
            if (isAliasRoot)
                specNormalized = specNormalized.replace(/^@\//, 'src/');
            else if (isProjectAlias)
                specNormalized = specNormalized.replace(/^@([^/]+)\//, 'src/$1/');
            let afterSrc = specNormalized.replace(/^.*src\//, '');
            afterSrc = afterSrc.replace(/\.js$/, '');
            alvoAntigo = norm(path.posix.join('src', afterSrc || ''));
            alvoAntigo = alvoAntigo
                .replace(/^src\/cli\/utils\//, 'src/utils/')
                .replace(/^src\/cli\//, 'src/')
                .replace(/^src\/[^/]+\/(?:util|utils)\//, 'src/utils/');
            alvoAntigo = alvoAntigo.replace(/\/utils\/utils\//g, '/utils/');
        }
        else {
            alvoAntigo = norm(path.posix.join(baseDe, spec));
        }
        let novoRel = path.posix.relative(basePara, alvoAntigo);
        novoRel = path.posix.normalize(novoRel);
        novoRel = novoRel.replace(/\.js$/, '');
        if (!novoRel.startsWith('.'))
            novoRel = `./${novoRel}`;
        reescritos.push({ from: spec, to: novoRel });
        return full.replace(spec, novoRel);
    });
    return { novoConteudo, reescritos };
}
//# sourceMappingURL=imports.js.map