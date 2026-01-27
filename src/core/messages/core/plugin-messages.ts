// SPDX-License-Identifier: MIT
/**
 * Mensagens dos Analistas de Plugins
 *
 * Centraliza todas as mensagens dos plugins:
 * - React
 * - React Hooks
 * - Tailwind
 * - CSS
 * - HTML
 * - Python
 */

/* -------------------------- MENSAGENS REACT -------------------------- */

export const ReactMessages = {
  linkTargetBlank: 'Link com target="_blank" sem rel="noreferrer"/"noopener".',
  dangerouslySetInnerHTML:
    'Uso de dangerouslySetInnerHTML encontrado; valide a necessidade.',
  imgWithoutAlt: 'Imagem sem atributo alt (acessibilidade).',
  httpFetch: 'Chamada HTTP sem TLS detectada; prefira HTTPS.',
  hardcodedCredential:
    'Possível credencial hardcoded; use variáveis de ambiente.',
  locationHrefRedirect:
    'Atribuição direta a location.href; valide origem para evitar open redirect.',
  listItemNoKey: 'Item em lista (map) sem atributo key.',
  indexAsKey: 'Uso de índice como key (pode causar problemas de reordenação).',
  inlineHandlerJsx:
    'Handler inline detectado em JSX; prefira funções estáveis (useCallback) ou extrair fora do render.',
} as const;

/* -------------------------- MENSAGENS REACT HOOKS -------------------------- */

export const ReactHooksMessages = {
  useEffectNoDeps:
    'useEffect sem array de dependências (avalie deps para evitar loops).',
  memoCallbackNoDeps: 'Hook sem array de dependências (useMemo/useCallback).',
  hookInConditional:
    'Hook declarado dentro de condicional (quebra Rules of Hooks).',
} as const;

/* -------------------------- MENSAGENS TAILWIND -------------------------- */

export const TailwindMessages = {
  conflictingClasses: (key: string, tokens: string[]) =>
    `Possível conflito ${key} (${tokens.slice(0, 4).join(', ')}). Verifique duplicidades.`,
  repeatedClass: (token: string) =>
    `Classe repetida detectada (${token}). Considere remover redundância.`,
  importantUsage: (token: string) =>
    `Uso de ! (important) detectado em (${token}). Prefira classes utilitárias ou reforço de escopo ao invés de important.`,
  variantConflict: (prop: string, variants: string[]) =>
    `Possível conflito de variantes para ${prop} (variantes: ${variants.slice(0, 6).join(', ')}). Verifique ordem/escopo.`,
  dangerousArbitraryValue: (token: string) =>
    `Valor arbitrário com url potencialmente perigosa (${token}). Evite javascript:/data:text/html.`,
  arbitraryValue: (token: string) =>
    `Classe com valor arbitrário (${token}). Confirme se está alinhada ao design.`,
} as const;

/* -------------------------- MENSAGENS CSS -------------------------- */

export const CssMessages = {
  duplicatePropertySame: (prop: string) =>
    `Propriedade duplicada com valor idêntico (${prop}): erro detectado.`,
  duplicatePropertyDifferent: (prop: string, prev: string, curr: string) =>
    `Propriedade duplicada (${prop}) com valores diferentes. Possível erro: "${prev}" vs "${curr}".`,
  importantUsage:
    'Uso de !important detectado; prefira especificidade adequada.',
  httpImport: 'Importação via HTTP detectada; prefira HTTPS ou bundling local.',
  httpUrl: 'Recurso externo via HTTP em url(); prefira HTTPS.',
  unifySelectors: (selectors: string[], propsCount: number) =>
    `Regras CSS idênticas (${propsCount} propriedades) em seletores (${selectors.slice(0, 6).join(', ')}). Considere unificar/centralizar em uma classe utilitária ou seletor compartilhado.`,
  idSelectorPreferClass: (selector: string) =>
    `Seletor por id (${selector}) detectado. Para reutilização e consistência, prefira classes quando possível.`,
  invalidProperty: (prop: string) =>
    `Propriedade CSS inválida ou desconhecida (${prop}). Verifique ortografia ou suporte do navegador.`,
  malformedSelector: (selector: string) =>
    `Seletor CSS malformado ou inválido (${selector}). Pode causar problemas de renderização.`,
  emptyRule: 'Regra CSS vazia detectada. Remova regras sem declarações.',
  vendorPrefixDeprecated: (prop: string) =>
    `Prefixo vendor deprecated (${prop}). Use propriedades padrão quando suportadas.`,
  cssHackDetected: (hack: string) =>
    `Hack CSS detectado (${hack}). Considere abordagens modernas ou feature queries.`,
} as const;

/* -------------------------- MENSAGENS HTML -------------------------- */

