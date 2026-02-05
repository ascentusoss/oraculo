// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  ClassMethod,
  FunctionDeclaration,
  FunctionExpression,
  Node,
  ObjectMethod,
} from '@babel/types';
import { traverse } from '@core/config/traverse.js';
import { DetectorAgregadosMessages } from '@core/messages/analistas/detector-agregados-messages.js';
import { createHash } from 'crypto';

import type {
  Analista,
  BlocoFuncao,
  ContextoExecucao,
  DuplicacaoEncontrada,
  Ocorrencia,
} from '@';
import { criarOcorrencia } from '@';

export const analistaDuplicacoes: Analista = {
  nome: 'detector-duplicacoes',
  categoria: 'estrutura',
  descricao: 'Detecta funções e blocos de código duplicados ou muito similares',
  limites: {
    similaridadeMinima: 80,
    tamanhoMinimoFuncao: 5,
  },

  test: (relPath: string): boolean => {
    return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
  },

  aplicar: async (
    src: string,
    relPath: string,
    ast: NodePath<Node> | null,
    fullPath?: string,
    contexto?: ContextoExecucao,
  ): Promise<Ocorrencia[]> => {
    if (!ast || !src || !contexto) {
      return [];
    }

    try {
      // Extrair todas as funções do arquivo atual
      const funcoesAtuais = extrairFuncoes(ast, relPath, src);

      // Extrair funções de outros arquivos para comparação
      let todasFuncoes: BlocoFuncao[] = [];
      try {
        todasFuncoes = await extrairFuncoesDoContexto(contexto, relPath);
      } catch (erro) {
        return [
          criarOcorrencia({
            tipo: 'erro_analise',
            nivel: 'aviso',
            mensagem: DetectorAgregadosMessages.erroAnalisarDuplicacoes(erro),
            relPath,
            linha: 1,
          }),
        ];
      }
      todasFuncoes.push(...funcoesAtuais);

      // Detectar duplicações
      const duplicacoes = detectarDuplicacoes(funcoesAtuais, todasFuncoes);

      if (duplicacoes.length === 0) {
        return [];
      }

      // Agrupar por tipo de similaridade
      const porTipo = agruparPorTipoSimilaridade(duplicacoes);
      const ocorrencias: Ocorrencia[] = [];

      for (const [tipo, dups] of Object.entries(porTipo)) {
        if (dups.length > 0) {
          const nivel = tipo === 'identica' ? 'aviso' : 'info';
          const primeiraFunc = dups[0]?.funcaoA;

          const resumo = dups
            .map(
              (d) =>
                `${d.funcaoA?.nome || 'unknown'} ≈ ${d.funcaoB?.nome || 'unknown'} (${d.similaridade.toFixed(0)}%)`,
            )
            .slice(0, 3)
            .join(', ');

          ocorrencias.push(
            criarOcorrencia({
              tipo: 'codigo_duplicado',
              nivel,
              mensagem: DetectorAgregadosMessages.duplicacoesResumo(
                tipo,
                resumo,
                dups.length,
              ),
              relPath,
              linha: primeiraFunc?.inicio || 1,
            }),
          );
        }
      }

      return ocorrencias;
    } catch (erro) {
      return [
        criarOcorrencia({
          tipo: 'erro_analise',
          nivel: 'aviso',
          mensagem: DetectorAgregadosMessages.erroAnalisarDuplicacoes(erro),
          relPath,
          linha: 1,
        }),
      ];
    }
  },
};

