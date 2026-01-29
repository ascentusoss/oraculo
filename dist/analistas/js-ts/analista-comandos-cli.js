import * as t from '/types';
import { traverse } from '../../core/config/traverse.js';
import { ComandosCliMessages } from '../../core/messages/analistas/analista-comandos-cli-messages.js';
import { detectarContextoProjeto, isRelevanteParaAnalise, } from '../../shared/contexto-projeto.js';
import { isBabelNode } from '../../types/index.js';
export function extractHandlerInfo(node) {
    if (!node || !isBabelNode(node))
        return null;
    const n = node;
    if (t.isFunctionDeclaration(n) && n.body && t.isBlockStatement(n.body)) {
        const rawParams = Array.isArray(n.params) ? n.params : [];
        const params = rawParams.filter((p) => t.isIdentifier(p));
        return {
            func: n,
            bodyBlock: n.body,
            isAnonymous: !n.id,
            params,
            totalParams: rawParams.length,
        };
    }
    if ((t.isFunctionExpression(n) || t.isArrowFunctionExpression(n)) &&
        n.body &&
        t.isBlockStatement(n.body)) {
        const rawParams = Array.isArray(n.params) ? n.params : [];
        const params = rawParams.filter((p) => t.isIdentifier(p));
        const isAnonymous = t.isFunctionExpression(n) ? !n.id : true;
        return {
            func: n,
            bodyBlock: n.body,
            isAnonymous,
            params,
            totalParams: rawParams.length,
        };
    }
    return null;
}
export const analistaComandosCli = {
    nome: 'analista-comandos-cli',
    test: (relPath) => {
        const p = relPath.replace(/\\/g, '/').toLowerCase();
        if (/(^|\/)tests?(\/)/i.test(p) ||
            /\.(test|spec)\.(ts|js|tsx|jsx)$/i.test(p))
            return false;
        return /(\.ts|\.tsx|\.js|\.jsx)$/.test(p);
    },
    aplicar(conteudo, arquivo, ast, _fullPath, _contexto) {
        const ocorrencias = [];
        const contextoProjeto = detectarContextoProjeto({
            arquivo,
            conteudo,
            relPath: arquivo,
        });
        if (!isRelevanteParaAnalise(contextoProjeto, 'comando'))
            return [];
        const comandos = [];
        const comandoNomes = [];
        let comandosInvocados = 0;
        let hasFrameworkSignal = false;
        const commandClassNames = new Set(['Command']);
        if (!ast)
            return [];
        function registrar(node, comandoNome, handler, origemFramework) {
            comandosInvocados++;
            if (comandoNome)
                comandoNomes.push(comandoNome);
            const userInfo = extractHandlerInfo(handler);
            const registro = {
                comandoNome,
                id: undefined,
                timestamp: new Date().toISOString(),
                origemFramework,
            };
            registro.handler = userInfo
                ? { ...userInfo }
                : undefined;
            registro.node = node;
            comandos.push(registro);
        }
        function extrairNomeDeCadeia(call) {
            let current = call;
            const visitados = new Set();
            while (current && !visitados.has(current)) {
                visitados.add(current);
                if (t.isCallExpression(current) &&
                    t.isMemberExpression(current.callee)) {
                    const callee = current.callee;
                    const prop = callee.property;
                    if (t.isIdentifier(prop) && prop.name === 'command') {
                        const arg0 = current.arguments && current.arguments[0];
                        if (arg0 && t.isStringLiteral(arg0))
                            return arg0.value;
                    }
                    const owner = callee.object;
                    if (t.isCallExpression(owner)) {
                        current = owner;
                        continue;
                    }
                    else if (t.isMemberExpression(owner)) {
                        current = owner.object;
                        continue;
                    }
                    else {
                        break;
                    }
                }
                else if (t.isMemberExpression(current)) {
                    current = current.object;
                    continue;
                }
                break;
            }
            return '';
        }
        traverse(ast.node, {
            enter(path) {
                const nodeAtual = path.node;
                if (t.isNewExpression(nodeAtual)) {
                    const newExpr = nodeAtual;
                    if (t.isIdentifier(newExpr.callee) &&
                        newExpr.callee.name === 'Command') {
                        hasFrameworkSignal = true;
                        let nome = '';
                        const arg0 = newExpr.arguments && newExpr.arguments[0];
                        if (arg0 && t.isStringLiteral(arg0))
                            nome = arg0.value;
                        if (comandosInvocados === 0) {
                            comandosInvocados++;
                            if (nome)
                                comandoNomes.push(nome);
                        }
                    }
                }
                if (t.isCallExpression(nodeAtual)) {
                    const call = nodeAtual;
                    const callee = call.callee;
                    if (t.isMemberExpression(callee)) {
                        const prop = callee.property;
                        if (t.isIdentifier(prop)) {
                            if ([
                                'addSlashCommand',
                                'setName',
                                'setDescription',
                                'addStringOption',
                                'addUserOption',
                                'addChannelOption',
                            ].includes(prop.name)) {
                                hasFrameworkSignal = true;
                                if (comandosInvocados === 0) {
                                    comandosInvocados++;
                                    const arg0 = call.arguments && call.arguments[0];
                                    const nome = prop.name === 'setName' && arg0 && t.isStringLiteral(arg0)
                                        ? arg0.value
                                        : 'slash-command';
                                    comandoNomes.push(nome);
                                }
                            }
                            if (['isCommand', 'isChatInputCommand', 'isAutocomplete'].includes(prop.name)) {
                                hasFrameworkSignal = true;
                                if (comandosInvocados === 0)
                                    comandosInvocados++;
                            }
                        }
                    }
                }
                if (t.isMemberExpression(nodeAtual)) {
                    const member = nodeAtual;
                    const prop = member.property;
                    if (t.isIdentifier(prop) &&
                        [
                            'commandName',
                            'options',
                            'isCommand',
                            'reply',
                            'editReply',
                            'deferReply',
                        ].includes(prop.name)) {
                        hasFrameworkSignal = true;
                        if (comandosInvocados === 0)
                            comandosInvocados++;
                    }
                }
                if (t.isCallExpression(nodeAtual)) {
                    const call = nodeAtual;
                    const callee = call.callee;
                    if (t.isMemberExpression(callee)) {
                        const propId = callee.property;
                        if (t.isIdentifier(propId) &&
                            [
                                'option',
                                'description',
                                'alias',
                                'argument',
                                'usage',
                                'help',
                            ].includes(propId.name)) {
                            hasFrameworkSignal = true;
                        }
                    }
                }
                if (t.isCallExpression(nodeAtual)) {
                    const call = nodeAtual;
                    const callee = call.callee;
                    if (t.isIdentifier(callee) &&
                        ['onCommand', 'registerCommand'].includes(callee.name)) {
                        let comandoNome = '';
                        const primeiroArg = call.arguments && call.arguments[0];
                        if (primeiroArg && t.isStringLiteral(primeiroArg))
                            comandoNome = primeiroArg.value;
                        const handler = call.arguments && call.arguments.length > 1
                            ? call.arguments[1]
                            : undefined;
                        registrar(call, comandoNome, handler, 'generico');
                        return;
                    }
                }
                if (t.isCallExpression(nodeAtual)) {
                    const call = nodeAtual;
                    const callee = call.callee;
                    if (t.isMemberExpression(callee)) {
                        const prop = callee.property;
                        if (t.isIdentifier(prop)) {
                            if (prop.name === 'action') {
                                const handler = call.arguments && call.arguments[0];
                                const nome = extrairNomeDeCadeia(call);
                                registrar(call, nome, handler, 'commander');
                                return;
                            }
                            if (prop.name === 'command') {
                                const args = call.arguments || [];
                                const nameArg = args[0];
                                let nome = '';
                                if (nameArg && t.isStringLiteral(nameArg))
                                    nome = nameArg.value;
                                let handler;
                                for (let i = args.length - 1; i >= 0; i--) {
                                    const a = args[i];
                                    if (t.isFunctionExpression(a) ||
                                        t.isArrowFunctionExpression(a)) {
                                        handler = a;
                                        break;
                                    }
                                }
                                registrar(call, nome, handler, 'multi');
                                return;
                            }
                        }
                    }
                }
                if (t.isCallExpression(nodeAtual)) {
                    const call = nodeAtual;
                    const callee = call.callee;
                    if (t.isMemberExpression(callee)) {
                        const configObject = callee.object;
                        const prop = callee.property;
                        if (t.isIdentifier(prop) &&
                            prop.name === 'command' &&
                            t.isIdentifier(configObject) &&
                            /yargs?/i.test(configObject.name)) {
                            const args = call.arguments || [];
                            let nome = '';
                            if (args[0] && t.isStringLiteral(args[0]))
                                nome = args[0].value;
                            const handlerCandidates = args.filter((a) => t.isFunctionExpression(a) ||
                                t.isArrowFunctionExpression(a));
                            const handler = handlerCandidates.at(-1);
                            registrar(call, nome, handler, 'yargs');
                            return;
                        }
                    }
                }
                if (t.isClassDeclaration(nodeAtual)) {
                    const cls = nodeAtual;
                    if (cls.superClass &&
                        t.isIdentifier(cls.superClass) &&
                        cls.superClass.name === 'Command') {
                        const className = cls.id?.name || '';
                        const bodyArray = cls.body.body;
                        const isRunMethod = (m) => {
                            if (!t.isClassMethod(m))
                                return false;
                            const km = m.key;
                            return t.isIdentifier(km) && km.name === 'run';
                        };
                        const bodyElem = Array.isArray(bodyArray)
                            ? bodyArray.find(isRunMethod)
                            : undefined;
                        if (bodyElem &&
                            t.isBlockStatement(bodyElem.body)) {
                            registrar(t.callExpression(t.identifier('oclifRun'), []), className, bodyElem, 'oclif');
                            return;
                        }
                    }
                }
                if (t.isImportDeclaration(nodeAtual)) {
                    const imp = nodeAtual;
                    if (typeof imp.source.value === 'string' &&
                        /commander/.test(imp.source.value)) {
                        for (const spec of imp.specifiers) {
                            if (t.isImportSpecifier(spec) &&
                                t.isIdentifier(spec.imported) &&
                                spec.imported.name === 'Command') {
                                if (t.isIdentifier(spec.local))
                                    commandClassNames.add(spec.local.name);
                            }
                        }
                    }
                }
                if (t.isFunctionDeclaration(nodeAtual) ||
                    t.isFunctionExpression(nodeAtual) ||
                    t.isArrowFunctionExpression(nodeAtual)) {
                    const fn = nodeAtual;
                    const body = fn.body;
                    if (body && t.isBlockStatement(body)) {
                        const createdVars = new Set();
                        for (const stmt of body.body || []) {
                            if (t.isVariableDeclaration(stmt)) {
                                const varDecl = stmt;
                                for (const d of varDecl.declarations) {
                                    const decl = d;
                                    if (decl.id &&
                                        t.isIdentifier(decl.id) &&
                                        decl.init &&
                                        t.isNewExpression(decl.init) &&
                                        t.isIdentifier(decl.init.callee) &&
                                        commandClassNames.has(decl.init.callee.name)) {
                                        createdVars.add(decl.id.name);
                                    }
                                }
                            }
                            if (t.isExpressionStatement(stmt)) {
                                const exprStmt = stmt;
                                if (t.isCallExpression(exprStmt.expression) &&
                                    t.isMemberExpression(exprStmt.expression.callee)) {
                                    const callee = exprStmt.expression.callee;
                                    const configObject = callee.object;
                                    if (t.isIdentifier(configObject) &&
                                        createdVars.has(configObject.name)) {
                                        hasFrameworkSignal = true;
                                    }
                                }
                            }
                        }
                        for (const stmt of body.body || []) {
                            if (t.isReturnStatement(stmt) &&
                                stmt.argument &&
                                t.isIdentifier(stmt.argument) &&
                                createdVars.has(stmt.argument.name)) {
                                hasFrameworkSignal = true;
                                if (comandosInvocados === 0) {
                                    comandosInvocados++;
                                }
                            }
                        }
                    }
                }
            },
        });
        if (comandosInvocados === 0 && !hasFrameworkSignal) {
            if ((contextoProjeto.isBot || contextoProjeto.isCLI) &&
                !contextoProjeto.isInfrastructure) {
                ocorrencias.push({
                    tipo: 'padrao-ausente',
                    nivel: 'info',
                    mensagem: ComandosCliMessages.padraoAusente,
                    relPath: arquivo,
                    origem: 'analista-comandos-cli',
                });
            }
        }
        const duplicados = comandoNomes.filter((item, idx) => item && comandoNomes.indexOf(item) !== idx);
        if (duplicados.length > 0) {
            ocorrencias.push({
                tipo: 'padrao-problematico',
                nivel: 'aviso',
                mensagem: ComandosCliMessages.comandosDuplicados(duplicados),
                relPath: arquivo,
                origem: 'analista-comandos-cli',
            });
        }
        for (const cmd of comandos) {
            const { comandoNome, node } = cmd;
            const handlerInfo = cmd.handler;
            let linha = 1;
            function getNumberProp(obj, prop) {
                if (typeof obj !== 'object' || obj === null)
                    return undefined;
                const o = obj;
                const v = o[prop];
                return typeof v === 'number' ? v : undefined;
            }
            function extractLineFromNode(obj) {
                if (typeof obj !== 'object' || obj === null)
                    return undefined;
                const o = obj;
                const loc = o.loc;
                if (typeof loc !== 'object' || loc === null)
                    return undefined;
                const start = loc.start;
                if (typeof start !== 'object' || start === null)
                    return undefined;
                const line = start.line;
                return typeof line === 'number' ? line : undefined;
            }
            const fromHandler = extractLineFromNode(handlerInfo);
            const fromNode = extractLineFromNode(node);
            if (typeof fromHandler === 'number')
                linha = fromHandler;
            else if (typeof fromNode === 'number')
                linha = fromNode;
            if (!handlerInfo || !handlerInfo.bodyBlock) {
                continue;
            }
            const statements = Array.isArray(handlerInfo.bodyBlock.body)
                ? handlerInfo.bodyBlock.body
                : [];
            if (handlerInfo.isAnonymous && comandoNome) {
                ocorrencias.push({
                    tipo: 'padrao-problematico',
                    nivel: 'aviso',
                    mensagem: ComandosCliMessages.handlerAnonimo(comandoNome),
                    relPath: arquivo,
                    linha,
                    origem: 'analista-comandos-cli',
                });
            }
            const paramCount = handlerInfo.totalParams ??
                (Array.isArray(handlerInfo.params) ? handlerInfo.params.length : 0);
            if (paramCount > 3) {
                ocorrencias.push({
                    tipo: 'padrao-problematico',
                    nivel: 'aviso',
                    mensagem: ComandosCliMessages.handlerMuitosParametros(comandoNome, paramCount),
                    relPath: arquivo,
                    linha,
                    origem: 'analista-comandos-cli',
                });
            }
            if (statements.length > 30) {
                ocorrencias.push({
                    tipo: 'padrao-problematico',
                    nivel: 'aviso',
                    mensagem: ComandosCliMessages.handlerMuitoLongo(comandoNome, statements.length),
                    relPath: arquivo,
                    linha,
                    origem: 'analista-comandos-cli',
                });
            }
            if (statements.length > 0) {
                const hasTryCatch = statements.some((stmt) => t.isTryStatement(stmt));
                if (!hasTryCatch) {
                    ocorrencias.push({
                        tipo: 'boa-pratica-ausente',
                        nivel: 'aviso',
                        mensagem: ComandosCliMessages.handlerSemTryCatch(comandoNome),
                        relPath: arquivo,
                        linha,
                        origem: 'analista-comandos-cli',
                    });
                }
                const bodyStart = getNumberProp(handlerInfo.bodyBlock, 'start');
                const bodyEnd = getNumberProp(handlerInfo.bodyBlock, 'end');
                const bodySlice = typeof bodyStart === 'number' && typeof bodyEnd === 'number'
                    ? conteudo.substring(bodyStart, bodyEnd)
                    : '';
                const bodySrc = bodySlice && bodySlice.length > 5 ? bodySlice : conteudo;
                const regexLog = /console\.(log|warn|error)|logger\.|ctx\.(reply|send|res|response)/;
                if (!regexLog.test(bodySrc)) {
                    if (!regexLog.test(conteudo)) {
                        ocorrencias.push({
                            tipo: 'boa-pratica-ausente',
                            nivel: 'aviso',
                            mensagem: ComandosCliMessages.handlerSemFeedback(comandoNome),
                            relPath: arquivo,
                            linha,
                            origem: 'analista-comandos-cli',
                        });
                    }
                }
            }
        }
        if (comandos.length > 1) {
            ocorrencias.push({
                tipo: 'padrao-estrutural',
                nivel: 'info',
                mensagem: ComandosCliMessages.multiplosComandos(comandos.length),
                relPath: arquivo,
                origem: 'analista-comandos-cli',
            });
        }
        return Array.isArray(ocorrencias) ? ocorrencias : [];
    },
};
//# sourceMappingURL=analista-comandos-cli.js.map