// SPDX-License-Identifier: MIT
import type {
  ClassDeclaration,
  ImportDeclaration,
  Program,
  Statement,
  TSEnumDeclaration,
  TSInterfaceDeclaration,
  TSTypeAliasDeclaration,
  VariableDeclaration,
} from '/types';

import type {
  ArquetipoEstruturaDef,
  FileEntryWithAst,
  PackageJson,
  ResultadoDeteccaoArquetipo,
  SinaisProjetoAvancados,
} from '@';

export function scoreArquetipo(
  def: ArquetipoEstruturaDef,
  _arquivos: string[], // prefixo _ para ignorar warning de unused
  _sinaisAvancados?: SinaisProjetoAvancados, // prefixo _ para ignorar warning de unused
): ResultadoDeteccaoArquetipo {
  // Implementação fictícia para evitar erro de compilação
  return {
    nome: def.nome,
    descricao: def.descricao ?? '',
    score: 0,
    confidence: 0,
    matchedRequired: [],
    missingRequired: [],
    matchedOptional: [],
    dependencyMatches: [],
    filePatternMatches: [],
    forbiddenPresent: [],
    anomalias: [],
  };
}

export function extrairSinaisAvancados(
  fileEntries: FileEntryWithAst[],
  packageJson?: PackageJson,
  _p0?: unknown,
  _baseDir?: string,
  _arquivos?: string[],
): SinaisProjetoAvancados {
  // Auxiliar para checar se o nó possui id.name string
  const hasIdName = (node: unknown): node is { id: { name: string } } => {
    return (
      typeof node === 'object' &&
      node !== null &&
      'id' in node &&
      typeof (node as { id?: { name?: unknown } }).id?.name === 'string'
    );
  };

  const sinais: SinaisProjetoAvancados = {
    funcoes: 0,
    imports: [],
    variaveis: 0,
    tipos: [],
    classes: 0,
    frameworksDetectados: [],
    dependencias: [],
    scripts: [],
    pastasPadrao: [],
    arquivosPadrao: [],
    arquivosConfig: [],
    // Novos sinais inteligentes
    padroesArquiteturais: [],
    tecnologiasDominantes: [],
    complexidadeEstrutura: 'baixa',
    tipoDominante: 'desconhecido',
  };

  // Análise de padrões arquiteturais baseada no código
  const padroesDetectados = new Set<string>();
  const tecnologias = new Map<string, number>();

  for (const fe of fileEntries) {
    let body: Statement[] = [];
    if (
      fe.ast &&
      'node' in fe.ast &&
      fe.ast.node &&
      (fe.ast.node as Program).type === 'Program' &&
      Array.isArray((fe.ast.node as Program).body)
    ) {
      body = (fe.ast.node as Program).body;
    }

    // Análise inteligente de padrões
    const conteudo = fe.content || '';
    const relPath = fe.relPath.toLowerCase();

    // Detectar padrões MVC
    if (
      relPath.includes('controller') ||
      relPath.includes('model') ||
      relPath.includes('view')
    ) {
      padroesDetectados.add('mvc');
    }

    // Detectar padrões Repository/Service
    if (relPath.includes('repository') || relPath.includes('service')) {
      padroesDetectados.add('repository-service');
    }

    // Detectar hooks React
    if (conteudo.includes('useState') || conteudo.includes('useEffect')) {
      tecnologias.set('react-hooks', (tecnologias.get('react-hooks') || 0) + 1);
    }

    // Detectar async/await patterns
    if (conteudo.includes('async') && conteudo.includes('await')) {
      padroesDetectados.add('async-await');
    }

    // Detectar TypeScript advanced features
    if (conteudo.includes('interface') || conteudo.includes('type ')) {
      tecnologias.set(
        'typescript-advanced',
        (tecnologias.get('typescript-advanced') || 0) + 1,
      );
    }

    // Detectar padrões de CLI
    if (
      conteudo.includes('commander') ||
      conteudo.includes('yargs') ||
      relPath.includes('bin/')
    ) {
      padroesDetectados.add('cli-patterns');
    }

    // Funções
    sinais.funcoes += body.filter(
      (n): n is import('/types').FunctionDeclaration =>
        n.type === 'FunctionDeclaration',
    ).length;

    // Imports
    const imports = body.filter(
      (n): n is ImportDeclaration => n.type === 'ImportDeclaration',
    );
    sinais.imports.push(...imports.map((i) => i.source.value));

    // Variáveis
    sinais.variaveis += body.filter(
      (n): n is VariableDeclaration => n.type === 'VariableDeclaration',
    ).length;

    // Tipos (TypeScript)
    sinais.tipos.push(
      ...body
        .filter(
          (
            n,
          ): n is
            | TSTypeAliasDeclaration
            | TSInterfaceDeclaration
            | TSEnumDeclaration =>
            [
              'TSTypeAliasDeclaration',
              'TSInterfaceDeclaration',
              'TSEnumDeclaration',
            ].includes(n.type),
        )
        .map((n) => (hasIdName(n) ? n.id.name : undefined))
        .filter((v): v is string => typeof v === 'string'),
    );

    // Classes
    sinais.classes += body.filter(
      (n): n is ClassDeclaration => n.type === 'ClassDeclaration',
    ).length;

    // Frameworks por import (expandido)
    for (const i of imports) {
      if (typeof i.source.value === 'string') {
        const importSource = i.source.value.toLowerCase();

        // Frameworks web
        if (
          importSource.includes('react') ||
          importSource.includes('vue') ||
          importSource.includes('angular')
        ) {
          tecnologias.set(
            'frontend-framework',
            (tecnologias.get('frontend-framework') || 0) + 1,
          );
        }

        // Frameworks backend
        if (
          importSource.includes('express') ||
          importSource.includes('fastify') ||
          importSource.includes('nestjs')
        ) {
          tecnologias.set(
            'backend-framework',
            (tecnologias.get('backend-framework') || 0) + 1,
          );
        }

        // ORMs
        if (
          importSource.includes('prisma') ||
          importSource.includes('mongoose') ||
          importSource.includes('typeorm')
        ) {
          tecnologias.set('orm', (tecnologias.get('orm') || 0) + 1);
        }

        // Testing
        if (
          importSource.includes('jest') ||
          importSource.includes('vitest') ||
          importSource.includes('mocha')
        ) {
          tecnologias.set(
            'testing-framework',
            (tecnologias.get('testing-framework') || 0) + 1,
          );
        }

        // Lista original mantida
        if (
          /express|react|next|electron|discord\.js|telegraf/.test(importSource)
        ) {
          sinais.frameworksDetectados.push(i.source.value);
        }
      }
    }

    // Padrões de pastas/arquivos (expandido)
    const rel = fe.relPath.replace(/\\/g, '/');
    if (
      /src\/controllers|pages|api|prisma|packages|apps|src\/routes|src\/services|src\/repositories/.test(
        rel,
      )
    ) {
      sinais.pastasPadrao.push(rel);
    }
    if (
      /main\.js|index\.ts|bot\.ts|electron\.js|server\.js|app\.js/.test(rel)
    ) {
      sinais.arquivosPadrao.push(rel);
    }
    if (
      /tsconfig\.json|turbo\.json|pnpm-workspace\.yaml|webpack\.config|rollup\.config|vite\.config/.test(
        rel,
      )
    ) {
      sinais.arquivosConfig.push(rel);
    }
  }

  // Processar sinais inteligentes
  sinais.padroesArquiteturais = Array.from(padroesDetectados);

  // Determinar tecnologia dominante
  let maxCount = 0;
  let dominante = 'desconhecido';
  for (const [tech, count] of tecnologias) {
    if (count > maxCount) {
      maxCount = count;
      dominante = tech;
    }
  }
  sinais.tecnologiasDominantes = Array.from(tecnologias.keys());
  sinais.tipoDominante = dominante;

  // Determinar complexidade da estrutura
  const totalArquivos = fileEntries.length;
  const totalPastas = new Set(
    fileEntries.map((fe) => fe.relPath.split('/').slice(0, -1).join('/')),
  ).size;

  if (totalArquivos > 100 || totalPastas > 20) {
    sinais.complexidadeEstrutura = 'alta';
  } else if (totalArquivos > 50 || totalPastas > 10) {
    sinais.complexidadeEstrutura = 'media';
  } else {
    sinais.complexidadeEstrutura = 'baixa';
  }

  // Dependências e scripts do package.json
  if (packageJson) {
    sinais.dependencias.push(...Object.keys(packageJson.dependencies || {}));
    sinais.scripts.push(...Object.keys(packageJson.scripts || {}));
  }

  // Normaliza arrays
  sinais.imports = Array.from(new Set(sinais.imports));
  sinais.frameworksDetectados = Array.from(
    new Set(sinais.frameworksDetectados),
  );
  sinais.pastasPadrao = Array.from(new Set(sinais.pastasPadrao));
  sinais.arquivosPadrao = Array.from(new Set(sinais.arquivosPadrao));
  sinais.arquivosConfig = Array.from(new Set(sinais.arquivosConfig));
  sinais.tipos = Array.from(new Set(sinais.tipos));

  return sinais;
}
