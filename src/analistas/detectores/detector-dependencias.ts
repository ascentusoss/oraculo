// SPDX-License-Identifier: MIT
import path from 'node:path';

import type { NodePath } from '/traverse';
import type * as t from '/types';
import { config } from '/config/config.js';
import { traverse } from '/config/traverse.js';
import { DetectorDependenciasMessages } from '/messages/analistas/detector-dependencias-messages.js';

import type { ContextoExecucao, Ocorrencia, TecnicaAplicarResultado } from '@';

export const grafoDependencias = new Map<string, Set<string>>();

/**
 * Registro global de imports identificados como usados via registro dinâmico.
 * Chave: relPath do arquivo, Valor: Set de nomes de imports considerados usados.
 * Outros detectores podem consultar antes de reportar "import não usado".
 */
export const importsUsadosDinamicamente = new Map<string, Set<string>>();

/**
 * Normaliza o caminho de import para uma chave consistente.
 */

function normalizarPosix(p: string): string {
  return path.posix.normalize((p || '').replace(/\\/g, '/'));
}

function ehImportSomenteTipo(node: t.ImportDeclaration): boolean {
  const kind = (node as unknown as { importKind?: string }).importKind;
  if (kind === 'type') return true;
  // Caso: import { type A } from './x'
  const specifiers = node.specifiers || [];
  if (specifiers.length === 0) return false; // import side-effect sempre é runtime
  return specifiers.every((s) => {
    const sk = (s as unknown as { importKind?: string }).importKind;
    return sk === 'type';
  });
}

