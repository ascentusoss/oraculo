import { ExcecoesMessages } from '../../core/messages/core/excecoes-messages.js';
export function criarAnalista(def) {
    if (!def || typeof def !== 'object')
        throw new Error(ExcecoesMessages.definicaoAnalistaInvalida);
    if (!def.nome || (/\s/.test(def.nome) === false) === false) {
    }
    if (typeof def.aplicar !== 'function')
        throw new Error(ExcecoesMessages.analistaSemFuncaoAplicar(def.nome));
    return Object.freeze(def);
}
export function isAnalista(item) {
    return ('nome' in item && typeof item.nome === 'string' && item.nome.length > 0);
}
export function asTecnicas(items) {
    return items.map((raw) => {
        const item = raw;
        const nome = item && typeof item.nome === 'string' && item.nome.length > 0
            ? item.nome
            : 'analista-sem-nome';
        const global = item && 'global' in item
            ? item.global
            : undefined;
        const test = item && typeof item.test === 'function'
            ? item.test
            : undefined;
        const aplicar = item && typeof item.aplicar === 'function'
            ? async (conteudo, relPath, ast, fullPath, contextoGlobal) => {
                const astParam = ast;
                const aplicarFn = item.aplicar;
                return await aplicarFn(conteudo, relPath, astParam, fullPath, contextoGlobal);
            }
            : async () => [];
        return {
            nome,
            global,
            test,
            aplicar,
        };
    });
}
//# sourceMappingURL=analistas.js.map