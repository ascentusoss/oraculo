import { ARQUETIPOS } from '../estrategistas/arquetipos-defs.js';
import { scoreArquetipo } from '../pontuadores/pontuador.js';
export function detectarArquetipoNode(arquivos) {
    const temPackage = arquivos.some((a) => a.endsWith('package.json'));
    const ehNode = temPackage;
    if (!ehNode)
        return [];
    const candidatos = ARQUETIPOS.map((def) => scoreArquetipo(def, arquivos)).filter((r) => r.score > 0);
    return candidatos;
}
//# sourceMappingURL=detector-node.js.map