export const HtmlMessages = {
  // Estrutura
  doctype: 'Documento sem <!DOCTYPE html> declarado.',
  htmlLang: 'Elemento <html> sem atributo lang (acessibilidade).',
  metaCharset: 'Falta <meta charset="utf-8"> no documento.',
  viewport: 'Falta meta viewport para responsividade.',
  title: 'Documento sem <title> definido.',

  // Links
  linkTargetBlank: 'Link com target="_blank" sem rel="noreferrer"/"noopener".',
  linkNoHref:
    'Link sem href válido ou sem handler (UX). Use <button> ou role="button".',

  // Imagens
  imgWithoutAlt: 'Imagem sem atributo alt ou acessibilidade (WCAG 2.1).',
  imgWithoutLoading:
    'Imagem sem atributo loading (performance). Considere loading="lazy".',
  imgWithoutDimensions:
    'Imagem sem width/height (layout shift). Defina dimensões para evitar CLS.',

  // Formulários
  formWithoutMethod: 'Formulário sem method especificado (GET/POST).',
  formWithoutAction:
    'Formulário sem action ou data-attribute para processamento.',
  inputWithoutLabel:
    'Input sem name, id ou aria-label (acessibilidade/usabilidade).',
  passwordWithoutAutocomplete:
    'Campo password sem autocomplete especificado (segurança).',
  inputWithoutType:
    'Input sem type especificado (assume text, mas seja explícito).',

  // Handlers
  inlineHandler:
    'Handler inline detectado (on*). Prefira listeners externos ou data-attributes com JS.',

  // Scripts/Styles
  inlineScript:
    'Script inline detectado. Prefira arquivos externos para melhor cache e CSP.',
  inlineStyle:
    'Style inline detectado. Prefira arquivos CSS externos para melhor cache.',
  scriptWithoutDefer:
    'Script sem defer/async. Pode bloquear renderização; considere defer.',

  // Acessibilidade
  headingSkipped: (current: number, expected: number) =>
    `Cabeçalho pulado: h${current} sem h${expected} precedente (estrutura semântica).`,
  buttonWithoutText: 'Botão sem texto ou aria-label (acessibilidade).',
  tableWithoutCaption: 'Tabela sem <caption> ou aria-label (acessibilidade).',
  iframeWithoutTitle: 'Iframe sem title (acessibilidade).',

  // Performance
  largeInlineScript: 'Script inline muito grande. Mova para arquivo externo.',
  multipleH1:
    'Múltiplos <h1> detectados. Use apenas um por página para SEO/acessibilidade.',
} as const;

/* -------------------------- MENSAGENS XML -------------------------- */

export const XmlMessages = {
  xmlPrologAusente:
    'XML sem declaração <?xml ...?> (opcional, mas melhora compatibilidade).',
  doctypeDetectado:
    'XML contém <!DOCTYPE>. Atenção a vetores de XXE (entidades externas).',
  doctypeExternoDetectado:
    'XML contém DOCTYPE com identificador externo (SYSTEM/PUBLIC). Risco elevado de XXE se parser não for seguro.',
  entidadeDetectada:
    'XML contém <!ENTITY>. Revise se há risco de expansão/XXE.',
  entidadeExternaDetectada:
    'XML contém entidade externa (SYSTEM/PUBLIC). Risco alto de XXE se parser não for seguro.',
  entidadeParametroDetectada:
    'XML contém entidade de parâmetro (<!ENTITY % ...>). Pode ser usada para XXE/DTD injection; revise com cuidado.',
  xincludeDetectado:
    'XML contém XInclude (<xi:include>). Pode carregar recursos externos; valide origem e parser.',
  namespaceUndeclared: (prefix: string) =>
    `Namespace prefix "${prefix}" usado sem declaração xmlns:${prefix}.`,
  invalidXmlStructure:
    'Estrutura XML inválida detectada (tags não fechadas ou mal aninhadas).',
  encodingMismatch: (declared: string, detected: string) =>
    `Encoding declarado (${declared}) não corresponde ao detectado (${detected}).`,
  largeEntityExpansion:
    'Possível entidade com expansão muito grande. Risco de Billion Laughs attack.',
  cdataInAttribute: 'CDATA detectado em valor de atributo (inválido em XML).',
} as const;

/* -------------------------- MENSAGENS FORMATADOR (MIN) -------------------------- */

export const FormatadorMessages = {
  naoFormatado: (parser: string, detalhes?: string) => {
    const base = `Arquivo parece não estar formatado (parser: ${parser}). Considere normalizar com o formatador do Oráculo.`;
    if (!detalhes) return base;
    return `${base} (${detalhes})`;
  },
  parseErro: (parser: string, err: string) =>
    `Falha ao validar formatação interna (parser: ${parser}): ${err}`,
} as const;

