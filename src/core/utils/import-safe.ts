// SPDX-License-Identifier: MIT
import { config } from '/config/config.js';
import { resolverPluginSeguro } from '/config/seguranca.js';
import { ExcecoesMessages } from '/messages/core/excecoes-messages.js';

export async function importarModuloSeguro(
  baseDir: string,
  pluginRel: string,
): Promise<unknown> {
  if (config.SAFE_MODE && !config.ALLOW_PLUGINS) {
    throw new Error(ExcecoesMessages.pluginsDesabilitadosSafeMode);
  }
  const resolvido = resolverPluginSeguro(baseDir, pluginRel);
  if (resolvido.erro)
    throw new Error(ExcecoesMessages.pluginBloqueado(resolvido.erro));
  if (!resolvido.caminho)
    throw new Error(ExcecoesMessages.caminhoPluginNaoResolvido);
  // permite que o chamador capture exceções do plugin
  return import(resolvido.caminho);
}
