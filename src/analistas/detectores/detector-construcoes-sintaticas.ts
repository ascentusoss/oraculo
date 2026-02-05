// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  ClassDeclaration,
  FunctionDeclaration,
  ImportDeclaration,
  NewExpression,
  Node,
  TSEnumDeclaration,
  TSInterfaceDeclaration,
  TSTypeAliasDeclaration,
  VariableDeclaration,
} from '@babel/types';
import { traverse } from '@core/config/traverse.js';
import { DetectorConstrucoesSintaticasMessages } from '@core/messages/analistas/detector-construcoes-sintaticas-messages.js';

import {
  type Analista,
  type ConstrucaoSintatica,
  criarOcorrencia,
  type Ocorrencia,
} from '@';

export const analistaConstrucoesSintaticas: Analista = {
  nome: 'construcoes-sintaticas',
  categoria: 'estrutura',
  descricao:
    'Identifica e cataloga construções sintáticas do JavaScript/TypeScript',

  test: (relPath: string): boolean => {
    return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
  },

  aplicar: (
    src: string,
    relPath: string,
    ast: NodePath<Node> | null,
  ): Ocorrencia[] => {
    if (!ast || !src) {
      return [];
    }

    const construcoes: Map<string, number> = new Map();
    const detalhes: ConstrucaoSintatica[] = [];

    try {
      // Traverse da AST para identificar construções
      traverse(ast.node, {
        // Declarações de variáveis
        VariableDeclaration(path: NodePath<VariableDeclaration>) {
          const kind = path.node.kind as 'const' | 'let' | 'var';
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

        // Declarações de função
        FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
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

        // Arrow functions
        ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
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

        // Await expressions
        AwaitExpression() {
          incrementarContagem(construcoes, 'await');
        },

        // Classes
        ClassDeclaration(path: NodePath<ClassDeclaration>) {
          incrementarContagem(construcoes, 'class');
          detalhes.push({
            tipo: 'class',
            nome: path.node.id?.name || 'anonymous',
            linha: path.node.loc?.start.line || 1,
            coluna: path.node.loc?.start.column || 0,
            codigo: src.slice(path.node.start || 0, path.node.end || 0),
          });
        },

        // Imports
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
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

        // Exports
        ExportNamedDeclaration() {
          incrementarContagem(construcoes, 'export');
        },

        ExportDefaultDeclaration() {
          incrementarContagem(construcoes, 'export');
        },

        // Promises (new Promise)
        NewExpression(path: NodePath<NewExpression>) {
          if (
            path.node.callee.type === 'Identifier' &&
            path.node.callee.name === 'Promise'
          ) {
            incrementarContagem(construcoes, 'promise');
          }
        },

        // TypeScript específico
        TSInterfaceDeclaration(path: NodePath<TSInterfaceDeclaration>) {
          incrementarContagem(construcoes, 'interface');
          detalhes.push({
            tipo: 'interface',
            nome: path.node.id.name,
            linha: path.node.loc?.start.line || 1,
            coluna: path.node.loc?.start.column || 0,
            codigo: src.slice(path.node.start || 0, path.node.end || 0),
          });
        },

        TSTypeAliasDeclaration(path: NodePath<TSTypeAliasDeclaration>) {
          incrementarContagem(construcoes, 'type');
          detalhes.push({
            tipo: 'type',
            nome: path.node.id.name,
            linha: path.node.loc?.start.line || 1,
            coluna: path.node.loc?.start.column || 0,
            codigo: src.slice(path.node.start || 0, path.node.end || 0),
          });
        },

        TSEnumDeclaration(path: NodePath<TSEnumDeclaration>) {
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

      // Gerar relatório das construções encontradas
      const resumo = Array.from(construcoes.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tipo, count]) => `${tipo}: ${count}`)
        .join(', ');

      const mensagemFinal =
        resumo || 'Nenhuma construção sintática específica identificada';

      return [
        criarOcorrencia({
          tipo: 'construcoes-sintaticas',
          nivel: 'info',
          mensagem:
            DetectorConstrucoesSintaticasMessages.identificadas(mensagemFinal),
          relPath,
          linha: 1,
        }),
      ];
    } catch (erro) {
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

function incrementarContagem(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) || 0) + 1);
}

function extrairContexto(path: NodePath): string {
  if (path.isProgram()) return 'global';
  if (path.getFunctionParent()) return 'function';
  if (path.getStatementParent()?.isBlockStatement()) return 'block';
  return 'other';
}
