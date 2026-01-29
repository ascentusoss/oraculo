// SPDX-License-Identifier: MIT
/**
 * Analisador principal de tipos
 * Integra context-analyzer, usage-analyzer e type-inference
 */

import type { Node } from '/types';
import { getTypesDirectoryDisplay } from '/config/conventions.js';
import { MENSAGENS_FIX_TYPES } from '/messages/index.js';

import type { TypeAnalysis, TypeInferenceContext } from '@';

import {
  extractVariableName,
  getDomainFromFilePath,
  isDefinitionFile,
  isLegacyOrVendorFile,
  isTypeScriptFile,
} from './context-analyzer.js';
import { inferTypeFromUsage } from './type-inference.js';
import { analyzeUsagePatterns, findVariableUsages } from './usage-analyzer.js';

/**
 * Analisa uso de any/unknown e infere tipo correto
 */
export async function analyzeTypeUsage(
  match: RegExpMatchArray,
  fullCode: string,
  filePath: string,
  ast: Node | null,
): Promise<TypeAnalysis> {
  // 1. Criar contexto de inferência
  const context: TypeInferenceContext = {
    filePath,
    domain: getDomainFromFilePath(filePath),
    isTypeScript: isTypeScriptFile(filePath),
    isDefinitionFile: isDefinitionFile(filePath),
    isLegacy: isLegacyOrVendorFile(filePath),
    ast,
    code: fullCode,
  };

  // 2. Extrair nome da variável
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

  // 3. Encontrar usos da variável no AST
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

  // 4. Analisar padrões de uso
  const patterns = analyzeUsagePatterns(usages);

  // 5. Inferir tipo baseado nos padrões
  const typeAnalysis = inferTypeFromUsage(varName, patterns, filePath);

  // 6. Ajustar suggestedPath com domínio correto
  if (typeAnalysis.suggestedPath) {
    typeAnalysis.suggestedPath = `${context.domain}/${typeAnalysis.suggestedPath}`;
  }

  return typeAnalysis;
}

/**
 * Analisa uso de unknown com foco em type guards
 */
export async function analyzeUnknownUsage(
  match: RegExpMatchArray,
  fullCode: string,
  filePath: string,
  ast: Node | null,
): Promise<TypeAnalysis> {
  // Mesma lógica de analyzeTypeUsage, mas mais conservador
  const analysis = await analyzeTypeUsage(match, fullCode, filePath, ast);

  // Penalizar confiança em 10% para unknown (mais conservador)
  analysis.confidence = Math.max(0, analysis.confidence - 10);

  // Se confiança ainda é baixa, sugerir manter unknown
  if (analysis.confidence < 70) {
    analysis.suggestion =
      'Confiança baixa para substituir unknown. ' +
      `Considere adicionar type guards ou criar tipo dedicado em ${getTypesDirectoryDisplay()}`;
  }

  return analysis;
}
