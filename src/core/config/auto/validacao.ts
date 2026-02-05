// SPDX-License-Identifier: MIT
/**
 * Sistema de validação para correções automáticas
 * Integra com o sistema existente de detectores do Oráculo
 */

import { log } from '@core/messages/index.js';

import type { ValidationResult } from '@';

// Re-exporta o tipo para compatibilidade
export type { ValidationResult };

/**
 * Valida sintaxe usando verificações robustas baseadas nos detectores existentes
 */
export function validateJavaScriptSyntax(code: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // 1. Verificações básicas de balanceamento
    const braceCount =
      (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
    const parenCount =
      (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
    const bracketCount =
      (code.match(/\[/g) || []).length - (code.match(/\]/g) || []).length;

    if (braceCount !== 0) {
      result.errors.push(
        `Chaves desbalanceadas: ${braceCount > 0 ? 'faltam' : 'sobram'} ${Math.abs(braceCount)} chave(s)`,
      );
      result.isValid = false;
    }

    if (parenCount !== 0) {
      result.errors.push(
        `Parênteses desbalanceados: ${parenCount > 0 ? 'faltam' : 'sobram'} ${Math.abs(parenCount)} parêntese(s)`,
      );
      result.isValid = false;
    }

    if (bracketCount !== 0) {
      result.errors.push(
        `Colchetes desbalanceados: ${bracketCount > 0 ? 'faltam' : 'sobram'} ${Math.abs(bracketCount)} colchete(s)`,
      );
      result.isValid = false;
    }

    // 2. Usar lógica similar ao detector de segurança para try-catch
    const tryBlocks = (code.match(/try\s*{/g) || []).length;
    const catchBlocks = (code.match(/catch\s*\(/g) || []).length;

    if (tryBlocks !== catchBlocks) {
      result.errors.push('Blocos try-catch desbalanceados');
      result.isValid = false;
    }

    // 3. Verificar JSDoc órfãos (seguindo padrão dos detectores)
    // Nota: Verificação simplificada - JSDoc pode aparecer em classes, interfaces, etc
    const jsdocBlocks = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    const codeStructures = (
      code.match(
        /(?:export\s+)?(?:async\s+)?(?:function|class|interface|type)\s+\w+/g,
      ) || []
    ).length;

    // Apenas avisar se houver MUITOS JSDoc órfãos (possível geração automática problemática)
    if (jsdocBlocks > codeStructures + 5) {
      result.warnings.push(
        `Possível poluição de JSDoc: ${jsdocBlocks} blocos para ${codeStructures} estruturas`,
      );
    }

    // 4. Verificar imports/exports quebrados
    const importLines = code
      .split('\n')
      .filter(
        (line) =>
          line.trim().startsWith('import') || line.trim().startsWith('export'),
      );

    for (const line of importLines) {
      if (
        !line.trim().endsWith(';') &&
        !line.includes('from') &&
        !line.includes('=')
      ) {
        result.warnings.push(
          `Possível import/export malformado: ${line.trim().substring(0, 50)}...`,
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Erro na validação de sintaxe: ${error instanceof Error ? error.message : String(error)}`,
    );
    result.isValid = false;
  }

  return result;
}

/**
 * Valida se a correção não introduz problemas conhecidos
 */
export function validateQuickFixResult(
  originalCode: string,
  fixedCode: string,
  fixId: string,
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Validar sintaxe do código corrigido
    const syntaxValidation = validateJavaScriptSyntax(fixedCode);
    result.errors.push(...syntaxValidation.errors);
    result.warnings.push(...syntaxValidation.warnings);
    result.isValid = result.isValid && syntaxValidation.isValid;

    // Validações específicas por tipo de correção
    switch (fixId) {
      case 'wrap-async-with-try-catch':
        // Verificar se o try-catch foi adicionado corretamente
        if (!fixedCode.includes('try {') || !fixedCode.includes('} catch')) {
          result.errors.push('Try-catch não foi adicionado corretamente');
          result.isValid = false;
        }

        // Verificar se não criamos try-catch aninhados desnecessários
        const nestedTryCount = (fixedCode.match(/try\s*{[^}]*try\s*{/g) || [])
          .length;
        if (nestedTryCount > 0) {
          result.warnings.push('Possível try-catch aninhado desnecessário');
        }
        break;

      case 'remove-console-log':
        // Verificar se o console.log foi comentado corretamente
        if (
          fixedCode.includes('console.log(') &&
          !fixedCode.includes('// console.log(')
        ) {
          result.warnings.push(
            'Console.log pode não ter sido comentado corretamente',
          );
        }
        break;

      case 'fix-dangerous-html':
        // Verificar se o innerHTML foi substituído corretamente
        if (
          fixedCode.includes('innerHTML') &&
          !fixedCode.includes('textContent')
        ) {
          result.warnings.push(
            'innerHTML pode não ter sido substituído corretamente',
          );
        }
        break;
    }

    // Verificação geral: o código não deve ter ficado significativamente maior
    const sizeDiff = fixedCode.length - originalCode.length;
    if (sizeDiff > originalCode.length * 0.5) {
      // Mais de 50% de aumento
      result.warnings.push(
        `Código aumentou significativamente (${sizeDiff} caracteres)`,
      );
    }
  } catch (error) {
    result.errors.push(
      `Erro na validação da correção: ${error instanceof Error ? error.message : String(error)}`,
    );
    result.isValid = false;
  }

  return result;
}

/**
 * Valida se é seguro aplicar uma correção específica usando heurísticas dos detectores
 */
export function isSafeToApplyFix(
  code: string,
  fixId: string,
  match: RegExpMatchArray,
): boolean {
  try {
    // Verificações gerais de segurança

    // 1. Não aplicar em arquivos muito pequenos (possivelmente incompletos)
    if (code.length < 100) {
      return false;
    }

    // 2. Não aplicar se o código tem muitos erros de sintaxe
    const validation = validateJavaScriptSyntax(code);
    if (validation.errors.length > 3) {
      return false;
    }

    // 3. Verificações específicas baseadas nos detectores existentes
    switch (fixId) {
      case 'wrap-async-with-try-catch':
        // Usar lógica similar ao detector-seguranca.ts para async/await
        const lines = code.split('\n');
        const matchLine = match.index
          ? code.substring(0, match.index).split('\n').length - 1
          : 0;

        // Verificar contexto (mesma lógica do detector de segurança)
        const contextLines = lines.slice(
          Math.max(0, matchLine - 5),
          Math.min(lines.length, matchLine + 5),
        );
        const context = contextLines.join(' ');

        // Não aplicar se já tem tratamento de erro próximo
        if (
          context.includes('try') ||
          context.includes('catch') ||
          context.includes('.catch')
        ) {
          return false;
        }

        // Não aplicar se está em Promise.allSettled (tratamento próprio)
        if (context.includes('Promise.allSettled')) {
          return false;
        }
        break;

      case 'remove-console-log':
        // Usar contexto similar aos detectores para verificar se é debug legítimo
        const beforeMatch = code.substring(
          Math.max(0, (match.index || 0) - 200),
          match.index || 0,
        );

        // Não remover se está em contexto de desenvolvimento/debug
        if (
          beforeMatch.includes('debug') ||
          beforeMatch.includes('DEV_MODE') ||
          beforeMatch.includes('VERBOSE')
        ) {
          return false;
        }
        break;
    }

    return true;
  } catch (error) {
    log.aviso(
      `⚠️ Erro ao validar segurança da correção ${fixId}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}