function resolverArquivoExistente(
  caminho: string,
  arquivosExistentes: Set<string>,
): string {
  const alvo = normalizarPosix(caminho);
  if (arquivosExistentes.has(alvo)) return alvo;

  const ext = path.posix.extname(alvo);
  const base = ext ? alvo.slice(0, -ext.length) : alvo;

  // Padrão TS ESM: importar "./x.js" em .ts, mas o arquivo real é "./x.ts"
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    const candidates = [
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.mjs`,
      `${base}.cjs`,
    ];
    for (const c of candidates) {
      const n = normalizarPosix(c);
      if (arquivosExistentes.has(n)) return n;
    }
  }

  if (ext === '.jsx') {
    const candidates = [`${base}.tsx`, `${base}.ts`, `${base}.jsx`];
    for (const c of candidates) {
      const n = normalizarPosix(c);
      if (arquivosExistentes.has(n)) return n;
    }
  }

  // Sem extensão: tenta variações comuns e index.*
  if (!ext) {
    const candidates = [
      `${alvo}.ts`,
      `${alvo}.tsx`,
      `${alvo}.js`,
      `${alvo}.jsx`,
      `${alvo}.mjs`,
      `${alvo}.cjs`,
      `${alvo}.d.ts`,
      `${alvo}/index.ts`,
      `${alvo}/index.tsx`,
      `${alvo}/index.js`,
      `${alvo}/index.mjs`,
      `${alvo}/index.cjs`,
    ];
    for (const c of candidates) {
      const n = normalizarPosix(c);
      if (arquivosExistentes.has(n)) return n;
    }
  }

  return alvo;
}

function resolverModulo(
  mod: string,
  relPath: string,
  arquivosExistentes?: Set<string>,
): { key: string; existe: boolean } {
  // Externo (node_modules / builtin): mantém como está
  if (!mod.startsWith('.') && !mod.startsWith('/')) {
    return { key: mod, existe: true };
  }

  // Import absoluto: trata como caminho normalizado
  if (mod.startsWith('/')) {
    const absNorm = normalizarPosix(mod);
    if (!arquivosExistentes) return { key: absNorm, existe: true };
    const resolved = resolverArquivoExistente(absNorm, arquivosExistentes);
    return { key: resolved, existe: arquivosExistentes.has(resolved) };
  }

  // Relativo
  const fromDir = normalizarPosix(path.posix.dirname(normalizarPosix(relPath)));
  const joined = normalizarPosix(path.posix.join(fromDir, mod));
  if (!arquivosExistentes) return { key: joined, existe: true };
  const resolved = resolverArquivoExistente(joined, arquivosExistentes);
  return { key: resolved, existe: arquivosExistentes.has(resolved) };
}

function verificarCicloConfirmado(
  ciclo: string[],
  grafo: Map<string, Set<string>>,
  arquivosExistentes?: Set<string>,
): boolean {
  if (ciclo.length < 2) return false;
  if (!arquivosExistentes) return true; // sem contexto suficiente: não bloqueia

  // 1) nós existem no conjunto de arquivos
  for (const no of ciclo) {
    const n = normalizarPosix(no);
    if (!arquivosExistentes.has(n)) return false;
  }

  // 2) arestas existem no grafo (forma normalizada)
  for (let i = 0; i < ciclo.length - 1; i++) {
    const de = normalizarPosix(ciclo[i]);
    const para = normalizarPosix(ciclo[i + 1]);
    const deps = grafo.get(de);
    if (!deps) return false;
    const depsNorm = new Set(Array.from(deps).map((d) => normalizarPosix(d)));
    if (!depsNorm.has(para)) return false;
  }

  return true;
}

/**
 * Detecta ciclos complexos no grafo de dependências usando DFS aprimorado
 *
 * Melhorias para reduzir falsos positivos:
 * - Normaliza caminhos antes de comparar
 * - Resolve caminhos relativos para absolutos
 * - Ignora dependências de tipo (type-only imports)
 * - Valida que o ciclo é real (todos os nós existem no grafo)
 * - Retorna caminho completo e limpo do ciclo
 *
 *  inicio - Arquivo inicial para busca
 *  grafo - Grafo de dependências completo
 *  maxProfundidade - Profundidade máxima de busca (evita loops infinitos)
 *  Array com caminho do ciclo, ou vazio se não houver ciclo
 */
function detectarCicloComplexo(
  inicio: string,
  grafo: Map<string, Set<string>>,
  maxProfundidade = 5,
): string[] {
  const visitados = new Set<string>();
  const pilha = new Set<string>();
  const caminho: string[] = [];

  // Normaliza o caminho inicial
  const inicioNormalizado = path.normalize(inicio).replace(/\\/g, '/');

  // Helper para resolver caminho relativo a partir de um arquivo
  function resolverCaminho(from: string, to: string): string {
    if (to.startsWith('.')) {
      const fromDir = path.dirname(from);
      const resolved = path.join(fromDir, to);
      return path.normalize(resolved).replace(/\\/g, '/');
    }
    return path.normalize(to).replace(/\\/g, '/');
  }

  // Helper para encontrar dependências no grafo mesmo com paths diferentes
  function buscarDependencias(arquivo: string): Set<string> | undefined {
    const normalizado = path.normalize(arquivo).replace(/\\/g, '/');

    // Tenta buscar diretamente
    if (grafo.has(arquivo)) return grafo.get(arquivo);
    if (grafo.has(normalizado)) return grafo.get(normalizado);

    // Tenta encontrar chave equivalente no grafo
    for (const [chave, deps] of grafo.entries()) {
      if (path.normalize(chave).replace(/\\/g, '/') === normalizado) {
        return deps;
      }
    }

    return undefined;
  }

  function dfs(atual: string, profundidade: number): boolean {
    if (profundidade > maxProfundidade) return false;

    // Normaliza o caminho atual para comparação consistente
    const atualNormalizado = path.normalize(atual).replace(/\\/g, '/');

    if (pilha.has(atualNormalizado)) {
      // Ciclo encontrado - verificar se é real
      const indiceCiclo = caminho.findIndex(
        (p) => path.normalize(p).replace(/\\/g, '/') === atualNormalizado,
      );
      if (indiceCiclo >= 0) {
        // Adiciona o nó atual para fechar o ciclo
        caminho.push(atualNormalizado);
        return true;
      }
      return false;
    }

    if (visitados.has(atualNormalizado)) return false;

    visitados.add(atualNormalizado);
    pilha.add(atualNormalizado);
    caminho.push(atualNormalizado);

    const dependencias = buscarDependencias(atual);
    if (dependencias) {
      for (const dep of dependencias) {
        // Ignora dependências externas (node_modules)
        if (
          !dep.startsWith('.') &&
          !dep.startsWith('/') &&
          !dep.startsWith('src')
        )
          continue;

        // Resolve e normaliza a dependência
        const depResolvida = resolverCaminho(atualNormalizado, dep);

        if (dfs(depResolvida, profundidade + 1)) {
          return true;
        }
      }
    }

    pilha.delete(atualNormalizado);
    caminho.pop();
    return false;
  }

  if (dfs(inicioNormalizado, 0)) {
    // Extrai apenas a parte cíclica do caminho
    const ultimoNo = caminho[caminho.length - 1];
    const indiceCiclo = caminho.findIndex(
      (p) => path.normalize(p).replace(/\\/g, '/') === ultimoNo,
    );

    if (indiceCiclo >= 0) {
      const cicloCompleto = caminho.slice(indiceCiclo);

      // Valida que todos os nós do ciclo existem no grafo
      const cicloValido = cicloCompleto.every((no) => {
        const normalizado = path.normalize(no).replace(/\\/g, '/');
        return (
          grafo.has(no) ||
          grafo.has(normalizado) ||
          Array.from(grafo.keys()).some(
            (k) => path.normalize(k).replace(/\\/g, '/') === normalizado,
          )
        );
      });

      return cicloValido ? cicloCompleto : [];
    }
  }

  return [];
}

/**
 * Verifica se um import é usado em padrões de registro dinâmico
 * (ex: registry.register, app.use, plugin.registerPlugin, client.on)
 *
 * Cobertura expandida para Discord.js, Express, Fastify, e outros frameworks:
 * - registry.register(handler) | register(handler)
 * - app.use(middleware) | router.use(handler)
 * - client.on('event', handler)
 * - app.get/post(path, handler)
 *
 *  Exportada para reuso em outros detectores
 */
export function isUsadoEmRegistroDinamico(
  src: string,
  importName: string,
): boolean {
  // Padrões comuns de registro dinâmico (escapar ponto literal com \\.)
  const padroesRegistro = [
    // Genéricos
    `register\\(\\s*${importName}`,
    `\\.register\\(\\s*${importName}`,
    `use\\(\\s*${importName}`,
    `\\.use\\(\\s*${importName}`,
    `registerPlugin\\(\\s*${importName}`,
    `addPlugin\\(\\s*${importName}`,
    `apply\\(\\s*${importName}`,
    `\\.apply\\(\\s*${importName}`,
    `load\\(\\s*${importName}`,
    `\\.load\\(\\s*${importName}`,
    // Discord.js event handlers
    `\\.on\\(\\s*[^,]+,\\s*${importName}\\s*\\)`,
    `\\.once\\(\\s*[^,]+,\\s*${importName}\\s*\\)`,
    // Express/Fastify routes (app.get/post/put/delete)
    `\\.(?:get|post|put|delete|patch|options|head)\\(\\s*[^,]+,\\s*${importName}\\s*\\)`,
    // Array spread/push pattern: [...handlers, importName] | handlers.push(importName)
    `\\[\\s*[^\\]]*${importName}[^\\]]*\\]`,
    `\\.push\\(\\s*${importName}\\s*\\)`,
    // NestJS patterns
    `providers\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
    `controllers\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
    `imports\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
    `exports\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
    // Vue/React component registration
    `components\\s*:\\s*\\{[^}]*${importName}[^}]*\\}`,
    // Redux/Zustand
    `combineReducers\\s*\\(\\s*\\{[^}]*${importName}[^}]*\\}`,
    // Generic object assignment where import is value
    `:\\s*${importName}\\s*[,}]`,
  ];

  return padroesRegistro.some((padrao) => new RegExp(padrao).test(src));
}

/**
 * Analisa dependências do arquivo (import/require), detecta padrões problemáticos e atualiza grafo global.
 * Retorna ocorrências para imports/require suspeitos, mistos, circulares, etc.
 */
export const detectorDependencias = {
  nome: 'detector-dependencias',
  test(relPath: string): boolean {
    return relPath.endsWith('.ts') || relPath.endsWith('.js');
  },

  aplicar(
    src: string,
    relPath: string,
    ast: NodePath | null,
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado {
    if (!ast) return [];

    const ocorrencias: Ocorrencia[] = [];
    const tiposImport: Set<'import' | 'require'> = new Set();
    const arquivosExistentes = contexto
      ? new Set(contexto.arquivos.map((f) => f.relPath))
      : undefined;
    // Conjunto de dependências (criado sob demanda quando houver refs)
    let depsSet: Set<string> | undefined = grafoDependencias.get(relPath);

    // Rastreia imports para detectar uso dinâmico
    const importsDeclarados = new Set<string>();

    // Detecta padrões problemáticos
    traverse(ast.node, {
      ImportDeclaration(p: NodePath<t.ImportDeclaration>) {
        const somenteTipo = ehImportSomenteTipo(p.node);
        if (!somenteTipo) tiposImport.add('import');
        const val = p.node.source.value;

        // Import type-only não participa do grafo nem de validações runtime
        if (somenteTipo) {
          // Ainda rastreia nomes para evitar ruído em heurísticas posteriores
          const specifiers = p.node.specifiers || [];
          for (const s of specifiers) {
            if (
              s.type === 'ImportDefaultSpecifier' ||
              s.type === 'ImportSpecifier'
            ) {
              importsDeclarados.add(s.local.name);
            } else if (s.type === 'ImportNamespaceSpecifier') {
              importsDeclarados.add(s.local.name);
            }
          }
          return;
        }

        const resolved = resolverModulo(val, relPath, arquivosExistentes);

        // Alimenta grafo
        if (!depsSet) {
          depsSet = new Set<string>();
          grafoDependencias.set(relPath, depsSet);
        }
        depsSet.add(resolved.key);
        // Import externo
        if (!val.startsWith('.') && !val.startsWith('/')) {
          ocorrencias.push({
            tipo: 'info',
            mensagem:
              DetectorDependenciasMessages.importDependenciaExterna(val),
            relPath,
            linha: p.node.loc?.start.line,
            coluna: p.node.loc?.start.column,
          });
        }
        // Import relativo longo
        if (val.startsWith('.') && val.split('../').length > 3) {
          ocorrencias.push({
            tipo: 'aviso',
            mensagem: DetectorDependenciasMessages.importRelativoLongo(val),
            relPath,
            linha: p.node.loc?.start.line,
            coluna: p.node.loc?.start.column,
          });
        }
        // Import de .js em projeto TS
        if (
          relPath.endsWith('.ts') &&
          val.endsWith('.js') &&
          !resolved.key.endsWith('.ts')
        ) {
          ocorrencias.push({
            tipo: 'aviso',
            mensagem: DetectorDependenciasMessages.importJsEmTs(val),
            relPath,
            linha: p.node.loc?.start.line,
            coluna: p.node.loc?.start.column,
          });
        }
        // Import de arquivo inexistente (só para caminhos relativos)
        if (val.startsWith('.')) {
          if (arquivosExistentes && !resolved.existe) {
            ocorrencias.push({
              tipo: 'erro',
              mensagem:
                DetectorDependenciasMessages.importArquivoInexistente(val),
              relPath,
              linha: p.node.loc?.start.line,
              coluna: p.node.loc?.start.column,
            });
          }
        }
        // Rastrear import names para heurística de uso dinâmico
        const specifiers = p.node.specifiers || [];
        for (const s of specifiers) {
          if (
            s.type === 'ImportDefaultSpecifier' ||
            s.type === 'ImportSpecifier'
          ) {
            importsDeclarados.add(s.local.name);
          } else if (s.type === 'ImportNamespaceSpecifier') {
            importsDeclarados.add(s.local.name);
          }
        }
      },
      CallExpression(p: NodePath<t.CallExpression>) {
        const { callee, arguments: args } = p.node;
        if (
          callee.type === 'Identifier' &&
          callee.name === 'require' &&
          args[0]?.type === 'StringLiteral'
        ) {
          tiposImport.add('require');
          const val = args[0].value;
          const resolved = resolverModulo(val, relPath, arquivosExistentes);
          // Alimenta grafo
          if (!depsSet) {
            depsSet = new Set<string>();
            grafoDependencias.set(relPath, depsSet);
          }
          depsSet.add(resolved.key);
          // Require externo
          if (!val.startsWith('.') && !val.startsWith('/')) {
            ocorrencias.push({
              tipo: 'info',
              mensagem:
                DetectorDependenciasMessages.requireDependenciaExterna(val),
              relPath,
              linha: p.node.loc?.start.line,
              coluna: p.node.loc?.start.column,
            });
          }
          // Require relativo longo
          if (val.startsWith('.') && val.split('../').length > 3) {
            ocorrencias.push({
              tipo: 'aviso',
              mensagem: DetectorDependenciasMessages.requireRelativoLongo(val),
              relPath,
              linha: p.node.loc?.start.line,
              coluna: p.node.loc?.start.column,
            });
          }
          // Require de .js em projeto TS
          if (
            relPath.endsWith('.ts') &&
            val.endsWith('.js') &&
            !resolved.key.endsWith('.ts')
          ) {
            ocorrencias.push({
              tipo: 'aviso',
              mensagem: DetectorDependenciasMessages.requireJsEmTs(val),
              relPath,
              linha: p.node.loc?.start.line,
              coluna: p.node.loc?.start.column,
            });
          }
          // Require de arquivo inexistente (só para caminhos relativos)
          if (val.startsWith('.')) {
            if (arquivosExistentes && !resolved.existe) {
              ocorrencias.push({
                tipo: 'erro',
                mensagem:
                  DetectorDependenciasMessages.requireArquivoInexistente(val),
                relPath,
                linha: p.node.loc?.start.line,
                coluna: p.node.loc?.start.column,
              });
            }
          }
        }
      },
    });

    // Heurística: marcar imports como usados quando aparecem em registros dinâmicos comuns
    if (importsDeclarados.size > 0) {
      // Inicializa registro para este arquivo
      let usadosDinamicos = importsUsadosDinamicamente.get(relPath);

      for (const nome of Array.from(importsDeclarados)) {
        const usado = isUsadoEmRegistroDinamico(src, nome);
        if (usado) {
          // Registra no mapa global para consulta por outros detectores
          if (!usadosDinamicos) {
            usadosDinamicos = new Set<string>();
            importsUsadosDinamicamente.set(relPath, usadosDinamicos);
          }
          usadosDinamicos.add(nome);

          // Emite info apenas em modo verbose (não polui relatórios normais)
          if (config.VERBOSE) {
            ocorrencias.push({
              tipo: 'info',
              mensagem:
                DetectorDependenciasMessages.importUsadoRegistroDinamico(nome),
              relPath,
            });
          }
        }
      }
    }

    // Mistura de require/import
    if (tiposImport.size > 1) {
      ocorrencias.push({
        tipo: 'aviso',
        mensagem: DetectorDependenciasMessages.usoMistoRequireImport,
        relPath,
      });
    }

    // Detecta import circular simples (arquivo importa a si mesmo)
    if (grafoDependencias.get(relPath)?.has(relPath)) {
      ocorrencias.push({
        tipo: 'alerta',
        mensagem: DetectorDependenciasMessages.importCircularSelf,
        relPath,
      });
    }

    // Detecta ciclos mais complexos (A -> B -> C -> A)
    const maxDepth =
      typeof (config as unknown as Record<string, unknown>)
        .DEPENDENCIAS_MAX_PROFUNDIDADE === 'number'
        ? (config as unknown as { DEPENDENCIAS_MAX_PROFUNDIDADE: number })
            .DEPENDENCIAS_MAX_PROFUNDIDADE
        : 5;
    const ciclo = detectarCicloComplexo(relPath, grafoDependencias, maxDepth);
    if (ciclo.length > 1) {
      const verifyCycles = Boolean(
        (config as unknown as Record<string, unknown>)['SPECIAL_VERIFY_CYCLES'],
      );
      if (
        verifyCycles &&
        !verificarCicloConfirmado(ciclo, grafoDependencias, arquivosExistentes)
      ) {
        return Array.isArray(ocorrencias) ? ocorrencias : [];
      }

      // Apenas reporta se ciclo tem mais de 1 nó (evita falsos positivos)
      // Remove caminhos base para deixar mais legível
      const caminhoLimpo = ciclo.map((p) => {
        const relativo = path.relative(process.cwd(), p) || p;
        return relativo.replace(/\\/g, '/');
      });
      const caminhoCompleto = caminhoLimpo.join(' → ');

      ocorrencias.push({
        tipo: 'alerta',
        mensagem: DetectorDependenciasMessages.dependenciaCircular(
          ciclo.length,
          caminhoCompleto,
        ),
        relPath,
        // Adiciona contexto extra para debugging
        contexto: `Ciclo completo: ${caminhoCompleto}`,
      });
    }

    return Array.isArray(ocorrencias) ? ocorrencias : [];
  },
};
