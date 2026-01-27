export function findVariableUsages(varName, ast) {
    const usages = [];
    if (!ast || typeof ast !== 'object') {
        return usages;
    }
    traverseAST(ast, (node) => {
        if (node.type === 'Identifier' && node.name === varName) {
            const usage = extractUsageFromNode(node, varName);
            if (usage) {
                usages.push(usage);
            }
        }
        if (node.type === 'MemberExpression' && node.object?.name === varName) {
            const usage = extractMemberExpressionUsage(node, varName);
            if (usage) {
                usages.push(usage);
            }
        }
        if (node.type === 'CallExpression' &&
            node.callee?.object?.name === varName) {
            const usage = extractCallExpressionUsage(node, varName);
            if (usage) {
                usages.push(usage);
            }
        }
    });
    return usages;
}
export function analyzeUsagePatterns(usages) {
    const pattern = {
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
    const stringMethods = [
        'toUpperCase',
        'toLowerCase',
        'trim',
        'substring',
        'charAt',
        'indexOf',
    ];
    const stringUsages = usages.filter((u) => u.operation === 'call' && u.method && stringMethods.includes(u.method));
    const numberOperations = usages.filter((u) => u.operation === 'call' &&
        (u.method === 'toFixed' ||
            u.method === 'toPrecision' ||
            u.context.includes('+') ||
            u.context.includes('-') ||
            u.context.includes('*') ||
            u.context.includes('/')));
    const booleanUsages = usages.filter((u) => u.operation === 'comparison' ||
        u.context.includes('===') ||
        u.context.includes('!==') ||
        u.context.includes('&&') ||
        u.context.includes('||'));
    const propertyAccesses = usages.filter((u) => u.operation === 'access' && u.property);
    const functionCalls = usages.filter((u) => u.operation === 'call' && !u.method);
    const arrayMethods = [
        'push',
        'pop',
        'map',
        'filter',
        'reduce',
        'forEach',
        'find',
    ];
    const arrayUsages = usages.filter((u) => u.operation === 'call' && u.method && arrayMethods.includes(u.method));
    pattern.allUsagesAreString =
        stringUsages.length > 0 && stringUsages.length === usages.length;
    pattern.allUsagesAreNumber =
        numberOperations.length > 0 && numberOperations.length === usages.length;
    pattern.allUsagesAreBoolean =
        booleanUsages.length > 0 && booleanUsages.length === usages.length;
    pattern.hasObjectStructure = propertyAccesses.length > 0;
    pattern.isFunction = functionCalls.length > 0;
    pattern.isArray = arrayUsages.length > 0;
    if (pattern.hasObjectStructure) {
        pattern.objectProperties = extractObjectProperties(usages);
    }
    const typeGuards = detectTypeGuards(usages);
    if (typeGuards.length > 0) {
        pattern.hasTypeGuards = true;
        pattern.typeGuards = typeGuards;
    }
    return pattern;
}
function extractObjectProperties(usages) {
    const propertiesMap = new Map();
    for (const usage of usages) {
        if (usage.property) {
            const existing = propertiesMap.get(usage.property);
            if (!existing) {
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
                    }
                    else if (numberMethods.includes(usage.method)) {
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
            }
            else {
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
function detectTypeGuards(usages) {
    const guards = [];
    for (const usage of usages) {
        const context = usage.context.toLowerCase();
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
function traverseAST(node, visitor) {
    if (!node || typeof node !== 'object') {
        return;
    }
    visitor(node);
    for (const key in node) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') {
            continue;
        }
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                traverseAST(item, visitor);
            }
        }
        else if (child && typeof child === 'object') {
            traverseAST(child, visitor);
        }
    }
}
function extractUsageFromNode(node, varName) {
    return {
        name: varName,
        nodeType: node.type || 'unknown',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        context: extractNodeContext(node),
        operation: 'access',
    };
}
function extractMemberExpressionUsage(node, varName) {
    const property = node.property?.name || node.property?.value;
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
function extractCallExpressionUsage(node, varName) {
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
function extractNodeContext(node) {
    if (node.type === 'Identifier') {
        return String(node.name || '');
    }
    if (node.type === 'MemberExpression') {
        const obj = node.object?.name || extractNodeContext(node.object);
        const prop = node.property?.name || node.property?.value;
        return `${obj}.${prop}`;
    }
    if (node.type === 'CallExpression') {
        const callee = extractNodeContext(node.callee);
        return `${callee}()`;
    }
    return String(node.type || '');
}
//# sourceMappingURL=usage-analyzer.js.map