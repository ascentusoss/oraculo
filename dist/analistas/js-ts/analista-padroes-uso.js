import * as t from '/types';
import { traverse } from '../../core/config/traverse.js';
import { PadroesUsoMessages } from '../../core/messages/analistas/analista-padroes-uso-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { garantirArray, incrementar, } from '../../shared/helpers/helpers-analistas.js';
import { criarOcorrencia, ocorrenciaErroAnalista } from '../../types/index.js';
export const estatisticasUsoGlobal = {
    requires: {},
    consts: {},
    exports: {},
    vars: {},
    lets: {},
    evals: {},
    withs: {},
};
export const analistaPadroesUso = {
    nome: 'analista-padroes-uso',
    global: false,
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    aplicar: (src, relPath, astInput, _fullPath, contexto) => {
        const contextoArquivo = detectarContextoProjeto({
            arquivo: relPath,
            conteudo: src,
            relPath,
        });
        if (contextoArquivo.isTest ||
            contextoArquivo.isConfig ||
            contextoArquivo.frameworks.includes('types')) {
            return null;
        }
        const ocorrencias = [];
        const push = (data) => {
            ocorrencias.push(criarOcorrencia({
                nivel: data.nivel,
                origem: data.origem,
                tipo: data.tipo,
                mensagem: data.mensagem,
                relPath: data.arquivo || data.relPath,
                linha: data.linha,
                coluna: data.coluna,
            }));
        };
        const statsFlag = estatisticasUsoGlobal;
        if (!statsFlag.___RESET_DONE___) {
            estatisticasUsoGlobal.requires = {};
            estatisticasUsoGlobal.consts = {};
            estatisticasUsoGlobal.exports = {};
            estatisticasUsoGlobal.vars = {};
            estatisticasUsoGlobal.lets = {};
            estatisticasUsoGlobal.evals = {};
            estatisticasUsoGlobal.withs = {};
            statsFlag.___RESET_DONE___ = true;
        }
        let astWrap = astInput;
        if (!astWrap && contexto?.arquivos) {
            const found = contexto.arquivos.find((f) => f.relPath === relPath) || contexto.arquivos[0];
            astWrap =
                found?.ast || undefined;
        }
        const hasNodeProp = (v) => typeof v === 'object' &&
            v !== null &&
            'node' in v;
        const ast = (astWrap &&
            (hasNodeProp(astWrap) ? astWrap.node : astWrap));
        if (!ast || typeof ast !== 'object')
            return null;
        const tipo = ast.type;
        if (tipo !== 'File' && tipo !== 'Program')
            return null;
        try {
            traverse(ast, {
                enter(path) {
                    const node = path.node;
                    if (t.isVariableDeclaration(node) && node.kind === 'var') {
                        incrementar(estatisticasUsoGlobal.vars, relPath);
                        const nivel = contextoArquivo.isTest ? 'info' : 'aviso';
                        push({
                            tipo: 'alerta',
                            nivel,
                            mensagem: PadroesUsoMessages.varUsage,
                            relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if (t.isVariableDeclaration(node) && node.kind === 'let') {
                        incrementar(estatisticasUsoGlobal.lets, relPath);
                        if (!contextoArquivo.isTest) {
                            push({
                                tipo: 'info',
                                mensagem: PadroesUsoMessages.letUsage,
                                relPath,
                                linha: node.loc?.start.line,
                                coluna: node.loc?.start.column,
                            });
                        }
                    }
                    if (t.isVariableDeclaration(node) && node.kind === 'const') {
                        incrementar(estatisticasUsoGlobal.consts, relPath);
                    }
                    if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
                        const nome = node.callee.name;
                        if (nome === 'require') {
                            incrementar(estatisticasUsoGlobal.requires, relPath);
                            if (relPath.endsWith('.ts') && !contextoArquivo.isTest) {
                                push({
                                    tipo: 'alerta',
                                    mensagem: PadroesUsoMessages.requireInTs,
                                    relPath,
                                    linha: node.loc?.start.line,
                                    coluna: node.loc?.start.column,
                                });
                            }
                        }
                        if (nome === 'eval') {
                            incrementar(estatisticasUsoGlobal.evals, relPath);
                            push({
                                tipo: 'critico',
                                mensagem: PadroesUsoMessages.evalUsage,
                                relPath,
                                linha: node.loc?.start.line,
                                coluna: node.loc?.start.column,
                            });
                        }
                    }
                    if (t.isExportNamedDeclaration(node) ||
                        t.isExportDefaultDeclaration(node)) {
                        incrementar(estatisticasUsoGlobal.exports, relPath);
                    }
                    if (t.isAssignmentExpression(node) &&
                        t.isMemberExpression(node.left) &&
                        ((t.isIdentifier(node.left.object) &&
                            node.left.object.name === 'module' &&
                            t.isIdentifier(node.left.property) &&
                            node.left.property.name === 'exports') ||
                            (t.isIdentifier(node.left.object) &&
                                node.left.object.name === 'exports')) &&
                        relPath.endsWith('.ts')) {
                        push({
                            tipo: 'alerta',
                            mensagem: PadroesUsoMessages.moduleExportsInTs,
                            relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if (t.isWithStatement(node)) {
                        incrementar(estatisticasUsoGlobal.withs, relPath);
                        push({
                            tipo: 'critico',
                            mensagem: PadroesUsoMessages.withUsage,
                            relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if ((t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) &&
                        !node.id &&
                        !t.isArrowFunctionExpression(node) &&
                        !contextoArquivo.isTest) {
                        push({
                            tipo: 'info',
                            mensagem: PadroesUsoMessages.anonymousFunction,
                            relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if ((node.type === 'ClassProperty' ||
                        node.type === 'PropertyDefinition') &&
                        'value' in node &&
                        t.isArrowFunctionExpression(node.value) &&
                        !contextoArquivo.isTest) {
                        push({
                            tipo: 'info',
                            mensagem: PadroesUsoMessages.arrowAsClassMethod,
                            relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                },
            });
        }
        catch (e) {
            ocorrencias.push(ocorrenciaErroAnalista({
                mensagem: PadroesUsoMessages.erroAnalise(relPath, e.message),
                relPath,
                origem: 'analista-padroes-uso',
            }));
        }
        return garantirArray(ocorrencias);
    },
};
//# sourceMappingURL=analista-padroes-uso.js.map