// SPDX-License-Identifier: MIT
// @oraculo-disable seguranca vulnerabilidade-seguranca
import type { NodePath } from '@babel/traverse';
import type { CallExpression, NewExpression, Node } from '@babel/types';
import { traverse } from '@core/config/traverse.js';
import { DetectorAgregadosMessages } from '@core/messages/analistas/detector-agregados-messages.js';
import { detectarContextoProjeto } from '@shared/contexto-projeto.js';
import { filtrarOcorrenciasSuprimidas } from '@shared/helpers/suppressao.js';

import type { Analista, Ocorrencia, ProblemaSeguranca } from '@';
import { criarOcorrencia } from '@';

// Funções helper para detecção inteligente de segredos

function isPlaceholderSuspeito(linha: string): boolean {
  const placeholdersComuns = [
    '<YOUR_',
    '<FOO>',
    '<BAR>',
    'REPLACE_ME',
    'EXAMPLE_',
    'PLACEHOLDER',
    'your_',
    'example',
    'sample',
    'demo',
    'test',
    'fake',
    'dummy',
    'mock',
  ];

  const linhaLower = linha.toLowerCase();
  return placeholdersComuns.some((p) => linhaLower.includes(p.toLowerCase()));
}

function isContextoDocumentacao(relPath: string): boolean {
  const arquivosDoc = [
    'readme',
    'doc/',
    'docs/',
    '.md',
    '.example',
    '.sample',
    '.template',
    'third-party-notices',
    'license',
    'changelog',
  ];

  const pathLower = relPath.toLowerCase();
  return arquivosDoc.some((pattern) => pathLower.includes(pattern));
}

function calcularEntropia(str: string): number {
  const frequencias = new Map<string, number>();

  // Contar frequência de cada caractere
  for (const char of str) {
    frequencias.set(char, (frequencias.get(char) || 0) + 1);
  }

  // Calcular entropia de Shannon
  let entropia = 0;
  for (const freq of frequencias.values()) {
    const prob = freq / str.length;
    entropia -= prob * Math.log2(prob);
  }

  return entropia;
}

