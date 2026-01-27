export const DEFAULT_AUTO_FIX_CONFIG = {
    mode: 'balanced',
    minConfidence: 75,
    allowedCategories: ['security', 'performance', 'style', 'documentation'],
    excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.min.js',
        '**/src/nucleo/configuracao/**',
        '**/src/shared/persistence/**',
        '**/operario-estrutura.ts',
        '**/corretor-estrutura.ts',
        '**/mapa-reversao.ts',
        '**/quick-fix-registry.ts',
        '**/config.ts',
        '**/executor.ts',
    ],
    excludeFunctionPatterns: [
        'planejar',
        'aplicar',
        'corrigir',
        'executar',
        'processar',
        'salvar.*Estado',
        'ler.*Estado',
        'gerarPlano.*',
        'detectar.*',
        'analisar.*',
        'validar.*',
    ],
    maxFixesPerFile: 5,
    createBackup: true,
    validateAfterFix: true,
    allowMutateFs: false,
    backupSuffix: '.local.bak',
    conservative: true,
};
export const CONSERVATIVE_AUTO_FIX_CONFIG = {
    ...DEFAULT_AUTO_FIX_CONFIG,
    mode: 'conservative',
    minConfidence: 90,
    allowedCategories: ['security', 'performance'],
    maxFixesPerFile: 2,
    excludePatterns: [
        ...(DEFAULT_AUTO_FIX_CONFIG.excludePatterns || []),
        '**/src/analistas/**',
        '**/src/arquitetos/**',
        '**/src/zeladores/**',
        '**/src/guardian/**',
        '**/src/cli/**',
    ],
};
export const AGGRESSIVE_AUTO_FIX_CONFIG = {
    ...DEFAULT_AUTO_FIX_CONFIG,
    mode: 'aggressive',
    minConfidence: 60,
    maxFixesPerFile: 10,
    excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.min.js',
    ],
};
export const AUTO_FIX_CONFIG_DEFAULTS = DEFAULT_AUTO_FIX_CONFIG;
export default AUTO_FIX_CONFIG_DEFAULTS;
export function shouldExcludeFile(filePath, config) {
    if (!config || !config.excludePatterns)
        return false;
    return config.excludePatterns.some((pattern) => {
        const regexPattern = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
        return new RegExp(regexPattern).test(filePath);
    });
}
export function shouldExcludeFunction(functionName, config) {
    if (!config || !config.excludeFunctionPatterns)
        return false;
    return config.excludeFunctionPatterns.some((pattern) => new RegExp(pattern, 'i').test(functionName));
}
export function isCategoryAllowed(category, config) {
    if (!config || !config.allowedCategories)
        return true;
    return config.allowedCategories.includes(category);
}
export function hasMinimumConfidence(confidence, config) {
    if (typeof config?.minConfidence !== 'number')
        return true;
    return confidence >= config.minConfidence;
}
export function getAutoFixConfig(mode) {
    switch (mode) {
        case 'conservative':
            return CONSERVATIVE_AUTO_FIX_CONFIG;
        case 'aggressive':
            return AGGRESSIVE_AUTO_FIX_CONFIG;
        case 'balanced':
        default:
            return DEFAULT_AUTO_FIX_CONFIG;
    }
}
//# sourceMappingURL=auto-fix-config.js.map