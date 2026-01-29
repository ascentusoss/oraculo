import { ExcecoesMessages } from '../../core/messages/core/excecoes-messages.js';
import { log, logCore } from '../../core/messages/index.js';
export class PluginRegistry {
    plugins = new Map();
    extensionMap = new Map();
    config;
    userConfiguredEnabled = false;
    languageSupport;
    loadingPromises = new Map();
    constructor(config, languageSupport) {
        this.config = {
            enabled: ['core'],
            autoload: true,
            registry: '/plugins',
            ...config,
        };
        this.userConfiguredEnabled = !!config?.enabled;
        this.languageSupport = languageSupport || {};
    }
    registerPlugin(plugin) {
        logCore.registrandoPlugin(plugin.name, plugin.version);
        this.validatePlugin(plugin);
        this.plugins.set(plugin.name, plugin);
        for (const ext of plugin.extensions) {
            if (this.extensionMap.has(ext)) {
                const existing = this.extensionMap.get(ext);
                log.debug(`⚠️ Extensão ${ext} já mapeada para plugin ${existing}, sobrescrevendo com ${plugin.name}`);
            }
            this.extensionMap.set(ext, plugin.name);
        }
        log.debug(`✅ Plugin ${plugin.name} registrado com extensões: ${plugin.extensions.join(', ')}`);
    }
    async loadPlugin(name) {
        if (this.plugins.has(name)) {
            const plugin = this.plugins.get(name);
            if (!plugin) {
                throw new Error(ExcecoesMessages.pluginRegistradoNaoPodeSerObtido(name));
            }
            return plugin;
        }
        if (this.loadingPromises.has(name)) {
            const promise = this.loadingPromises.get(name);
            if (!promise) {
                throw new Error(ExcecoesMessages.pluginCarregandoPromiseNaoPodeSerObtida(name));
            }
            return promise;
        }
        const loadingPromise = this.doLoadPlugin(name);
        this.loadingPromises.set(name, loadingPromise);
        try {
            const plugin = await loadingPromise;
            this.loadingPromises.delete(name);
            return plugin;
        }
        catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }
    async doLoadPlugin(name) {
        log.debug(`📦 Carregando plugin: ${name}`);
        try {
            const pluginPath = `${this.config.registry}/${name}-plugin`;
            const dynImport = globalThis.import || ((p) => import(p));
            const pluginModule = await dynImport(pluginPath);
            const plugin = pluginModule.default ||
                pluginModule;
            this.validatePlugin(plugin);
            this.registerPlugin(plugin);
            return plugin;
        }
        catch (error) {
            logCore.erroCarregarPlugin(name, error.message);
            throw new Error(ExcecoesMessages.naoFoiPossivelCarregarPlugin(name, error.message));
        }
    }
    async getPluginForExtension(extension) {
        const pluginName = this.extensionMap.get(extension);
        if (!pluginName) {
            if (this.config.autoload) {
                logCore.tentandoAutoload(extension);
                const inferredName = this.inferPluginName(extension);
                if (inferredName && this.config.enabled.includes(inferredName)) {
                    try {
                        return await this.loadPlugin(inferredName);
                    }
                    catch {
                        logCore.autoloadFalhou(inferredName);
                    }
                }
            }
            return null;
        }
        if (this.userConfiguredEnabled &&
            !this.config.enabled.includes(pluginName)) {
            log.debug(`🚫 Plugin ${pluginName} está desabilitado para extensão ${extension}`);
            return null;
        }
        const langKey = extension.substring(1);
        const langSupport = this.languageSupport[langKey];
        if (langSupport && !langSupport.enabled) {
            log.debug(`🚫 Suporte à linguagem ${langKey} está desabilitado`);
            return null;
        }
        return await this.loadPlugin(pluginName);
    }
    inferPluginName(extension) {
        const extMap = {
            '.xml': 'core',
            '.html': 'core',
            '.htm': 'core',
            '.css': 'core',
            '.js': 'core',
            '.jsx': 'core',
            '.ts': 'core',
            '.tsx': 'core',
            '.mjs': 'core',
            '.cjs': 'core',
            '.php': 'core',
            '.py': 'core',
        };
        return extMap[extension] || null;
    }
    validatePlugin(plugin) {
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
    getRegisteredPlugins() {
        return Array.from(this.plugins.keys());
    }
    getSupportedExtensions() {
        return Array.from(this.extensionMap.keys());
    }
    getStats() {
        return {
            pluginsRegistrados: this.plugins.size,
            extensoesSuportadas: this.extensionMap.size,
            pluginsHabilitados: this.config.enabled.length,
            autoloadAtivo: this.config.autoload,
        };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (Object.prototype.hasOwnProperty.call(newConfig, 'enabled')) {
            this.userConfiguredEnabled = true;
        }
        log.debug(`🔧 Configuração do registry atualizada`);
    }
    updateLanguageSupport(newSupport) {
        this.languageSupport = { ...this.languageSupport, ...newSupport };
        log.debug(`🌐 Suporte a linguagens atualizado`);
    }
    clearCache() {
        this.plugins.clear();
        this.extensionMap.clear();
        this.loadingPromises.clear();
        log.debug(`🧹 Cache do registry limpo`);
    }
}
let globalRegistry = null;
export function getGlobalRegistry() {
    if (!globalRegistry) {
        globalRegistry = new PluginRegistry();
    }
    return globalRegistry;
}
export function configureGlobalRegistry(config, languageSupport) {
    globalRegistry = new PluginRegistry(config, languageSupport);
}
export function resetGlobalRegistry() {
    globalRegistry = null;
}
//# sourceMappingURL=registry.js.map