// SPDX-License-Identifier: MIT
import type { ParserPlugin as BabelParserPlugin } from '/parser';
import { parse as babelParse } from '/parser';
import type { NodePath, Visitor } from '/traverse';
import traverse from '/traverse';
import * as t from '/types';
import {
  AnalystOrigins,
  AnalystTypes,
  ReactHooksMessages,
  SeverityLevels,
} from '/messages/core/plugin-messages.js';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_REACT_HOOKS === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

function hasHooksUsage(src: string): boolean {
  return /use(State|Effect|Memo|Callback|Reducer|Ref|LayoutEffect|ImperativeHandle|Transition)/.test(
    src,
  );
}

function warn(
  message: string,
  relPath: string,
  line?: number,
  nivel = SeverityLevels.warning,
): Msg {
  return criarOcorrencia({
    relPath,
    mensagem: message,
    linha: line,
    nivel,
    origem: AnalystOrigins.reactHooks,
    tipo: AnalystTypes.reactHooks,
  });
}

/**
 * Extrai o conteúdo completo de uma chamada de hook,
 * lidando corretamente com parênteses aninhados e arrays de dependências.
 */
function extractHookCallContent(src: string, startIndex: number): string {
  let depth = 0;
  let started = false;
  let content = '';

  for (let i = startIndex; i < src.length; i++) {
    const char = src[i];
    if (char === '(') {
      depth++;
      started = true;
    } else if (char === ')') {
      depth--;
    }

    if (started) {
      content += char;
    }

    if (started && depth === 0) {
      break;
    }
  }

  return content;
}

function collectHookIssues(src: string, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];

  // useEffect/useLayoutEffect sem array de dependências
  const effectMatches = [...src.matchAll(/use(Layout)?Effect\s*\(/g)];
  effectMatches.forEach((m) => {
    const hookStart = m.index ?? 0;
    const fullCall = extractHookCallContent(src, hookStart + m[0].length - 1);

    // Verificar se tem segundo argumento (array de dependências)
    // Padrão: (callback, [deps]) ou (callback, deps)
    // Um array vazio [] conta como dependências válidas
    const hasDepsArg = /,\s*(\[[\s\S]*?\]|\w+)\s*\)$/.test(fullCall);

    const skip =
      /no-deps-ok|eslint-disable-next-line\s+react-hooks\/exhaustive-deps/i.test(
        fullCall,
      );

    if (!hasDepsArg && !skip) {
      const line = src.slice(0, hookStart).split(/\n/).length;
      ocorrencias.push(warn(ReactHooksMessages.useEffectNoDeps, relPath, line));
    }
  });

  // useMemo/useCallback sem deps
  const memoMatches = [...src.matchAll(/use(Memo|Callback)\s*\(/g)];
  memoMatches.forEach((m) => {
    const hookStart = m.index ?? 0;
    const fullCall = extractHookCallContent(src, hookStart + m[0].length - 1);

    // Verificar se tem segundo argumento (array de dependências)
    const hasDepsArg = /,\s*(\[[\s\S]*?\]|\w+)\s*\)$/.test(fullCall);

    const skip =
      /no-deps-ok|eslint-disable-next-line\s+react-hooks\/exhaustive-deps/i.test(
        fullCall,
      );

    if (!hasDepsArg && !skip) {
      const line = src.slice(0, hookStart).split(/\n/).length;
      ocorrencias.push(
        warn(ReactHooksMessages.memoCallbackNoDeps, relPath, line),
      );
    }
  });

  // Hooks dentro de condicionais (heurística simples)
  const conditionalHooks = [
    ...src.matchAll(
      /(if|for|while)\s*\([^)]*\)\s*\{[\s\S]{0,160}?use[A-Z][A-Za-z0-9_]*/g,
    ),
  ];
  conditionalHooks.forEach((m) => {
    const line = src.slice(0, m.index || 0).split(/\n/).length;
    ocorrencias.push(warn(ReactHooksMessages.hookInConditional, relPath, line));
  });

  return ocorrencias;
}

