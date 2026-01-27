import { promises as fs } from 'node:fs';
import path from 'node:path';
import { mapaReversao } from '../corrections/mapa-reversao.js';
import { config } from '../../core/config/config.js';
import { resolverPluginSeguro } from '../../core/config/seguranca.js';
import { log, logAuto } from '../../core/messages/index.js';
import { importarModuloSeguro } from '../../core/utils/import-safe.js';
import { reescreverImports } from '../../shared/helpers/imports.js';
import pLimit from 'p-limit';
export async function corrigirEstrutura(mapa, fileEntries, baseDir = process.cwd()) {
    const CONCORRENCIA = Number(config.STRUCTURE_CONCURRENCY ?? 5);
    const AUTO_FIX = Boolean(config.STRUCTURE_AUTO_FIX);
    const PLUGINS = config.STRUCTURE_PLUGINS || [];
    const STRUCTURE_LAYERS = config.STRUCTURE_LAYERS;
    const limit = pLimit(CONCORRENCIA);
    await Promise.all(mapa.map((entry) => limit(async () => {
        const { arquivo, ideal, atual } = entry;
        if (!ideal || ideal === atual)
            return;
        const origem = path.join(baseDir, arquivo);
        const nomeArquivo = path.basename(arquivo);
        const destino = path.join(baseDir, ideal, nomeArquivo);
        if (!AUTO_FIX) {
            log.info(`→ Simular: ${arquivo} → ${path.relative(baseDir, destino)}`);
            return;
        }
        try {
            await fs.mkdir(path.dirname(destino), { recursive: true });
        }
        catch (err) {
            const msg = err && typeof err === 'object' && 'message' in err
                ? String(err.message)
                : String(err);
            logAuto.corretorErroCriarDiretorio(destino, msg);
            return;
        }
        try {
            const destinoExiste = await fs
                .stat(destino)
                .then(() => true)
                .catch(() => false);
            if (destinoExiste) {
                logAuto.corretorDestinoExiste(arquivo, path.relative(baseDir, destino));
                return;
            }
            try {
                if (config.SAFE_MODE && !config.ALLOW_MUTATE_FS) {
                    log.info(`→ SAFE_MODE: simulando escrita/movimento para ${arquivo} → ${path.relative(baseDir, destino)}`);
                }
                else {
                    const conteudo = await fs.readFile(origem, 'utf-8');
                    const { novoConteudo } = reescreverImports(conteudo, path.posix.normalize(arquivo.replace(/\\/g, '/')), path.posix.normalize(path.relative(baseDir, destino).replace(/\\/g, '/')));
                    await mapaReversao.registrarMove(arquivo, path.relative(baseDir, destino), entry.motivo || 'Reorganização estrutural', conteudo, novoConteudo, true);
                    await fs.writeFile(destino, novoConteudo, 'utf-8');
                    await fs.unlink(origem);
                }
            }
            catch {
                if (config.SAFE_MODE && !config.ALLOW_MUTATE_FS) {
                }
                else {
                    try {
                        await mapaReversao.registrarMove(arquivo, path.relative(baseDir, destino), entry.motivo || 'Reorganização estrutural (fallback)', undefined, undefined, true);
                        await fs.rename(origem, destino);
                    }
                    catch (err) {
                        const msg = err && typeof err === 'object' && 'message' in err
                            ? String(err.message)
                            : String(err);
                        logAuto.corretorErroMover(arquivo, msg);
                        return;
                    }
                }
            }
            log.sucesso(`✅ Movido: ${arquivo} → ${path.relative(baseDir, destino)}`);
        }
        catch (err) {
            const msg = err && typeof err === 'object' && 'message' in err
                ? String(err.message)
                : String(err);
            logAuto.corretorErroMover(arquivo, msg);
        }
    })));
    for (const pluginRel of PLUGINS) {
        try {
            const resolvido = resolverPluginSeguro(baseDir, String(pluginRel));
            if (resolvido.erro) {
                logAuto.pluginIgnorado(String(pluginRel), resolvido.erro);
                continue;
            }
            const caminhoPlugin = resolvido.caminho;
            if (!caminhoPlugin) {
                logAuto.caminhoNaoResolvido(String(pluginRel));
                continue;
            }
            const pluginModule = await importarModuloSeguro(baseDir, String(pluginRel));
            let pluginFn;
            if (pluginModule &&
                typeof pluginModule === 'object' &&
                'default' in pluginModule &&
                typeof pluginModule.default === 'function') {
                pluginFn = pluginModule.default;
            }
            else if (typeof pluginModule === 'function') {
                pluginFn = pluginModule;
            }
            if (typeof pluginFn === 'function') {
                await pluginFn({
                    mapa,
                    baseDir,
                    layers: STRUCTURE_LAYERS,
                    fileEntries,
                });
            }
        }
        catch (err) {
            let msg = 'erro desconhecido';
            if (err &&
                typeof err === 'object' &&
                'message' in err &&
                typeof err.message === 'string') {
                msg = String(err.message);
            }
            else if (typeof err === 'string') {
                msg = err;
            }
            logAuto.pluginFalhou(String(pluginRel), String(msg));
        }
    }
}
//# sourceMappingURL=corretor-estrutura.js.map