/* -------------------------- MENSAGENS SVG (OTIMIZAÇÃO) -------------------------- */

export const SvgMessages = {
  naoPareceSvg: 'Arquivo .svg não contém uma tag <svg> válida.',
  semViewBox: 'SVG sem viewBox detectado (pode prejudicar responsividade).',
  scriptInline:
    'SVG contém <script>. Risco de segurança: evite SVGs com script embutido.',
  eventoInline:
    'SVG contém handlers inline (on*). Evite eventos inline em assets.',
  javascriptUrl: 'SVG contém javascript: em URL/href. Risco de segurança.',
  podeOtimizar: (
    originalBytes: number,
    optimizedBytes: number,
    mudancas: string[],
  ) =>
    `SVG pode ser otimizado (${originalBytes}B → ${optimizedBytes}B). Mudanças: ${mudancas.join(', ')}.`,
} as const;

/* -------------------------- MENSAGENS CSS-IN-JS -------------------------- */

export const CssInJsMessages = {
  detectedStyledComponents:
    'Padrões de styled-components detectados (CSS-in-JS).',
  detectedStyledJsx: 'Padrões de styled-jsx detectados (CSS-in-JS em React).',
  globalStyles: (fonte: 'styled-components' | 'styled-jsx') =>
    `Estilos globais detectados (${fonte}). Prefira escopo local quando possível.`,
  importantUsage:
    'Uso de !important em CSS-in-JS detectado; prefira especificidade adequada.',
  httpUrl: 'Recurso externo via HTTP em url(); prefira HTTPS.',
} as const;

/* -------------------------- MENSAGENS PYTHON -------------------------- */

export const PythonMessages = {
  // Imports & Dependencies
  missingTypeHints:
    'Função sem type hints detectada; adicione type hints para melhor legibilidade.',
  hardcodedString: (string: string) =>
    `String hardcoded detectada (${string.slice(0, 30)}...); considere usar constantes.`,
  httpWithoutVerify:
    'Requisição HTTP sem verify=True detectada; valide certificados SSL.',
  sqlInjection: 'Possível SQL injection detectada; use prepared statements.',

  // Code Quality
  broadExcept: 'Exceção genérica (except:) detectada; seja específico.',
  bareRaise:
    'raise sem contexto detectada; sempre passe a exceção para manter stack trace.',
  passInExcept:
    'pass em except block; implemente tratamento de erro apropriado.',

  // Best Practices
  printInsteadOfLog: 'print() detectado; prefira logging module para produção.',
  evalUsage:
    'eval() detectado; evite usar eval - vulnerabilidade de segurança.',
  execUsage:
    'exec() detectado; evite usar exec - vulnerabilidade de segurança.',
  subprocessShellTrue:
    'subprocess com shell=True detectado; risco de command injection. Prefira lista de args e shell=False.',
  pickleUsage:
    'pickle load(s) detectado; nunca desserialize dados não confiáveis (RCE). Prefira formatos seguros (JSON).',
  yamlUnsafeLoad:
    'yaml.load sem Loader seguro detectado; prefira yaml.safe_load (evita execução).',
  globalKeyword:
    'Uso de global keyword detectado; prefira passar como parâmetro.',
  mutableDefault:
    'Argumento com valor padrão mutável (list/dict) detectado; use None como padrão.',

  // Performance
  listComprehensionOpportunity:
    'Loop que poderia ser list comprehension detectado.',
  loopingOverDict: 'Iteração sobre dict sem .items(); considere usar .items().',
} as const;

/* -------------------------- Nivéis de Severidade -------------------------- */

export const SeverityLevels = {
  error: 'erro',
  warning: 'aviso',
  info: 'info',
  suggestion: 'sugestao',
} as const;

/* -------------------------- Categorias/Tipos de Analistas -------------------------- */

export const AnalystTypes = {
  react: 'react/regra',
  reactHooks: 'react-hooks/regra',
  tailwind: 'tailwindcss/regra',
  css: 'css/regra',
  html: 'html/regra',
  python: 'python/regra',
  xml: 'xml/regra',
  formatador: 'formatador/regra',
  svg: 'svg/regra',
  cssInJs: 'css-in-js/regra',
} as const;

export const AnalystOrigins = {
  react: 'analista-react',
  reactHooks: 'analista-react-hooks',
  tailwind: 'analista-tailwind',
  css: 'analista-css',
  html: 'analista-html',
  python: 'analista-python',
  xml: 'analista-xml',
  formatador: 'analista-formatador',
  svg: 'analista-svg',
  cssInJs: 'analista-css-in-js',
} as const;
