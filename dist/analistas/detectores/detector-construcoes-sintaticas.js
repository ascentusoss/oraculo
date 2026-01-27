import { traverse } from '../../core/config/traverse.js';
import { DetectorConstrucoesSintaticasMessages } from '../../core/messages/analistas/detector-construcoes-sintaticas-messages.js';
import { criarOcorrencia, } from '../../types/index.js';
export const analistaConstrucoesSintaticas = {
    nome: 'construcoes-sintaticas',
    categoria: 'estrutura',
    descricao: 'Identifica e cataloga construções sintáticas do JavaScript/TypeScript',
    test: (relPath) => {
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
    },
    aplicar: (src, relPath, ast) => {
        if (!ast || !src) {
            return [];
        }
        const construcoes = new Map();
        const detalhes = [];
        try {
            traverse(ast.node, {
                VariableDeclaration(path) {
                    const kind = path.node.kind;
                    incrementarContagem(construcoes, kind);
                    for (const declarator of path.node.declarations) {
                        if (declarator.id?.type === 'Identifier') {
                            detalhes.push({
                                tipo: kind,
                                nome: declarator.id.name,
                                contexto: extrairContexto(path),
                                linha: path.node.loc?.start.line || 1,
                                coluna: path.node.loc?.start.column || 0,
                                codigo: src.slice(path.node.start || 0, path.node.end || 0),
                            });
                        }
                    }
                },
                FunctionDeclaration(path) {
                    incrementarContagem(construcoes, 'function');
                    detalhes.push({
                        tipo: 'function',
                        nome: path.node.id?.name || 'anonymous',
                        contexto: path.node.async ? 'async' : 'sync',
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                    if (path.node.async) {
                        incrementarContagem(construcoes, 'async');
                    }
                },
                ArrowFunctionExpression(path) {
                    incrementarContagem(construcoes, 'arrow');
                    detalhes.push({
                        tipo: 'arrow',
                        contexto: path.node.async ? 'async' : 'sync',
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                    if (path.node.async) {
                        incrementarContagem(construcoes, 'async');
                    }
                },
                AwaitExpression() {
                    incrementarContagem(construcoes, 'await');
                },
                ClassDeclaration(path) {
                    incrementarContagem(construcoes, 'class');
                    detalhes.push({
                        tipo: 'class',
                        nome: path.node.id?.name || 'anonymous',
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                },
                ImportDeclaration(path) {
                    incrementarContagem(construcoes, 'import');
                    detalhes.push({
                        tipo: 'import',
                        nome: path.node.source.value,
                        contexto: `${path.node.specifiers.length.toString()} imports`,
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                },
                ExportNamedDeclaration() {
                    incrementarContagem(construcoes, 'export');
                },
                ExportDefaultDeclaration() {
                    incrementarContagem(construcoes, 'export');
                },
                NewExpression(path) {
                    if (path.node.callee.type === 'Identifier' &&
                        path.node.callee.name === 'Promise') {
                        incrementarContagem(construcoes, 'promise');
                    }
                },
                TSInterfaceDeclaration(path) {
                    incrementarContagem(construcoes, 'interface');
                    detalhes.push({
                        tipo: 'interface',
                        nome: path.node.id.name,
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                },
                TSTypeAliasDeclaration(path) {
                    incrementarContagem(construcoes, 'type');
                    detalhes.push({
                        tipo: 'type',
                        nome: path.node.id.name,
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                },
                TSEnumDeclaration(path) {
                    incrementarContagem(construcoes, 'enum');
                    detalhes.push({
                        tipo: 'enum',
                        nome: path.node.id.name,
                        linha: path.node.loc?.start.line || 1,
                        coluna: path.node.loc?.start.column || 0,
                        codigo: src.slice(path.node.start || 0, path.node.end || 0),
                    });
                },
            });
            const resumo = Array.from(construcoes.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, count]) => `${tipo}: ${count}`)
                .join(', ');
            const mensagemFinal = resumo || 'Nenhuma construção sintática específica identificada';
            return [
                criarOcorrencia({
                    tipo: 'construcoes-sintaticas',
                    nivel: 'info',
                    mensagem: DetectorConstrucoesSintaticasMessages.identificadas(mensagemFinal),
                    relPath,
                    linha: 1,
                }),
            ];
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'ERRO_ANALISE',
                    nivel: 'aviso',
                    mensagem: DetectorConstrucoesSintaticasMessages.erroAnalisar(erro),
                    relPath,
                }),
            ];
        }
    },
};
function incrementarContagem(map, key) {
    map.set(key, (map.get(key) || 0) + 1);
}
function extrairContexto(path) {
    if (path.isProgram())
        return 'global';
    if (path.getFunctionParent())
        return 'function';
    if (path.getStatementParent()?.isBlockStatement())
        return 'block';
    return 'other';
}
//# sourceMappingURL=detector-construcoes-sintaticas.js.map