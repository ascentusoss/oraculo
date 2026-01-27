import { traverse } from '../../core/config/traverse.js';
import { DetectorAgregadosMessages } from '../../core/messages/analistas/detector-agregados-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { filtrarOcorrenciasSuprimidas } from '../../shared/helpers/suppressao.js';
import { criarOcorrencia } from '../../types/index.js';
export const analistaPerformance = {
    nome: 'performance',
    categoria: 'performance',
    descricao: 'Detecta problemas de performance e otimizações possíveis',
    test: (relPath) => {
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
    },
    aplicar: (src, relPath, ast) => {
        if (!src)
            return [];
        const contextoArquivo = detectarContextoProjeto({
            arquivo: relPath,
            conteudo: src,
            relPath,
        });
        const problemas = [];
        try {
            detectarPadroesPerformance(src, problemas, relPath);
            if (ast) {
                detectarProblemasPerformanceAST(ast, problemas, relPath);
            }
            const ocorrencias = [];
            const porImpacto = agruparPorImpacto(problemas);
            for (const [impacto, items] of Object.entries(porImpacto)) {
                if (items.length > 0) {
                    const nivel = mapearImpactoParaNivel(impacto);
                    const nivelAjustado = contextoArquivo.isTest && nivel === 'aviso' ? 'info' : nivel;
                    const resumo = items
                        .slice(0, 3)
                        .map((p) => p.tipo)
                        .join(', ');
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'PROBLEMA_PERFORMANCE',
                        nivel: nivelAjustado,
                        mensagem: DetectorAgregadosMessages.problemasPerformanceResumo(impacto, resumo, items.length),
                        relPath,
                        linha: items[0].linha,
                    }));
                }
            }
            return filtrarOcorrenciasSuprimidas(ocorrencias, 'performance', src);
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'ERRO_ANALISE',
                    nivel: 'aviso',
                    mensagem: DetectorAgregadosMessages.erroAnalisarPerformance(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function detectarPadroesPerformance(src, problemas, relPath) {
    const linhas = src.split('\n');
    let dentroLoop = 0;
    linhas.forEach((linha, index) => {
        const numeroLinha = index + 1;
        if (/\b(for|while)\s*\(/.test(linha)) {
            dentroLoop++;
            if (dentroLoop > 1) {
                problemas.push({
                    tipo: 'inefficient-loop',
                    descricao: 'Loops aninhados podem causar problemas de performance O(n²)',
                    impacto: 'alto',
                    linha: numeroLinha,
                    coluna: linha.indexOf('for') !== -1
                        ? linha.indexOf('for') + 1
                        : linha.indexOf('while') + 1,
                    sugestao: 'Considere usar Map, Set ou otimizar algoritmo para complexidade linear',
                });
            }
        }
        if (/^\s*}/.test(linha) && dentroLoop > 0) {
            dentroLoop = Math.max(0, dentroLoop - 1);
        }
        if (/\b(readFileSync|writeFileSync|execSync)\s*\(/.test(linha)) {
            problemas.push({
                tipo: 'blocking-operation',
                descricao: 'Operação síncrona pode bloquear event loop',
                impacto: 'alto',
                linha: numeroLinha,
                coluna: linha.indexOf(/readFileSync|writeFileSync|execSync/.exec(linha)?.[0] || '') + 1,
                sugestao: 'Use versões assíncronas: readFile, writeFile, exec',
            });
        }
        if (/addEventListener\s*\(/.test(linha)) {
            const srcSemComentarios = src
                .replace(/\/\/.*$/gm, '')
                .replace(/\/\*[\s\S]*?\*\//g, '');
            if (!srcSemComentarios.includes('removeEventListener') &&
                !srcSemComentarios.includes('cleanup') &&
                !srcSemComentarios.includes('destroy')) {
                problemas.push({
                    tipo: 'memory-leak',
                    descricao: 'Event listener pode causar vazamento de memória',
                    impacto: 'medio',
                    linha: numeroLinha,
                    coluna: linha.indexOf('addEventListener') + 1,
                    sugestao: 'Adicione removeEventListener em cleanup/destroy',
                });
            }
        }
        if (/\.map\s*\([^)]*\)/.test(linha) &&
            (/return\s*<|<\w+/.test(linha) ||
                relPath.includes('.tsx') ||
                relPath.includes('.jsx')) &&
            !linha.includes('key=')) {
            problemas.push({
                tipo: 'unnecessary-rerender',
                descricao: 'React map sem key prop pode causar rerenders desnecessários',
                impacto: 'medio',
                linha: numeroLinha,
                coluna: linha.indexOf('.map') + 1,
                sugestao: 'Adicione key prop única para cada elemento da lista',
            });
        }
        if (/\.forEach\s*\(.*\.(find|get|query|select)\s*\(/.test(linha)) {
            problemas.push({
                tipo: 'n-plus-one',
                descricao: 'Possível problema N+1 em consultas',
                impacto: 'alto',
                linha: numeroLinha,
                coluna: linha.indexOf('.forEach') + 1,
                sugestao: 'Use join/include ou agrupe consultas para evitar N+1',
            });
        }
        if (/import.*from\s+['"]lodash['"]|import.*from\s+['"]moment['"]/.test(linha)) {
            problemas.push({
                tipo: 'large-bundle',
                descricao: 'Import completo de biblioteca grande pode aumentar bundle',
                impacto: 'medio',
                linha: numeroLinha,
                coluna: linha.indexOf('import') + 1,
                sugestao: 'Use imports específicos: import { method } from "lodash/method"',
            });
        }
    });
}
function detectarProblemasPerformanceAST(ast, problemas, relPath) {
    try {
        traverse(ast.node, {
            ForStatement(path) {
                let parent = path.parent;
                while (parent) {
                    if (parent.type === 'ForStatement' ||
                        parent.type === 'WhileStatement' ||
                        parent.type === 'DoWhileStatement') {
                        problemas.push({
                            tipo: 'inefficient-loop',
                            descricao: 'Loop aninhado detectado via AST - pode causar performance O(n²)',
                            impacto: 'alto',
                            linha: path.node.loc?.start.line || 0,
                            coluna: path.node.loc?.start.column || 0,
                            sugestao: 'Considere restruturar algoritmo para evitar complexidade quadrática',
                        });
                        break;
                    }
                    parent = parent.parent;
                }
            },
            CallExpression(path) {
                if (path.node.callee.type === 'Identifier' &&
                    (path.node.callee.name === 'setTimeout' ||
                        path.node.callee.name === 'setInterval')) {
                    const binding = path.scope.getBinding(path.node.callee.name);
                    if (!binding)
                        return;
                    const parentFunction = path.getFunctionParent();
                    if (parentFunction &&
                        !parentFunction.toString().includes('clear') &&
                        !relPath.includes('test')) {
                        problemas.push({
                            tipo: 'memory-leak',
                            descricao: `${path.node.callee.name} sem cleanup pode causar vazamento`,
                            impacto: 'medio',
                            linha: path.node.loc?.start.line || 0,
                            coluna: path.node.loc?.start.column || 0,
                            sugestao: `Use clear${path.node.callee.name.replace('set', '')} para limpar`,
                        });
                    }
                }
            },
        });
    }
    catch {
    }
}
function agruparPorImpacto(problemas) {
    return problemas.reduce((acc, problema) => {
        const impacto = problema.impacto;
        if (impacto) {
            if (!acc[impacto]) {
                acc[impacto] = [];
            }
            acc[impacto].push(problema);
        }
        return acc;
    }, {});
}
function mapearImpactoParaNivel(impacto) {
    switch (impacto) {
        case 'alto':
            return 'aviso';
        case 'medio':
            return 'aviso';
        case 'baixo':
        default:
            return 'info';
    }
}
//# sourceMappingURL=detector-performance.js.map