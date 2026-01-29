// SPDX-License-Identifier: MIT
import corePlugin from './core-plugin.js';
import { getGlobalRegistry } from './registry.js';

/**
 * Inicializa plugins padr�o do Or�culo
 * Registra todos os plugins internos no registry global
 */

export function initializeDefaultPlugins(): void {
  const registry = getGlobalRegistry();

  // Registra plugin core (JS/TS/HTML/CSS/XML)
  registry.registerPlugin(corePlugin);
}

/**
 * Obtém todos os plugins disponíveis (útil para listagem)
 */

export function getAvailablePlugins(): string[] {
  return ['core'];
}

/**
 * Configuração padrão de plugins para o Oráculo
 */
export const DEFAULT_PLUGIN_CONFIG = {
  enabled: ['core'],
  autoload: true,
  registry: '/plugins',
};

/**
 * Configuração padrão de suporte a linguagens
 */
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
