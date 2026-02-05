// SPDX-License-Identifier: MIT
import type { NodePath } from '@babel/traverse';
import type {
  ExportNamedDeclaration,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Node,
} from '@babel/types';
import { traverse } from '@core/config/traverse.js';
import { DetectorArquiteturaMessages } from '@core/messages/analistas/detector-arquitetura-messages.js';
import * as path from 'path';

import type {
  AnaliseArquitetural,
  Analista,
  ContextoExecucao,
  EstatisticasArquivo,
  ExportInfo,
  ImportInfo,
  Ocorrencia,
} from '@';
import { criarOcorrencia } from '@';

export const analistaArquitetura: Analista = {
  nome: 'arquitetura',
  categoria: 'estrutura',
  descricao: 'Analisa padrões arquiteturais e detecta violações de design',

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
      // Analisar arquivo atual
      const estatisticasArquivo = analisarArquivo(ast, relPath, src);

      // Analisar todo o contexto para entender a arquitetura
      let analiseCompleta: AnaliseArquitetural | undefined;
      const ocorrencias: Ocorrencia[] = [];
      try {
        analiseCompleta = await analisarArquiteturaCompleta(
          contexto,
          estatisticasArquivo,
        );
      } catch (erro) {
        // Em caso de falha na análise contextual, registre ocorrência e continue sem travar
        return [
          criarOcorrencia({
            tipo: 'erro-analise',
            nivel: 'aviso',
            mensagem: DetectorArquiteturaMessages.erroAnalisarArquitetura(erro),
            relPath,
            linha: 1,
          }),
        ];
      }

      // Relatório principal da arquitetura
      ocorrencias.push(
        criarOcorrencia({
          tipo: 'analise-arquitetura',
          nivel:
            (analiseCompleta.violacoes?.length ?? 0) > 0 ? 'aviso' : 'info',
          mensagem: DetectorArquiteturaMessages.padraoArquitetural(
            analiseCompleta.padraoIdentificado,
            analiseCompleta.confianca ?? 0,
          ),
          relPath,
          linha: 1,
        }),
      );

      // Relatório de características
      if ((analiseCompleta.caracteristicas?.length ?? 0) > 0) {
        ocorrencias.push(
          criarOcorrencia({
            tipo: 'caracteristicas-arquitetura',
            nivel: 'info',
            mensagem: DetectorArquiteturaMessages.caracteristicas(
              analiseCompleta.caracteristicas || [],
            ),
            relPath,
            linha: 1,
          }),
        );
      }

      // Relatório de violações
      for (const violacao of (analiseCompleta.violacoes ?? []).slice(0, 3)) {
        ocorrencias.push(
          criarOcorrencia({
            tipo: 'violacao-arquitetura',
            nivel: 'aviso',
            mensagem: DetectorArquiteturaMessages.violacao(violacao),
            relPath,
            linha: 1,
          }),
        );
      }

      // Métricas de qualidade
      const metricas = analiseCompleta.metricas;
      if (
        metricas &&
        typeof metricas === 'object' &&
        'acoplamento' in metricas &&
        'coesao' in metricas
      ) {
        if ((metricas.acoplamento ?? 0) > 0.7 || (metricas.coesao ?? 1) < 0.3) {
          ocorrencias.push(
            criarOcorrencia({
              tipo: 'metricas-arquitetura',
              nivel: 'aviso',
              mensagem: DetectorArquiteturaMessages.metricas(
                metricas.acoplamento ?? 0,
                metricas.coesao ?? 0,
              ),
              relPath,
              linha: 1,
            }),
          );
        }
      }

      return ocorrencias;
    } catch (erro) {
      return [
        criarOcorrencia({
          tipo: 'erro-analise',
          nivel: 'aviso',
          mensagem: DetectorArquiteturaMessages.erroAnalisarArquitetura(erro),
          relPath,
          linha: 1,
        }),
      ];
    }
  },
};

