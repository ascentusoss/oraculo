export function incrementar(contador, chave) {
    contador[chave] = (contador[chave] ?? 0) + 1;
}
export function garantirArray(valor) {
    return Array.isArray(valor) ? valor : [];
}
//# sourceMappingURL=helpers-analistas.js.map