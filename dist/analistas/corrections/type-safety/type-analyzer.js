import { getTypesDirectoryDisplay } from '../../../core/config/conventions.js';
import { MENSAGENS_FIX_TYPES } from '../../../core/messages/index.js';
import { extractVariableName, getDomainFromFilePath, isDefinitionFile, isLegacyOrVendorFile, isTypeScriptFile, } from './context-analyzer.js';
import { inferTypeFromUsage } from './type-inference.js';
import { analyzeUsagePatterns, findVariableUsages } from './usage-analyzer.js';
export async function analyzeTypeUsage(match, fullCode, filePath, ast) {
    const context = {
        filePath,
        domain: getDomainFromFilePath(filePath),
        isTypeScript: isTypeScriptFile(filePath),
        isDefinitionFile: isDefinitionFile(filePath),
        isLegacy: isLegacyOrVendorFile(filePath),
        ast,
        code: fullCode,
    };
    const varName = extractVariableName(match, fullCode);
    if (!varName) {
        return {
            confidence: 0,
            inferredType: 'unknown',
            isSimpleType: false,
            typeName: '',
            typeDefinition: '',
            suggestedPath: '',
            suggestion: MENSAGENS_FIX_TYPES.erros.extrairNome,
        };
    }
    const usages = findVariableUsages(varName, ast);
    if (usages.length === 0) {
        return {
            confidence: 20,
            inferredType: 'unknown',
            isSimpleType: false,
            typeName: '',
            typeDefinition: '',
            suggestedPath: '',
            suggestion: MENSAGENS_FIX_TYPES.erros.variavelNaoUsada,
        };
    }
    const patterns = analyzeUsagePatterns(usages);
    const typeAnalysis = inferTypeFromUsage(varName, patterns, filePath);
    if (typeAnalysis.suggestedPath) {
        typeAnalysis.suggestedPath = `${context.domain}/${typeAnalysis.suggestedPath}`;
    }
    return typeAnalysis;
}
export async function analyzeUnknownUsage(match, fullCode, filePath, ast) {
    const analysis = await analyzeTypeUsage(match, fullCode, filePath, ast);
    analysis.confidence = Math.max(0, analysis.confidence - 10);
    if (analysis.confidence < 70) {
        analysis.suggestion =
            'Confiança baixa para substituir unknown. ' +
                `Considere adicionar type guards ou criar tipo dedicado em ${getTypesDirectoryDisplay()}`;
    }
    return analysis;
}
//# sourceMappingURL=type-analyzer.js.map