function analisarArquivo(
  ast: NodePath<Node>,
  relPath: string,
  _src: string,
): EstatisticasArquivo {
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];
  const dependenciasExternas: string[] = [];
  const dependenciasInternas: string[] = [];
  const aliases: Record<string, number> = {};
  let complexidade = 0;

  traverse(ast.node, {
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      const origem = path.node.source.value;
      const items = path.node.specifiers.map(
        (
          spec:
            | ImportSpecifier
            | ImportDefaultSpecifier
            | ImportNamespaceSpecifier,
        ) => {
          // Mixed import specifier types
          if (spec.type === 'ImportDefaultSpecifier') return 'default';
          if (spec.type === 'ImportNamespaceSpecifier') return '*';
          return spec.local.name;
        },
      );

      let tipo: ImportInfo['tipo'] = 'external';

      if (origem.startsWith('@')) {
        tipo = 'alias';
        const alias = origem.split('/')[0];
        aliases[alias] = (aliases[alias] || 0) + 1;
        dependenciasInternas.push(origem);
      } else if (origem.startsWith('.')) {
        tipo = 'relative';
        dependenciasInternas.push(origem);
      } else {
        dependenciasExternas.push(origem);
      }

      imports.push({ origem, tipo, items });
    },

    ExportNamedDeclaration(path: NodePath<ExportNamedDeclaration>) {
      if (path.node.declaration) {
        // export const/function/class/etc
        const decl = path.node.declaration; // ExportDeclaration node
        if ('id' in decl && decl.id && 'name' in decl.id) {
          exports.push({ nome: decl.id.name as string, tipo: 'named' });
        } else if ('declarations' in decl && decl.declarations) {
          // export const a = ..., b = ...
          for (const declarator of decl.declarations) {
            if (declarator.id && 'name' in declarator.id) {
              exports.push({
                nome: declarator.id.name as string,
                tipo: 'named',
              });
            }
          }
        }
      } else {
        // export { a, b }
        for (const spec of path.node.specifiers) {
          // ExportSpecifier nodes
          const name =
            'exported' in spec &&
            spec.exported.type === 'Identifier' &&
            'name' in spec.exported
              ? (spec.exported.name as string)
              : 'exported';
          exports.push({ nome: name, tipo: 'named' });
        }
      }
    },

    ExportDefaultDeclaration() {
      exports.push({ nome: 'default', tipo: 'default' });
    },

    // Calcular complexidade ciclomática básica
    'IfStatement|WhileStatement|ForStatement|DoWhileStatement|SwitchCase|CatchClause'() {
      complexidade++;
    },

    'ConditionalExpression|LogicalExpression'() {
      complexidade++;
    },
  });

  return {
    caminho: relPath,
    imports,
    exports,
    dependenciasExternas,
    dependenciasInternas,
    aliases,
    complexidade: complexidade || 1,
  };
}

async function analisarArquiteturaCompleta(
  contexto: ContextoExecucao,
  arquivoAtual: EstatisticasArquivo,
): Promise<AnaliseArquitetural> {
  // Analisar todos os arquivos para entender a arquitetura geral
  const todasEstatisticas: EstatisticasArquivo[] = [];

  for (const arquivo of contexto.arquivos.slice(0, 50)) {
    // Limitar para performance
    if (
      arquivo.ast &&
      arquivo.content &&
      arquivo.relPath.match(/\.(js|jsx|ts|tsx)$/)
    ) {
      // Verificar se o AST é do tipo correto (NodePath<Node>)
      if ('parent' in arquivo.ast && 'node' in arquivo.ast) {
        const stats = analisarArquivo(
          arquivo.ast as NodePath<Node>,
          arquivo.relPath,
          arquivo.content,
        );
        todasEstatisticas.push(stats);
      }
    }
  }

  todasEstatisticas.push(arquivoAtual);

  // Detectar padrão arquitetural
  const padraoDetectado = detectarPadraoArquitetural(todasEstatisticas);

  // Calcular métricas
  const metricas = calcularMetricas(todasEstatisticas);

  // Detectar violações
  const violacoes = detectarViolacoes(todasEstatisticas, padraoDetectado);

  // Gerar características
  const caracteristicas = gerarCaracteristicas(todasEstatisticas);

  return {
    padraoIdentificado: padraoDetectado.tipo,
    confianca: padraoDetectado.confianca,
    caracteristicas,
    violacoes,
    recomendacoes: [],
    metricas,
    imports: [], // Propriedade obrigatória do tipo AnaliseArquitetural
    exports: [], // Propriedade obrigatória do tipo AnaliseArquitetural
    stats: arquivoAtual, // Propriedade obrigatória do tipo AnaliseArquitetural
  };
}

