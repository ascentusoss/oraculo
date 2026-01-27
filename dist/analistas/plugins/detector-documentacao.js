import { DetectorAgregadosMessages } from '../../core/messages/analistas/detector-agregados-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { filtrarOcorrenciasSuprimidas } from '../../shared/helpers/suppressao.js';
import { criarOcorrencia } from '../../types/index.js';
export const analistaDocumentacao = {
    nome: 'documentacao',
    categoria: 'manutenibilidade',
    descricao: 'Detecta problemas de documentação e legibilidade do código',
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
            detectarPadroesDocumentacao(src, problemas, relPath);
            if (ast) {
                detectarProblemasDocumentacaoAST(ast, problemas);
            }
            const ocorrencias = [];
            const porPrioridade = agruparPorPrioridade(problemas);
            for (const [prioridade, items] of Object.entries(porPrioridade)) {
                if (items.length > 0) {
                    const nivel = mapearPrioridadeParaNivel(prioridade);
                    const nivelAjustado = (contextoArquivo.isTest || contextoArquivo.isConfig) &&
                        nivel === 'aviso'
                        ? 'info'
                        : nivel;
                    const resumo = items
                        .slice(0, 3)
                        .map((p) => p.tipo)
                        .join(', ');
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'problema-documentacao',
                        nivel: nivelAjustado,
                        mensagem: DetectorAgregadosMessages.problemasDocumentacaoResumo(prioridade, resumo, items.length),
                        relPath,
                        linha: items[0].linha,
                    }));
                }
            }
            return filtrarOcorrenciasSuprimidas(ocorrencias, 'documentacao', src);
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'ERRO_ANALISE',
                    nivel: 'aviso',
                    mensagem: DetectorAgregadosMessages.erroAnalisarDocumentacao(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function detectarPadroesDocumentacao(src, problemas, relPath) {
    const linhas = src.split('\n');
    const isLibraryFile = relPath.includes('src/shared/') ||
        relPath.includes('src/core/') ||
        relPath.includes('lib/');
    const isInternalFile = relPath.includes('/cli/') ||
        relPath.includes('/test') ||
        relPath.includes('/spec') ||
        relPath.includes('/__tests__/') ||
        relPath.includes('/fixtures/') ||
        relPath.includes('/mocks/') ||
        relPath.includes('config.') ||
        relPath.includes('setup.');
    let temExportacaoPublica = false;
    let temJSDoc = false;
    let dentroDeJSDoc = false;
    linhas.forEach((linha, index) => {
        const numeroLinha = index + 1;
        if (/\/\*\*/.test(linha)) {
            temJSDoc = true;
            dentroDeJSDoc = true;
        }
        const linhaJSDoc = dentroDeJSDoc || /^\s*\*/.test(linha);
        if (linhaJSDoc) {
            if (/\*\//.test(linha)) {
                dentroDeJSDoc = false;
            }
            return;
        }
        if (/^export\s+(function|class|const|let|var|default)/.test(linha.trim())) {
            temExportacaoPublica = true;
        }
        const singleLetterMatch = /\b(const|let|var)\s+([a-z])\s*=/.exec(linha);
        if (singleLetterMatch &&
            !/for\s*\(/.test(linha) &&
            !/while\s*\(/.test(linha)) {
            const varName = singleLetterMatch[2];
            const isLoopContext = /\b(i|j|k)\s*=\s*\d+/.test(linha) || /\b(i|j|k)\s*[+\-]=/.test(linha);
            const isTypeCast = /as\s+\w+/.test(linha) || /:\s*\w+\s*=/.test(linha);
            if (!isLoopContext && !isTypeCast) {
                problemas.push({
                    tipo: 'poor-naming',
                    descricao: `Variável '${varName}' com nome de uma letra dificulta compreensão`,
                    prioridade: 'media',
                    linha: numeroLinha,
                    coluna: linha.indexOf(singleLetterMatch[0]) + 1,
                    contexto: linha.trim(),
                    sugestao: 'Use nomes descritivos para variáveis',
                });
            }
        }
        const numMagico = /\b(\d{2,})\b/.exec(linha);
        if (numMagico &&
            !/(length|size|count)\s*[=><!]/.test(linha) &&
            !/\[\s*\d+\s*\]/.test(linha) &&
            parseInt(numMagico[1]) > 10) {
            problemas.push({
                tipo: 'magic-constants',
                descricao: `Número mágico ${numMagico[1]} sem explicação`,
                prioridade: 'baixa',
                linha: numeroLinha,
                coluna: linha.indexOf(numMagico[0]) + 1,
                contexto: linha.trim(),
                sugestao: 'Extraia para constante nomeada com comentário',
            });
        }
        if (/TODO.*\d{4}/.test(linha)) {
            const ano = /TODO.*(\d{4})/.exec(linha)?.[1];
            const anoAtual = new Date().getFullYear();
            if (ano && anoAtual - parseInt(ano) > 1) {
                problemas.push({
                    tipo: 'outdated-comments',
                    descricao: `TODO de ${ano} pode estar desatualizado`,
                    prioridade: 'baixa',
                    linha: numeroLinha,
                    coluna: linha.indexOf('TODO') + 1,
                    contexto: linha.trim(),
                    sugestao: 'Revisar e atualizar ou implementar TODO antigo',
                });
            }
        }
        if (/:\s*any\b/.test(linha) && !/\/\/|\/\*/.test(linha)) {
            const anyMatch = /:\s*any\b/.exec(linha);
            if (anyMatch) {
                const position = anyMatch.index;
                const before = linha.substring(0, position);
                const singleQuotes = (before.match(/'/g) || []).length;
                const doubleQuotes = (before.match(/"/g) || []).length;
                const backticks = (before.match(/`/g) || []).length;
                const dentroDeString = singleQuotes % 2 !== 0 ||
                    doubleQuotes % 2 !== 0 ||
                    backticks % 2 !== 0;
                if (!dentroDeString) {
                    problemas.push({
                        tipo: 'missing-types',
                        descricao: 'Tipo any sem justificativa via comentário',
                        prioridade: 'media',
                        linha: numeroLinha,
                        coluna: position + 1,
                        contexto: linha.trim(),
                        sugestao: 'Adicione comentário explicando uso de any ou use tipo mais específico',
                    });
                }
            }
        }
    });
    if (isLibraryFile &&
        temExportacaoPublica &&
        !temJSDoc &&
        !isInternalFile &&
        src.length > 200) {
        problemas.push({
            tipo: 'missing-jsdoc',
            descricao: 'Arquivo de biblioteca pública sem documentação',
            prioridade: 'media',
            linha: 1,
            coluna: 1,
            contexto: 'Arquivo de biblioteca',
            sugestao: 'Considere adicionar JSDoc para APIs públicas (funções/classes exportadas principais)',
        });
    }
}
function detectarProblemasDocumentacaoAST(ast, problemas) {
    try {
        ast.traverse({
            ExportDefaultDeclaration(path) {
                if ((path.node.declaration.type === 'FunctionDeclaration' ||
                    path.node.declaration.type === 'ClassDeclaration') &&
                    !path.node.leadingComments?.some((c) => c.value.startsWith('*'))) {
                    problemas.push({
                        tipo: 'missing-jsdoc',
                        descricao: 'Export default (principal) sem JSDoc',
                        prioridade: 'media',
                        linha: path.node.loc?.start.line || 0,
                        coluna: path.node.loc?.start.column || 0,
                        contexto: 'Export default',
                        sugestao: 'Documente a API principal do módulo para facilitar uso',
                    });
                }
            },
            ClassDeclaration(path) {
                const node = path.node;
                if (node.body.body.length > 3 &&
                    !node.leadingComments?.some((c) => c.value.startsWith('*')) &&
                    node.id?.name &&
                    !node.id.name.toLowerCase().includes('test') &&
                    !node.id.name.toLowerCase().includes('mock')) {
                    const parent = path.parent;
                    const isExported = parent.type === 'ExportNamedDeclaration' ||
                        parent.type === 'ExportDefaultDeclaration';
                    if (isExported) {
                        problemas.push({
                            tipo: 'missing-jsdoc',
                            descricao: `Classe pública ${node.id.name} (${node.body.body.length} membros) sem documentação`,
                            prioridade: 'media',
                            linha: node.loc?.start.line || 0,
                            coluna: node.loc?.start.column || 0,
                            contexto: 'ClassDeclaration',
                            sugestao: 'Documente o propósito e principais responsabilidades da classe',
                        });
                    }
                }
            },
        });
    }
    catch {
    }
}
function agruparPorPrioridade(problemas) {
    return problemas.reduce((acc, problema) => {
        const prioridade = problema.prioridade;
        if (prioridade) {
            if (!acc[prioridade]) {
                acc[prioridade] = [];
            }
            acc[prioridade].push(problema);
        }
        return acc;
    }, {});
}
function mapearPrioridadeParaNivel(prioridade) {
    switch (prioridade) {
        case 'alta':
            return 'aviso';
        case 'media':
            return 'aviso';
        case 'baixa':
        default:
            return 'info';
    }
}
//# sourceMappingURL=detector-documentacao.js.map