const traverseFn =
  traverse as unknown as typeof import('/traverse').default;

function parseHooksWithBabel(src: string, relPath: string): Msg[] | null {
  const lower = relPath.toLowerCase();
  const isTs = lower.endsWith('.ts') || lower.endsWith('.tsx');
  const isJsxLike = lower.endsWith('.tsx') || lower.endsWith('.jsx');

  try {
    const plugins: BabelParserPlugin[] = [
      'decorators-legacy',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'optionalChaining',
      'nullishCoalescingOperator',
      'topLevelAwait',
      'importAttributes',
      'importAssertions',
    ];
    if (isTs) plugins.unshift('typescript');
    if (isJsxLike) plugins.unshift('jsx');

    const ast = babelParse(src, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins,
    });

    const out: Msg[] = [];
    const seen = new Set<string>();
    const pushOnce = (m: Msg) => {
      const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push(m);
    };

    const isHookCallee = (
      callee: t.CallExpression['callee'],
    ): { name: string } | null => {
      if (t.isIdentifier(callee)) return { name: String(callee.name) };
      if (t.isMemberExpression(callee)) {
        const obj = callee.object;
        const prop = callee.property;
        const objName = t.isIdentifier(obj) ? String(obj.name) : '';
        const propName = t.isIdentifier(prop) ? String(prop.name) : '';
        if (objName === 'React' && propName) return { name: propName };
      }
      return null;
    };

    const isEffectLike = (name: string) =>
      name === 'useEffect' || name === 'useLayoutEffect';
    const isMemoLike = (name: string) =>
      name === 'useMemo' || name === 'useCallback';
    const isAnyHook = (name: string) => /^use[A-Z0-9_]/.test(name);

    const inConditionalOrLoop = (path: NodePath<t.CallExpression>): boolean => {
      return Boolean(
        path.findParent(
          (p) =>
            p.isIfStatement() ||
            p.isForStatement() ||
            p.isWhileStatement() ||
            p.isDoWhileStatement() ||
            p.isSwitchStatement(),
        ),
      );
    };

    const visitor: Visitor<unknown> = {
      CallExpression(path: NodePath<t.CallExpression>) {
        try {
          const calleeInfo = isHookCallee(path.node.callee);
          if (!calleeInfo) return;
          const name = calleeInfo.name;
          const locLine: number | undefined = path.node.loc?.start?.line;

          if (isEffectLike(name) && path.node.arguments.length < 2) {
            pushOnce(
              warn(ReactHooksMessages.useEffectNoDeps, relPath, locLine),
            );
          }

          if (isMemoLike(name) && path.node.arguments.length < 2) {
            pushOnce(
              warn(ReactHooksMessages.memoCallbackNoDeps, relPath, locLine),
            );
          }

          if (isAnyHook(name) && inConditionalOrLoop(path)) {
            pushOnce(
              warn(ReactHooksMessages.hookInConditional, relPath, locLine),
            );
          }
        } catch {
          // ignora
        }
      },
    };

    traverseFn(ast, visitor);
    // Importante: retorna array (mesmo vazio) quando o parse foi bem-sucedido,
    // para evitar cair no fallback regex (que é mais frágil e ruidoso).
    return out;
  } catch {
    return null;
  }
}

export const analistaReactHooks = criarAnalista({
  nome: 'analista-react-hooks',
  categoria: 'framework',
  descricao: 'Heurísticas leves de Hooks (sem ESLint).',
  global: false,
  test: (relPath: string): boolean => /\.(jsx|tsx|js|ts)$/i.test(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;
    if (relPath.includes('src/analistas/plugins/analista-react-hooks.ts'))
      return null;
    if (!hasHooksUsage(src)) return null;

    const astMsgs = parseHooksWithBabel(src, relPath);
    if (astMsgs !== null) return astMsgs.length ? astMsgs : null;

    const msgs = collectHookIssues(src, relPath);
    return msgs.length ? msgs : null;
  },
});

export default analistaReactHooks;
