import { TodoCommentsMessages } from '../../core/messages/analistas/analista-todo-comments-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { criarOcorrencia } from '../../types/index.js';
void detectarContextoProjeto;
export const analistaTodoComments = {
    nome: 'todo-comments',
    categoria: 'qualidade',
    descricao: 'Detecta comentários TODO deixados no código (apenas em comentários).',
    global: false,
    test(relPath) {
        const contextoArquivo = detectarContextoProjeto({
            arquivo: relPath,
            conteudo: '',
            relPath,
        });
        if (contextoArquivo.isTest ||
            contextoArquivo.isConfig ||
            contextoArquivo.frameworks.includes('types')) {
            return false;
        }
        if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath))
            return false;
        return /\.(ts|js|tsx|jsx)$/i.test(relPath);
    },
    aplicar(src, relPath, ast) {
        const contextoArquivo = detectarContextoProjeto({
            arquivo: relPath,
            conteudo: src,
            relPath,
        });
        const nivelTodo = contextoArquivo.isLibrary ? 'aviso' : 'info';
        const RE_TODO_START = /^TODO\b/i;
        const RE_TODO_ANY = /\bTODO\b\s*[:\-(\[]/i;
        const isJSDocTemplate = (linha, _linhaAnterior) => {
            const templatePatterns = [
                /\*\s*TODO:\s*Adicionar descrição da função\s*$/i,
                /\*\s*@param\s+\{[^}]*\}\s+\w+\s*-\s*TODO:\s*Descrever parâmetro\s*$/i,
                /\*\s*@returns\s+\{[^}]*\}\s*TODO:\s*Descrever retorno\s*$/i,
            ];
            return templatePatterns.some((pattern) => pattern.test(linha));
        };
        const isTodoComment = (texto, linhaCompleta, linhaAnterior) => {
            const t = String(texto ?? '').trim();
            const isTodo = RE_TODO_START.test(t) || RE_TODO_ANY.test(t);
            if (isTodo &&
                linhaCompleta &&
                isJSDocTemplate(linhaCompleta, linhaAnterior)) {
                return false;
            }
            return isTodo;
        };
        const localizarMarcadores = (linha) => {
            let inS = false;
            let inD = false;
            let inB = false;
            let prev = '';
            for (let i = 0; i < linha.length; i++) {
                const ch = linha[i];
                const pair = prev + ch;
                if (!inD && !inB && ch === "'" && prev !== '\\')
                    inS = !inS;
                else if (!inS && !inB && ch === '"' && prev !== '\\')
                    inD = !inD;
                else if (!inS && !inD && ch === '`' && prev !== '\\')
                    inB = !inB;
                if (!inS && !inD && !inB) {
                    if (pair === '//') {
                        return { lineIdx: i - 1, blockIdx: -1 };
                    }
                    if (pair === '/*') {
                        return { lineIdx: -1, blockIdx: i - 1 };
                    }
                }
                prev = ch;
            }
            return { lineIdx: -1, blockIdx: -1 };
        };
        if (!src || typeof src !== 'string')
            return null;
        if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath))
            return null;
        if (ast && ast.node) {
            const maybeWithComments = ast.node;
            if (Array.isArray(maybeWithComments.comments)) {
                const comments = maybeWithComments.comments;
                const ocorrencias = comments
                    .filter((c) => {
                    const texto = String(c.value ?? '').trim();
                    return isTodoComment(texto);
                })
                    .map((c) => criarOcorrencia({
                    tipo: 'TODO-pendente',
                    mensagem: TodoCommentsMessages.todoFound,
                    nivel: nivelTodo,
                    relPath,
                    linha: c.loc?.start.line,
                    origem: 'todo-comments',
                }));
                return ocorrencias.length ? ocorrencias : null;
            }
        }
        const linhas = src.split(/\r?\n/);
        const ocorrenciasLinhas = [];
        let emBloco = false;
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i];
            let analisada = false;
            if (emBloco) {
                analisada = true;
                const linhaAnterior = i > 0 ? linhas[i - 1] : undefined;
                if (isTodoComment(linha, linha, linhaAnterior)) {
                    ocorrenciasLinhas.push(i + 1);
                }
                if (linha.includes('*/')) {
                    emBloco = false;
                }
            }
            if (!analisada) {
                const { blockIdx: idxBlockStart, lineIdx: idxLine } = localizarMarcadores(linha);
                if (idxLine >= 0 && (idxBlockStart === -1 || idxLine < idxBlockStart)) {
                    const trechoComentario = linha.slice(idxLine + 2);
                    const linhaAnterior = i > 0 ? linhas[i - 1] : undefined;
                    if (isTodoComment(trechoComentario, linha, linhaAnterior)) {
                        ocorrenciasLinhas.push(i + 1);
                    }
                    continue;
                }
                if (idxBlockStart >= 0) {
                    const trechoAposInicio = linha.slice(idxBlockStart + 2);
                    const linhaAnterior = i > 0 ? linhas[i - 1] : undefined;
                    if (isTodoComment(trechoAposInicio, linha, linhaAnterior)) {
                        ocorrenciasLinhas.push(i + 1);
                    }
                    if (!linha.includes('*/')) {
                        emBloco = true;
                    }
                    continue;
                }
            }
        }
        if (ocorrenciasLinhas.length === 0)
            return null;
        return ocorrenciasLinhas.map((linha) => criarOcorrencia({
            tipo: 'TODO-pendente',
            mensagem: TodoCommentsMessages.todoFound,
            nivel: nivelTodo,
            relPath,
            linha,
            origem: 'todo-comments',
        }));
    },
};
export default analistaTodoComments;
//# sourceMappingURL=analista-todo-comments.js.map