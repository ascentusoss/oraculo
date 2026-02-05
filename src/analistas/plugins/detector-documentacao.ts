// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import { DetectorAgregadosMessages } from '@core/messages/analistas/detector-agregados-messages.js';
import { detectarContextoProjeto } from '@shared/contexto-projeto.js';
import { filtrarOcorrenciasSuprimidas } from '@shared/helpers/suppressao.js';

import type { Analista, Ocorrencia, ProblemaDocumentacao } from '@';
import { criarOcorrencia } from '@';

export const analistaDocumentacao: Analista = {
  nome: 'documentacao',
  categoria: 'manutenibilidade',
  descricao: 'Detecta problemas de documentação e legibilidade do código',

  test: (relPath: string): boolean => {
    return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
  },

  aplicar: (
    src: string,
    relPath: string,
    ast: NodePath<Node> | null,
  ): Ocorrencia[] => {
    if (!src) return [];

    const contextoArquivo = detectarContextoProjeto({
      arquivo: relPath,
      conteudo: src,
      relPath,
    });

    const problemas: ProblemaDocumentacao[] = [];

    try {
      // Detectar problemas por padrões de texto
      detectarPadroesDocumentacao(src, problemas, relPath);

      // Detectar problemas via AST quando disponível
      if (ast) {
        detectarProblemasDocumentacaoAST(ast, problemas);
      }

      // Converter para ocorrências
      const ocorrencias: Ocorrencia[] = [];

      // Agrupar por prioridade
      const porPrioridade = agruparPorPrioridade(problemas);

      for (const [prioridade, items] of Object.entries(porPrioridade)) {
        if (items.length > 0) {
          const nivel = mapearPrioridadeParaNivel(
            prioridade as ProblemaDocumentacao['prioridade'],
          );

          // Ser mais relaxado com testes e arquivos de configuração
          const nivelAjustado =
            (contextoArquivo.isTest || contextoArquivo.isConfig) &&
            nivel === 'aviso'
              ? 'info'
              : nivel;

          const resumo = items
            .slice(0, 3)
            .map((p) => p.tipo)
            .join(', ');

          ocorrencias.push(
            criarOcorrencia({
              tipo: 'problema-documentacao',
              nivel: nivelAjustado,
              mensagem: DetectorAgregadosMessages.problemasDocumentacaoResumo(
                prioridade,
                resumo,
                items.length,
              ),
              relPath,
              linha: items[0].linha,
            }),
          );
        }
      }

      // Aplicar supressões inline antes de retornar
      return filtrarOcorrenciasSuprimidas(ocorrencias, 'documentacao', src);
    } catch (erro) {
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

function detectarPadroesDocumentacao(
  src: string,
  problemas: ProblemaDocumentacao[],
  relPath: string,
): void {
  const linhas = src.split('\n');

  // 🎯 FILOSOFIA: Documentação é importante mas não deve poluir
  // - Detectar apenas problemas reais, não ausência de JSDoc em código interno
  // - Priorizar qualidade do código sobre quantidade de comentários
  // - Arquivos de biblioteca pública precisam mais documentação que utils internos

  // Verificar se é arquivo de biblioteca pública (requer documentação rigorosa)
  const isLibraryFile =
    relPath.includes('src/shared/') ||
    relPath.includes('src/core/') ||
    relPath.includes('lib/');

  // Arquivos que não precisam JSDoc rigoroso
  const isInternalFile =
    relPath.includes('/cli/') ||
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

    // Rastrear contexto JSDoc
    if (/\/\*\*/.test(linha)) {
      temJSDoc = true;
      dentroDeJSDoc = true;
    }

    // Pular análise de problemas se estiver dentro de JSDoc ou linha começa com * (JSDoc)
    const linhaJSDoc = dentroDeJSDoc || /^\s*\*/.test(linha);
    if (linhaJSDoc) {
      // Verificar fechamento depois de pular análise
      if (/\*\//.test(linha)) {
        dentroDeJSDoc = false;
      }
      return; // Não analisar código dentro de comentários JSDoc
    }

    // Detectar exportações
    if (/^export\s+(function|class|const|let|var|default)/.test(linha.trim())) {
      temExportacaoPublica = true;
    }

    // Variáveis com nomes de uma letra (exceto loops, cast types, e contextos legítimos)
    const singleLetterMatch = /\b(const|let|var)\s+([a-z])\s*=/.exec(linha);
    if (
      singleLetterMatch &&
      !/for\s*\(/.test(linha) &&
      !/while\s*\(/.test(linha)
    ) {
      const varName = singleLetterMatch[2];
      // Excluir variáveis legítimas: i, j, k em contexto de iteração, tipos (x as Type)
      const isLoopContext =
        /\b(i|j|k)\s*=\s*\d+/.test(linha) || /\b(i|j|k)\s*[+\-]=/.test(linha);
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

    // Números mágicos (não em arrays ou comparações simples)
    const numMagico = /\b(\d{2,})\b/.exec(linha);
    if (
      numMagico &&
      !/(length|size|count)\s*[=><!]/.test(linha) &&
      !/\[\s*\d+\s*\]/.test(linha) &&
      parseInt(numMagico[1]) > 10
    ) {
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

    // Comentários TODO antigos (aproximação heurística)
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

    // TypeScript: tipos 'any' sem comentário explicativo (exceto em strings literais)
    if (/:\s*any\b/.test(linha) && !/\/\/|\/\*/.test(linha)) {
      // Verificar se não está dentro de string (ex: const code = 'x: any')
      const anyMatch = /:\s*any\b/.exec(linha);
      if (anyMatch) {
        const position = anyMatch.index;
        const before = linha.substring(0, position);
        // Contar aspas antes da posição
        const singleQuotes = (before.match(/'/g) || []).length;
        const doubleQuotes = (before.match(/"/g) || []).length;
        const backticks = (before.match(/`/g) || []).length;

        // Se número ímpar de aspas, está dentro de string
        const dentroDeString =
          singleQuotes % 2 !== 0 ||
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
            sugestao:
              'Adicione comentário explicando uso de any ou use tipo mais específico',
          });
        }
      }
    }
  });

  // 📚 DETECÇÃO INTELIGENTE DE FALTA DE DOCUMENTAÇÃO
  // Apenas reportar se:
  // 1. É arquivo de biblioteca pública (shared/, core/, lib/) E
  // 2. Tem exportações públicas E
  // 3. Não tem nenhum JSDoc E
  // 4. Não é arquivo de teste/config/setup
  if (
    isLibraryFile &&
    temExportacaoPublica &&
    !temJSDoc &&
    !isInternalFile &&
    src.length > 200
  ) {
    // Arquivo grande o suficiente para justificar documentação
    problemas.push({
      tipo: 'missing-jsdoc',
      descricao: 'Arquivo de biblioteca pública sem documentação',
      prioridade: 'media', // Reduzido de 'alta' para 'media'
      linha: 1,
      coluna: 1,
      contexto: 'Arquivo de biblioteca',
      sugestao:
        'Considere adicionar JSDoc para APIs públicas (funções/classes exportadas principais)',
    });
  }
}

function detectarProblemasDocumentacaoAST(
  ast: NodePath<Node>,
  problemas: ProblemaDocumentacao[],
): void {
  try {
    ast.traverse({
      // 🎯 FILOSOFIA: Detectar apenas exports DEFAULT sem JSDoc
      // Exports nomeados podem ser auto-explicativos pelo nome
      ExportDefaultDeclaration(path) {
        if (
          (path.node.declaration.type === 'FunctionDeclaration' ||
            path.node.declaration.type === 'ClassDeclaration') &&
          !path.node.leadingComments?.some((c) => c.value.startsWith('*'))
        ) {
          problemas.push({
            tipo: 'missing-jsdoc',
            descricao: 'Export default (principal) sem JSDoc',
            prioridade: 'media', // Reduzido de 'alta'
            linha: path.node.loc?.start.line || 0,
            coluna: path.node.loc?.start.column || 0,
            contexto: 'Export default',
            sugestao: 'Documente a API principal do módulo para facilitar uso',
          });
        }
      },

      // Classes públicas complexas (>3 métodos) sem documentação
      ClassDeclaration(path) {
        const node = path.node;
        if (
          node.body.body.length > 3 && // Apenas classes não-triviais
          !node.leadingComments?.some((c) => c.value.startsWith('*')) &&
          node.id?.name &&
          !node.id.name.toLowerCase().includes('test') &&
          !node.id.name.toLowerCase().includes('mock')
        ) {
          // Verificar se é exportada
          const parent = path.parent;
          const isExported =
            parent.type === 'ExportNamedDeclaration' ||
            parent.type === 'ExportDefaultDeclaration';

          if (isExported) {
            problemas.push({
              tipo: 'missing-jsdoc',
              descricao: `Classe pública ${node.id.name} (${node.body.body.length} membros) sem documentação`,
              prioridade: 'media',
              linha: node.loc?.start.line || 0,
              coluna: node.loc?.start.column || 0,
              contexto: 'ClassDeclaration',
              sugestao:
                'Documente o propósito e principais responsabilidades da classe',
            });
          }
        }
      },

      // 🚫 REMOVIDO: Detecção de funções com muitos parâmetros
      // Motivo: Gera muito ruído em código interno/utils
      // Alternativa: Revisar code review manual ou usar linter específico
    });
  } catch {
    // Ignorar erros de traverse
  }
}

function agruparPorPrioridade(
  problemas: ProblemaDocumentacao[],
): Record<string, ProblemaDocumentacao[]> {
  return problemas.reduce(
    (acc, problema) => {
      const prioridade = problema.prioridade;
      if (prioridade) {
        if (!acc[prioridade]) {
          acc[prioridade] = [];
        }
        acc[prioridade].push(problema);
      }
      return acc;
    },
    {} as Record<string, ProblemaDocumentacao[]>,
  );
}

function mapearPrioridadeParaNivel(
  prioridade: ProblemaDocumentacao['prioridade'],
): 'info' | 'aviso' | 'erro' {
  switch (prioridade) {
    case 'alta':
      return 'aviso'; // Documentação raramente é erro crítico
    case 'media':
      return 'aviso';
    case 'baixa':
    default:
      return 'info';
  }
}
