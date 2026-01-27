import { config } from '../../core/config/config.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { criarAnalista, isBabelNode } from '../../types/index.js';
function isNodePath(x) {
    return (typeof x === 'object' &&
        x !== null &&
        'node' in x &&
        isBabelNode(x.node) &&
        typeof x.traverse === 'function');
}
const LIMITE_LINHAS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_LINHAS ?? 30;
const LIMITE_PARAMETROS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_PARAMETROS ?? 4;
const LIMITE_ANINHAMENTO = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_ANINHAMENTO ?? 3;
export const analistaFuncoesLongas = criarAnalista({
    aplicar(src, relPath, ast, _fullPath) {
        const contextoArquivo = detectarContextoProjeto({
            arquivo: relPath,
            conteudo: src,
            relPath,
        });
        const limitesAjustados = {
            linhas: contextoArquivo.isTest || contextoArquivo.isConfig
                ? LIMITE_LINHAS * 2
                : LIMITE_LINHAS,
            parametros: contextoArquivo.isTest
                ? LIMITE_PARAMETROS + 2
                : LIMITE_PARAMETROS,
            aninhamento: LIMITE_ANINHAMENTO,
        };
        const ocorrencias = [];
        const pushOcorrencia = (tipo, nivel, linha, mensagem) => {
            ocorrencias.push({
                tipo,
                nivel,
                relPath,
                arquivo: relPath,
                linha,
                mensagem,
                origem: 'analista-funcoes-longas',
            });
        };
        function analisar(fn, _aninhamento = 0) {
            const loc = fn.loc;
            if (!loc ||
                typeof loc.start !== 'object' ||
                typeof loc.end !== 'object' ||
                typeof loc.start.line !== 'number' ||
                typeof loc.end.line !== 'number' ||
                loc.start.line < 1 ||
                loc.end.line < loc.start.line) {
                return;
            }
            const startLine = loc.start.line;
            const endLine = loc.end.line;
            const linhas = endLine - startLine + 1;
            if (linhas > limitesAjustados.linhas) {
                pushOcorrencia('FUNCAO_LONGA', 'aviso', startLine, `Função com ${linhas} linhas (máx: ${limitesAjustados.linhas})`);
            }
            const paramsArr = fn.params;
            if (paramsArr &&
                Array.isArray(paramsArr) &&
                paramsArr.length > limitesAjustados.parametros) {
                pushOcorrencia('MUITOS_PARAMETROS', 'aviso', startLine, `Função com muitos parâmetros (${paramsArr.length}, máx: ${limitesAjustados.parametros})`);
            }
            if (_aninhamento > limitesAjustados.aninhamento) {
                pushOcorrencia('FUNCAO_ANINHADA', 'aviso', startLine, `Função aninhada em nível ${_aninhamento} (máx: ${limitesAjustados.aninhamento})`);
            }
            if (fn.leadingComments == null ||
                (Array.isArray(fn.leadingComments) && fn.leadingComments.length === 0)) {
                if (!contextoArquivo.isTest) {
                    pushOcorrencia('FUNCAO_SEM_COMENTARIO', 'info', startLine, `Função sem comentário acima.`);
                }
            }
        }
        function analisarRecursivo(path, aninhamento = 0) {
            const node = isNodePath(path) ? path.node : path;
            const type = node.type;
            if (type === 'FunctionDeclaration' ||
                type === 'FunctionExpression' ||
                type === 'ArrowFunctionExpression') {
                const fnNode = node;
                analisar(fnNode, aninhamento);
                aninhamento++;
            }
            if (isNodePath(path) && typeof path.traverse === 'function') {
                path.traverse({
                    FunctionDeclaration(p) {
                        analisarRecursivo(p, aninhamento + 1);
                    },
                    FunctionExpression(p) {
                        analisarRecursivo(p, aninhamento + 1);
                    },
                    ArrowFunctionExpression(p) {
                        analisarRecursivo(p, aninhamento + 1);
                    },
                });
            }
        }
        if (ast &&
            typeof ast.traverse === 'function') {
            analisarRecursivo(ast, 0);
            return ocorrencias;
        }
        const fileAst = ast;
        let fileNode = null;
        try {
            if (fileAst) {
                const fa = fileAst;
                if (fa && typeof fa === 'object') {
                    const maybeNode = fa.node;
                    if (maybeNode &&
                        typeof maybeNode === 'object' &&
                        Array.isArray(maybeNode.body)) {
                        fileNode = maybeNode;
                    }
                    else if (Array.isArray(fa.body)) {
                        fileNode = fileAst;
                    }
                }
            }
        }
        catch {
            fileNode = null;
        }
        if (fileNode) {
            const body = Array.isArray(fileNode.body) ? fileNode.body : [];
            for (const child of body) {
                if (child &&
                    typeof child === 'object' &&
                    (child.type === 'FunctionDeclaration' ||
                        child.type === 'FunctionExpression' ||
                        child.type === 'ArrowFunctionExpression')) {
                    analisar(child, 0);
                }
            }
            return ocorrencias;
        }
        return ocorrencias;
    },
    nome: 'analista-funcoes-longas',
    categoria: 'complexidade',
    descricao: 'Detecta funcoes muito longas, com muitos parametros, aninhamento excessivo ou sem comentario',
    limites: {
        linhas: LIMITE_LINHAS,
        params: LIMITE_PARAMETROS,
        aninhamento: LIMITE_ANINHAMENTO,
    },
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    global: false,
});
//# sourceMappingURL=analista-funcoes-longas.js.map