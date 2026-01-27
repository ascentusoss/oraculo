import path from 'node:path';
import { config } from '../../core/config/config.js';
import pLimit from 'p-limit';
export const CONCORRENCIA = Number(config.STRUCTURE_CONCURRENCY ?? 5);
export const CAMADAS = {
    ts: 'src',
    js: 'src',
    tsx: 'src',
    jsx: 'src',
    mjs: 'src',
    cjs: 'src',
    json: 'config',
    md: 'docs',
    yml: 'config',
    yaml: 'config',
};
export async function analisarEstrutura(fileEntries, _baseDir = process.cwd()) {
    const limit = pLimit(CONCORRENCIA);
    const resultados = await Promise.all(fileEntries.map((entry) => limit(() => {
        const rel = entry.relPath;
        const normalizado = rel.replace(/\\/g, '/');
        const atual = normalizado.split('/')[0] || '';
        let ideal = null;
        const matchDireta = Object.entries(CAMADAS).find(([, dir]) => normalizado.startsWith(`${dir.replace(/\\/g, '/')}/`));
        if (matchDireta) {
            ideal = matchDireta[1];
        }
        else {
            const nome = path.basename(rel);
            const [, tipo] = /\.([^.]+)\.[^.]+$/.exec(nome) ?? [];
            if (tipo && CAMADAS[tipo]) {
                ideal = CAMADAS[tipo];
            }
        }
        return { arquivo: rel, atual, ideal };
    })));
    return resultados;
}
export { analisarEstrutura as alinhamentoEstrutural };
//# sourceMappingURL=analista-estrutura.js.map