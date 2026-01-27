import { toKebabCase } from './context-analyzer.js';
export function inferTypeFromUsage(varName, patterns, _filePath) {
    const result = {
        confidence: 0,
        inferredType: 'unknown',
        isSimpleType: false,
        typeName: '',
        typeDefinition: '',
        suggestedPath: '',
    };
    if (patterns.allUsagesAreString) {
        result.inferredType = 'string';
        result.isSimpleType = true;
        result.confidence = 95;
        return result;
    }
    if (patterns.allUsagesAreNumber) {
        result.inferredType = 'number';
        result.isSimpleType = true;
        result.confidence = 95;
        return result;
    }
    if (patterns.allUsagesAreBoolean) {
        result.inferredType = 'boolean';
        result.isSimpleType = true;
        result.confidence = 95;
        return result;
    }
    if (patterns.isArray) {
        const elementType = inferArrayElementType(patterns);
        result.inferredType = `${elementType}[]`;
        result.isSimpleType =
            elementType === 'string' ||
                elementType === 'number' ||
                elementType === 'boolean';
        result.confidence = 85;
        return result;
    }
    if (patterns.isFunction) {
        result.inferredType = 'Function';
        result.isSimpleType = true;
        result.confidence = 80;
        result.suggestion =
            'Considere usar tipo de função específico: (param: T) => R';
        return result;
    }
    if (patterns.hasObjectStructure && patterns.objectProperties) {
        const inferredInterface = inferInterfaceFromProperties(varName, patterns.objectProperties);
        result.inferredType = inferredInterface.name;
        result.typeName = inferredInterface.name;
        result.typeDefinition = inferredInterface.definition;
        result.isSimpleType = false;
        result.confidence = inferredInterface.confidence;
        result.suggestedPath = `${toKebabCase(inferredInterface.name)}.ts`;
        result.createdNewType = true;
        result.requiresImport = true;
        return result;
    }
    if (patterns.hasTypeGuards && patterns.typeGuards) {
        const guardType = extractTypeFromGuards(patterns.typeGuards);
        result.inferredType = guardType.type;
        result.isSimpleType = isPrimitiveType(guardType.type);
        result.confidence = guardType.confidence;
        return result;
    }
    if (patterns.unionTypes && patterns.unionTypes.length > 0) {
        result.inferredType = patterns.unionTypes.join(' | ');
        result.isSimpleType = false;
        result.confidence = 70;
        result.suggestion = 'Considere criar type alias para união complexa';
        return result;
    }
    result.inferredType = 'unknown';
    result.confidence = 30;
    result.suggestion = 'Adicione type guards ou crie tipo dedicado manualmente';
    return result;
}
export function inferInterfaceFromProperties(varName, properties) {
    const interfaceName = toPascalCase(varName);
    const confidence = calculateInterfaceConfidence(properties);
    const propertiesCode = properties
        .map((prop) => {
        const optional = prop.isOptional ? '?' : '';
        return `  ${prop.name}${optional}: ${prop.inferredType};`;
    })
        .join('\n');
    const definition = `export interface ${interfaceName} {\n${propertiesCode}\n}`;
    return {
        name: interfaceName,
        definition,
        confidence,
        properties,
    };
}
export function extractTypeFromGuards(typeGuards) {
    if (typeGuards.length === 0) {
        return { type: 'unknown', confidence: 0 };
    }
    const types = typeGuards.map((g) => g.inferredType);
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length === 1) {
        const avgConfidence = typeGuards.reduce((sum, g) => sum + g.confidence, 0) / typeGuards.length;
        return { type: uniqueTypes[0], confidence: avgConfidence };
    }
    const avgConfidence = typeGuards.reduce((sum, g) => sum + g.confidence, 0) / typeGuards.length;
    return { type: uniqueTypes.join(' | '), confidence: avgConfidence * 0.9 };
}
function calculateInterfaceConfidence(properties) {
    if (properties.length === 0) {
        return 30;
    }
    const avgConfidence = properties.reduce((sum, prop) => sum + prop.confidence, 0) /
        properties.length;
    let bonus = 0;
    if (properties.length >= 3)
        bonus = 5;
    if (properties.length >= 5)
        bonus = 10;
    return Math.min(100, Math.round(avgConfidence + bonus));
}
function inferArrayElementType(patterns) {
    if (patterns.allUsagesAreString)
        return 'string';
    if (patterns.allUsagesAreNumber)
        return 'number';
    if (patterns.allUsagesAreBoolean)
        return 'boolean';
    return 'unknown';
}
function isPrimitiveType(type) {
    const primitives = [
        'string',
        'number',
        'boolean',
        'null',
        'undefined',
        'symbol',
        'bigint',
    ];
    return primitives.includes(type.toLowerCase());
}
function toPascalCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(/[\s_-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
//# sourceMappingURL=type-inference.js.map