function extrairFuncoes(
  ast: NodePath<Node>,
  caminho: string,
  src: string,
): BlocoFuncao[] {
  const funcoes: BlocoFuncao[] = [];
  const linhas = src.split('\n');

  traverse(ast.node, {
    FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
      const func = extrairInfoFuncao(path, caminho, 'declaration', linhas);
      if (func) funcoes.push(func);
    },

    FunctionExpression(path: NodePath<FunctionExpression>) {
      const func = extrairInfoFuncao(path, caminho, 'expression', linhas);
      if (func) funcoes.push(func);
    },

    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
      const func = extrairInfoFuncao(path, caminho, 'arrow', linhas);
      if (func) funcoes.push(func);
    },

    ObjectMethod(path: NodePath<ObjectMethod>) {
      const func = extrairInfoFuncao(path, caminho, 'method', linhas);
      if (func) funcoes.push(func);
    },

    ClassMethod(path: NodePath<ClassMethod>) {
      const func = extrairInfoFuncao(path, caminho, 'method', linhas);
      if (func) funcoes.push(func);
    },
  });

  return funcoes;
}

function extrairInfoFuncao(
  path: NodePath,
  caminho: string,
  tipoFuncao: BlocoFuncao['tipoFuncao'],
  linhas: string[],
): BlocoFuncao | null {
  const node = path.node;

  const inicio = node.loc?.start.line || 0;
  const fim = node.loc?.end.line || 0;

  // Ignorar funções muito pequenas
  if (fim - inicio < 3) {
    return null;
  }

  const conteudo = linhas.slice(inicio - 1, fim).join('\n');
  const conteudoNormalizado = normalizarConteudo(conteudo);
  // MD5 usado apenas para fingerprinting rápido de código (detecção de duplicação)
  // Não é usado para segurança/criptografia - contexto: cache de análise estática
  const hash = createHash('md5').update(conteudoNormalizado).digest('hex');

  // Extrair nome da função
  let nome = 'anonymous';
  if ('id' in node && node.id && 'name' in node.id) {
    nome = node.id.name;
  } else if ('key' in node && node.key && 'name' in node.key) {
    nome = node.key.name as string;
  } else if (path.parentPath?.isVariableDeclarator()) {
    const parent = path.parentPath.node;
    nome =
      'id' in parent && parent.id && 'name' in parent.id
        ? (parent.id.name as string)
        : 'assigned';
  }

  // Extrair parâmetros
  const parametros = (
    'params' in node && Array.isArray(node.params) ? node.params : []
  ).map((param: Node) => {
    // Function parameter nodes
    if (param.type === 'Identifier' && 'name' in param)
      return param.name as string; // Identifier node
    if (
      param.type === 'RestElement' &&
      'argument' in param &&
      param.argument &&
      'name' in param.argument
    ) {
      return `...${param.argument.name as string}`; // RestElement node
    }
    return param.type;
  });

  return {
    hash,
    conteudo: conteudoNormalizado,
    nome,
    caminho,
    inicio,
    fim,
    parametros,
    tipoFuncao,
    codigo: conteudoNormalizado,
  };
}

async function extrairFuncoesDoContexto(
  contexto: ContextoExecucao,
  caminhoAtual: string,
): Promise<BlocoFuncao[]> {
  const todasFuncoes: BlocoFuncao[] = [];

  // Limitar a análise a alguns arquivos para performance
  const arquivosParaComparar = contexto.arquivos
    .filter((arq) => arq.relPath !== caminhoAtual && arq.ast)
    .slice(0, 20); // Limitar para evitar overhead

  for (const arquivo of arquivosParaComparar) {
    if (arquivo.ast && arquivo.content) {
      // Verificar se o AST é do tipo correto (NodePath<Node>)
      if ('parent' in arquivo.ast && 'node' in arquivo.ast) {
        const funcoes = extrairFuncoes(
          arquivo.ast as NodePath<Node>,
          arquivo.relPath,
          arquivo.content,
        );
        todasFuncoes.push(...funcoes);
      }
    }
  }

  return todasFuncoes;
}

