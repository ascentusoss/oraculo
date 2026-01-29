// SPDX-License-Identifier: MIT
import { ExcecoesMessages } from '/messages/core/excecoes-messages.js';
import { log, logCore } from '/messages/index.js';

import type {
  GlobalComImport,
  ImportDinamico,
  LanguageSupport,
  ParserPlugin,
  PluginConfig,
} from '@';

/**
 * Registry centralizado para gerenciamento de plugins de parser
 * Suporta loading dinâmico, cache e configuração flexível
 */
export class PluginRegistry {
  private plugins = new Map<string, ParserPlugin>();
  private extensionMap = new Map<string, string>(); // extensão -> nome do plugin
  private config: PluginConfig;
  private userConfiguredEnabled = false;
  private languageSupport: Record<string, LanguageSupport>;
  private loadingPromises = new Map<string, Promise<ParserPlugin>>();

  constructor(
    config?: PluginConfig,
    languageSupport?: Record<string, LanguageSupport>,
  ) {
    this.config = {
      enabled: ['core'],
      autoload: true,
      registry: '/plugins',
      ...config,
    };
    this.userConfiguredEnabled = !!config?.enabled;
    this.languageSupport = languageSupport || {};
  }

  /**
   * Registra um plugin no registry
   */
  registerPlugin(plugin: ParserPlugin): void {
    logCore.registrandoPlugin(plugin.name, plugin.version);

    // Valida o plugin
    this.validatePlugin(plugin);

    // Registra o plugin
    this.plugins.set(plugin.name, plugin);

    // Mapeia extensões para o plugin
    for (const ext of plugin.extensions) {
      if (this.extensionMap.has(ext)) {
        const existing = this.extensionMap.get(ext);
        log.debug(
          `⚠️ Extensão ${ext} já mapeada para plugin ${existing}, sobrescrevendo com ${plugin.name}`,
        );
      }
      this.extensionMap.set(ext, plugin.name);
    }

    log.debug(
      `✅ Plugin ${plugin.name} registrado com extensões: ${plugin.extensions.join(', ')}`,
    );
  }