export const analistaSeguranca: Analista = {
  nome: 'seguranca',
  categoria: 'seguranca',
  descricao: 'Detecta vulnerabilidades e práticas inseguras no código',

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

    const problemas: ProblemaSeguranca[] = [];

    try {
      // Detectar problemas por padrões de texto (mais confiável que AST para alguns casos)
      detectarPadroesPerigosos(src, relPath, problemas);

      // Detectar problemas via AST quando disponível
      if (ast) {
        detectarProblemasAST(ast, problemas);
      }

      // Converter para ocorrências
      const ocorrencias: Ocorrencia[] = [];

      // Agrupar por severidade
      const porSeveridade = agruparPorSeveridade(problemas);

      for (const [severidade, items] of Object.entries(porSeveridade)) {
        if (items.length > 0) {
          const nivel = mapearSeveridadeParaNivel(
            severidade as ProblemaSeguranca['severidade'],
          );

          // Ajustar severidade baseado no contexto
          const nivelAjustado =
            contextoArquivo.isTest && nivel === 'aviso' ? 'info' : nivel;

          const resumo = items
            .slice(0, 3)
            .map((p) => p.tipo)
            .join(', ');

          ocorrencias.push(
            criarOcorrencia({
              tipo: 'vulnerabilidade-seguranca',
              nivel: nivelAjustado,
              mensagem: DetectorAgregadosMessages.problemasSegurancaResumo(
                severidade,
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
      return filtrarOcorrenciasSuprimidas(ocorrencias, 'seguranca', src);
    } catch (erro) {
      return [
        criarOcorrencia({
          tipo: 'ERRO_ANALISE',
          nivel: 'aviso',
          mensagem: DetectorAgregadosMessages.erroAnalisarSeguranca(erro),
          relPath,
          linha: 1,
        }),
      ];
    }
  },
};

function detectarPadroesPerigosos(
  src: string,
  relPath: string,
  problemas: ProblemaSeguranca[],
): void {
  const linhas = src.split('\n');

  function isLikelyHttpHeaderName(value: string): boolean {
    const v = String(value || '').trim();
    if (!v) return false;
    // Header names geralmente são curtos/médios e usam letras/números/hífens.
    if (v.length < 4 || v.length > 80) return false;
    if (!/^[A-Za-z0-9-]+$/.test(v)) return false;
    if (v.startsWith('-') || v.endsWith('-')) return false;
    // Heurística: costuma ter hífen (ex.: Content-Type) e, muitas vezes, prefixo X-
    if (!/-/.test(v) && !/^X[A-Za-z]?/.test(v)) return false;
    return true;
  }

  function isHttpHeadersKeyValueContext(index: number): boolean {
    const start = Math.max(0, index - 12);
    const end = Math.min(linhas.length, index + 6);
    const ctx = linhas.slice(start, end).join('\n');
    const hasHeaders =
      /\bheaders\b\s*[:=]/i.test(ctx) || /\bheader\b/i.test(ctx);
    const hasValueProp = /\bvalue\b\s*[:=]/i.test(ctx);
    return hasHeaders && hasValueProp;
  }

  linhas.forEach((linha, index) => {
    const numeroLinha = index + 1;

    // Ignorar comentários, strings e regex patterns para reduzir falsos positivos
    const linhaSemComentarios = linha
      .replace(/\/\/.*$/, '')
      .replace(/\/\*.*?\*\//, '');
    const linhaSemStrings = linhaSemComentarios
      .replace(/'[^']*'/g, '')
      .replace(/"[^"]*"/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\/[^\/]*\//g, '');

    // eval() usage - apenas em código real, não em comentários/strings/regex
    if (/\beval\s*\(/.test(linhaSemStrings)) {
      problemas.push({
        tipo: 'eval-usage',
        descricao: 'Uso de eval() pode executar código malicioso',
        severidade: 'critica',
        linha: numeroLinha,
        sugestao: 'Use JSON.parse() ou funções específicas ao invés de eval()',
      });
    }

    // innerHTML com variáveis
    if (/\.innerHTML\s*=\s*[^"']/.test(linha)) {
      problemas.push({
        tipo: 'dangerous-html',
        descricao: 'innerHTML com variáveis pode causar XSS',
        severidade: 'alta',
        linha: numeroLinha,
        sugestao: 'Use textContent ou sanitize o HTML antes de inserir',
      });
    }

    // Math.random() para criptografia
    if (
      /Math\.random\(\)/.test(linha) &&
      /crypto|password|token|secret/i.test(linha)
    ) {
      problemas.push({
        tipo: 'weak-crypto',
        descricao: 'Math.random() não é seguro para criptografia',
        severidade: 'alta',
        linha: numeroLinha,
        sugestao: 'Use crypto.randomBytes() ou crypto.getRandomValues()',
      });
    }

    // Algoritmos de hash fracos
    if (/createHash\s*\(\s*['"`](md5|md4|sha1)['"`]\s*\)/.test(linha)) {
      const algoritmo = /createHash\s*\(\s*['"`](md5|md4|sha1)['"`]\s*\)/.exec(
        linha,
      )?.[1];

      // Verificar se há comentário justificando o uso (ex: fingerprinting, não-criptográfico)
      const linhaAnterior = index > 0 ? linhas[index - 1] : '';
      const linha2Atras = index > 1 ? linhas[index - 2] : '';
      const comentarioContexto = linhaAnterior + linha2Atras;
      const temJustificativa =
        /fingerprint|cache|baseline|perf|não.*segurança|not.*security|não.*criptograf/i.test(
          comentarioContexto,
        ) ||
        /apenas.*identifica|only.*identif|deduplica/i.test(comentarioContexto);

      if (!temJustificativa) {
        problemas.push({
          tipo: 'weak-crypto',
          descricao: `Algoritmo de hash ${algoritmo?.toUpperCase()} é considerado fraco`,
          severidade: 'alta',
          linha: numeroLinha,
          sugestao:
            'Use SHA-256 ou superior: createHash("sha256") - ou adicione comentário se for apenas fingerprinting',
        });
      }
    }

    // RegExp com input do usuário
    if (
      /new RegExp\s*\([^)]*\)/.test(linha) &&
      /req\.|params\.|query\.|body\./.test(linha)
    ) {
      problemas.push({
        tipo: 'unsafe-regex',
        descricao: 'RegExp com input não validado pode causar ReDoS',
        severidade: 'media',
        linha: numeroLinha,
        sugestao: 'Valide e escape o input antes de usar em RegExp',
      });
    }

    // __proto__ manipulation - evitar falsos positivos em strings/comentários
    if (/__proto__/.test(linhaSemStrings)) {
      problemas.push({
        tipo: 'prototype-pollution',
        descricao: 'Manipulação de __proto__ pode causar prototype pollution',
        severidade: 'alta',
        linha: numeroLinha,
        sugestao:
          'Use Object.create(null) ou Object.setPrototypeOf() com cuidado',
      });
    }

    // Path traversal patterns
    if (/\.\.\//g.test(linha) && /req\.|params\.|query\./.test(linha)) {
      problemas.push({
        tipo: 'path-traversal',
        descricao: 'Possível vulnerabilidade de path traversal',
        severidade: 'alta',
        linha: numeroLinha,
        sugestao:
          'Sanitize caminhos de arquivo e use path.resolve() com cuidado',
      });
    }

    // Credenciais hardcoded - versão inteligente com whitelist
    // Excluir variáveis comuns que não são secrets (migrationKey, cacheKey, hashKey, etc)
    const isNonSecretKey =
      /\b(migration|cache|hash|dedupe|lookup|map|index)key\b/i.test(linha);

    if (
      !isPlaceholderSuspeito(linha) &&
      !isContextoDocumentacao(relPath) &&
      !isNonSecretKey
    ) {
      const padraoSegredo =
        /\b(password|pwd|pass|secret|key|token|api_key|apikey)\b\s*[:=]\s*['"`]([^'"`\s]{3,})/i;
      const match = linha.match(padraoSegredo);

      if (match) {
        const campo = String(match[1] || '').toLowerCase();
        const valor = match[2];

        // Redução de falsos positivos: headers HTTP em configurações
        // Ex.: headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }]
        if (
          campo === 'key' &&
          isLikelyHttpHeaderName(valor) &&
          isHttpHeadersKeyValueContext(index)
        ) {
          return;
        }

        // Excluir template strings com interpolação (não são secrets hardcoded)
        const temInterpolacao =
          linha.includes('${') || /`[^`]*\$\{[^}]+\}/.test(linha);
        if (temInterpolacao) {
          return; // Template strings dinâmicas não são hardcoded
        }

        // Whitelist de padrões comuns de nomenclatura (não são secrets)
        const padroesNomenclatura = [
          '_role_',
          '_config_',
          '_key_',
          '_type_',
          '_name_',
          '_prefix_',
          '_suffix_',
          'squad_',
          'channel_',
          'guild_',
        ];

        const isPadraoNomenclatura = padroesNomenclatura.some((p) =>
          valor.toLowerCase().includes(p.toLowerCase()),
        );

        if (isPadraoNomenclatura) {
          return; // Padrões de nomenclatura não são secrets
        }

        // Whitelist para placeholders comuns
        const placeholdersSegurs = [
          '<YOUR_',
          '<FOO>',
          '<BAR>',
          'REPLACE_ME',
          'EXAMPLE_',
          'PLACEHOLDER',
          'your_',
          'example',
          'sample',
          'demo',
          'test',
          'fake',
          'dummy',
          'mock',
        ];

        const isPlaceholder = placeholdersSegurs.some((p) =>
          valor.toLowerCase().includes(p.toLowerCase()),
        );

        // Verificar entropia (tokens reais tendem a ter alta entropia)
        const entropia = calcularEntropia(valor);
        const temAltaEntropia = entropia > 3.5; // Threshold empírico

        // Verificar se parece com token/chave real
        const pareceTokReal =
          valor.length > 20 && // Aumentado de 8 para 20 para reduzir falsos positivos
          (temAltaEntropia || /^[A-Za-z0-9+/]{20,}={0,2}$/.test(valor)) && // Base64-like
          !isPlaceholder;

        if (pareceTokReal) {
          problemas.push({
            tipo: 'hardcoded-secrets',
            descricao: 'Credenciais hardcoded no código podem ser expostas',
            severidade: 'critica',
            linha: numeroLinha,
            sugestao:
              'Use variáveis de ambiente ou arquivo de configuração seguro',
          });
        }
      }
    }
  });

  // Detectar async/await sem try-catch (melhoria exclusiva)
  detectarAsyncSemTryCatch(src, problemas);
}

/**
 * Detecta uso de async/await sem tratamento adequado de erro
 */
function detectarAsyncSemTryCatch(
  src: string,
  problemas: ProblemaSeguranca[],
): void {
  const lines = src.split('\n');

  // Contexto global do arquivo para detectar padrões do Next.js
  const isNextJsServerComponent =
    /^['"](use server|use client)['"]/.test(src.trim()) ||
    /export\s+(default\s+)?async\s+function/.test(src);
  const hasDynamicImport = /next\/dynamic|import\s*\(/.test(src);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Detectar await sem try-catch
    if (/\bawait\s+/.test(line) && !trimmedLine.startsWith('//')) {
      // Verificar contexto expandido para detectar event handlers
      const contextLines = lines.slice(Math.max(0, i - 10), i);
      const context = contextLines.join(' ');

      // Detectar se está dentro de event handler (fire-and-forget por design)
      const isEventHandler =
        /\.on\s*\(/.test(context) ||
        /\.once\s*\(/.test(context) ||
        /addEventListener\s*\(/.test(context) ||
        /collector\.on\s*\(/.test(context) ||
        /emitter\.on\s*\(/.test(context) ||
        /process\.on\s*\(/.test(context);

      // Verificar se é dynamic import do Next.js (tratamento gerenciado pelo framework)
      const isDynamicImport =
        hasDynamicImport &&
        (/import\s*\(/.test(line) || /dynamic\s*\(/.test(context));

      // Server Components do Next.js: tratamento gerenciado pelo framework
      if (isNextJsServerComponent || isDynamicImport) {
        continue;
      }

      // Verificar se há try-catch em escopo expandido (20 linhas antes/depois)
      const extendedContext = lines.slice(
        Math.max(0, i - 20),
        Math.min(lines.length, i + 10),
      );
      const fullContext = extendedContext.join('\n');

      // Detectar try-catch em escopo pai (bloco que envolve o await)
      const hasErrorHandling =
        /try\s*\{[\s\S]*?\}\s*catch/.test(fullContext) ||
        /\.catch\s*\(/.test(line) ||
        /\.catch\s*\(/.test(lines[i + 1] || '') ||
        // Promise encadeada com .then().catch()
        /\.then\s*\([^)]*\)\s*\.catch/.test(fullContext);

      if (!hasErrorHandling) {
        problemas.push({
          tipo: isEventHandler ? 'unhandled-async-event' : 'unhandled-async',
          descricao: isEventHandler
            ? 'await em event handler sem tratamento de erro (considere adicionar .catch se necessário)'
            : 'await sem tratamento de erro pode causar crashes não tratados',
          severidade: isEventHandler ? 'baixa' : 'media',
          linha: i + 1,
          sugestao: isEventHandler
            ? 'Event handlers são fire-and-forget. Adicione .catch() apenas se precisar tratar erros específicos'
            : 'Envolva em try-catch ou use .catch() na Promise',
        });
      }
    }
  }
}

function detectarProblemasAST(
  ast: NodePath<Node>,
  problemas: ProblemaSeguranca[],
): void {
  try {
    traverse(ast.node, {
      // Detectar Function constructor
      NewExpression(path: NodePath<NewExpression>) {
        if (
          path.node.callee.type === 'Identifier' &&
          path.node.callee.name === 'Function'
        ) {
          problemas.push({
            tipo: 'eval-usage',
            descricao: 'Function constructor pode executar código dinâmico',
            severidade: 'alta',
            linha: path.node.loc?.start.line || 0,
            sugestao: 'Evite Function constructor, use funções declaradas',
          });
        }
      },

      // Detectar setTimeout/setInterval com strings
      CallExpression(path: NodePath<CallExpression>) {
        if (
          path.node.callee.type === 'Identifier' &&
          ['setTimeout', 'setInterval'].includes(path.node.callee.name) &&
          path.node.arguments[0]?.type === 'StringLiteral'
        ) {
          problemas.push({
            tipo: 'eval-usage',
            descricao:
              'setTimeout/setInterval com string executa código dinâmico',
            severidade: 'media',
            linha: path.node.loc?.start.line || 0,
            sugestao: 'Use função ao invés de string',
          });
        }
      },
    });
  } catch {
    // Ignorar erros de traverse para não quebrar a análise
  }
}

function agruparPorSeveridade(
  problemas: ProblemaSeguranca[],
): Record<string, ProblemaSeguranca[]> {
  return problemas.reduce(
    (acc, problema) => {
      if (!acc[problema.severidade]) {
        acc[problema.severidade] = [];
      }
      acc[problema.severidade].push(problema);
      return acc;
    },
    {} as Record<string, ProblemaSeguranca[]>,
  );
}

function mapearSeveridadeParaNivel(
  severidade: ProblemaSeguranca['severidade'],
): 'info' | 'aviso' | 'erro' {
  switch (severidade) {
    case 'critica':
    case 'alta':
      return 'erro';
    case 'media':
      return 'aviso';
    case 'baixa':
    default:
      return 'info';
  }
}
