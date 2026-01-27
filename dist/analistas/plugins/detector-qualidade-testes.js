import { DetectorAgregadosMessages } from '../../core/messages/analistas/detector-agregados-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { criarOcorrencia } from '../../types/index.js';
export const analistaQualidadeTestes = {
    nome: 'qualidade-testes',
    categoria: 'testes',
    descricao: 'Avalia qualidade e completude dos testes automatizados',
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
            if (contextoArquivo.isTest) {
                analisarArquivoTeste(src, problemas, relPath, ast);
            }
            else {
                analisarCodigoFonte(src, problemas, relPath, ast);
            }
            const ocorrencias = [];
            const porSeveridade = agruparPorSeveridade(problemas);
            for (const [severidade, items] of Object.entries(porSeveridade)) {
                if (items.length > 0) {
                    const nivel = mapearSeveridadeParaNivel(severidade);
                    const resumo = items
                        .slice(0, 3)
                        .map((p) => p.tipo)
                        .join(', ');
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'problemas-teste',
                        nivel,
                        mensagem: DetectorAgregadosMessages.problemasTesteResumo(severidade, resumo, items.length),
                        relPath,
                        linha: items[0].linha,
                    }));
                }
            }
            return ocorrencias;
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'erro-analise',
                    nivel: 'aviso',
                    mensagem: DetectorAgregadosMessages.erroAnalisarQualidadeTestes(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function analisarArquivoTeste(src, problemas, relPath, ast) {
    const linhas = src.split('\n');
    let totalTestes = 0;
    let _testesComTimeout = 0;
    let testesComMocks = 0;
    let blocosDescribe = 0;
    linhas.forEach((linha, index) => {
        const numeroLinha = index + 1;
        if (/\b(it|test)\s*\(/.test(linha)) {
            totalTestes++;
        }
        if (/},\s*(\d{4,})\s*\)/.test(linha)) {
            const timeout = /},\s*(\d{4,})\s*\)/.exec(linha);
            if (timeout && parseInt(timeout[1]) > 30000) {
                _testesComTimeout++;
                problemas.push({
                    tipo: 'slow-test',
                    descricao: `Teste com timeout muito alto (${timeout[1]}ms)`,
                    severidade: 'media',
                    linha: numeroLinha,
                    sugestao: 'Considere otimizar o teste ou dividir em testes menores',
                });
            }
        }
        if (/\bdescribe\s*\(/.test(linha)) {
            blocosDescribe++;
        }
        if (/\b(mock|stub|spy)\s*\(/.test(linha)) {
            testesComMocks++;
        }
        if (/\b(setTimeout|setInterval|Math\.random|Date\.now)\s*\(/.test(linha)) {
            problemas.push({
                tipo: 'flaky-test',
                descricao: 'Teste usa operações não-determinísticas',
                severidade: 'alta',
                linha: numeroLinha,
                sugestao: 'Use mocks para operações temporais ou aleatórias',
            });
        }
        if (/\b(only|skip)\s*\(/.test(linha) && !/\/\//.test(linha)) {
            problemas.push({
                tipo: 'test-smells',
                descricao: 'Teste com .only ou .skip pode afetar execução',
                severidade: 'media',
                linha: numeroLinha,
                sugestao: 'Remova .only/.skip antes de commit',
            });
        }
        if (/console\.(log|info|warn|error)\s*\(/.test(linha) &&
            !/\/\//.test(linha)) {
            problemas.push({
                tipo: 'test-smells',
                descricao: 'Console.log em teste pode ser debug esquecido',
                severidade: 'baixa',
                linha: numeroLinha,
                sugestao: 'Remova logs de debug ou use biblioteca de logging adequada',
            });
        }
    });
    if (totalTestes === 0) {
        problemas.push({
            tipo: 'missing-tests',
            descricao: 'Arquivo de teste sem testes detectáveis',
            severidade: 'alta',
            linha: 1,
            sugestao: 'Adicione testes usando it() ou test()',
        });
    }
    if (totalTestes > 0 && blocosDescribe === 0) {
        problemas.push({
            tipo: 'test-smells',
            descricao: 'Testes sem organização em blocos describe',
            severidade: 'baixa',
            linha: 1,
            sugestao: 'Organize testes em blocos describe para melhor estrutura',
        });
    }
    if (testesComMocks > totalTestes * 0.8) {
        problemas.push({
            tipo: 'mock-abuse',
            descricao: 'Uso excessivo de mocks pode indicar acoplamento forte',
            severidade: 'media',
            linha: 1,
            sugestao: 'Considere refatorar código para reduzir dependências',
        });
    }
    if (ast) {
        analisarTestesComAST(ast, problemas);
    }
}
function analisarCodigoFonte(src, problemas, relPath, ast) {
    if (relPath.includes('config') ||
        relPath.includes('.config.') ||
        relPath.endsWith('.d.ts')) {
        return;
    }
    const linhas = src.split('\n');
    let temExportacaoPublica = false;
    let temFuncaoComplice = false;
    linhas.forEach((linha, _index) => {
        if (/^export\s+(function|class|const|let|var|default)/.test(linha.trim())) {
            temExportacaoPublica = true;
        }
        if (/\b(if|else|switch|for|while|try|catch)\b/.test(linha)) {
            temFuncaoComplice = true;
        }
    });
    if (temExportacaoPublica && temFuncaoComplice) {
        problemas.push({
            tipo: 'missing-tests',
            descricao: 'Arquivo com lógica complexa pode se beneficiar de testes',
            severidade: 'baixa',
            linha: 1,
            sugestao: 'Considere criar arquivo de teste correspondente',
        });
    }
    if (ast) {
        analisarCodigoFonteComAST(ast, problemas);
    }
}
function analisarTestesComAST(ast, problemas) {
    try {
        ast.traverse({
            CallExpression(path) {
                if (path.node.callee.type === 'Identifier' &&
                    (path.node.callee.name === 'it' || path.node.callee.name === 'test')) {
                    const callback = path.node.arguments[1];
                    if (callback &&
                        (callback.type === 'ArrowFunctionExpression' ||
                            callback.type === 'FunctionExpression')) {
                        if (callback.body.type === 'BlockStatement' &&
                            callback.body.body.length === 0) {
                            problemas.push({
                                tipo: 'test-smells',
                                descricao: 'Teste vazio detectado',
                                severidade: 'media',
                                linha: path.node.loc?.start.line || 0,
                                sugestao: 'Implemente o teste ou remova se não for necessário',
                            });
                        }
                    }
                }
            },
        });
    }
    catch {
    }
}
function analisarCodigoFonteComAST(ast, problemas) {
    try {
        let funcoesSemTestes = 0;
        ast.traverse({
            ExportDefaultDeclaration(path) {
                if (path.node.declaration.type === 'FunctionDeclaration') {
                    funcoesSemTestes++;
                }
            },
            ExportNamedDeclaration(path) {
                if (path.node.declaration?.type === 'FunctionDeclaration') {
                    funcoesSemTestes++;
                }
            },
        });
        if (funcoesSemTestes > 2) {
            problemas.push({
                tipo: 'missing-tests',
                descricao: `${funcoesSemTestes} funções exportadas podem precisar de testes`,
                severidade: 'media',
                linha: 1,
                sugestao: 'Considere criar testes unitários para funções exportadas',
            });
        }
    }
    catch {
    }
}
function agruparPorSeveridade(problemas) {
    return problemas.reduce((acc, problema) => {
        if (!acc[problema.severidade]) {
            acc[problema.severidade] = [];
        }
        acc[problema.severidade].push(problema);
        return acc;
    }, {});
}
function mapearSeveridadeParaNivel(severidade) {
    switch (severidade) {
        case 'alta':
            return 'aviso';
        case 'media':
            return 'aviso';
        case 'baixa':
        default:
            return 'info';
    }
}
//# sourceMappingURL=detector-qualidade-testes.js.map