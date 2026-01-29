import { buildTypesRelPathPosix, getTypesDirectoryDisplay, } from '../../../core/config/conventions.js';
import { MENSAGENS_FIX_TYPES } from '../../../core/messages/index.js';
import { isInStringOrComment, isLegacyOrVendorFile, isUnknownInGenericContext, } from '../type-safety/context-analyzer.js';
import { analyzeUnknownUsage } from '../type-safety/type-analyzer.js';
import { createTypeDefinition } from '../type-safety/type-creator.js';
import { validateTypeReplacement } from '../type-safety/type-validator.js';
export const fixUnknownToSpecificType = {
    id: 'fix-unknown-to-specific-type',
    title: MENSAGENS_FIX_TYPES.fixUnknown.title,
    description: MENSAGENS_FIX_TYPES.fixUnknown.description,
    pattern: /:\s*unknown\b/g,
    category: 'style',
    confidence: 75,
    shouldApply: (match, fullCode, lineContext, filePath) => {
        if (isInStringOrComment(fullCode, match.index || 0)) {
            return false;
        }
        if (filePath?.includes('.d.ts') || filePath?.includes('//')) {
            return false;
        }
        if (isLegacyOrVendorFile(filePath)) {
            return false;
        }
        if (isUnknownInGenericContext(fullCode, match.index || 0)) {
            return false;
        }
        return true;
    },
    fix: (match, fullCode) => {
        return fullCode;
    },
};
export async function fixUnknownToSpecificTypeAsync(match, fullCode, filePath, ast) {
    try {
        const typeAnalysis = await analyzeUnknownUsage(match, fullCode, filePath, ast);
        if (typeAnalysis.confidence >= 90) {
            const typePath = await createTypeDefinition(typeAnalysis, filePath);
            const importStatement = `import type { ${typeAnalysis.typeName} } from '${typePath}';\n`;
            const lines = fullCode.split('\n');
            const importIndex = findImportInsertionPoint(lines);
            lines.splice(importIndex, 0, importStatement);
            let fixedCode = lines.join('\n');
            fixedCode = fixedCode.replace(match[0], `: ${typeAnalysis.typeName}`);
            const validation = await validateTypeReplacement(fullCode, fixedCode, typeAnalysis);
            if (!validation.isCompatible) {
                return {
                    code: fullCode,
                    applied: false,
                    reason: `Validação falhou: ${validation.errors.join(', ')}`,
                };
            }
            return {
                code: fixedCode,
                applied: true,
                additionalChanges: [
                    {
                        type: 'add-import',
                        content: importStatement,
                    },
                    {
                        type: 'create-type-file',
                        content: typeAnalysis.typeDefinition,
                        path: buildTypesRelPathPosix(typeAnalysis.suggestedPath),
                    },
                ],
            };
        }
        else if (typeAnalysis.confidence >= 70) {
            const warning = {
                type: 'type-suggestion',
                message: `unknown pode ser substituído por tipo específico: ${typeAnalysis.inferredType}`,
                suggestion: `Crie interface em ${buildTypesRelPathPosix(typeAnalysis.suggestedPath)}`,
                confidence: typeAnalysis.confidence,
            };
            return {
                code: fullCode,
                applied: false,
                reason: `Confiança média (${typeAnalysis.confidence}%) - sugestão apenas`,
                warnings: [warning],
            };
        }
        else {
            const warning = {
                type: 'keep-unknown',
                message: 'unknown apropriado aqui (entrada genérica ou baixa confiança)',
                suggestion: `Se possível, adicione type guards ou crie tipo dedicado em ${getTypesDirectoryDisplay()}`,
            };
            return {
                code: fullCode,
                applied: false,
                reason: `Confiança baixa (${typeAnalysis.confidence}%) - manter unknown`,
                warnings: [warning],
            };
        }
    }
    catch (error) {
        return {
            code: fullCode,
            applied: false,
            reason: `Erro na análise: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
function findImportInsertionPoint(lines) {
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('//') ||
            line.startsWith('/*') ||
            line.startsWith('*')) {
            continue;
        }
        if (line.startsWith('import ')) {
            lastImportIndex = i;
        }
        if (line && !line.startsWith('import ') && lastImportIndex !== -1) {
            break;
        }
    }
    return lastImportIndex + 1;
}
//# sourceMappingURL=fix-unknown-to-specific-type.js.map