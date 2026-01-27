import { config } from '../config/config.js';
import { resolverPluginSeguro } from '../config/seguranca.js';
import { ExcecoesMessages } from '../messages/core/excecoes-messages.js';
export async function importarModuloSeguro(baseDir, pluginRel) {
    if (config.SAFE_MODE && !config.ALLOW_PLUGINS) {
        throw new Error(ExcecoesMessages.pluginsDesabilitadosSafeMode);
    }
    const resolvido = resolverPluginSeguro(baseDir, pluginRel);
    if (resolvido.erro)
        throw new Error(ExcecoesMessages.pluginBloqueado(resolvido.erro));
    if (!resolvido.caminho)
        throw new Error(ExcecoesMessages.caminhoPluginNaoResolvido);
    return import(resolvido.caminho);
}
//# sourceMappingURL=import-safe.js.map