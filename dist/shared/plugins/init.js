import corePlugin from './core-plugin.js';
import { getGlobalRegistry } from './registry.js';
export function initializeDefaultPlugins() {
    const registry = getGlobalRegistry();
    registry.registerPlugin(corePlugin);
}
export function getAvailablePlugins() {
    return ['core'];
}
export const DEFAULT_PLUGIN_CONFIG = {
    enabled: ['core'],
    autoload: true,
    registry: '@oraculo/plugins',
};
export const DEFAULT_LANGUAGE_SUPPORT = {
    javascript: {
        enabled: true,
        parser: 'core',
        extensions: ['.js', '.jsx', '.mjs', '.cjs'],
        features: ['babel', 'flow', 'jsx'],
    },
    typescript: {
        enabled: true,
        parser: 'core',
        extensions: ['.ts', '.tsx'],
        features: ['typescript', 'jsx', 'decorators'],
    },
    html: {
        enabled: true,
        parser: 'core',
        extensions: ['.html', '.htm'],
        features: ['html5', 'dom'],
    },
    css: {
        enabled: true,
        parser: 'core',
        extensions: ['.css'],
        features: ['css3', 'ast'],
    },
    xml: {
        enabled: true,
        parser: 'core',
        extensions: ['.xml'],
        features: ['xml', 'attributes'],
    },
    php: {
        enabled: true,
        parser: 'core',
        extensions: ['.php'],
        features: ['heuristic', 'classes', 'functions'],
    },
    python: {
        enabled: true,
        parser: 'core',
        extensions: ['.py'],
        features: ['heuristic', 'classes', 'functions'],
    },
};
//# sourceMappingURL=init.js.map