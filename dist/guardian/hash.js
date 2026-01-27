import { createHash, getHashes } from 'node:crypto';
import { ALGORITMO_HASH } from './constantes.js';
export function gerarHashHex(conteudo) {
    const candidatos = [ALGORITMO_HASH, 'sha256', 'sha1', 'md5'];
    const disponiveis = new Set(getHashes());
    for (const alg of candidatos) {
        try {
            if (!disponiveis.has(alg))
                continue;
            return createHash(alg).update(conteudo).digest('hex');
        }
        catch {
        }
    }
    let hash = 0;
    for (let i = 0; i < conteudo.length; i++) {
        hash = (hash * 31 + conteudo.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}
export function gerarSnapshotDoConteudo(conteudo) {
    const linhas = conteudo.split('\n');
    const snapshot = {
        hash: gerarHashHex(conteudo),
        linhas: linhas.length,
        amostra: linhas[0]?.slice(0, 200) ?? '',
    };
    return snapshot.hash;
}
//# sourceMappingURL=hash.js.map