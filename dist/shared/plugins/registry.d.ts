import type { LanguageSupport, ParserPlugin, PluginConfig } from '../../types/index.js';
export declare class PluginRegistry {
    private plugins;
    private extensionMap;
    private config;
    private userConfiguredEnabled;
    private languageSupport;
    private loadingPromises;
    constructor(config?: PluginConfig, languageSupport?: Record<string, LanguageSupport>);
    registerPlugin(plugin: ParserPlugin): void;
    loadPlugin(name: string): Promise<ParserPlugin>;
    private doLoadPlugin;
    getPluginForExtension(extension: string): Promise<ParserPlugin | null>;
    private inferPluginName;
    private validatePlugin;
    getRegisteredPlugins(): string[];
    getSupportedExtensions(): string[];
    getStats(): {
        pluginsRegistrados: number;
        extensoesSuportadas: number;
        pluginsHabilitados: number;
        autoloadAtivo: boolean;
    };
    updateConfig(newConfig: Partial<PluginConfig>): void;
    updateLanguageSupport(newSupport: Record<string, LanguageSupport>): void;
    clearCache(): void;
}
export declare function getGlobalRegistry(): PluginRegistry;
export declare function configureGlobalRegistry(config?: PluginConfig, languageSupport?: Record<string, LanguageSupport>): void;
export declare function resetGlobalRegistry(): void;
//# sourceMappingURL=registry.d.ts.map