import { gerarSnapshotDoConteudo } from './hash.js';
export function verificarRegistros(fileEntries, registrosSalvos) {
    const registrosMap = new Map(registrosSalvos.map((r) => [r.arquivo, r.hash]));
    const corrompidos = [];
    for (const { relPath, content } of fileEntries) {
        if (!relPath || typeof content !== 'string' || !content.trim())
            continue;
        const hashAtual = gerarSnapshotDoConteudo(content);
        const hashEsperado = registrosMap.get(relPath);
        if (hashEsperado && hashAtual !== hashEsperado) {
            corrompidos.push(relPath);
        }
    }
    return {
        corrompidos,
        verificados: registrosSalvos.length,
    };
}
//# sourceMappingURL=verificador.js.map