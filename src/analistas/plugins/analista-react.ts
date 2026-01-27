// SPDX-License-Identifier: MIT
import type { ParserPlugin as BabelParserPlugin } from '@babel/parser';
import { parse as babelParse } from '@babel/parser';
import type { NodePath, Visitor } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import {
  AnalystOrigins,
  AnalystTypes,
  ReactMessages,
  SeverityLevels,
} from '@core/messages/core/plugin-messages.js';
import { createLineLookup } from '@shared/helpers/line-lookup.js';
import { maskJsComments } from '@shared/helpers/masking.js';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_REACT === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

function hasJSX(src: string): boolean {
  // Evita falsos positivos com genéricos TypeScript (ex.: foo<Bar>(...)).
  // Heurística: JSX normalmente aparece após um separador (início de arquivo/linha, whitespace,
  // pontuação), enquanto genéricos aparecem logo após identificadores.
  const hasTagLike = /(^|[^A-Za-z0-9_$])<([A-Za-z][A-Za-z0-9]*)\b/.test(src);
  const hasFragment = /<>|<\/>|<\/\s*>|<\/\s*Fragment\s*>/i.test(src);
  return hasTagLike || hasFragment || /React\.createElement/.test(src);
}

const traverseFn =
  traverse as unknown as typeof import('@babel/traverse').default;

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
    origem: AnalystOrigins.react,
    tipo: AnalystTypes.react,
  });
}