function detectarPadraoArquitetural(estatisticas: EstatisticasArquivo[]): {
  tipo: string;
  confianca: number;
} {
  const aliases = new Set<string>();
  let temNucleo = false;
  let temAnalistas = false;
  let _temCLI = false;
  let temShared = false;
  let temTipos = false;

  // Analisar uso de aliases
  for (const stats of estatisticas) {
    if (stats.aliases) {
      Object.keys(stats.aliases).forEach((alias) => aliases.add(alias));

      if (stats.aliases['@nucleo']) temNucleo = true;
      if (stats.aliases['@analistas']) temAnalistas = true;
      if (stats.aliases['@cli']) _temCLI = true;
      if (stats.aliases['@shared']) temShared = true;
      if (stats.aliases['@types']) temTipos = true;
    }
  }

  // Detectar dependências circulares
  const temDependenciasCirculares =
    detectarDependenciasCirculares(estatisticas);

  // Regras de detecção
  if (temNucleo && temAnalistas && !temDependenciasCirculares) {
    if (temShared && temTipos) {
      return {
        tipo: 'Arquitetura Hexagonal com Clean Architecture',
        confianca: 90,
      };
    }
    return {
      tipo: 'Arquitetura Hexagonal (Ports and Adapters)',
      confianca: 85,
    };
  }

  if (aliases.size >= 4 && temTipos) {
    return { tipo: 'Arquitetura Modular Bem Estruturada', confianca: 80 };
  }

  if (aliases.size >= 2) {
    return { tipo: 'Arquitetura Modular', confianca: 70 };
  }

  if (temDependenciasCirculares) {
    return { tipo: 'Arquitetura com Problemas de Acoplamento', confianca: 60 };
  }

  return { tipo: 'Arquitetura Simples ou Monolítica', confianca: 50 };
}

function calcularMetricas(
  estatisticas: EstatisticasArquivo[],
): AnaliseArquitetural['metricas'] {
  if (estatisticas.length === 0) {
    return { modularidade: 0, acoplamento: 0, coesao: 0, complexidadeMedia: 0 };
  }

  // Modularidade = uso de aliases / total de imports
  const totalImports = estatisticas.reduce((sum, s) => {
    if (Array.isArray(s.imports)) {
      return sum + s.imports.length;
    } else if (typeof s.imports === 'number') {
      return sum + s.imports;
    }
    return sum;
  }, 0);

  const importsAlias = estatisticas.reduce((sum, s) => {
    if (Array.isArray(s.imports)) {
      return (
        sum + s.imports.filter((i: ImportInfo) => i.tipo === 'alias').length
      );
    }
    return sum;
  }, 0);

  const modularidade = totalImports > 0 ? importsAlias / totalImports : 0;

  // Acoplamento = dependências externas / total de dependências
  const totalDeps = estatisticas.reduce((sum, s) => {
    const externas = s.dependenciasExternas?.length ?? 0;
    const internas = s.dependenciasInternas?.length ?? 0;
    return sum + externas + internas;
  }, 0);

  const depsExternas = estatisticas.reduce((sum, s) => {
    return sum + (s.dependenciasExternas?.length ?? 0);
  }, 0);

  const acoplamento = totalDeps > 0 ? depsExternas / totalDeps : 0;

  // Coesão = exports / imports (simplificado)
  const totalExports = estatisticas.reduce((sum, s) => {
    if (Array.isArray(s.exports)) {
      return sum + s.exports.length;
    } else if (typeof s.exports === 'number') {
      return sum + s.exports;
    }
    return sum;
  }, 0);

  const coesao =
    totalImports > 0 ? Math.min(totalExports / totalImports, 1) : 0;

  // Complexidade média
  const complexidadeMedia =
    estatisticas.reduce((sum, s) => sum + (s.complexidade ?? 0), 0) /
    estatisticas.length;

  return {
    modularidade: Math.max(0, Math.min(1, modularidade)),
    acoplamento: Math.max(0, Math.min(1, acoplamento)),
    coesao: Math.max(0, Math.min(1, coesao)),
    complexidadeMedia,
  };
}

