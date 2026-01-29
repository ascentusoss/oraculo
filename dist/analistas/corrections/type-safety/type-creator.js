import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildTypesFsPath } from '../../../core/config/conventions.js';
import { toKebabCase } from './context-analyzer.js';
export async function createTypeDefinition(analysis, sourceFilePath) {
    const domain = extractDomain(sourceFilePath);
    const fileName = toKebabCase(analysis.typeName);
    const typePath = buildTypesFsPath(path.posix.join(domain, `${fileName}.ts`));
    const existing = await findExistingType(analysis.typeName);
    if (existing) {
        return `/types`;
    }
    const dir = path.dirname(typePath);
    await fs.mkdir(dir, { recursive: true });
    const content = generateTypeFileContent(analysis, sourceFilePath);
    await fs.writeFile(typePath, content, 'utf-8');
    await addExportToIndex(domain, fileName);
    return `/types`;
}
export async function findExistingType(typeName) {
    try {
        const tiposDir = buildTypesFsPath('');
        const types = await scanTypesDirectory(tiposDir);
        for (const type of types) {
            if (type.name === typeName) {
                return type;
            }
        }
        return null;
    }
    catch {
        return null;
    }
}
export function isSameType(type1, type2) {
    const normalize = (str) => str.replace(/\s+/g, ' ').trim();
    return normalize(type1.definition) === normalize(type2);
}
function generateTypeFileContent(analysis, sourceFilePath) {
    const date = new Date().toISOString();
    return `// SPDX-License-Identifier: MIT
/**
 * Tipo gerado automaticamente
 * Origem: ${sourceFilePath}
 * Confiança: ${analysis.confidence}%
 * Data: ${date}
 *
 *  by oraculo fix-any-to-proper-type
 */

${analysis.typeDefinition}
`;
}
async function addExportToIndex(domain, fileName) {
    const indexPath = buildTypesFsPath(path.posix.join(domain, 'index.ts'));
    try {
        await fs.access(indexPath);
        const content = await fs.readFile(indexPath, 'utf-8');
        const exportStatement = `export * from './${fileName}.js';`;
        if (content.includes(exportStatement)) {
            return;
        }
        await fs.appendFile(indexPath, `${exportStatement}\n`, 'utf-8');
    }
    catch {
        const header = `// SPDX-License-Identifier: MIT
/**
 * Exports do domínio ${domain}
 */

`;
        const exportStatement = `export * from './${fileName}.js';\n`;
        await fs.writeFile(indexPath, header + exportStatement, 'utf-8');
    }
}
function extractDomain(filePath) {
    const match = filePath.match(/src[\\/]([\w-]+)[\\/]/);
    return match ? match[1] : 'shared';
}
async function scanTypesDirectory(dir) {
    const types = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const subTypes = await scanTypesDirectory(fullPath);
                types.push(...subTypes);
            }
            else if (entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
                const content = await fs.readFile(fullPath, 'utf-8');
                const extractedTypes = extractTypesFromFile(content, fullPath);
                types.push(...extractedTypes);
            }
        }
    }
    catch {
    }
    return types;
}
function extractTypesFromFile(content, filePath) {
    const types = [];
    const interfaceRegex = /export\s+interface\s+(\w+)\s*{([^}]*)}/g;
    const typeRegex = /export\s+type\s+(\w+)\s*=\s*([^;]+);/g;
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
        types.push({
            name: match[1],
            path: filePath,
            definition: match[0],
            isExported: true,
            domain: extractDomain(filePath),
        });
    }
    while ((match = typeRegex.exec(content)) !== null) {
        types.push({
            name: match[1],
            path: filePath,
            definition: match[0],
            isExported: true,
            domain: extractDomain(filePath),
        });
    }
    return types;
}
//# sourceMappingURL=type-creator.js.map