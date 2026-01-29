// SPDX-License-Identifier: MIT
//  tipo-literal-inline-complexo
// Justificativa: tipos locais para inferência de tipos
/**
 * Módulo de inferência de tipos
 * Infere tipos primitivos e cria interfaces para objetos complexos
 */

import type {
  InferredInterface,
  PropertyUsage,
  TypeAnalysis,
  UsagePattern,
} from '@';

import { toKebabCase } from './context-analyzer.js';

/**
 * Infere tipo baseado em padrões de uso
 */
export function inferTypeFromUsage(
  varName: string,
  patterns: UsagePattern,
  _filePath: string,
): TypeAnalysis {
  const result: TypeAnalysis = {
    confidence: 0,
    inferredType: 'unknown',
    isSimpleType: false,
    typeName: '',
    typeDefinition: '',
    suggestedPath: '',
  };

  // Tipo primitivo: string
  if (patterns.allUsagesAreString) {
    result.inferredType = 'string';
    result.isSimpleType = true;
    result.confidence = 95;
    return result;
  }

  // Tipo primitivo: number
  if (patterns.allUsagesAreNumber) {
    result.inferredType = 'number';
    result.isSimpleType = true;
    result.confidence = 95;
    return result;
  }

  // Tipo primitivo: boolean
  if (patterns.allUsagesAreBoolean) {
    result.inferredType = 'boolean';
    result.isSimpleType = true;
    result.confidence = 95;
    return result;
  }

  // Array
  if (patterns.isArray) {
    // Tentar inferir tipo do array
    const elementType = inferArrayElementType(patterns);
    result.inferredType = `${elementType}[]`;
    result.isSimpleType =
      elementType === 'string' ||
      elementType === 'number' ||
      elementType === 'boolean';
    result.confidence = 85;
    return result;
  }

  // Function
  if (patterns.isFunction) {
    result.inferredType = 'Function';
    result.isSimpleType = true;
    result.confidence = 80;
    result.suggestion =
      'Considere usar tipo de função específico: (param: T) => R';
    return result;
  }

  // Objeto complexo
  if (patterns.hasObjectStructure && patterns.objectProperties) {
    const inferredInterface = inferInterfaceFromProperties(
      varName,
      patterns.objectProperties,
    );
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

  // Type guards encontrados
  if (patterns.hasTypeGuards && patterns.typeGuards) {
    const guardType = extractTypeFromGuards(patterns.typeGuards);
    result.inferredType = guardType.type;
    result.isSimpleType = isPrimitiveType(guardType.type);
    result.confidence = guardType.confidence;
    return result;
  }

  // União de tipos detectada
  if (patterns.unionTypes && patterns.unionTypes.length > 0) {
    result.inferredType = patterns.unionTypes.join(' | ');
    result.isSimpleType = false;
    result.confidence = 70;
    result.suggestion = 'Considere criar type alias para união complexa';
    return result;
  }

  // Não conseguiu inferir
  result.inferredType = 'unknown';
  result.confidence = 30;
  result.suggestion = 'Adicione type guards ou crie tipo dedicado manualmente';
  return result;
}

/**
 * Cria interface baseado em propriedades detectadas
 */
export function inferInterfaceFromProperties(
  varName: string,
  properties: PropertyUsage[],
): InferredInterface {
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

/**
 * Extrai tipo de type guards
 */
export function extractTypeFromGuards(
  typeGuards: Array<{ type: string; inferredType: string; confidence: number }>,
): { type: string; confidence: number } {
  if (typeGuards.length === 0) {
    return { type: 'unknown', confidence: 0 };
  }

  // Se todos os guards apontam para o mesmo tipo
  const types = typeGuards.map((g) => g.inferredType);
  const uniqueTypes = [...new Set(types)];

  if (uniqueTypes.length === 1) {
    const avgConfidence =
      typeGuards.reduce((sum, g) => sum + g.confidence, 0) / typeGuards.length;
    return { type: uniqueTypes[0], confidence: avgConfidence };
  }

  // Múltiplos tipos - criar união
  const avgConfidence =
    typeGuards.reduce((sum, g) => sum + g.confidence, 0) / typeGuards.length;
  return { type: uniqueTypes.join(' | '), confidence: avgConfidence * 0.9 }; // Penalizar união
}

/**
 * Calcula confiança da interface baseado nas propriedades
 */
function calculateInterfaceConfidence(properties: PropertyUsage[]): number {
  if (properties.length === 0) {
    return 30;
  }

  // Média da confiança das propriedades
  const avgConfidence =
    properties.reduce((sum, prop) => sum + prop.confidence, 0) /
    properties.length;

  // Bonus por número de propriedades (mais propriedades = mais confiável)
  let bonus = 0;
  if (properties.length >= 3) bonus = 5;
  if (properties.length >= 5) bonus = 10;

  return Math.min(100, Math.round(avgConfidence + bonus));
}

/**
 * Infere tipo de elemento de array
 */
function inferArrayElementType(patterns: UsagePattern): string {
  // Simplificado - em produção, analisar elementos do array
  if (patterns.allUsagesAreString) return 'string';
  if (patterns.allUsagesAreNumber) return 'number';
  if (patterns.allUsagesAreBoolean) return 'boolean';
  return 'unknown';
}

/**
 * Verifica se é tipo primitivo
 */
function isPrimitiveType(type: string): boolean {
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

/**
 * Converte string para PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