function detectarDuplicacoes(
  funcoesAtuais: BlocoFuncao[],
  todasFuncoes: BlocoFuncao[],
): DuplicacaoEncontrada[] {
  const duplicacoes: DuplicacaoEncontrada[] = [];

  for (const funcaoAtual of funcoesAtuais) {
    for (const outraFuncao of todasFuncoes) {
      // Não comparar função consigo mesma
      if (
        funcaoAtual.caminho === outraFuncao.caminho &&
        funcaoAtual.inicio === outraFuncao.inicio
      ) {
        continue;
      }

      const similaridade = calcularSimilaridade(funcaoAtual, outraFuncao);

      if (similaridade >= 80) {
        const tipoSimilaridade = determinarTipoSimilaridade(
          funcaoAtual,
          outraFuncao,
          similaridade,
        );

        duplicacoes.push({
          funcaoA: funcaoAtual,
          funcaoB: outraFuncao,
          similaridade,
          tipoSimilaridade,
          arquivo1: funcaoAtual.caminho || '',
          arquivo2: outraFuncao.caminho || '',
          bloco1: funcaoAtual,
          bloco2: outraFuncao,
        });
      }
    }
  }

  return duplicacoes;
}

function calcularSimilaridade(
  funcaoA: BlocoFuncao,
  funcaoB: BlocoFuncao,
): number {
  // Similaridade por hash (exata)
  if (funcaoA.hash === funcaoB.hash) {
    return 100;
  }

  // Similaridade estrutural (tokens)
  const tokensA = tokenizar(funcaoA.conteudo || '');
  const tokensB = tokenizar(funcaoB.conteudo || '');

  const similaridadeJaccard = calcularJaccard(tokensA, tokensB);

  // Bonus se parâmetros forem similares
  const similaridadeParametros = calcularSimilaridadeParametros(
    funcaoA.parametros || [],
    funcaoB.parametros || [],
  );

  return (similaridadeJaccard * 0.8 + similaridadeParametros * 0.2) * 100;
}

function determinarTipoSimilaridade(
  funcaoA: BlocoFuncao,
  funcaoB: BlocoFuncao,
  similaridade: number,
): DuplicacaoEncontrada['tipoSimilaridade'] {
  if (similaridade >= 95) return 'identica';
  if (similaridade >= 85) return 'estrutural';
  return 'semantica';
}

function normalizarConteudo(conteudo: string): string {
  return (
    conteudo
      // Remover comentários
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Normalizar espaços
      .replace(/\s+/g, ' ')
      // Remover espaços antes/depois de símbolos
      .replace(/\s*([{}();,])\s*/g, '$1')
      .trim()
  );
}

function tokenizar(texto: string): string[] {
  return texto
    .split(/[\s\(\)\{\}\[\];,\.]+/)
    .filter((token) => token.length > 0 && !/^[0-9]+$/.test(token)); // Remover números puros
}

function calcularJaccard(tokensA: string[], tokensB: string[]): number {
  const conjuntoA = new Set(tokensA);
  const conjuntoB = new Set(tokensB);

  const intersecao = new Set([...conjuntoA].filter((x) => conjuntoB.has(x)));
  const uniao = new Set([...conjuntoA, ...conjuntoB]);

  return uniao.size === 0 ? 0 : intersecao.size / uniao.size;
}

function calcularSimilaridadeParametros(
  paramsA: string[],
  paramsB: string[],
): number {
  if (paramsA.length === 0 && paramsB.length === 0) return 1;
  if (paramsA.length === 0 || paramsB.length === 0) return 0;

  const maxLength = Math.max(paramsA.length, paramsB.length);
  let matches = 0;

  for (let i = 0; i < maxLength; i++) {
    if (paramsA[i] === paramsB[i]) {
      matches++;
    }
  }

  return matches / maxLength;
}

function agruparPorTipoSimilaridade(
  duplicacoes: DuplicacaoEncontrada[],
): Record<string, DuplicacaoEncontrada[]> {
  return duplicacoes.reduce(
    (acc, dup) => {
      const tipo = dup.tipoSimilaridade;
      if (tipo) {
        if (!acc[tipo]) {
          acc[tipo] = [];
        }
        acc[tipo].push(dup);
      }
      return acc;
    },
    {} as Record<string, DuplicacaoEncontrada[]>,
  );
}
