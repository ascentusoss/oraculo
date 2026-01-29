// SPDX-License-Identifier: MIT
import type { NodePath } from '/traverse';
import type {
  ArrowFunctionExpression,
  CallExpression,
  CatchClause,
  ClassMethod,
  FunctionDeclaration,
  FunctionExpression,
  Node,
  NumericLiteral,
  TSAnyKeyword,
} from '/types';
import { config } from '/config/config.js';
import { traverse } from '/config/traverse.js';
import { DetectorCodigoFragilMessages } from '/messages/analistas/detector-codigo-fragil-messages.js';
import { detectarFrameworks } from '/helpers/framework-detector.js';
import { isWhitelistedConstant } from '/helpers/magic-constants-whitelist.js';
import { filtrarOcorrenciasSuprimidas } from '/helpers/suppressao.js';

import type { Analista, Fragilidade, Ocorrencia } from '@';
import { criarOcorrencia } from '@';

// Cache de frameworks detectados (evita múltiplas leituras do package.json)
let frameworksDetectados: string[] | null = null;

export const analistaCodigoFragil: Analista = {
  nome: 'codigo-fragil',
  categoria: 'qualidade',
  descricao: 'Detecta padrões de código que podem levar a problemas futuros',
  limites: {
    maxLinhasFuncao:
      config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_LINHAS_FUNCAO ?? 30,
    maxParametros: config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_PARAMETROS ?? 4,
    maxNestedCallbacks:
      config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_NESTED_CALLBACKS ?? 2,
  },

  test: (relPath: string): boolean => {
    // Ignorar arquivos deprecados e abandonados
    if (
      /\.(deprecados?|abandonados?)\//i.test(relPath) ||
      relPath.includes('.deprecados/') ||
      relPath.includes('abandonados/')
    ) {
      return false;
    }
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

    // Limites efetivos (lidos dinamicamente para respeitar overrides por env/config)
    const maxLinhasFuncao =
      config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_LINHAS_FUNCAO ?? 30;
    const maxParametros =
      config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_PARAMETROS ?? 4;
    const maxNestedCallbacks =
      config.ANALISE_LIMITES?.CODIGO_FRAGIL?.MAX_NESTED_CALLBACKS ?? 2;

    const fragilidades: Fragilidade[] = [];

    try {
      // Detectar problemas baseados em texto
      detectarConsoleLog(src, fragilidades);
      detectarTodoComments(src, fragilidades);

      // Detecções avançadas baseadas em texto
      detectarProblemasAvancados(src, fragilidades);

      // Detectar problemas via AST
      traverse(ast.node, {
        // Blocos catch vazios
        CatchClause(path: NodePath<CatchClause>) {
          const body = path.node.body.body;
          const linha = path.node.loc?.start.line || 0;

          if (body.length === 0) {
            fragilidades.push({
              tipo: 'catch-vazio',
              linha,
              coluna: path.node.loc?.start.column || 0,
              severidade: 'media',
              contexto: 'Bloco catch vazio',
            });
          } else if (body.length === 1 && isSingleConsoleLog(body[0])) {
            fragilidades.push({
              tipo: 'catch-apenas-log',
              linha,
              coluna: path.node.loc?.start.column || 0,
              severidade: 'baixa',
              contexto: 'Catch apenas com console.log',
            });
          }
        },

        // Uso explícito de 'any'
        TSAnyKeyword(path: NodePath<TSAnyKeyword>) {
          fragilidades.push({
            tipo: 'any-explicito',
            linha: path.node.loc?.start.line || 0,
            coluna: path.node.loc?.start.column || 0,
            severidade: 'media',
            contexto: 'Tipo any explícito',
          });
        },

        // Funções muito longas + muitos parâmetros
        FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
          const node = path.node;

          // Verificar tamanho da função
          if (node.body?.type === 'BlockStatement') {
            const inicio = node.loc?.start.line || 0;
            const fim = node.loc?.end.line || 0;
            const numLinhas = fim - inicio;

            if (numLinhas > maxLinhasFuncao) {
              fragilidades.push({
                tipo: 'funcao-longa',
                linha: inicio,
                coluna: node.loc?.start.column || 0,
                severidade:
                  numLinhas >
                  Math.max(
                    maxLinhasFuncao + 20,
                    Math.floor(maxLinhasFuncao * 1.7),
                  )
                    ? 'alta'
                    : 'media',
                contexto: `Função com ${numLinhas} linhas (máx: ${maxLinhasFuncao})`,
              });
            }
          }

          // Verificar número de parâmetros
          const numParams = node.params.length;
          if (numParams > maxParametros) {
            fragilidades.push({
              tipo: 'muitos-parametros',
              linha: node.loc?.start.line || 0,
              coluna: node.loc?.start.column || 0,
              severidade:
                numParams >
                Math.max(maxParametros + 2, Math.floor(maxParametros * 1.5))
                  ? 'alta'
                  : 'media',
              contexto: `Função com ${numParams} parâmetros (máx: ${maxParametros})`,
            });
          }
        },

        ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
          const node = path.node;
          if (node.body?.type === 'BlockStatement') {
            const inicio = node.loc?.start.line || 0;
            const fim = node.loc?.end.line || 0;
            const numLinhas = fim - inicio;

            if (numLinhas > maxLinhasFuncao) {
              fragilidades.push({
                tipo: 'funcao-longa',
                linha: inicio,
                coluna: node.loc?.start.column || 0,
                severidade:
                  numLinhas >
                  Math.max(
                    maxLinhasFuncao + 20,
                    Math.floor(maxLinhasFuncao * 1.7),
                  )
                    ? 'alta'
                    : 'media',
                contexto: `Arrow function com ${numLinhas} linhas (máx: ${maxLinhasFuncao})`,
              });
            }
          }
        },

        FunctionExpression(path: NodePath<FunctionExpression>) {
          const node = path.node;
          if (node.body?.type === 'BlockStatement') {
            const inicio = node.loc?.start.line || 0;
            const fim = node.loc?.end.line || 0;
            const numLinhas = fim - inicio;

            if (numLinhas > maxLinhasFuncao) {
              fragilidades.push({
                tipo: 'funcao-longa',
                linha: inicio,
                coluna: node.loc?.start.column || 0,
                severidade:
                  numLinhas >
                  Math.max(
                    maxLinhasFuncao + 20,
                    Math.floor(maxLinhasFuncao * 1.7),
                  )
                    ? 'alta'
                    : 'media',
                contexto: `Function expression com ${numLinhas} linhas (máx: ${maxLinhasFuncao})`,
              });
            }
          }
        },

        // Números mágicos
        NumericLiteral(path: NodePath<NumericLiteral>) {
          const value = path.node.value;

          // Ignorar se está em declaração de variável ou índice de array
          if (isInVariableDeclarator(path) || isInArrayIndex(path)) {
            return;
          }

          // Detectar frameworks do projeto (cache básico via closure)
          if (!frameworksDetectados) {
            const rootDir = process.cwd();
            const frameworks = detectarFrameworks(rootDir);
            frameworksDetectados = frameworks.map((f) => f.name);
          }

          // Verificar se está na whitelist (valores comuns + limites de frameworks)
          if (isWhitelistedConstant(value, frameworksDetectados)) {
            return;
          }

          fragilidades.push({
            tipo: 'magic-number',
            linha: path.node.loc?.start.line || 0,
            coluna: path.node.loc?.start.column || 0,
            severidade: 'baixa',
            contexto: `Número mágico: ${value}`,
          });
        },

        // Muitos parâmetros - ClassMethod
        ClassMethod(path: NodePath<ClassMethod>) {
          const node = path.node;
          const numParams =
            node.params && Array.isArray(node.params) ? node.params.length : 0;

          if (numParams > 4) {
            fragilidades.push({
              tipo: 'muitos-parametros',
              linha: node.loc?.start.line || 0,
              coluna: node.loc?.start.column || 0,
              severidade: numParams > 6 ? 'alta' : 'media',
              contexto: `Método com ${numParams} parâmetros`,
            });
          }
        },
      });

      // Detectar callbacks aninhados (requer análise específica)
      detectarNestedCallbacks(ast, fragilidades, maxNestedCallbacks);

      // Gerar ocorrências por severidade
      const ocorrencias: Ocorrencia[] = [];

      // Agrupar por severidade
      const porSeveridade = agruparPorSeveridade(fragilidades);

      for (const [severidade, items] of Object.entries(porSeveridade)) {
        if (items.length > 0) {
          const nivel =
            severidade === 'alta'
              ? 'erro'
              : severidade === 'media'
                ? 'aviso'
                : 'info';

          // Criar resumo por tipo
          const resumoPorTipo = items.reduce(
            (acc, item) => {
              acc[item.tipo] = (acc[item.tipo] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const resumo = Object.entries(resumoPorTipo)
            .map(([tipo, count]) => `${tipo}: ${count}`)
            .join(', ');

          ocorrencias.push(
            criarOcorrencia({
              tipo: 'codigo-fragil',
              nivel,
              mensagem: DetectorCodigoFragilMessages.fragilidadesResumo(
                severidade,
                resumo,
                {
                  severidade,
                  total: items.length,
                  tipos: resumoPorTipo,
                  amostra: items
                    .slice(0, 3)
                    .map((f) => `${f.tipo}:L${f.linha}`),
                },
              ),
              relPath,
              linha: items[0].linha,
            }),
          );
        }
      }

      // Aplicar supressões inline antes de retornar
      return filtrarOcorrenciasSuprimidas(ocorrencias, 'codigo-fragil', src);
    } catch (erro) {
      return [
        criarOcorrencia({
          tipo: 'ERRO_ANALISE',
          nivel: 'aviso',
          mensagem: DetectorCodigoFragilMessages.erroAnalisarCodigoFragil(erro),
          relPath,
          linha: 1,
        }),
      ];
    }
  },
};

function detectarConsoleLog(src: string, fragilidades: Fragilidade[]): void {
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Ignorar linhas comentadas (// ou /* ... */)
    if (
      trimmedLine.startsWith('//') ||
      (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/'))
    ) {
      continue;
    }

    // Detectar console.log não comentado
    const consoleMatch = line.match(/console\.log\s*\(/);
    if (consoleMatch) {
      // Verificar se não está dentro de comentário de bloco
      const beforeMatch = line.substring(0, consoleMatch.index);
      if (beforeMatch.includes('/*') && !beforeMatch.includes('*/')) {
        continue; // Está dentro de comentário de bloco
      }

      fragilidades.push({
        tipo: 'console-log',
        linha: i + 1,
        coluna: consoleMatch.index || 0,
        severidade: 'baixa',
        contexto: 'console.log encontrado',
      });
    }
  }
}

function detectarTodoComments(src: string, fragilidades: Fragilidade[]): void {
  const regex = /\/\/\s*TODO|\/\*\s*TODO/gi;
  let match;

  while ((match = regex.exec(src)) !== null) {
    const linha = src.substring(0, match.index).split('\n').length;

    fragilidades.push({
      tipo: 'todo-comment',
      linha,
      coluna: 0,
      severidade: 'baixa',
      contexto: 'Comentário TODO encontrado',
    });
  }
}

/**
 * Detecta problemas avançados de código que indicam fragilidade (não duplicados com outros analistas)
 */
function detectarProblemasAvancados(
  src: string,
  fragilidades: Fragilidade[],
): void {
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Ignorar linhas comentadas
    if (
      trimmedLine.startsWith('//') ||
      (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/'))
    ) {
      continue;
    }

    // Promise sem catch (exclusivo - não coberto por outros analistas)
    if (/\.then\s*\(/.test(line) && !line.includes('.catch')) {
      const nextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
      if (!nextLines.includes('.catch')) {
        fragilidades.push({
          tipo: 'promise-sem-catch',
          linha: i + 1,
          coluna: line.indexOf('.then'),
          severidade: 'media',
          contexto: 'Promise sem tratamento de erro (.catch)',
        });
      }
    }

    // addEventListener sem removeEventListener (detecção aprimorada)
    if (/addEventListener\s*\(/.test(line)) {
      const eventName = line.match(
        /addEventListener\s*\(\s*['"`]([^'"`]+)['"`]/,
      );
      if (
        eventName &&
        !src.includes(`removeEventListener`) &&
        !src.includes(`{ once: true }`) &&
        !src.includes('AbortController')
      ) {
        fragilidades.push({
          tipo: 'event-listener-sem-cleanup',
          linha: i + 1,
          coluna: line.indexOf('addEventListener'),
          severidade: 'media',
          contexto: `Event listener '${eventName[1]}' sem cleanup`,
        });
      }
    }

    // Regex complexa (mais de 50 caracteres com múltiplos grupos)
    const regexMatch = line.match(/\/([^\/\\]|\\.)+\/[gimuy]*/);
    if (
      regexMatch &&
      regexMatch[0].length > 50 &&
      (regexMatch[0].match(/\(/g) || []).length > 3
    ) {
      fragilidades.push({
        tipo: 'regex-complexa',
        linha: i + 1,
        coluna: line.indexOf(regexMatch[0]),
        severidade: 'media',
        contexto: 'Regex complexa - considere quebrar em partes menores',
      });
    }

    // Potencial vazamento de memória - setInterval/setTimeout sem clear + addEventListener sem remove
    if (
      (/setInterval\s*\(/.test(line) || /setTimeout\s*\(/.test(line)) &&
      !src.includes('clear') &&
      !line.includes('once')
    ) {
      fragilidades.push({
        tipo: 'memory-leak-potential',
        linha: i + 1,
        coluna: line.search(/setInterval|setTimeout/),
        severidade: 'media',
        contexto: 'Potencial vazamento: timer sem cleanup',
      });
    }
  }

  // Detectar complexidade cognitiva (mais avançado que funções longas)
  detectarComplexidadeCognitiva(src, fragilidades);
}

/**
 * Detecta complexidade cognitiva alta baseada em estruturas de controle (mais avançado que analista de funções longas)
 */
function detectarComplexidadeCognitiva(
  src: string,
  fragilidades: Fragilidade[],
): void {
  const lines = src.split('\n');
  let complexityScore = 0;
  let currentFunction = '';
  let functionStartLine = 0;
  let nestingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Início de função
    if (
      /^(function|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=).*=>|^function\s+\w+|^async\s+function/.test(
        trimmedLine,
      )
    ) {
      if (complexityScore > 15) {
        // Threshold mais alto que funções longas
        fragilidades.push({
          tipo: 'cognitive-complexity',
          linha: functionStartLine,
          coluna: 0,
          severidade: 'alta',
          contexto: `Função '${currentFunction}' com complexidade cognitiva crítica (${complexityScore})`,
        });
      }

      complexityScore = 1;
      currentFunction = `${trimmedLine.substring(0, 30)}...`;
      functionStartLine = i + 1;
      nestingLevel = 0;
    }

    // Detectar nível de aninhamento
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    nestingLevel += openBraces - closeBraces;

    // Incrementar complexidade para estruturas de controle com peso por aninhamento
    const controlStructures =
      /(if|else if|while|for|switch|case|catch|&&|\|\||\?|:)/.test(trimmedLine);
    if (controlStructures) {
      complexityScore += Math.max(1, nestingLevel); // Peso maior para aninhamento profundo
    }

    // Callbacks e async aumentam complexidade
    if (
      /\.then|\.catch|callback|setTimeout|setInterval|async\s*\(/.test(
        trimmedLine,
      )
    ) {
      complexityScore += 2;
    }

    // Regex complexa e condições ternárias aninhadas
    if (/\?\s*.*\?\s*.*:/.test(trimmedLine)) {
      // Ternário aninhado
      complexityScore += 3;
    }

    // Try-catch aumenta complexidade
    if (/try\s*\{|catch\s*\(/.test(trimmedLine)) {
      complexityScore += 2;
    }
  }

  // Verificar última função
  if (complexityScore > 15) {
    fragilidades.push({
      tipo: 'cognitive-complexity',
      linha: functionStartLine,
      coluna: 0,
      severidade: 'alta',
      contexto: `Função '${currentFunction}' com complexidade cognitiva crítica (${complexityScore})`,
    });
  }
}

function detectarNestedCallbacks(
  ast: NodePath<Node>,
  fragilidades: Fragilidade[],
  limite: number,
): void {
  const lim = Number.isFinite(limite) && limite >= 0 ? limite : 2;

  traverse(ast.node, {
    CallExpression(path: NodePath<CallExpression>) {
      const profundidade = calcularProfundidadeCallback(path);
      if (profundidade > lim) {
        fragilidades.push({
          tipo: 'nested-callbacks',
          linha: path.node.loc?.start.line || 0,
          coluna: path.node.loc?.start.column || 0,
          severidade: profundidade > lim + 1 ? 'alta' : 'media',
          contexto: `Callbacks aninhados (nível ${profundidade}, máx: ${lim})`,
        });
      }
    },
  });
}

function calcularProfundidadeCallback(path: NodePath): number {
  let profundidade = 0;
  let current: NodePath | null = path;

  while (current) {
    if (current.isCallExpression() && hasCallbackArgument(current)) {
      profundidade++;
    }
    current = current.parentPath;
  }

  return profundidade;
}

function hasCallbackArgument(path: NodePath): boolean {
  if (!path.isCallExpression()) return false;

  return path.node.arguments.some(
    (arg) =>
      arg.type === 'ArrowFunctionExpression' ||
      arg.type === 'FunctionExpression',
  );
}

function isSingleConsoleLog(stmt: Node): boolean {
  // Statement node
  return (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression?.type === 'CallExpression' &&
    stmt.expression.callee?.type === 'MemberExpression' &&
    stmt.expression.callee.object?.type === 'Identifier' &&
    stmt.expression.callee.object.name === 'console'
  );
}

function isInVariableDeclarator(path: NodePath): boolean {
  return path.findParent((p) => p.isVariableDeclarator()) !== null;
}

function isInArrayIndex(path: NodePath): boolean {
  return (
    path.findParent((p) => p.isMemberExpression() && p.node.computed) !== null
  );
}

function agruparPorSeveridade(
  fragilidades: Fragilidade[],
): Record<string, Fragilidade[]> {
  return fragilidades.reduce(
    (acc, frag) => {
      const sev = (frag.severidade as string) || 'media';
      if (!acc[sev]) {
        acc[sev] = [];
      }
      acc[sev].push(frag);
      return acc;
    },
    {} as Record<string, Fragilidade[]>,
  );
}
