// SPDX-License-Identifier: MIT
/**
 * Quick Fix: Replace any with proper types
 * Analisa uso de `any` e infere/cria tipos corretos
 */

import type { Node } from '/types';
import { buildTypesRelPathPosix } from '/config/conventions.js';
import { MENSAGENS_FIX_TYPES } from '/messages/index.js';

import type { QuickFix, QuickFixResult, TypeSafetyWarning } from '@';

import {
  isAnyInGenericFunction,
  isInStringOrComment,
  isLegacyOrVendorFile,
  isTypeScriptContext,
} from '../type-safety/context-analyzer.js';
import { analyzeTypeUsage } from '../type-safety/type-analyzer.js';
import { createTypeDefinition } from '../type-safety/type-creator.js';
import { validateTypeReplacement } from '../type-safety/type-validator.js';

export const fixAnyToProperType: QuickFix = {
  id: 'fix-any-to-proper-type',
  title: MENSAGENS_FIX_TYPES.fixAny.title,
  description: MENSAGENS_FIX_TYPES.fixAny.description,
  pattern: /:\s*any\b/g,
  category: 'style', // Type safety é considerado 'style' pois não afeta execução
  confidence: 70, // Média - requer análise contextual

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

    // 2. Verificar contexto TypeScript (type assertion, etc)
    if (isTypeScriptContext(fullCode, match.index || 0)) {
      return false;
    }

    // 3. Não modificar arquivos de definição de tipos
    if (filePath?.includes('.d.ts') || filePath?.includes('//')) {
      return false;
    }

    // 4. Não modificar vendor/node_modules
    if (isLegacyOrVendorFile(filePath)) {
      return false;
    }

    // 5. Verificar se any está em função genérica apropriada
    if (isAnyInGenericFunction(fullCode, match.index || 0)) {
      return false; // any pode ser apropriado aqui
    }

    return true;
  },

  fix: (match: RegExpMatchArray, fullCode: string) => {
    // Retornar código sem modificação por padrão
    // A aplicação real deve ser feita via fixAsync
    return fullCode;
  },
};

/**
 * Versão assíncrona do fix que faz análise completa
 */
export async function fixAnyToProperTypeAsync(
  match: RegExpMatchArray,
  fullCode: string,
  filePath: string,
  ast: Node | null,
): Promise<QuickFixResult> {
  try {
    // 1. Analisar uso do tipo
    const typeAnalysis = await analyzeTypeUsage(match, fullCode, filePath, ast);

    // 2. Estratégia baseada em confiança
    if (typeAnalysis.confidence >= 85) {
      // ALTA CONFIANÇA: Aplicar tipo automaticamente

      if (typeAnalysis.isSimpleType) {
        // Tipo primitivo: substituir diretamente
        const fixedCode = fullCode.replace(
          match[0],
          `: ${typeAnalysis.inferredType}`,
        );

        // Validar resultado
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
      } else {
        // Tipo complexo: criar interface
        const typePath = await createTypeDefinition(typeAnalysis, filePath);
        const importStatement = `import type { ${typeAnalysis.typeName} } from '${typePath}';\n`;

        // Adicionar import no topo e substituir any
        const lines = fullCode.split('\n');
        const importIndex = findImportInsertionPoint(lines);
        lines.splice(importIndex, 0, importStatement);

        let fixedCode = lines.join('\n');
        fixedCode = fixedCode.replace(match[0], `: ${typeAnalysis.typeName}`);

        // Validar resultado
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
      }
    } else if (typeAnalysis.confidence >= 60) {
      // MÉDIA CONFIANÇA: Sugerir mas não aplicar
      const warning: TypeSafetyWarning = {
        type: 'type-suggestion',
        message: MENSAGENS_FIX_TYPES.warnings.confiancaMedia(
          typeAnalysis.confidence,
          typeAnalysis.inferredType,
        ),
        suggestion: MENSAGENS_FIX_TYPES.warnings.criarTipoDedicado(
          typeAnalysis.suggestedPath,
        ),
        confidence: typeAnalysis.confidence,
      };

      return {
        code: fullCode,
        applied: false,
        reason: `Confiança média (${typeAnalysis.confidence}%) - sugestão apenas`,
        warnings: [warning],
      };
    } else {
      // BAIXA CONFIANÇA: Apenas avisar
      const warning: TypeSafetyWarning = {
        type: 'unsafe-type',
        message: MENSAGENS_FIX_TYPES.warnings.confiancaBaixa(
          typeAnalysis.confidence,
        ),
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
  } catch (error) {
    return {
      code: fullCode,
      applied: false,
      reason: MENSAGENS_FIX_TYPES.erros.analise(
        error instanceof Error ? error.message : String(error),
      ),
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

    // Pular comentários no topo
    if (
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*')
    ) {
      continue;
    }

    // Encontrar último import
    if (line.startsWith('import ')) {
      lastImportIndex = i;
    }

    // Se encontrou código não-import, parar
    if (line && !line.startsWith('import ') && lastImportIndex !== -1) {
      break;
    }
  }

  // Inserir após último import ou no topo
  return lastImportIndex + 1;
}
