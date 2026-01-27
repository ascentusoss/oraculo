import path from 'node:path';
import { config } from '../core/config/config.js';
import { log } from '../core/messages/index.js';
import { lerEstado, salvarEstado } from '../shared/persistence/persistencia.js';
import { gerarSnapshotDoConteudo } from './hash.js';
const DESTINO_PADRAO = path.join(config.STATE_DIR, 'integridade.json');
export async function salvarRegistros(fileEntries, destino = DESTINO_PADRAO) {
    const registros = [];
    for (const { relPath, content } of fileEntries) {
        if (!relPath || typeof content !== 'string' || !content.trim())
            continue;
        const hash = gerarSnapshotDoConteudo(content);
        registros.push({ arquivo: relPath, hash });
    }
    const fs = await import('node:fs');
    await fs.promises.mkdir(path.dirname(destino), { recursive: true });
    await salvarEstado(destino, registros);
    log.sucesso(`??? Registro de integridade salvo em: ${destino}`);
}
export async function carregarRegistros(caminho = DESTINO_PADRAO) {
    try {
        return await lerEstado(caminho);
    }
    catch {
        log.aviso(`?? Nenhum registro encontrado em ${caminho}`);
        return [];
    }
}
//# sourceMappingURL=registros.js.map