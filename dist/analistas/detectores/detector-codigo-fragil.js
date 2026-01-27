import { config } from '../../core/config/config.js';
import { traverse } from '../../core/config/traverse.js';
import { DetectorCodigoFragilMessages } from '../../core/messages/analistas/detector-codigo-fragil-messages.js';
import { detectarFrameworks } from '../../shared/helpers/framework-detector.js';
import { isWhitelistedConstant } from '../../shared/helpers/magic-constants-whitelist.js';
import { filtrarOcorrenciasSuprimidas } from '../../shared/helpers/suppressao.js';
import { criarOcorrencia } from '../../types/index.js';
let frameworksDetectados = null;
export const analistaCodigoFragil = {
    nome: 'codigo-fragil',
    categoria: 'qualidade',
    descricao: 'Detecta padrões de código que podem levar a problemas futuros',
    limites: {
        maxLinhasFuncao: config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_LINHAS_FUNCAO ?? 30,
        maxParametros: config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_PARAMETROS ?? 4,
        maxNestedCallbacks: config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_NESTED_CALLBACKS ?? 2,
    },
    test: (relPath) => {
        if (/\.(deprecados?|abandonados?)\//i.test(relPath) ||
            relPath.includes('.deprecados/') ||
            relPath.includes('abandonados/')) {
            return false;
        }
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
    },
    aplicar: (src, relPath, ast) => {
        if (!ast || !src) {
            return [];
        }
        const maxLinhasFuncao = config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_LINHAS_FUNCAO ?? 30;
        const maxParametros = config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_PARAMETROS ?? 4;
        const maxNestedCallbacks = config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_NESTED_CALLBACKS ?? 2;
        const fragilidades = [];
        try {
            detectarConsoleLog(src, fragilidades);
            detectarTodoComments(src, fragilidades);
            detectarProblemasAvancados(src, fragilidades);
            traverse(ast.node, {
                CatchClause(path) {
                    const body = path.node.body.body;
                    const linha = path.node.loc?.start.line || 0;
                    if (body.length === 0) {
                        fragilidades.push({
                            tipo: 'catch-vazio',
                            linha,
                            coluna: path.node.loc?.start.column || 0,
                            severidade: 'media',
                            contexto: 'Bloco catch vazio',
                        });
                    }
                    else if (body.length === 1 && isSingleConsoleLog(body[0])) {
                        fragilidades.push({
                            tipo: 'catch-apenas-log',
                            linha,
                            coluna: path.node.loc?.start.column || 0,
                            severidade: 'baixa',
                            contexto: 'Catch apenas com console.log',
                        });
                    }
                },
                TSAnyKeyword(path) {
                    fragilidades.push({
                        tipo: 'any-explicito',
                        linha: path.node.loc?.start.line || 0,
                        coluna: path.node.loc?.start.column || 0,
                        severidade: 'media',
                        contexto: 'Tipo any explícito',
                    });
                },
                FunctionDeclaration(path) {
                    const node = path.node;
                    if (node.body?.type === 'BlockStatement') {
                        const inicio = node.loc?.start.line || 0;
                        const fim = node.loc?.end.line || 0;
                        const numLinhas = fim - inicio;
                        if (numLinhas > maxLinhasFuncao) {
                            fragilidades.push({
                                tipo: 'funcao-longa',
                                linha: inicio,
                                coluna: node.loc?.start.column || 0,
                                severidade: numLinhas >
                                    Math.max(maxLinhasFuncao + 20, Math.floor(maxLinhasFuncao * 1.7))
                                    ? 'alta'
                                    : 'media',
                                contexto: `Função com ${numLinhas} linhas (máx: ${maxLinhasFuncao})`,
                            });
                        }
                    }
                    const numParams = node.params.length;
                    if (numParams > maxParametros) {
                        fragilidades.push({
                            tipo: 'muitos-parametros',
                            linha: node.loc?.start.line || 0,
                            coluna: node.loc?.start.column || 0,
                            severidade: numParams >
                                Math.max(maxParametros + 2, Math.floor(maxParametros * 1.5))
                                ? 'alta'
                                : 'media',
                            contexto: `Função com ${numParams} parâmetros (máx: ${maxParametros})`,
                        });
                    }
                },
                ArrowFunctionExpression(path) {
                    const node = path.node;
                    if (node.body?.type === 'BlockStatement') {
                        const inicio = node.loc?.start.line || 0;
                        const fim = node.loc?.end.line || 0;
                        const numLinhas = fim - inicio;
                        if (numLinhas > maxLinhasFuncao) {
                            fragilidades.push({
                                tipo: 'funcao-longa',
                                linha: inicio,
                                coluna: node.loc?.start.column || 0,
                                severidade: numLinhas >
                                    Math.max(maxLinhasFuncao + 20, Math.floor(maxLinhasFuncao * 1.7))
                                    ? 'alta'
                                    : 'media',
                                contexto: `Arrow function com ${numLinhas} linhas (máx: ${maxLinhasFuncao})`,
                            });
                        }
                    }
                },
                FunctionExpression(path) {
                    const node = path.node;
                    if (node.body?.type === 'BlockStatement') {
                        const inicio = node.loc?.start.line || 0;
                        const fim = node.loc?.end.line || 0;
                        const numLinhas = fim - inicio;
                        if (numLinhas > maxLinhasFuncao) {
                            fragilidades.push({
                                tipo: 'funcao-longa',
                                linha: inicio,
                                coluna: node.loc?.start.column || 0,
                                severidade: numLinhas >
                                    Math.max(maxLinhasFuncao + 20, Math.floor(maxLinhasFuncao * 1.7))
                                    ? 'alta'
                                    : 'media',
                                contexto: `Function expression com ${numLinhas} linhas (máx: ${maxLinhasFuncao})`,
                            });
                        }
                    }
                },
                NumericLiteral(path) {
                    const value = path.node.value;
                    if (isInVariableDeclarator(path) || isInArrayIndex(path)) {
                        return;
                    }
                    if (!frameworksDetectados) {
                        const rootDir = process.cwd();
                        const frameworks = detectarFrameworks(rootDir);
                        frameworksDetectados = frameworks.map((f) => f.name);
                    }
                    if (isWhitelistedConstant(value, frameworksDetectados)) {
                        return;
                    }
                    fragilidades.push({
                        tipo: 'magic-number',
                        linha: path.node.loc?.start.line || 0,
                        coluna: path.node.loc?.start.column || 0,
                        severidade: 'baixa',
                        contexto: `Número mágico: ${value}`,
                    });
                },
                ClassMethod(path) {
                    const node = path.node;
                    const numParams = node.params && Array.isArray(node.params) ? node.params.length : 0;
                    if (numParams > 4) {
                        fragilidades.push({
                            tipo: 'muitos-parametros',
                            linha: node.loc?.start.line || 0,
                            coluna: node.loc?.start.column || 0,
                            severidade: numParams > 6 ? 'alta' : 'media',
                            contexto: `Método com ${numParams} parâmetros`,
                        });
                    }
                },
            });
            detectarNestedCallbacks(ast, fragilidades, maxNestedCallbacks);
            const ocorrencias = [];
            const porSeveridade = agruparPorSeveridade(fragilidades);
            for (const [severidade, items] of Object.entries(porSeveridade)) {
                if (items.length > 0) {
                    const nivel = severidade === 'alta'
                        ? 'erro'
                        : severidade === 'media'
                            ? 'aviso'
                            : 'info';
                    const resumoPorTipo = items.reduce((acc, item) => {
                        acc[item.tipo] = (acc[item.tipo] || 0) + 1;
                        return acc;
                    }, {});
                    const resumo = Object.entries(resumoPorTipo)
                        .map(([tipo, count]) => `${tipo}: ${count}`)
                        .join(', ');
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'codigo-fragil',
                        nivel,
                        mensagem: DetectorCodigoFragilMessages.fragilidadesResumo(severidade, resumo, {
                            severidade,
                            total: items.length,
                            tipos: resumoPorTipo,
                            amostra: items
                                .slice(0, 3)
                                .map((f) => `${f.tipo}:L${f.linha}`),
                        }),
                        relPath,
                        linha: items[0].linha,
                    }));
                }
            }
            return filtrarOcorrenciasSuprimidas(ocorrencias, 'codigo-fragil', src);
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'ERRO_ANALISE',
                    nivel: 'aviso',
                    mensagem: DetectorCodigoFragilMessages.erroAnalisarCodigoFragil(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function detectarConsoleLog(src, fragilidades) {
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') ||
            (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/'))) {
            continue;
        }
        const consoleMatch = line.match(/console\.log\s*\(/);
        if (consoleMatch) {
            const beforeMatch = line.substring(0, consoleMatch.index);
            if (beforeMatch.includes('/*') && !beforeMatch.includes('*/')) {
                continue;
            }
            fragilidades.push({
                tipo: 'console-log',
                linha: i + 1,
                coluna: consoleMatch.index || 0,
                severidade: 'baixa',
                contexto: 'console.log encontrado',
            });
        }
    }
}
function detectarTodoComments(src, fragilidades) {
    const regex = /\/\/\s*TODO|\/\*\s*TODO/gi;
    let match;
    while ((match = regex.exec(src)) !== null) {
        const linha = src.substring(0, match.index).split('\n').length;
        fragilidades.push({
            tipo: 'todo-comment',
            linha,
            coluna: 0,
            severidade: 'baixa',
            contexto: 'Comentário TODO encontrado',
        });
    }
}
function detectarProblemasAvancados(src, fragilidades) {
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') ||
            (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/'))) {
            continue;
        }
        if (/\.then\s*\(/.test(line) && !line.includes('.catch')) {
            const nextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
            if (!nextLines.includes('.catch')) {
                fragilidades.push({
                    tipo: 'promise-sem-catch',
                    linha: i + 1,
                    coluna: line.indexOf('.then'),
                    severidade: 'media',
                    contexto: 'Promise sem tratamento de erro (.catch)',
                });
            }
        }
        if (/addEventListener\s*\(/.test(line)) {
            const eventName = line.match(/addEventListener\s*\(\s*['"`]([^'"`]+)['"`]/);
            if (eventName &&
                !src.includes(`removeEventListener`) &&
                !src.includes(`{ once: true }`) &&
                !src.includes('AbortController')) {
                fragilidades.push({
                    tipo: 'event-listener-sem-cleanup',
                    linha: i + 1,
                    coluna: line.indexOf('addEventListener'),
                    severidade: 'media',
                    contexto: `Event listener '${eventName[1]}' sem cleanup`,
                });
            }
        }
        const regexMatch = line.match(/\/([^\/\\]|\\.)+\/[gimuy]*/);
        if (regexMatch &&
            regexMatch[0].length > 50 &&
            (regexMatch[0].match(/\(/g) || []).length > 3) {
            fragilidades.push({
                tipo: 'regex-complexa',
                linha: i + 1,
                coluna: line.indexOf(regexMatch[0]),
                severidade: 'media',
                contexto: 'Regex complexa - considere quebrar em partes menores',
            });
        }
        if ((/setInterval\s*\(/.test(line) || /setTimeout\s*\(/.test(line)) &&
            !src.includes('clear') &&
            !line.includes('once')) {
            fragilidades.push({
                tipo: 'memory-leak-potential',
                linha: i + 1,
                coluna: line.search(/setInterval|setTimeout/),
                severidade: 'media',
                contexto: 'Potencial vazamento: timer sem cleanup',
            });
        }
    }
    detectarComplexidadeCognitiva(src, fragilidades);
}
function detectarComplexidadeCognitiva(src, fragilidades) {
    const lines = src.split('\n');
    let complexityScore = 0;
    let currentFunction = '';
    let functionStartLine = 0;
    let nestingLevel = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (/^(function|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=).*=>|^function\s+\w+|^async\s+function/.test(trimmedLine)) {
            if (complexityScore > 15) {
                fragilidades.push({
                    tipo: 'cognitive-complexity',
                    linha: functionStartLine,
                    coluna: 0,
                    severidade: 'alta',
                    contexto: `Função '${currentFunction}' com complexidade cognitiva crítica (${complexityScore})`,
                });
            }
            complexityScore = 1;
            currentFunction = `${trimmedLine.substring(0, 30)}...`;
            functionStartLine = i + 1;
            nestingLevel = 0;
        }
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        nestingLevel += openBraces - closeBraces;
        const controlStructures = /(if|else if|while|for|switch|case|catch|&&|\|\||\?|:)/.test(trimmedLine);
        if (controlStructures) {
            complexityScore += Math.max(1, nestingLevel);
        }
        if (/\.then|\.catch|callback|setTimeout|setInterval|async\s*\(/.test(trimmedLine)) {
            complexityScore += 2;
        }
        if (/\?\s*.*\?\s*.*:/.test(trimmedLine)) {
            complexityScore += 3;
        }
        if (/try\s*\{|catch\s*\(/.test(trimmedLine)) {
            complexityScore += 2;
        }
    }
    if (complexityScore > 15) {
        fragilidades.push({
            tipo: 'cognitive-complexity',
            linha: functionStartLine,
            coluna: 0,
            severidade: 'alta',
            contexto: `Função '${currentFunction}' com complexidade cognitiva crítica (${complexityScore})`,
        });
    }
}
function detectarNestedCallbacks(ast, fragilidades, limite) {
    const lim = Number.isFinite(limite) && limite >= 0 ? limite : 2;
    traverse(ast.node, {
        CallExpression(path) {
            const profundidade = calcularProfundidadeCallback(path);
            if (profundidade > lim) {
                fragilidades.push({
                    tipo: 'nested-callbacks',
                    linha: path.node.loc?.start.line || 0,
                    coluna: path.node.loc?.start.column || 0,
                    severidade: profundidade > lim + 1 ? 'alta' : 'media',
                    contexto: `Callbacks aninhados (nível ${profundidade}, máx: ${lim})`,
                });
            }
        },
    });
}
function calcularProfundidadeCallback(path) {
    let profundidade = 0;
    let current = path;
    while (current) {
        if (current.isCallExpression() && hasCallbackArgument(current)) {
            profundidade++;
        }
        current = current.parentPath;
    }
    return profundidade;
}
function hasCallbackArgument(path) {
    if (!path.isCallExpression())
        return false;
    return path.node.arguments.some((arg) => arg.type === 'ArrowFunctionExpression' ||
        arg.type === 'FunctionExpression');
}
function isSingleConsoleLog(stmt) {
    return (stmt.type === 'ExpressionStatement' &&
        stmt.expression?.type === 'CallExpression' &&
        stmt.expression.callee?.type === 'MemberExpression' &&
        stmt.expression.callee.object?.type === 'Identifier' &&
        stmt.expression.callee.object.name === 'console');
}
function isInVariableDeclarator(path) {
    return path.findParent((p) => p.isVariableDeclarator()) !== null;
}
function isInArrayIndex(path) {
    return (path.findParent((p) => p.isMemberExpression() && p.node.computed) !== null);
}
function agruparPorSeveridade(fragilidades) {
    return fragilidades.reduce((acc, frag) => {
        const sev = frag.severidade || 'media';
        if (!acc[sev]) {
            acc[sev] = [];
        }
        acc[sev].push(frag);
        return acc;
    }, {});
}
//# sourceMappingURL=detector-codigo-fragil.js.map