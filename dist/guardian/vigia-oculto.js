import { log } from '../core/messages/index.js';
import { REGISTRO_VIGIA_CAMINHO_PADRAO } from './constantes.js';
import { gerarSnapshotDoConteudo } from './hash.js';
import { carregarRegistros, salvarRegistros } from './registros.js';
export async function vigiaOculta(arquivos, caminhoRegistro = REGISTRO_VIGIA_CAMINHO_PADRAO, autoReset = true) {
    const registros = await carregarRegistros(caminhoRegistro);
    const mapaAnterior = new Map(registros.map((r) => [r.arquivo, r.hash]));
    const corrompidos = [];
    for (const { relPath, content } of arquivos) {
        if (!relPath || typeof content !== 'string' || !content.trim())
            continue;
        const hashAtual = gerarSnapshotDoConteudo(content);
        const hashEsperado = mapaAnterior.get(relPath);
        if (hashEsperado && hashAtual !== hashEsperado) {
            corrompidos.push(relPath);
        }
    }
    if (corrompidos.length > 0) {
        log.aviso(`🔐 [VigiaOculta] Alterações detectadas em ${corrompidos.length} arquivo(s):`);
        for (const arq of corrompidos) {
            log.info(`  - ${arq}`);
        }
        if (autoReset) {
            await salvarRegistros(arquivos, caminhoRegistro);
            log.sucesso('🌀 Registros recalibrados automaticamente pela Vigia Oculta.\\n');
        }
    }
}
//# sourceMappingURL=vigia-oculto.js.map