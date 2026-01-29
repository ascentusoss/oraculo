// SPDX-License-Identifier: MIT
/**
 * Quick Fix: Replace unknown with specific types
 * Mais conservador que fix-any - requer confiança >= 90%
 */

import type { Node } from '/types';
import {
  buildTypesRelPathPosix,
  getTypesDirectoryDisplay,
} from '/config/conventions.js';
import { MENSAGENS_FIX_TYPES } from '/messages/index.js';

import type { QuickFix, QuickFixResult, TypeSafetyWarning } from '@';

import {
  isInStringOrComment,
  isLegacyOrVendorFile,
  isUnknownInGenericContext,
} from '../type-safety/context-analyzer.js';
import { analyzeUnknownUsage } from '../type-safety/type-analyzer.js';
import { createTypeDefinition } from '../type-safety/type-creator.js';
import { validateTypeReplacement } from '../type-safety/type-validator.js';

export const fixUnknownToSpecificType: QuickFix = {
  id: 'fix-unknown-to-specific-type',
  title: MENSAGENS_FIX_TYPES.fixUnknown.title,
  description: MENSAGENS_FIX_TYPES.fixUnknown.description,
  pattern: /:\s*unknown\b/g,
  category: 'style',
  confidence: 75, // Mais conservador que any

  shouldApply: (
    match: RegExpMatchArray,
    fullCode: string,
    lineContext: string,
    filePath?: string,
  ) => {
    // 1. Verificar contexto básico
    if (isInStringOrComment(fullCode, match.index || 0)) {
      return false;
    }

    // 2. Não modificar arquivos de definição
    if (filePath?.includes('.d.ts') || filePath?.includes('//')) {
      return false;
    }

    // 3. Não modificar legado/vendor
    if (isLegacyOrVendorFile(filePath)) {
      return false;
    }

    // 4. Verificar se unknown está em contexto genérico apropriado
    if (isUnknownInGenericContext(fullCode, match.index || 0)) {
      return false; // unknown é apropriado aqui (entrada genérica, deserialização, etc)
    }

    return true;
  },

  fix: (match: RegExpMatchArray, fullCode: string) => {
    // Retornar código sem modificação por padrão
    return fullCode;
  },
};

/**
 * Versão assíncrona com análise completa (conservador)
 */
export async function fixUnknownToSpecificTypeAsync(
  match: RegExpMatchArray,
  fullCode: string,
  filePath: string,
  ast: Node | null,
): Promise<QuickFixResult> {
  try {
    // 1. Analisar uso (mais conservador que any)
    const typeAnalysis = await analyzeUnknownUsage(
      match,
      fullCode,
      filePath,
      ast,
    );

    // 2. Estratégia mais conservadora (requer >= 90% confiança)
    if (typeAnalysis.confidence >= 90) {
      // ALTA CONFIANÇA: Criar interface dedicada

      const typePath = await createTypeDefinition(typeAnalysis, filePath);
      const importStatement = `import type { ${typeAnalysis.typeName} } from '${typePath}';\n`;

      // Adicionar import e substituir unknown
      const lines = fullCode.split('\n');
      const importIndex = findImportInsertionPoint(lines);
      lines.splice(importIndex, 0, importStatement);

      let fixedCode = lines.join('\n');
      fixedCode = fixedCode.replace(match[0], `: ${typeAnalysis.typeName}`);

      // Validar
      const validation = await validateTypeReplacement(
        fullCode,
        fixedCode,
        typeAnalysis,
      );

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
    } else if (typeAnalysis.confidence >= 70) {
      // MÉDIA CONFIANÇA: Sugerir tipo
      const warning: TypeSafetyWarning = {
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
    } else {
      // BAIXA CONFIANÇA: Manter unknown
      const warning: TypeSafetyWarning = {
        type: 'keep-unknown',
        message:
          'unknown apropriado aqui (entrada genérica ou baixa confiança)',
        suggestion: `Se possível, adicione type guards ou crie tipo dedicado em ${getTypesDirectoryDisplay()}`,
      };

      return {
        code: fullCode,
        applied: false,
        reason: `Confiança baixa (${typeAnalysis.confidence}%) - manter unknown`,
        warnings: [warning],
      };
    }
  } catch (error) {
    return {
      code: fullCode,
      applied: false,
      reason: `Erro na análise: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Encontra ponto de inserção para import
 */
function findImportInsertionPoint(lines: string[]): number {
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*')
    ) {
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