  /**
   * Carrega um plugin dinamicamente
   */
  async loadPlugin(name: string): Promise<ParserPlugin> {
    // Se já está carregado, retorna
    if (this.plugins.has(name)) {
      const plugin = this.plugins.get(name);
      if (!plugin) {
        throw new Error(
          ExcecoesMessages.pluginRegistradoNaoPodeSerObtido(name),
        );
      }
      return plugin;
    }

    // Se já está sendo carregado, retorna a promise existente
    // NOTE: este padrão evita condições de race onde múltiplos callers tentariam
    // carregar o mesmo plugin simultaneamente — a promise existente é retornada
    // e quaisquer erros são propagados pela promise, evitando rejetions não tratadas.
    if (this.loadingPromises.has(name)) {
      const promise = this.loadingPromises.get(name);
      if (!promise) {
        throw new Error(
          ExcecoesMessages.pluginCarregandoPromiseNaoPodeSerObtida(name),
        );
      }
      return promise;
    }

    // Cria nova promise de loading
    const loadingPromise = this.doLoadPlugin(name);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const plugin = await loadingPromise;
      this.loadingPromises.delete(name);
      return plugin;
    } catch (error) {
      this.loadingPromises.delete(name);
      throw error;
    }
  }

  /**
   * Implementação real do loading do plugin
   */
  private async doLoadPlugin(name: string): Promise<ParserPlugin> {
    log.debug(`📦 Carregando plugin: ${name}`);

    try {
      // Tenta carregar do registry configurado
      const pluginPath = `${this.config.registry}/${name}-plugin`;
      // Usa import dinâmico mockável (globalThis.import pode ser substituído nos testes)
      const dynImport: ImportDinamico =
        (globalThis as GlobalComImport).import || ((p: string) => import(p));
      const pluginModule = await dynImport(pluginPath);

      const plugin: ParserPlugin =
        ((pluginModule as Record<string, unknown>).default as ParserPlugin) ||
        (pluginModule as ParserPlugin);

      // Valida e registra
      this.validatePlugin(plugin);
      this.registerPlugin(plugin);

      return plugin;
    } catch (error) {
      logCore.erroCarregarPlugin(name, (error as Error).message);
      throw new Error(
        ExcecoesMessages.naoFoiPossivelCarregarPlugin(
          name,
          (error as Error).message,
        ),
      );
    }
  }

  /**
   * Obtém plugin por extensão de arquivo
   */
  async getPluginForExtension(extension: string): Promise<ParserPlugin | null> {
    const pluginName = this.extensionMap.get(extension);

    if (!pluginName) {
      if (this.config.autoload) {
        logCore.tentandoAutoload(extension);
        // Tenta inferir nome do plugin pela extensão
        const inferredName = this.inferPluginName(extension);
        if (inferredName && this.config.enabled.includes(inferredName)) {
          try {
            return await this.loadPlugin(inferredName);
          } catch {
            logCore.autoloadFalhou(inferredName);
          }
        }
      }
      return null;
    }

    // Verifica se o plugin está habilitado
    // Regra: se o usuário NÃO configurou a lista 'enabled', tratamos todos os plugins registrados como habilitados por padrão.
    // Só aplicamos o gate includes() quando houve configuração explícita de 'enabled'.
    if (
      this.userConfiguredEnabled &&
      !this.config.enabled.includes(pluginName)
    ) {
      log.debug(
        `🚫 Plugin ${pluginName} está desabilitado para extensão ${extension}`,
      );
      return null;
    }

    // Verifica suporte da linguagem
    const langKey = extension.substring(1); // remove o ponto
    const langSupport = this.languageSupport[langKey];
    if (langSupport && !langSupport.enabled) {
      log.debug(`🚫 Suporte à linguagem ${langKey} está desabilitado`);
      return null;
    }

    return await this.loadPlugin(pluginName);
  }

  /**
   * Infere nome do plugin baseado na extensão
   */
  private inferPluginName(extension: string): string | null {
    const extMap: Record<string, string> = {
      '.xml': 'core', // XML fica no core
      '.html': 'core', // HTML fica no core
      '.htm': 'core',
      '.css': 'core', // CSS fica no core
      '.js': 'core',
      '.jsx': 'core',
      '.ts': 'core',
      '.tsx': 'core',
      '.mjs': 'core',
      '.cjs': 'core',
      '.php': 'core', // PHP fica no core
      '.py': 'core', // Python fica no core
    };

    return extMap[extension] || null;
  }

  /**
   * Valida um plugin antes do registro
   */
  private validatePlugin(plugin: ParserPlugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error(ExcecoesMessages.pluginDeveTerNomeValido);
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error(ExcecoesMessages.pluginDeveTerVersaoValida);
    }

    if (!Array.isArray(plugin.extensions) || plugin.extensions.length === 0) {
      throw new Error(ExcecoesMessages.pluginDeveDefinirPeloMenosUmaExtensao);
    }

    if (typeof plugin.parse !== 'function') {
      throw new Error(ExcecoesMessages.pluginDeveImplementarMetodoParse);
    }
  }

  /**
   * Lista plugins registrados
   */
  getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Lista extensões suportadas
   */
  getSupportedExtensions(): string[] {
    return Array.from(this.extensionMap.keys());
  }

  /**
   * Obtém estatísticas do registry
   */
  getStats(): {
    pluginsRegistrados: number;
    extensoesSuportadas: number;
    pluginsHabilitados: number;
    autoloadAtivo: boolean;
  } {
    return {
      pluginsRegistrados: this.plugins.size,
      extensoesSuportadas: this.extensionMap.size,
      pluginsHabilitados: this.config.enabled.length,
      autoloadAtivo: this.config.autoload,
    };
  }

  /**
   * Atualiza configuração do registry
   */
  updateConfig(newConfig: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (Object.prototype.hasOwnProperty.call(newConfig, 'enabled')) {
      this.userConfiguredEnabled = true;
    }
    log.debug(`🔧 Configuração do registry atualizada`);
  }

  /**
   * Atualiza suporte a linguagens
   */
  updateLanguageSupport(newSupport: Record<string, LanguageSupport>): void {
    this.languageSupport = { ...this.languageSupport, ...newSupport };
    log.debug(`🌐 Suporte a linguagens atualizado`);
  }

  /**
   * Limpa cache de plugins (útil para testes)
   */
  clearCache(): void {
    this.plugins.clear();
    this.extensionMap.clear();
    this.loadingPromises.clear();
    log.debug(`🧹 Cache do registry limpo`);
  }
}

/**
 * Instância global do registry (singleton)
 */
let globalRegistry: PluginRegistry | null = null;

/**
 * Obtém a instância global do registry
 */

export function getGlobalRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();
  }
  return globalRegistry;
}

/**
 * Configura a instância global do registry
 */

export function configureGlobalRegistry(
  config?: PluginConfig,
  languageSupport?: Record<string, LanguageSupport>,
): void {
  globalRegistry = new PluginRegistry(config, languageSupport);
}

/**
 * Reseta a instância global (útil para testes)
 */

export function resetGlobalRegistry(): void {
  globalRegistry = null;
}