function collectReactIssues(src: string, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];
  const lineOf = createLineLookup(src).lineAt;

  // <a target="_blank"> sem rel
  for (const match of src.matchAll(/<a[^>]*target=['"]?_blank['"]?[^>]*>/gi)) {
    const hasRelSafe = /rel=['"][^'"]*(noopener|noreferrer)[^'"]*['"]/i.test(
      match[0],
    );
    if (!hasRelSafe) {
      const line = lineOf(match.index);
      ocorrencias.push(warn(ReactMessages.linkTargetBlank, relPath, line));
    }
  }

  // dangerouslySetInnerHTML
  for (const match of src.matchAll(/dangerouslySetInnerHTML/gi)) {
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(ReactMessages.dangerouslySetInnerHTML, relPath, line),
    );
  }

  // <img> sem alt
  for (const match of src.matchAll(/<img[^>]*>/gi)) {
    const hasAlt = /\salt=/.test(match[0]);
    const ariaHidden = /\saria-hidden=['"]true['"]/i.test(match[0]);
    const rolePresentation = /\srole=['"](presentation|none)['"]/i.test(
      match[0],
    );
    if (!hasAlt && !ariaHidden && !rolePresentation) {
      const line = lineOf(match.index);
      ocorrencias.push(warn(ReactMessages.imgWithoutAlt, relPath, line));
    }
  }

  // fetch/axios com HTTP (inseguro)
  for (const match of src.matchAll(
    /\b(fetch|axios\.get|axios\.post|axios\.[a-z]+)\s*\(\s*['"]http:\/\//gi,
  )) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(ReactMessages.httpFetch, relPath, line));
  }

  // Hardcoded secrets (heurística)
  for (const match of src.matchAll(
    /(api[key]?|token|secret|senha|password|passphrase)\s*[:=]\s*['"]([A-Za-z0-9\/_+=.-]{16,})['"]/gi,
  )) {
    const valor = match[2] || '';
    if (valor.length < 24 || /^https?:\/\//i.test(valor)) continue;
    const line = lineOf(match.index);
    ocorrencias.push(warn(ReactMessages.hardcodedCredential, relPath, line));
  }

  // Redirecionamento direto via location.href em handlers
  // Ignorar router.push/replace do Next.js (navegação segura via client-side routing)
  const usesNextRouter = /useRouter|router\.(push|replace)/.test(src);

  for (const match of src.matchAll(/location\.href\s*=\s*([^;]+)/gi)) {
    const assignedValue = match[1] || '';
    const line = lineOf(match.index);

    // Ignorar se valor é string literal (não vem de input do usuário)
    const isStaticString = /^['"`][^'"\`]*['"`]$/.test(assignedValue.trim());

    // Ignorar se é window.location.href = '/path' (navegação interna estática)
    const isInternalNavigation = /^['"`]\//.test(assignedValue.trim());

    // Só reportar se for atribuição dinâmica (potencialmente de input do usuário)
    if (!isStaticString && !isInternalNavigation && !usesNextRouter) {
      ocorrencias.push(warn(ReactMessages.locationHrefRedirect, relPath, line));
    }
  }

  return ocorrencias;
}

function normalizeStringValue(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function isBabelNode(v: unknown): v is t.Node {
  return typeof v === 'object' && v !== null && 'type' in v;
}

function attrsToFlatList(
  attrs: unknown,
): Array<{ name: string; value?: string | null }> {
  if (!Array.isArray(attrs)) return [];
  return attrs
    .filter(isBabelNode)
    .filter((a): a is t.JSXAttribute => t.isJSXAttribute(a))
    .filter((a) => t.isJSXIdentifier(a.name))
    .map((a) => {
      const name = String(a.name.name);
      let value: string | null | undefined;
      if (!a.value) value = null;
      else if (t.isStringLiteral(a.value)) value = a.value.value;
      else if (t.isJSXExpressionContainer(a.value)) {
        const expr = a.value.expression;
        if (t.isStringLiteral(expr)) value = expr.value;
      }
      return { name, value };
    });
}

function findAttr(
  attrs: Array<{ name: string; value?: string | null }>,
  name: string,
): { name: string; value?: string | null } | null {
  const n = name.toLowerCase();
  return attrs.find((a) => a.name.toLowerCase() === n) ?? null;
}

function isSensitiveKeyName(key: string): boolean {
  return /(api[key]?|token|secret|senha|password|passphrase)/i.test(key);
}

function parseReactWithBabel(scan: string, relPath: string): Msg[] | null {
  const lower = relPath.toLowerCase();
  const isTs = lower.endsWith('.ts') || lower.endsWith('.tsx');
  const isJsxLike = lower.endsWith('.tsx') || lower.endsWith('.jsx');
  const isJsFamily = /\.(js|mjs|cjs|jsx)$/i.test(lower);

  // Em .ts puro o Babel com JSX pode aumentar falsos positivos; só parseamos quando o
  // arquivo já passou pela heurística de JSX antes.
  if (lower.endsWith('.ts') && !isJsxLike) return null;

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
    // Robustez: projetos React frequentemente usam JSX em .js
    if (isJsxLike || isJsFamily) plugins.unshift('jsx');

    const ast = babelParse(scan, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins,
    });

    const ocorrencias: Msg[] = [];
    const seen = new Set<string>();
    const pushOnce = (m: Msg) => {
      const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
      if (seen.has(k)) return;
      seen.add(k);
      ocorrencias.push(m);
    };

    const visitor: Visitor<unknown> = {
      JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
        try {
          const node = path.node;
          const locLine: number | undefined = node.loc?.start?.line;
          const nameNode = node.name;
          const tag = t.isJSXIdentifier(nameNode) ? String(nameNode.name) : '';
          if (!tag) return;

          const attrs = attrsToFlatList(node.attributes);

          if (tag.toLowerCase() === 'a') {
            const target = findAttr(attrs, 'target');
            const targetVal = normalizeStringValue(target?.value);
            if (target && targetVal === '_blank') {
              const rel = findAttr(attrs, 'rel');
              const relVal = normalizeStringValue(rel?.value);
              const safe = /(noopener|noreferrer)/i.test(relVal);
              if (!safe)
                pushOnce(warn(ReactMessages.linkTargetBlank, relPath, locLine));
            }
          }

          if (tag.toLowerCase() === 'img') {
            const alt = findAttr(attrs, 'alt');
            const ariaHidden = findAttr(attrs, 'aria-hidden');
            const role = findAttr(attrs, 'role');
            const ariaHiddenVal = normalizeStringValue(ariaHidden?.value);
            const roleVal = normalizeStringValue(role?.value);
            const decorative =
              ariaHiddenVal === 'true' ||
              /^(presentation|none)$/i.test(roleVal);
            // Considerar alt presente se há atributo alt, mesmo se valor é expressão
            if (!alt && !decorative) {
              pushOnce(warn(ReactMessages.imgWithoutAlt, relPath, locLine));
            }
          }

          if (findAttr(attrs, 'dangerouslySetInnerHTML')) {
            pushOnce(
              warn(ReactMessages.dangerouslySetInnerHTML, relPath, locLine),
            );
          }

          // Verificar handlers inline em atributos JSX (ex.: onClick={() => ...})
          for (const a of node.attributes) {
            try {
              if (!t.isJSXAttribute(a) || !t.isJSXIdentifier(a.name)) continue;
              const attrName = String(a.name.name);
              if (a.value && t.isJSXExpressionContainer(a.value)) {
                const expr = a.value.expression;
                if (
                  t.isArrowFunctionExpression(expr) ||
                  t.isFunctionExpression(expr)
                ) {
                  pushOnce(
                    warn(ReactMessages.inlineHandlerJsx, relPath, locLine),
                  );
                }

                // Detectar uso de índice como key (key={i} / key={index})
                if (
                  attrName === 'key' &&
                  t.isJSXExpressionContainer(a.value) &&
                  t.isIdentifier(a.value.expression)
                ) {
                  const id = a.value.expression.name;
                  if (['i', 'index', 'idx'].includes(id)) {
                    pushOnce(warn(ReactMessages.indexAsKey, relPath, locLine));
                  }
                }
              }
            } catch {
              // ignora
            }
          }
        } catch {
          // ignora
        }
      },

      CallExpression(path: NodePath<t.CallExpression>) {
        try {
          const node = path.node;
          const locLine: number | undefined = node.loc?.start?.line;
          const args = node.arguments;
          const first = args[0];
          const firstStr = t.isStringLiteral(first) ? String(first.value) : '';

          if (t.isIdentifier(node.callee) && node.callee.name === 'fetch') {
            if (/^http:\/\//i.test(firstStr))
              pushOnce(warn(ReactMessages.httpFetch, relPath, locLine));
            return;
          }

          if (t.isMemberExpression(node.callee)) {
            const obj = node.callee.object;
            const prop = node.callee.property;
            const objName = t.isIdentifier(obj) ? String(obj.name) : '';
            const propName = t.isIdentifier(prop) ? String(prop.name) : '';
            if (objName === 'axios' && propName) {
              if (/^http:\/\//i.test(firstStr))
                pushOnce(warn(ReactMessages.httpFetch, relPath, locLine));
            }

            // Detectar Array#map com callback retornando JSX sem key
            if (propName === 'map' && args.length >= 1) {
              const cb = args[0];
              const checkCallback = (
                fn: t.FunctionExpression | t.ArrowFunctionExpression,
              ) => {
                try {
                  const body = fn.body;

                  const checkJsxNode = (jsx: t.JSXElement | t.JSXFragment) => {
                    if (t.isJSXElement(jsx)) {
                      const hasKey = jsx.openingElement.attributes.some(
                        (a) =>
                          t.isJSXAttribute(a) &&
                          t.isJSXIdentifier(a.name) &&
                          String(a.name.name) === 'key',
                      );
                      if (!hasKey) {
                        pushOnce(
                          warn(
                            ReactMessages.listItemNoKey,
                            relPath,
                            jsx.loc?.start?.line ?? locLine,
                          ),
                        );
                      }
                    } else {
                      // JSXFragment (<>...</>) não aceita atributo key - tratar como sem key
                      pushOnce(
                        warn(
                          ReactMessages.listItemNoKey,
                          relPath,
                          jsx.loc?.start?.line ?? locLine,
                        ),
                      );
                    }
                  };

                  if (t.isJSXElement(body) || t.isJSXFragment(body)) {
                    checkJsxNode(body);
                  } else if (t.isBlockStatement(body)) {
                    for (const stmt of body.body) {
                      if (t.isReturnStatement(stmt) && stmt.argument) {
                        if (
                          t.isJSXElement(stmt.argument) ||
                          t.isJSXFragment(stmt.argument)
                        ) {
                          checkJsxNode(stmt.argument);
                        }
                      }
                    }
                  }
                } catch {
                  // ignora
                }
              };

              if (t.isFunctionExpression(cb)) checkCallback(cb);
              if (t.isArrowFunctionExpression(cb)) checkCallback(cb);
            }
          }
        } catch {
          // ignora
        }
      },

      AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
        try {
          const node = path.node;
          const locLine: number | undefined = node.loc?.start?.line;
          const left = node.left;
          if (!t.isMemberExpression(left)) return;
          const obj = left.object;
          const prop = left.property;
          const objName = t.isIdentifier(obj) ? String(obj.name) : '';
          const propName = t.isIdentifier(prop) ? String(prop.name) : '';
          if (objName === 'location' && propName === 'href') {
            // Ignorar se RHS é string literal estática ou navegação interna
            const right = node.right;
            let isSafe = false;
            if (t.isStringLiteral(right)) {
              const val = right.value;
              isSafe =
                val.startsWith('/') ||
                val.startsWith('./') ||
                val.startsWith('../');
            }
            if (!isSafe) {
              pushOnce(
                warn(ReactMessages.locationHrefRedirect, relPath, locLine),
              );
            }
          }
        } catch {
          // ignora
        }
      },

      ObjectProperty(path: NodePath<t.ObjectProperty>) {
        try {
          const node = path.node;
          const locLine: number | undefined = node.loc?.start?.line;
          const key = node.key;
          const value = node.value;
          const keyName = t.isIdentifier(key)
            ? String(key.name)
            : t.isStringLiteral(key)
              ? String(key.value)
              : '';
          if (!keyName || !isSensitiveKeyName(keyName)) return;
          if (!t.isStringLiteral(value)) return;
          const s = String(value.value || '');
          if (s.length < 24) return;
          if (/^https?:\/\//i.test(s)) return;
          pushOnce(warn(ReactMessages.hardcodedCredential, relPath, locLine));
        } catch {
          // ignora
        }
      },
    };

    traverseFn(ast, visitor);

    return ocorrencias.length ? ocorrencias : null;
  } catch {
    return null;
  }
}

export const analistaReact = criarAnalista({
  nome: 'analista-react',
  categoria: 'framework',
  descricao: 'Heurísticas leves de React (sem ESLint).',
  global: false,
  test: (relPath: string): boolean => /\.(jsx|tsx|js|ts)$/i.test(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;
    if (relPath.includes('src/analistas/plugins/analista-react.ts'))
      return null;

    const scan = maskJsComments(src);

    // Em arquivos .ts (não TSX), seja mais conservador para evitar falsos positivos
    // com assertions/generics usando <T>.
    if (/\.ts$/i.test(relPath) && !/\.tsx$/i.test(relPath)) {
      const hasStrongJsxEvidence =
        /<\/[A-Za-z][^>]*>/.test(scan) ||
        /\/>/.test(scan) ||
        /React\.createElement/.test(scan);
      if (!hasStrongJsxEvidence) return null;
    }

    if (!hasJSX(scan)) return null;

    const astMsgs = parseReactWithBabel(scan, relPath) ?? [];
    const heuristicMsgs = collectReactIssues(scan, relPath);

    if (!astMsgs.length && !heuristicMsgs.length) return null;

    // Dedupe para evitar duplicatas quando AST e regex cobrem o mesmo caso.
    const seen = new Set<string>();
    const merged: Msg[] = [];
    const pushOnce = (m: Msg) => {
      const k = `${m.mensagem}|${m.relPath}|${m.linha ?? 0}`;
      if (seen.has(k)) return;
      seen.add(k);
      merged.push(m);
    };

    astMsgs.forEach(pushOnce);
    heuristicMsgs.forEach(pushOnce);

    return merged.length ? merged : null;
  },
});

export default analistaReact;
