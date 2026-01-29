import { buildTypesRelPathPosix } from '../../../core/config/conventions.js';
import { MENSAGENS_FIX_TYPES } from '../../../core/messages/index.js';
import { isAnyInGenericFunction, isInStringOrComment, isLegacyOrVendorFile, isTypeScriptContext, } from '../type-safety/context-analyzer.js';
import { analyzeTypeUsage } from '../type-safety/type-analyzer.js';
import { createTypeDefinition } from '../type-safety/type-creator.js';
import { validateTypeReplacement } from '../type-safety/type-validator.js';
export const fixAnyToProperType = {
    id: 'fix-any-to-proper-type',
    title: MENSAGENS_FIX_TYPES.fixAny.title,
    description: MENSAGENS_FIX_TYPES.fixAny.description,
    pattern: /:\s*any\b/g,
    category: 'style',
    confidence: 70,
    shouldApply: (match, fullCode, lineContext, filePath) => {
        if (isInStringOrComment(fullCode, match.index || 0)) {
            return false;
        }
        if (isTypeScriptContext(fullCode, match.index || 0)) {
            return false;
        }
        if (filePath?.includes('.d.ts') || filePath?.includes('//')) {
            return false;
        }
        if (isLegacyOrVendorFile(filePath)) {
            return false;
        }
        if (isAnyInGenericFunction(fullCode, match.index || 0)) {
            return false;
        }
        return true;
    },
    fix: (match, fullCode) => {
        return fullCode;
    },
};
export async function fixAnyToProperTypeAsync(match, fullCode, filePath, ast) {
    try {
        const typeAnalysis = await analyzeTypeUsage(match, fullCode, filePath, ast);
        if (typeAnalysis.confidence >= 85) {
            if (typeAnalysis.isSimpleType) {
                const fixedCode = fullCode.replace(match[0], `: ${typeAnalysis.inferredType}`);
                const validation = await validateTypeReplacement(fullCode, fixedCode, typeAnalysis);
                if (!validation.isCompatible) {
                    return {
                        code: fullCode,
                        applied: false,
                        reason: `Validação falhou: ${validation.errors.join(', ')}`,
                        warnings: validation.warnings.map((w) => ({
                            type: 'unsafe-type',
                            message: w,
                            suggestion: 'Revise manualmente',
                        })),
                    };
                }
                return {
                    code: fixedCode,
                    applied: true,
                    warnings: validation.warnings.map((w) => ({
                        type: 'type-suggestion',
                        message: w,
                        suggestion: MENSAGENS_FIX_TYPES.validacao.revisar,
                    })),
                };
            }
            else {
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
        }
        else if (typeAnalysis.confidence >= 60) {
            const warning = {
                type: 'type-suggestion',
                message: MENSAGENS_FIX_TYPES.warnings.confiancaMedia(typeAnalysis.confidence, typeAnalysis.inferredType),
                suggestion: MENSAGENS_FIX_TYPES.warnings.criarTipoDedicado(typeAnalysis.suggestedPath),
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
                type: 'unsafe-type',
                message: MENSAGENS_FIX_TYPES.warnings.confiancaBaixa(typeAnalysis.confidence),
                suggestion: MENSAGENS_FIX_TYPES.warnings.useTiposCentralizados(),
                needsManualReview: true,
            };
            return {
                code: fullCode,
                applied: false,
                reason: `Confiança baixa (${typeAnalysis.confidence}%)`,
                warnings: [warning],
            };
        }
    }
    catch (error) {
        return {
            code: fullCode,
            applied: false,
            reason: MENSAGENS_FIX_TYPES.erros.analise(error instanceof Error ? error.message : String(error)),
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
//# sourceMappingURL=fix-any-to-proper-type.js.map