import path from 'node:path';
import { lerEstado } from '../persistence/persistencia.js';
export const CATEGORIAS_DEFAULT = {
    controller: 'controllers',
    controllers: 'controllers',
    webhook: 'webhooks',
    webhooks: 'webhooks',
    cliente: 'clients',
    client: 'clients',
    service: 'services',
    repository: 'repositories',
    config: 'config',
    test: '__tests__',
    spec: '__tests__',
    type: 'types',
    types: 'types',
    handler: 'handlers',
};
export const DEFAULT_OPCOES = {
    raizCodigo: 'src',
    criarSubpastasPorEntidade: true,
    apenasCategoriasConfiguradas: true,
    estiloPreferido: 'kebab',
    categoriasMapa: {},
    ignorarPastas: [
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '.oraculo',
    ],
};
export const PRESETS = {
    oraculo: {
        nome: 'oraculo',
        criarSubpastasPorEntidade: false,
        apenasCategoriasConfiguradas: false,
        categoriasMapa: { ...CATEGORIAS_DEFAULT },
        ignorarPastas: [
            ...DEFAULT_OPCOES.ignorarPastas,
            'tests',
            'tests/fixtures',
            'src/analistas',
            'src/arquitetos',
            'src/relatorios',
            'src/guardian',
            'src/nucleo',
            'src/cli',
            'src/zeladores',
        ],
    },
    'node-community': {
        nome: 'node-community',
        criarSubpastasPorEntidade: false,
        apenasCategoriasConfiguradas: false,
        categoriasMapa: {
            ...CATEGORIAS_DEFAULT,
        },
    },
    'ts-lib': {
        nome: 'ts-lib',
        criarSubpastasPorEntidade: false,
        apenasCategoriasConfiguradas: false,
        categoriasMapa: {
            ...CATEGORIAS_DEFAULT,
        },
    },
};
export function normalizarRel(p) {
    return p.replace(/\\/g, '/');
}
export function deveIgnorar(rel, ignorar) {
    const norm = normalizarRel(rel);
    return ignorar.some((raw) => {
        const pat = normalizarRel(raw);
        if (!pat)
            return false;
        if (norm === pat)
            return true;
        if (norm.startsWith(`${pat}/`))
            return true;
        if (norm.endsWith(`/${pat}`))
            return true;
        if (norm.includes(`/${pat}/`))
            return true;
        if (!pat.includes('/')) {
            const segs = norm.split('/');
            if (segs.includes(pat))
                return true;
        }
        return false;
    });
}
export function parseNomeArquivo(baseName) {
    const semExt = baseName.replace(/\.[^.]+$/i, '');
    const lower = semExt.toLowerCase();
    const CATS = new Set(Object.keys(CATEGORIAS_DEFAULT).map((c) => c.toLowerCase()));
    const dotMatch = /^(?<ent>[\w-]+)\.(?<cat>[\w-]+)$/.exec(semExt);
    if (dotMatch?.groups) {
        const cat = dotMatch.groups.cat.toLowerCase();
        if (CATS.has(cat))
            return { entidade: dotMatch.groups.ent, categoria: cat };
    }
    const kebabMatch = /^(?<ent>[\w-]+)-(?<cat>[\w-]+)$/.exec(lower);
    if (kebabMatch?.groups) {
        const cat = kebabMatch.groups.cat.toLowerCase();
        if (CATS.has(cat))
            return { entidade: kebabMatch.groups.ent, categoria: cat };
    }
    const camelMatch = /^(?<ent>[A-Za-z][A-Za-z0-9]*?)(?<cat>Controller|Webhook|Cliente|Client|Service|Repository)$/.exec(semExt);
    if (camelMatch?.groups)
        return {
            entidade: camelMatch.groups.ent,
            categoria: camelMatch.groups.cat.toLowerCase(),
        };
    const tokens = [
        'controller',
        'controllers',
        'webhook',
        'webhooks',
        'cliente',
        'client',
        'service',
        'repository',
    ];
    for (const tk of tokens) {
        if (lower.endsWith(`-${tk}`) || lower.endsWith(`.${tk}`)) {
            const entidade = lower.replace(new RegExp(`[.-]${tk}$`), '');
            return { entidade: entidade || null, categoria: tk };
        }
    }
    return { entidade: null, categoria: null };
}
export function destinoPara(relPath, raizCodigo, criarSubpastasPorEntidade, apenasCategoriasConfiguradas, categoriasMapa) {
    const baseName = path.posix.basename(normalizarRel(relPath));
    const { entidade, categoria } = parseNomeArquivo(baseName);
    if (!categoria)
        return { destinoDir: null };
    const normCat = categoria.toLowerCase();
    const pastaMapeada = categoriasMapa[normCat];
    if (!pastaMapeada && apenasCategoriasConfiguradas) {
        return {
            destinoDir: null,
            motivo: `categoria ${categoria} não configurada`,
        };
    }
    const pastaFinal = pastaMapeada || (normCat.endsWith('s') ? normCat : `${normCat}s`);
    if (criarSubpastasPorEntidade && entidade) {
        const ent = entidade
            .toString()
            .replace(/[^a-z0-9-]/gi, '')
            .toLowerCase();
        const dir = path.posix.join(raizCodigo, 'domains', ent, pastaFinal);
        return {
            destinoDir: dir,
            motivo: `categoria ${categoria} organizada por entidade ${ent}`,
        };
    }
    return {
        destinoDir: path.posix.join(raizCodigo, pastaFinal),
        motivo: `categoria ${categoria} organizada por camada`,
    };
}
export async function carregarConfigEstrategia(baseDir, overrides) {
    const caminho = path.join(baseDir, '.oraculo', 'estrutura.json');
    const lido = await lerEstado(caminho);
    const cfgArquivo = (lido && !Array.isArray(lido) && typeof lido === 'object' ? lido : {});
    const nomePreset = (overrides?.preset ||
        cfgArquivo.preset);
    const preset = nomePreset && PRESETS[nomePreset]?.nome ? PRESETS[nomePreset] : undefined;
    const base = { ...DEFAULT_OPCOES };
    const aplicarParcial = (src) => {
        if (!src)
            return;
        if (src.raizCodigo)
            base.raizCodigo = src.raizCodigo;
        if (typeof src.criarSubpastasPorEntidade === 'boolean')
            base.criarSubpastasPorEntidade = src.criarSubpastasPorEntidade;
        if (typeof src.apenasCategoriasConfiguradas === 'boolean')
            base.apenasCategoriasConfiguradas =
                src.apenasCategoriasConfiguradas;
        if (src.estiloPreferido)
            base.estiloPreferido = src.estiloPreferido;
        if (src.categoriasMapa)
            base.categoriasMapa = {
                ...base.categoriasMapa,
                ...src.categoriasMapa,
            };
        if (src.ignorarPastas && Array.isArray(src.ignorarPastas))
            base.ignorarPastas = Array.from(new Set([...base.ignorarPastas, ...src.ignorarPastas]));
    };
    aplicarParcial(preset);
    aplicarParcial(cfgArquivo);
    aplicarParcial(overrides);
    if (!base.apenasCategoriasConfiguradas) {
        base.categoriasMapa = {
            ...CATEGORIAS_DEFAULT,
            ...base.categoriasMapa,
        };
    }
    return base;
}
//# sourceMappingURL=estrutura.js.map