function detectarViolacoes(
  estatisticas: EstatisticasArquivo[],
  _padrao: { tipo: string; confianca: number },
): string[] {
  const violacoes: string[] = [];

  // Detectar imports relativos excessivos
  const totalImports = estatisticas.reduce((sum, s) => {
    if (Array.isArray(s.imports)) {
      return sum + s.imports.length;
    } else if (typeof s.imports === 'number') {
      return sum + s.imports;
    }
    return sum;
  }, 0);

  const importsRelativos = estatisticas.reduce((sum, s) => {
    if (Array.isArray(s.imports)) {
      return (
        sum + s.imports.filter((i: ImportInfo) => i.tipo === 'relative').length
      );
    }
    return sum;
  }, 0);

  if (totalImports > 0 && importsRelativos / totalImports > 0.3) {
    violacoes.push('Uso excessivo de imports relativos (>30%)');
  }

  // Detectar arquivos com muitas dependências
  for (const stats of estatisticas) {
    const importsCount = Array.isArray(stats.imports)
      ? stats.imports.length
      : typeof stats.imports === 'number'
        ? stats.imports
        : 0;

    if (importsCount > 20) {
      const caminho = stats.caminho ?? 'arquivo-desconhecido';
      violacoes.push(
        `Arquivo ${path.basename(caminho)} com muitas dependências (${importsCount})`,
      );
    }
  }

  return violacoes;
}

function gerarCaracteristicas(estatisticas: EstatisticasArquivo[]): string[] {
  const caracteristicas: string[] = [];

  const aliases = new Set<string>();
  estatisticas.forEach((s) => {
    if (s.aliases) {
      Object.keys(s.aliases).forEach((a) => aliases.add(a));
    }
  });

  if (aliases.size > 0) {
    caracteristicas.push(`Uso de ${aliases.size} aliases de importação`);
  }

  const mediaComplexidade =
    estatisticas.reduce((sum, s) => sum + (s.complexidade ?? 0), 0) /
    estatisticas.length;
  caracteristicas.push(`Complexidade média: ${mediaComplexidade.toFixed(1)}`);

  const totalExports = estatisticas.reduce((sum, s) => {
    if (Array.isArray(s.exports)) {
      return sum + s.exports.length;
    } else if (typeof s.exports === 'number') {
      return sum + s.exports;
    }
    return sum;
  }, 0);

  caracteristicas.push(`${totalExports} exports públicos`);

  return caracteristicas;
}

function detectarDependenciasCirculares(
  estatisticas: EstatisticasArquivo[],
): boolean {
  // Simplificado: detectar se há imports bidirecionais
  const dependencias = new Map<string, Set<string>>();

  for (const stats of estatisticas) {
    const caminho = stats.caminho ?? 'arquivo-desconhecido';
    const deps = new Set<string>();
    if (stats.dependenciasInternas) {
      stats.dependenciasInternas.forEach((dep) => deps.add(dep));
    }
    dependencias.set(caminho, deps);
  }

  // Verificar ciclos simples (A -> B -> A)
  for (const [arquivo, deps] of dependencias) {
    for (const dep of deps) {
      const depsDoDepdep = dependencias.get(dep);
      if (depsDoDepdep?.has(arquivo)) {
        return true;
      }
    }
  }

  return false;
}
