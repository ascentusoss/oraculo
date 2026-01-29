// SPDX-License-Identifier: MIT
/**
 * Analisador de uso de variáveis via AST Babel
 * Detecta padrões de uso para inferir tipos corretos
 */

import type { Node } from '/types';

import type {
  ASTNode,
  PropertyUsage,
  TypeGuard,
  UsagePattern,
  VariableUsage,
} from '@';

/**
 * Encontra todos os usos de uma variável no AST
 */
export function findVariableUsages(
  varName: string,
  ast: Node | null,
): VariableUsage[] {
  const usages: VariableUsage[] = [];

  if (!ast || typeof ast !== 'object') {
    return usages;
  }

  // Traversar AST recursivamente
  traverseAST(ast, (node: ASTNode) => {
    // Identifier usage
    if (node.type === 'Identifier' && node.name === varName) {
      const usage = extractUsageFromNode(node, varName);
      if (usage) {
        usages.push(usage);
      }
    }

    // Member expression (obj.property)
    if (node.type === 'MemberExpression' && node.object?.name === varName) {
      const usage = extractMemberExpressionUsage(node, varName);
      if (usage) {
        usages.push(usage);
      }
    }

    // Call expression (func())
    if (
      node.type === 'CallExpression' &&
      node.callee?.object?.name === varName
    ) {
      const usage = extractCallExpressionUsage(node, varName);
      if (usage) {
        usages.push(usage);
      }
    }
  });

  return usages;
}

/**
 * Analisa padrões de uso para inferir tipo
 */
export function analyzeUsagePatterns(usages: VariableUsage[]): UsagePattern {
  const pattern: UsagePattern = {
    allUsagesAreString: false,
    allUsagesAreNumber: false,
    allUsagesAreBoolean: false,
    hasObjectStructure: false,
    hasTypeGuards: false,
    isFunction: false,
    isArray: false,
  };

  if (usages.length === 0) {
    return pattern;
  }

  // Detectar métodos de string
  const stringMethods = [
    'toUpperCase',
    'toLowerCase',
    'trim',
    'substring',
    'charAt',
    'indexOf',
  ];
  const stringUsages = usages.filter(
    (u) =>
      u.operation === 'call' && u.method && stringMethods.includes(u.method),
  );

  // Detectar métodos de number
  const numberOperations = usages.filter(
    (u) =>
      u.operation === 'call' &&
      (u.method === 'toFixed' ||
        u.method === 'toPrecision' ||
        u.context.includes('+') ||
        u.context.includes('-') ||
        u.context.includes('*') ||
        u.context.includes('/')),
  );

  // Detectar métodos de boolean
  const booleanUsages = usages.filter(
    (u) =>
      u.operation === 'comparison' ||
      u.context.includes('===') ||
      u.context.includes('!==') ||
      u.context.includes('&&') ||
      u.context.includes('||'),
  );

  // Detectar acesso a propriedades (objeto)
  const propertyAccesses = usages.filter(
    (u) => u.operation === 'access' && u.property,
  );

  // Detectar chamadas de função
  const functionCalls = usages.filter(
    (u) => u.operation === 'call' && !u.method,
  );

  // Detectar métodos de array
  const arrayMethods = [
    'push',
    'pop',
    'map',
    'filter',
    'reduce',
    'forEach',
    'find',
  ];
  const arrayUsages = usages.filter(
    (u) =>
      u.operation === 'call' && u.method && arrayMethods.includes(u.method),
  );

  // Análise final
  pattern.allUsagesAreString =
    stringUsages.length > 0 && stringUsages.length === usages.length;
  pattern.allUsagesAreNumber =
    numberOperations.length > 0 && numberOperations.length === usages.length;
  pattern.allUsagesAreBoolean =
    booleanUsages.length > 0 && booleanUsages.length === usages.length;
  pattern.hasObjectStructure = propertyAccesses.length > 0;
  pattern.isFunction = functionCalls.length > 0;
  pattern.isArray = arrayUsages.length > 0;

  // Extrair propriedades de objeto
  if (pattern.hasObjectStructure) {
    pattern.objectProperties = extractObjectProperties(usages);
  }

  // Detectar type guards
  const typeGuards = detectTypeGuards(usages);
  if (typeGuards.length > 0) {
    pattern.hasTypeGuards = true;
    pattern.typeGuards = typeGuards;
  }

  return pattern;
}

/**
 * Extrai propriedades de objeto baseado em acessos
 */
