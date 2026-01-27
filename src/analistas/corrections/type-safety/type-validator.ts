// SPDX-License-Identifier: MIT
/**
 * Validação de tipos criados/modificados
 * Verifica compatibilidade e compilação TypeScript
 */

import type { TypeAnalysis, TypeReplacementValidation } from '@';

import { findExistingType, isSameType } from './type-creator.js';

/**
 * Valida substituição de tipo (any/unknown → specific)
 */
export async function validateTypeReplacement(
  originalCode: string,
  fixedCode: string,
  typeAnalysis: TypeAnalysis,
): Promise<TypeReplacementValidation> {
  const result: TypeReplacementValidation = {
    isCompatible: true,
    expectedType: typeAnalysis.inferredType,
    errors: [],
    warnings: [],
  };

  // 1. Verificar se tipo criado já existe com definição diferente
  if (typeAnalysis.createdNewType) {
    const existingType = await findExistingType(typeAnalysis.typeName);
    if (
      existingType &&
      !isSameType(existingType, typeAnalysis.typeDefinition)
    ) {
      result.warnings.push(
        `Tipo ${typeAnalysis.typeName} já existe com definição diferente. ` +
          `Verifique conflito em ${existingType.path}`,
      );
    }
  }

  // 2. Verificar se tipo inferido é compatível com uso
  const usageValidation = validateTypeUsageCompatibility(
    fixedCode,
    typeAnalysis,
  );
  if (!usageValidation.isCompatible) {
    result.errors.push(
      `Tipo inferido ${typeAnalysis.inferredType} incompatível com uso detectado. ` +
        `Esperado: ${usageValidation.expectedType}`,
    );
    result.isCompatible = false;
  }

  // 3. Verificar se import foi adicionado corretamente
  if (typeAnalysis.requiresImport) {
    const hasCorrectImport =
      fixedCode.includes(`import type { ${typeAnalysis.typeName} }`) ||
      fixedCode.includes(`import { type ${typeAnalysis.typeName} }`);

    if (!hasCorrectImport) {
      result.errors.push(
        `Import de tipo ${typeAnalysis.typeName} não encontrado`,
      );
      result.isCompatible = false;
    }
  }

  // 4. Verificar confiança mínima
  if (typeAnalysis.confidence < 60) {
    result.warnings.push(
      `Confiança muito baixa (${typeAnalysis.confidence}%). Considere revisão manual.`,
    );
  }

  // 5. Validar sintaxe básica do código modificado
  const syntaxValidation = validateBasicSyntax(fixedCode);
  if (!syntaxValidation.isValid) {
    result.errors.push(...syntaxValidation.errors);
    result.isCompatible = false;
  }

  return result;
}

/**
 * Valida compatibilidade do tipo inferido com uso real
 */
function validateTypeUsageCompatibility(
  code: string,
  typeAnalysis: TypeAnalysis,
): { isCompatible: boolean; expectedType: string } {
  // Simplificado - em produção, usar TypeScript compiler API
  // para verificação completa

  // Por enquanto, considerar compatível se confiança >= 70%
  const isCompatible = typeAnalysis.confidence >= 70;

  return {
    isCompatible,
    expectedType: typeAnalysis.inferredType,
  };
}

/**
 * Valida sintaxe básica do código
 */
function validateBasicSyntax(code: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar balanceamento de chaves
  const braceCount =
    (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
  if (braceCount !== 0) {
    errors.push(`Chaves desbalanceadas: diferença de ${Math.abs(braceCount)}`);
  }

  // Verificar balanceamento de parênteses
  const parenCount =
    (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
  if (parenCount !== 0) {
    errors.push(
      `Parênteses desbalanceados: diferença de ${Math.abs(parenCount)}`,
    );
  }

  // Verificar balanceamento de colchetes
  const bracketCount =
    (code.match(/\[/g) || []).length - (code.match(/\]/g) || []).length;
  if (bracketCount !== 0) {
    errors.push(
      `Colchetes desbalanceados: diferença de ${Math.abs(bracketCount)}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Simula compilação TypeScript (simplificado)
 * Em produção, usar TypeScript compiler API
 */
export function runTypeScriptCompiler(code: string): {
  hasErrors: boolean;
  errors: string[];
} {
  // Simplificado - validações básicas
  const errors: string[] = [];

  // Verificar imports malformados
  const importLines = code
    .split('\n')
    .filter((line) => line.trim().startsWith('import'));

  for (const line of importLines) {
    if (!line.includes('from') && !line.includes('=')) {
      errors.push(`Import malformado: ${line.trim()}`);
    }
  }

  // Verificar sintaxe de interface
  const interfaceRegex = /interface\s+\w+\s*{[^}]*}/g;
  const interfaces = code.match(interfaceRegex) || [];

  for (const iface of interfaces) {
    // Verificar propriedades
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
