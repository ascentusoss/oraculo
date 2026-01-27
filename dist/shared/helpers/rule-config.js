import { config } from '../../core/config/config.js';
import { minimatch } from 'minimatch';
export function isRuleSuppressed(ruleName, filePath) {
    const normalizedPath = filePath.replace(/^\.\//, '').replace(/\\/g, '/');
    const configData = config;
    const suppressRules = configData.suppressRules;
    if (suppressRules?.includes(ruleName)) {
        return true;
    }
    const ruleConfig = configData.rules?.[ruleName];
    if (ruleConfig) {
        if (ruleConfig.severity === 'off') {
            return true;
        }
        if (ruleConfig.exclude) {
            for (const pattern of ruleConfig.exclude) {
                if (minimatch(normalizedPath, pattern, { dot: true })) {
                    return true;
                }
            }
        }
        if (ruleConfig.allowTestFiles && isTestFile(normalizedPath, configData)) {
            return true;
        }
    }
    if (ruleName === 'tipo-inseguro' || ruleName === 'tipo-inseguro-any') {
        const testPatterns = configData.testPatterns;
        if (testPatterns?.allowAnyType && isTestFile(normalizedPath, configData)) {
            return true;
        }
    }
    return false;
}
function isTestFile(filePath, configData) {
    const testPatterns = configData.testPatterns?.files || [
        '**/*.test.*',
        '**/*.spec.*',
        'test/**/*',
        'tests/**/*',
        '**/__tests__/**',
    ];
    return testPatterns.some((pattern) => minimatch(filePath, pattern, { dot: true }));
}
export function getRuleSeverity(ruleName, filePath) {
    const configData = config;
    const ruleConfig = configData.rules?.[ruleName];
    if (!ruleConfig) {
        return undefined;
    }
    if (isRuleSuppressed(ruleName, filePath)) {
        return undefined;
    }
    if (ruleConfig.severity === 'error')
        return 'error';
    if (ruleConfig.severity === 'warning')
        return 'warning';
    if (ruleConfig.severity === 'info')
        return 'info';
    return undefined;
}
export function shouldSuppressOccurrence(tipo, filePath, _severity) {
    const baseRuleName = tipo.replace(/-(any|unknown|assertion|cast).*$/, '');
    const rulesToCheck = [tipo, baseRuleName];
    return rulesToCheck.some((rule) => isRuleSuppressed(rule, filePath));
}
//# sourceMappingURL=rule-config.js.map