function extractObjectProperties(usages: VariableUsage[]): PropertyUsage[] {
  const propertiesMap = new Map<string, PropertyUsage>();

  for (const usage of usages) {
    if (usage.property) {
      const existing = propertiesMap.get(usage.property);

      if (!existing) {
        // Inferir tipo da propriedade baseado no método chamado
        let inferredType = 'unknown';
        let confidence = 50;

        if (usage.method) {
          const stringMethods = [
            'toUpperCase',
            'toLowerCase',
            'trim',
            'substring',
          ];
          const numberMethods = ['toFixed', 'toPrecision'];

          if (stringMethods.includes(usage.method)) {
            inferredType = 'string';
            confidence = 90;
          } else if (numberMethods.includes(usage.method)) {
            inferredType = 'number';
            confidence = 90;
          }
        }

        propertiesMap.set(usage.property, {
          name: usage.property,
          inferredType,
          confidence,
          isOptional: false,
          methodsCalled: usage.method ? [usage.method] : [],
        });
      } else {
        // Atualizar métodos chamados
        if (usage.method && !existing.methodsCalled?.includes(usage.method)) {
          existing.methodsCalled = [
            ...(existing.methodsCalled || []),
            usage.method,
          ];
        }
      }
    }
  }

  return Array.from(propertiesMap.values());
}

/**
 * Detecta type guards no código
 */
function detectTypeGuards(usages: VariableUsage[]): TypeGuard[] {
  const guards: TypeGuard[] = [];

  for (const usage of usages) {
    const context = usage.context.toLowerCase();

    // typeof guards
    if (context.includes('typeof')) {
      const match = context.match(/typeof\s+\w+\s*===\s*['"](\w+)['"]/);
      if (match) {
        guards.push({
          type: 'typeof',
          expression: usage.context,
          inferredType: match[1],
          confidence: 95,
        });
      }
    }

    // instanceof guards
    if (context.includes('instanceof')) {
      const match = context.match(/\w+\s+instanceof\s+(\w+)/);
      if (match) {
        guards.push({
          type: 'instanceof',
          expression: usage.context,
          inferredType: match[1],
          confidence: 95,
        });
      }
    }

    // 'in' operator guards
    if (context.includes(' in ')) {
      const match = context.match(/['"](\w+)['"]\s+in\s+\w+/);
      if (match) {
        guards.push({
          type: 'in',
          expression: usage.context,
          inferredType: `{ ${match[1]}: unknown }`,
          confidence: 80,
        });
      }
    }
  }

  return guards;
}

/**
 * Traversa AST recursivamente
 */
function traverseAST(node: unknown, visitor: (node: ASTNode) => void): void {
  if (!node || typeof node !== 'object') {
    return;
  }

  visitor(node as ASTNode);

  for (const key in node as Record<string, unknown>) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') {
      continue; // Skip location metadata
    }

    const child = (node as Record<string, unknown>)[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        traverseAST(item, visitor);
      }
    } else if (child && typeof child === 'object') {
      traverseAST(child, visitor);
    }
  }
}

/**
 * Extrai informações de uso de um nó Identifier
 */
function extractUsageFromNode(
  node: ASTNode,
  varName: string,
): VariableUsage | null {
  return {
    name: varName,
    nodeType: node.type || 'unknown',
    line: node.loc?.start?.line || 0,
    column: node.loc?.start?.column || 0,
    context: extractNodeContext(node),
    operation: 'access',
  };
}

/**
 * Extrai informações de MemberExpression
 */
function extractMemberExpressionUsage(
  node: ASTNode,
  varName: string,
): VariableUsage | null {
  const property = node.property?.name || (node.property as ASTNode)?.value;

  return {
    name: varName,
    nodeType: 'MemberExpression',
    line: node.loc?.start?.line || 0,
    column: node.loc?.start?.column || 0,
    context: extractNodeContext(node),
    operation: 'access',
    property: property ? String(property) : undefined,
  };
}

/**
 * Extrai informações de CallExpression
 */
function extractCallExpressionUsage(
  node: ASTNode,
  varName: string,
): VariableUsage | null {
  const method = node.callee?.property?.name;

  return {
    name: varName,
    nodeType: 'CallExpression',
    line: node.loc?.start?.line || 0,
    column: node.loc?.start?.column || 0,
    context: extractNodeContext(node),
    operation: 'call',
    method: method ? String(method) : undefined,
  };
}

/**
 * Extrai contexto ao redor de um nó (para análise)
 */
function extractNodeContext(node: ASTNode): string {
  // Simplificado - em produção, usar gerador de código do Babel
  if (node.type === 'Identifier') {
    return String(node.name || '');
  }

  if (node.type === 'MemberExpression') {
    const obj = node.object?.name || extractNodeContext(node.object as ASTNode);
    const prop = node.property?.name || (node.property as ASTNode)?.value;
    return `${obj}.${prop}`;
  }

  if (node.type === 'CallExpression') {
    const callee = extractNodeContext(node.callee as ASTNode);
    return `${callee}()`;
  }

  return String(node.type || '');
}
