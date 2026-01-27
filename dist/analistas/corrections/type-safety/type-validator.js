import { findExistingType, isSameType } from './type-creator.js';
export async function validateTypeReplacement(originalCode, fixedCode, typeAnalysis) {
    const result = {
        isCompatible: true,
        expectedType: typeAnalysis.inferredType,
        errors: [],
        warnings: [],
    };
    if (typeAnalysis.createdNewType) {
        const existingType = await findExistingType(typeAnalysis.typeName);
        if (existingType &&
            !isSameType(existingType, typeAnalysis.typeDefinition)) {
            result.warnings.push(`Tipo ${typeAnalysis.typeName} já existe com definição diferente. ` +
                `Verifique conflito em ${existingType.path}`);
        }
    }
    const usageValidation = validateTypeUsageCompatibility(fixedCode, typeAnalysis);
    if (!usageValidation.isCompatible) {
        result.errors.push(`Tipo inferido ${typeAnalysis.inferredType} incompatível com uso detectado. ` +
            `Esperado: ${usageValidation.expectedType}`);
        result.isCompatible = false;
    }
    if (typeAnalysis.requiresImport) {
        const hasCorrectImport = fixedCode.includes(`import type { ${typeAnalysis.typeName} }`) ||
            fixedCode.includes(`import { type ${typeAnalysis.typeName} }`);
        if (!hasCorrectImport) {
            result.errors.push(`Import de tipo ${typeAnalysis.typeName} não encontrado`);
            result.isCompatible = false;
        }
    }
    if (typeAnalysis.confidence < 60) {
        result.warnings.push(`Confiança muito baixa (${typeAnalysis.confidence}%). Considere revisão manual.`);
    }
    const syntaxValidation = validateBasicSyntax(fixedCode);
    if (!syntaxValidation.isValid) {
        result.errors.push(...syntaxValidation.errors);
        result.isCompatible = false;
    }
    return result;
}
function validateTypeUsageCompatibility(code, typeAnalysis) {
    const isCompatible = typeAnalysis.confidence >= 70;
    return {
        isCompatible,
        expectedType: typeAnalysis.inferredType,
    };
}
function validateBasicSyntax(code) {
    const errors = [];
    const braceCount = (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
    if (braceCount !== 0) {
        errors.push(`Chaves desbalanceadas: diferença de ${Math.abs(braceCount)}`);
    }
    const parenCount = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
    if (parenCount !== 0) {
        errors.push(`Parênteses desbalanceados: diferença de ${Math.abs(parenCount)}`);
    }
    const bracketCount = (code.match(/\[/g) || []).length - (code.match(/\]/g) || []).length;
    if (bracketCount !== 0) {
        errors.push(`Colchetes desbalanceados: diferença de ${Math.abs(bracketCount)}`);
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
export function runTypeScriptCompiler(code) {
    const errors = [];
    const importLines = code
        .split('\n')
        .filter((line) => line.trim().startsWith('import'));
    for (const line of importLines) {
        if (!line.includes('from') && !line.includes('=')) {
            errors.push(`Import malformado: ${line.trim()}`);
        }
    }
    const interfaceRegex = /interface\s+\w+\s*{[^}]*}/g;
    const interfaces = code.match(interfaceRegex) || [];
    for (const iface of interfaces) {
        const properties = iface.match(/\w+\s*\??\s*:\s*[\w\[\]<>|&\s]+;/g);
        if (!properties) {
            errors.push(`Interface malformada: ${iface.substring(0, 50)}...`);
        }
    }
    return {
        hasErrors: errors.length > 0,
        errors,
    };
}
//# sourceMappingURL=type-validator.js.map