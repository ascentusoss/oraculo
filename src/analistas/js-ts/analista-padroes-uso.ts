// SPDX-License-Identifier: MIT
// src/analistas/analista-padroes-uso.ts
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import * as t from '@babel/types';
import { traverse } from '@core/config/traverse.js';
import { PadroesUsoMessages } from '@core/messages/analistas/analista-padroes-uso-messages.js';
import { detectarContextoProjeto } from '@shared/contexto-projeto.js';
import {
  garantirArray,
  incrementar,
} from '@shared/helpers/helpers-analistas.js';

import type {
  ContextoExecucao,
  Estatisticas,
  Ocorrencia,
  TecnicaAplicarResultado,
} from '@';
import { criarOcorrencia, ocorrenciaErroAnalista } from '@';

// Estatísticas globais (mantidas)
export const estatisticasUsoGlobal: Estatisticas = {
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
  test: (relPath: string): boolean =>
    relPath.endsWith('.js') || relPath.endsWith('.ts'),
  aplicar: (
    src: string,
    relPath: string,
    astInput: NodePath<Node> | Node | undefined | null,
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado => {
    // Aplicar contexto inteligente - não analisar arquivos de infraestrutura desnecessariamente
    const contextoArquivo = detectarContextoProjeto({
      arquivo: relPath,
      conteudo: src,
      relPath,
    });

    // Arquivos que não precisam de análise rigorosa de padrões
    if (
      contextoArquivo.isTest ||
      contextoArquivo.isConfig ||
      contextoArquivo.frameworks.includes('types')
    ) {
      return null; // Ou análise mais leve
    }

    const ocorrencias: Ocorrencia[] = [];

    const push = (
      data: Omit<Ocorrencia, 'nivel' | 'origem' | 'tipo' | 'mensagem'> & {
        tipo: string;
        mensagem: string;
        nivel?: Ocorrencia['nivel'];
        origem?: string;
        arquivo?: string;
        relPath?: string;
      },
    ) => {
      ocorrencias.push(
        criarOcorrencia({
          nivel: data.nivel,
          origem: data.origem,
          tipo: data.tipo,
          mensagem: data.mensagem,
          relPath: data.arquivo || data.relPath,
          linha: data.linha,
          coluna: data.coluna,
        }),
      );
    };

    const statsFlag = estatisticasUsoGlobal as Estatisticas & {
      ___RESET_DONE___?: boolean;
    };
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

    // Normaliza AST recebido do executor (pode ser NodePath<Node> com .node ou o nó direto); fallback ao contexto
    let astWrap: NodePath<Node> | Node | undefined | null = astInput as
      | NodePath<Node>
      | Node
      | undefined
      | null;
    if (!astWrap && contexto?.arquivos) {
      const found =
        contexto.arquivos.find(
          (f: { relPath: string }) => f.relPath === relPath,
        ) || contexto.arquivos[0];
      astWrap =
        (found?.ast as NodePath<Node> | Node | undefined | null) || undefined;
    }
    const hasNodeProp = (v: unknown): v is { node?: Node } =>
      typeof v === 'object' &&
      v !== null &&
      'node' in (v as Record<string, unknown>);
    const ast: Node | undefined | null = (astWrap &&
      (hasNodeProp(astWrap) ? astWrap.node : (astWrap as Node))) as
      | Node
      | undefined
      | null;
    if (!ast || typeof ast !== 'object') return null;
    const tipo = (ast as Node).type;
    if (tipo !== 'File' && tipo !== 'Program') return null; // evita traverse inválido

    try {
      traverse(ast as unknown as t.Node, {
        enter(path: NodePath<t.Node>) {
          const node = path.node;

          if (t.isVariableDeclaration(node) && node.kind === 'var') {
            incrementar(estatisticasUsoGlobal.vars, relPath);
            // Menos rigoroso para testes e configs
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
            // Apenas info para testes, pode ser normal usar let em testes
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
                // Menos rigoroso para testes onde require pode ser normal
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
          if (
            t.isExportNamedDeclaration(node) ||
            t.isExportDefaultDeclaration(node)
          ) {
            incrementar(estatisticasUsoGlobal.exports, relPath);
          }
          if (
            t.isAssignmentExpression(node) &&
            t.isMemberExpression(node.left) &&
            ((t.isIdentifier(node.left.object) &&
              node.left.object.name === 'module' &&
              t.isIdentifier(node.left.property) &&
              node.left.property.name === 'exports') ||
              (t.isIdentifier(node.left.object) &&
                node.left.object.name === 'exports')) &&
            relPath.endsWith('.ts')
          ) {
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
          if (
            (t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) &&
            !node.id &&
            !t.isArrowFunctionExpression(node) &&
            !contextoArquivo.isTest // Testes frequentemente usam funções anônimas
          ) {
            push({
              tipo: 'info',
              mensagem: PadroesUsoMessages.anonymousFunction,
              relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Arrow function em propriedade de classe (Babel 7+: ClassProperty/PropertyDefinition)
          if (
            (node.type === 'ClassProperty' ||
              (node as { type?: string }).type === 'PropertyDefinition') &&
            'value' in (node as unknown as Record<string, unknown>) &&
            t.isArrowFunctionExpression(
              (node as unknown as Record<string, unknown>).value as t.Node,
            ) &&
            !contextoArquivo.isTest // Menos rigoroso para testes
          ) {
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
    } catch (e) {
      ocorrencias.push(
        ocorrenciaErroAnalista({
          mensagem: PadroesUsoMessages.erroAnalise(
            relPath,
            (e as Error).message,
          ),
          relPath,
          origem: 'analista-padroes-uso',
        }),
      );
    }

    return garantirArray(ocorrencias);
  },
};
