// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import { config } from '@core/config/config.js';
import { detectarContextoProjeto } from '@shared/contexto-projeto.js';

import type { FileLike, FunctionLikeNode, Ocorrencia } from '@';
import { criarAnalista, isBabelNode } from '@';

function isNodePath(x: unknown): x is NodePath<Node> {
  return (
    typeof x === 'object' &&
    x !== null &&
    'node' in x &&
    isBabelNode(x.node) &&
    typeof (x as { traverse?: unknown }).traverse === 'function'
  );
}

const LIMITE_LINHAS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_LINHAS ?? 30;
const LIMITE_PARAMETROS =
  config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_PARAMETROS ?? 4;
const LIMITE_ANINHAMENTO =
  config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_ANINHAMENTO ?? 3;

export const analistaFuncoesLongas = criarAnalista({
  aplicar(
    src: string,
    relPath: string,
    ast: NodePath<Node> | Node | null,
    _fullPath?: string,
  ) {
    // Aplicar contexto inteligente
    const contextoArquivo = detectarContextoProjeto({
      arquivo: relPath,
      conteudo: src,
      relPath,
    });

    // Limites mais relaxados para testes e configurações
    const limitesAjustados = {
      linhas:
        contextoArquivo.isTest || contextoArquivo.isConfig
          ? LIMITE_LINHAS * 2
          : LIMITE_LINHAS,
      parametros: contextoArquivo.isTest
        ? LIMITE_PARAMETROS + 2
        : LIMITE_PARAMETROS,
      aninhamento: LIMITE_ANINHAMENTO,
    };

    const ocorrencias: Ocorrencia[] = [];

    const pushOcorrencia = (
      tipo: Ocorrencia['tipo'],
      nivel: NonNullable<Ocorrencia['nivel']>,
      linha: number,
      mensagem: string,
    ) => {
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

    function analisar(fn: FunctionLikeNode, _aninhamento: number = 0): void {
      const loc = fn.loc;
      if (
        !loc ||
        typeof loc.start !== 'object' ||
        typeof loc.end !== 'object' ||
        typeof loc.start.line !== 'number' ||
        typeof loc.end.line !== 'number' ||
        loc.start.line < 1 ||
        loc.end.line < loc.start.line
      ) {
        return;
      }

      const startLine = loc.start.line;
      const endLine = loc.end.line;
      const linhas = endLine - startLine + 1;
      if (linhas > limitesAjustados.linhas) {
        pushOcorrencia(
          'FUNCAO_LONGA',
          'aviso',
          startLine,
          `Função com ${linhas} linhas (máx: ${limitesAjustados.linhas})`,
        );
      }

      const paramsArr = fn.params;
      if (
        paramsArr &&
        Array.isArray(paramsArr) &&
        paramsArr.length > limitesAjustados.parametros
      ) {
        pushOcorrencia(
          'MUITOS_PARAMETROS',
          'aviso',
          startLine,
          `Função com muitos parâmetros (${paramsArr.length}, máx: ${limitesAjustados.parametros})`,
        );
      }

      // Verifica se a função está aninhada demais
      if (_aninhamento > limitesAjustados.aninhamento) {
        pushOcorrencia(
          'FUNCAO_ANINHADA',
          'aviso',
          startLine,
          `Função aninhada em nível ${_aninhamento} (máx: ${limitesAjustados.aninhamento})`,
        );
      }

      // Verifica se a função não tem comentário - menos rigoroso para testes
      if (
        fn.leadingComments == null ||
        (Array.isArray(fn.leadingComments) && fn.leadingComments.length === 0)
      ) {
        if (!contextoArquivo.isTest) {
          // Testes não precisam comentários obrigatórios
          pushOcorrencia(
            'FUNCAO_SEM_COMENTARIO',
            'info',
            startLine,
            `Função sem comentário acima.`,
          );
        }
      }
    }

    function analisarRecursivo(
      path: NodePath<Node> | Node,
      aninhamento: number = 0,
    ) {
      const node = isNodePath(path) ? path.node : (path as Node);
      const type = (node as { type?: string }).type;
      if (
        type === 'FunctionDeclaration' ||
        type === 'FunctionExpression' ||
        type === 'ArrowFunctionExpression'
      ) {
        // garantir que 'node' atenda à forma mínima esperada por analisar
        const fnNode = node as unknown as FunctionLikeNode;
        analisar(fnNode, aninhamento);
        aninhamento++;
      }
      if (isNodePath(path) && typeof path.traverse === 'function') {
        path.traverse({
          FunctionDeclaration(p: NodePath<Node>) {
            analisarRecursivo(p, aninhamento + 1);
          },
          FunctionExpression(p: NodePath<Node>) {
            analisarRecursivo(p, aninhamento + 1);
          },
          ArrowFunctionExpression(p: NodePath<Node>) {
            analisarRecursivo(p, aninhamento + 1);
          },
        });
      }
    }

    // --- Fluxo centralizado e robusto ---
    // 1. NodePath real: use traverse e recursão
    if (
      ast &&
      typeof (ast as unknown as { traverse?: unknown }).traverse === 'function'
    ) {
      analisarRecursivo(ast, 0);
      return ocorrencias;
    }

    // 2. AST puro ou mock: só processa body do File, nunca recursiona
    const fileAst = ast as unknown as FileLike | null;
    let fileNode: FileLike | null = null;
    try {
      if (fileAst) {
        const fa = fileAst as unknown;
        if (fa && typeof fa === 'object') {
          const maybeNode = (fa as { node?: unknown }).node;
          if (
            maybeNode &&
            typeof maybeNode === 'object' &&
            Array.isArray((maybeNode as { body?: unknown }).body)
          ) {
            fileNode = maybeNode as FileLike;
          } else if (Array.isArray((fa as { body?: unknown }).body)) {
            fileNode = fileAst;
          }
        }
      }
    } catch {
      fileNode = null;
    }

    if (fileNode) {
      const body = Array.isArray(fileNode.body) ? fileNode.body : [];
      for (const child of body) {
        if (
          child &&
          typeof child === 'object' &&
          ((child as { type?: string }).type === 'FunctionDeclaration' ||
            (child as { type?: string }).type === 'FunctionExpression' ||
            (child as { type?: string }).type === 'ArrowFunctionExpression')
        ) {
          analisar(child as FunctionLikeNode, 0);
        }
      }
      return ocorrencias;
    }

    // Se não for nenhum dos casos acima, retorna vazio
    return ocorrencias;
  },
  nome: 'analista-funcoes-longas',
  categoria: 'complexidade',
  descricao:
    'Detecta funcoes muito longas, com muitos parametros, aninhamento excessivo ou sem comentario',
  limites: {
    linhas: LIMITE_LINHAS,
    params: LIMITE_PARAMETROS,
    aninhamento: LIMITE_ANINHAMENTO,
  },
  test: (relPath: string): boolean =>
    relPath.endsWith('.js') || relPath.endsWith('.ts'),
  global: false,
});
