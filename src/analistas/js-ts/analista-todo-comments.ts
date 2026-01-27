// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type { Comment } from '@babel/types';
import { TodoCommentsMessages } from '@core/messages/analistas/analista-todo-comments-messages.js';
import { detectarContextoProjeto } from '@shared/contexto-projeto.js';

import type { Analista, TecnicaAplicarResultado } from '@';
import { criarOcorrencia } from '@';

// Evita warning de unused import - função usada em runtime
void detectarContextoProjeto;

// Analista simples para detectar TODO em comentários (//, /* */), ignorando testes/specs
export const analistaTodoComments: Analista = {
  nome: 'todo-comments',
  categoria: 'qualidade',
  descricao:
    'Detecta comentários TODO deixados no código (apenas em comentários).',
  // Per-file (não global): executa por arquivo
  global: false,
  test(relPath) {
    // Usa o sistema de contexto inteligente
    const contextoArquivo = detectarContextoProjeto({
      arquivo: relPath,
      conteudo: '',
      relPath,
    });

    // Ignora testes, configs e infraestrutura
    if (
      contextoArquivo.isTest ||
      contextoArquivo.isConfig ||
      contextoArquivo.frameworks.includes('types')
    ) {
      return false;
    }

    // Evita auto-detecção neste próprio arquivo
    if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath))
      return false;
    return /\.(ts|js|tsx|jsx)$/i.test(relPath);
  },
  aplicar(src, relPath, ast?: NodePath | null): TecnicaAplicarResultado {
    // Aplicar contexto inteligente
    const contextoArquivo = detectarContextoProjeto({
      arquivo: relPath,
      conteudo: src,
      relPath,
    });

    // Nível baseado no contexto
    const nivelTodo = contextoArquivo.isLibrary ? 'aviso' : 'info';

    const RE_TODO_START = /^TODO\b/i;
    const RE_TODO_ANY = /\bTODO\b\s*[:\-(\[]/i;

    // Detecta se o TODO é parte de um template JSDoc gerado automaticamente
    const isJSDocTemplate = (
      linha: string,
      _linhaAnterior?: string,
    ): boolean => {
      // Padrões típicos de JSDoc templates automáticos
      const templatePatterns = [
        /\*\s*TODO:\s*Adicionar descrição da função\s*$/i,
        /\*\s*@param\s+\{[^}]*\}\s+\w+\s*-\s*TODO:\s*Descrever parâmetro\s*$/i,
        /\*\s*@returns\s+\{[^}]*\}\s*TODO:\s*Descrever retorno\s*$/i,
      ];

      return templatePatterns.some((pattern) => pattern.test(linha));
    };

    const isTodoComment = (
      texto: string,
      linhaCompleta?: string,
      linhaAnterior?: string,
    ): boolean => {
      const t = String(texto ?? '').trim();
      const isTodo = RE_TODO_START.test(t) || RE_TODO_ANY.test(t);

      // Se é TODO, verifica se é template JSDoc
      if (
        isTodo &&
        linhaCompleta &&
        isJSDocTemplate(linhaCompleta, linhaAnterior)
      ) {
        return false; // Ignora TODOs em templates JSDoc
      }

      return isTodo;
    };

    // Localiza marcadores de comentário ignorando ocorrências dentro de strings (', ", `)
    const localizarMarcadores = (
      linha: string,
    ): { lineIdx: number; blockIdx: number } => {
      let inS = false;
      let inD = false;
      let inB = false;
      let prev = '';
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        const pair = prev + ch;
        // alterna estados de string considerando escapes simples
        if (!inD && !inB && ch === "'" && prev !== '\\') inS = !inS;
        else if (!inS && !inB && ch === '"' && prev !== '\\') inD = !inD;
        else if (!inS && !inD && ch === '`' && prev !== '\\') inB = !inB;

        // apenas quando não dentro de strings detectar comentários
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
    if (!src || typeof src !== 'string') return null;
    // Evita auto-detecção neste próprio arquivo (defesa dupla)
    if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath))
      return null;

    // Caminho preferencial: usar comentários da AST quando disponível
    if (ast && ast.node) {
      const maybeWithComments = ast.node as unknown as { comments?: Comment[] };
      if (Array.isArray(maybeWithComments.comments)) {
        const comments = maybeWithComments.comments;
        const ocorrencias = comments
          .filter((c) => {
            const texto = String(c.value ?? '').trim();
            // Para comentários AST, não temos acesso fácil ao contexto de linha
            // Vamos usar uma heurística mais simples aqui
            return isTodoComment(texto);
          })
          .map((c) =>
            criarOcorrencia({
              tipo: 'TODO-pendente',
              mensagem: TodoCommentsMessages.todoFound,
              nivel: nivelTodo,
              relPath,
              linha: c.loc?.start.line,
              origem: 'todo-comments',
            }),
          );
        return ocorrencias.length ? ocorrencias : null;
      }
    }

    // Heurística: considera TODO apenas quando presente em comentários
    const linhas = src.split(/\r?\n/);
    const ocorrenciasLinhas: number[] = [];
    let emBloco = false;
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      let analisada = false;

      // Verifica comentários de bloco (/* ... */)
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
        // Procura início de bloco e comentário de linha ignorando strings
        const { blockIdx: idxBlockStart, lineIdx: idxLine } =
          localizarMarcadores(linha);

        // Caso comentário de linha
        if (idxLine >= 0 && (idxBlockStart === -1 || idxLine < idxBlockStart)) {
          const trechoComentario = linha.slice(idxLine + 2);
          const linhaAnterior = i > 0 ? linhas[i - 1] : undefined;
          if (isTodoComment(trechoComentario, linha, linhaAnterior)) {
            ocorrenciasLinhas.push(i + 1);
          }
          continue;
        }

        // Caso bloco começando nesta linha
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

    if (ocorrenciasLinhas.length === 0) return null;

    return ocorrenciasLinhas.map((linha) =>
      criarOcorrencia({
        tipo: 'TODO-pendente',
        mensagem: TodoCommentsMessages.todoFound,
        nivel: nivelTodo,
        relPath,
        linha,
        origem: 'todo-comments',
      }),
    );
  },
};

export default analistaTodoComments;
