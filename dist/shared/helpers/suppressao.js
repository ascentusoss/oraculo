export function extrairSupressoes(src) {
    const linhas = src.split('\n');
    const porLinha = new Map();
    const blocosAtivos = new Set();
    const normalizarLinha = (linha) => {
        let t = linha.trim();
        if (t.startsWith('<!--'))
            t = t
                .replace(/^<!--/, '')
                .replace(/--!?>(\s*)?$/, '')
                .trim();
        if (t.startsWith('/*'))
            t = t.replace(/^\/\*/, '').replace(/\*\/$/, '').trim();
        if (t.startsWith('*'))
            t = t.replace(/^\*\s?/, '').trim();
        t = t.replace(/^\/\//, '').trim();
        t = t.replace(/^#/, '').trim();
        t = t.replace(/^--/, '').trim();
        t = t.replace(/^;/, '').trim();
        return t;
    };
    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const linhaNorm = normalizarLinha(linha);
        const numeroLinha = i + 1;
        const matchNextLine = linhaNorm.match(/\s+(.+)/);
        if (matchNextLine) {
            const regras = matchNextLine[1].trim().split(/\s+/);
            const linhaAfetada = numeroLinha + 1;
            if (!porLinha.has(linhaAfetada)) {
                porLinha.set(linhaAfetada, new Set());
            }
            regras.forEach((regra) => {
                porLinha.get(linhaAfetada)?.add(regra.trim());
            });
            continue;
        }
        const matchDisable = linhaNorm.match(/\s+(.+)/);
        if (matchDisable) {
            const regras = matchDisable[1].trim().split(/\s+/);
            regras.forEach((regra) => {
                blocosAtivos.add(regra.trim());
            });
            continue;
        }
        const matchEnable = linhaNorm.match(/\s+(.+)/);
        if (matchEnable) {
            const regras = matchEnable[1].trim().split(/\s+/);
            regras.forEach((regra) => {
                blocosAtivos.delete(regra.trim());
            });
            continue;
        }
        if (linhaNorm.includes('')) {
            blocosAtivos.add('*');
            continue;
        }
        if (linhaNorm.includes('')) {
            blocosAtivos.clear();
            continue;
        }
        if (blocosAtivos.size > 0) {
            if (!porLinha.has(numeroLinha)) {
                porLinha.set(numeroLinha, new Set());
            }
            blocosAtivos.forEach((regra) => {
                porLinha.get(numeroLinha)?.add(regra);
            });
        }
    }
    return { porLinha, blocosAtivos };
}
export function isRegraSuprimida(regra, linha, supressoes) {
    const regrasDaLinha = supressoes.porLinha.get(linha);
    if (!regrasDaLinha) {
        return false;
    }
    if (regrasDaLinha.has(regra)) {
        return true;
    }
    if (regrasDaLinha.has('*')) {
        return true;
    }
    return false;
}
export function filtrarOcorrenciasSuprimidas(ocorrencias, nomeAnalista, src) {
    const supressoes = extrairSupressoes(src);
    return ocorrencias.filter((ocorrencia) => {
        if (!ocorrencia.linha) {
            return true;
        }
        const _identificadorRegra = ocorrencia.tipo || nomeAnalista || '';
        const suprimidaPorTipo = ocorrencia.tipo &&
            isRegraSuprimida(ocorrencia.tipo, ocorrencia.linha, supressoes);
        const suprimidaPorAnalista = isRegraSuprimida(nomeAnalista, ocorrencia.linha, supressoes);
        return !suprimidaPorTipo && !suprimidaPorAnalista;
    });
}
//# sourceMappingURL=suppressao.js.map