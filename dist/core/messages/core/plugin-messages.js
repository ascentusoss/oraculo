export const ReactMessages = {
    linkTargetBlank: 'Link com target="_blank" sem rel="noreferrer"/"noopener".',
    dangerouslySetInnerHTML: 'Uso de dangerouslySetInnerHTML encontrado; valide a necessidade.',
    imgWithoutAlt: 'Imagem sem atributo alt (acessibilidade).',
    httpFetch: 'Chamada HTTP sem TLS detectada; prefira HTTPS.',
    hardcodedCredential: 'Possível credencial hardcoded; use variáveis de ambiente.',
    locationHrefRedirect: 'Atribuição direta a location.href; valide origem para evitar open redirect.',
    listItemNoKey: 'Item em lista (map) sem atributo key.',
    indexAsKey: 'Uso de índice como key (pode causar problemas de reordenação).',
    inlineHandlerJsx: 'Handler inline detectado em JSX; prefira funções estáveis (useCallback) ou extrair fora do render.',
};
export const ReactHooksMessages = {
    useEffectNoDeps: 'useEffect sem array de dependências (avalie deps para evitar loops).',
    memoCallbackNoDeps: 'Hook sem array de dependências (useMemo/useCallback).',
    hookInConditional: 'Hook declarado dentro de condicional (quebra Rules of Hooks).',
};
export const TailwindMessages = {
    conflictingClasses: (key, tokens) => `Possível conflito ${key} (${tokens.slice(0, 4).join(', ')}). Verifique duplicidades.`,
    repeatedClass: (token) => `Classe repetida detectada (${token}). Considere remover redundância.`,
    importantUsage: (token) => `Uso de ! (important) detectado em (${token}). Prefira classes utilitárias ou reforço de escopo ao invés de important.`,
    variantConflict: (prop, variants) => `Possível conflito de variantes para ${prop} (variantes: ${variants.slice(0, 6).join(', ')}). Verifique ordem/escopo.`,
    dangerousArbitraryValue: (token) => `Valor arbitrário com url potencialmente perigosa (${token}). Evite javascript:/data:text/html.`,
    arbitraryValue: (token) => `Classe com valor arbitrário (${token}). Confirme se está alinhada ao design.`,
};
export const CssMessages = {
    duplicatePropertySame: (prop) => `Propriedade duplicada com valor idêntico (${prop}): erro detectado.`,
    duplicatePropertyDifferent: (prop, prev, curr) => `Propriedade duplicada (${prop}) com valores diferentes. Possível erro: "${prev}" vs "${curr}".`,
    importantUsage: 'Uso de !important detectado; prefira especificidade adequada.',
    httpImport: 'Importação via HTTP detectada; prefira HTTPS ou bundling local.',
    httpUrl: 'Recurso externo via HTTP em url(); prefira HTTPS.',
    unifySelectors: (selectors, propsCount) => `Regras CSS idênticas (${propsCount} propriedades) em seletores (${selectors.slice(0, 6).join(', ')}). Considere unificar/centralizar em uma classe utilitária ou seletor compartilhado.`,
    idSelectorPreferClass: (selector) => `Seletor por id (${selector}) detectado. Para reutilização e consistência, prefira classes quando possível.`,
    invalidProperty: (prop) => `Propriedade CSS inválida ou desconhecida (${prop}). Verifique ortografia ou suporte do navegador.`,
    malformedSelector: (selector) => `Seletor CSS malformado ou inválido (${selector}). Pode causar problemas de renderização.`,
    emptyRule: 'Regra CSS vazia detectada. Remova regras sem declarações.',
    vendorPrefixDeprecated: (prop) => `Prefixo vendor deprecated (${prop}). Use propriedades padrão quando suportadas.`,
    cssHackDetected: (hack) => `Hack CSS detectado (${hack}). Considere abordagens modernas ou feature queries.`,
};
export const HtmlMessages = {
    doctype: 'Documento sem <!DOCTYPE html> declarado.',
    htmlLang: 'Elemento <html> sem atributo lang (acessibilidade).',
    metaCharset: 'Falta <meta charset="utf-8"> no documento.',
    viewport: 'Falta meta viewport para responsividade.',
    title: 'Documento sem <title> definido.',
    linkTargetBlank: 'Link com target="_blank" sem rel="noreferrer"/"noopener".',
    linkNoHref: 'Link sem href válido ou sem handler (UX). Use <button> ou role="button".',
    imgWithoutAlt: 'Imagem sem atributo alt ou acessibilidade (WCAG 2.1).',
    imgWithoutLoading: 'Imagem sem atributo loading (performance). Considere loading="lazy".',
    imgWithoutDimensions: 'Imagem sem width/height (layout shift). Defina dimensões para evitar CLS.',
    formWithoutMethod: 'Formulário sem method especificado (GET/POST).',
    formWithoutAction: 'Formulário sem action ou data-attribute para processamento.',
    inputWithoutLabel: 'Input sem name, id ou aria-label (acessibilidade/usabilidade).',
    passwordWithoutAutocomplete: 'Campo password sem autocomplete especificado (segurança).',
    inputWithoutType: 'Input sem type especificado (assume text, mas seja explícito).',
    inlineHandler: 'Handler inline detectado (on*). Prefira listeners externos ou data-attributes com JS.',
    inlineScript: 'Script inline detectado. Prefira arquivos externos para melhor cache e CSP.',
    inlineStyle: 'Style inline detectado. Prefira arquivos CSS externos para melhor cache.',
    scriptWithoutDefer: 'Script sem defer/async. Pode bloquear renderização; considere defer.',
    headingSkipped: (current, expected) => `Cabeçalho pulado: h${current} sem h${expected} precedente (estrutura semântica).`,
    buttonWithoutText: 'Botão sem texto ou aria-label (acessibilidade).',
    tableWithoutCaption: 'Tabela sem <caption> ou aria-label (acessibilidade).',
    iframeWithoutTitle: 'Iframe sem title (acessibilidade).',
    largeInlineScript: 'Script inline muito grande. Mova para arquivo externo.',
    multipleH1: 'Múltiplos <h1> detectados. Use apenas um por página para SEO/acessibilidade.',
};
export const XmlMessages = {
    xmlPrologAusente: 'XML sem declaração <?xml ...?> (opcional, mas melhora compatibilidade).',
    doctypeDetectado: 'XML contém <!DOCTYPE>. Atenção a vetores de XXE (entidades externas).',
    doctypeExternoDetectado: 'XML contém DOCTYPE com identificador externo (SYSTEM/PUBLIC). Risco elevado de XXE se parser não for seguro.',
    entidadeDetectada: 'XML contém <!ENTITY>. Revise se há risco de expansão/XXE.',
    entidadeExternaDetectada: 'XML contém entidade externa (SYSTEM/PUBLIC). Risco alto de XXE se parser não for seguro.',
    entidadeParametroDetectada: 'XML contém entidade de parâmetro (<!ENTITY % ...>). Pode ser usada para XXE/DTD injection; revise com cuidado.',
    xincludeDetectado: 'XML contém XInclude (<xi:include>). Pode carregar recursos externos; valide origem e parser.',
    namespaceUndeclared: (prefix) => `Namespace prefix "${prefix}" usado sem declaração xmlns:${prefix}.`,
    invalidXmlStructure: 'Estrutura XML inválida detectada (tags não fechadas ou mal aninhadas).',
    encodingMismatch: (declared, detected) => `Encoding declarado (${declared}) não corresponde ao detectado (${detected}).`,
    largeEntityExpansion: 'Possível entidade com expansão muito grande. Risco de Billion Laughs attack.',
    cdataInAttribute: 'CDATA detectado em valor de atributo (inválido em XML).',
};
export const FormatadorMessages = {
    naoFormatado: (parser, detalhes) => {
        const base = `Arquivo parece não estar formatado (parser: ${parser}). Considere normalizar com o formatador do Oráculo.`;
        if (!detalhes)
            return base;
        return `${base} (${detalhes})`;
    },
    parseErro: (parser, err) => `Falha ao validar formatação interna (parser: ${parser}): ${err}`,
};
export const SvgMessages = {
    naoPareceSvg: 'Arquivo .svg não contém uma tag <svg> válida.',
    semViewBox: 'SVG sem viewBox detectado (pode prejudicar responsividade).',
    scriptInline: 'SVG contém <script>. Risco de segurança: evite SVGs com script embutido.',
    eventoInline: 'SVG contém handlers inline (on*). Evite eventos inline em assets.',
    javascriptUrl: 'SVG contém javascript: em URL/href. Risco de segurança.',
    podeOtimizar: (originalBytes, optimizedBytes, mudancas) => `SVG pode ser otimizado (${originalBytes}B → ${optimizedBytes}B). Mudanças: ${mudancas.join(', ')}.`,
};
export const CssInJsMessages = {
    detectedStyledComponents: 'Padrões de styled-components detectados (CSS-in-JS).',
    detectedStyledJsx: 'Padrões de styled-jsx detectados (CSS-in-JS em React).',
    globalStyles: (fonte) => `Estilos globais detectados (${fonte}). Prefira escopo local quando possível.`,
    importantUsage: 'Uso de !important em CSS-in-JS detectado; prefira especificidade adequada.',
    httpUrl: 'Recurso externo via HTTP em url(); prefira HTTPS.',
};
export const PythonMessages = {
    missingTypeHints: 'Função sem type hints detectada; adicione type hints para melhor legibilidade.',
    hardcodedString: (string) => `String hardcoded detectada (${string.slice(0, 30)}...); considere usar constantes.`,
    httpWithoutVerify: 'Requisição HTTP sem verify=True detectada; valide certificados SSL.',
    sqlInjection: 'Possível SQL injection detectada; use prepared statements.',
    broadExcept: 'Exceção genérica (except:) detectada; seja específico.',
    bareRaise: 'raise sem contexto detectada; sempre passe a exceção para manter stack trace.',
    passInExcept: 'pass em except block; implemente tratamento de erro apropriado.',
    printInsteadOfLog: 'print() detectado; prefira logging module para produção.',
    evalUsage: 'eval() detectado; evite usar eval - vulnerabilidade de segurança.',
    execUsage: 'exec() detectado; evite usar exec - vulnerabilidade de segurança.',
    subprocessShellTrue: 'subprocess com shell=True detectado; risco de command injection. Prefira lista de args e shell=False.',
    pickleUsage: 'pickle load(s) detectado; nunca desserialize dados não confiáveis (RCE). Prefira formatos seguros (JSON).',
    yamlUnsafeLoad: 'yaml.load sem Loader seguro detectado; prefira yaml.safe_load (evita execução).',
    globalKeyword: 'Uso de global keyword detectado; prefira passar como parâmetro.',
    mutableDefault: 'Argumento com valor padrão mutável (list/dict) detectado; use None como padrão.',
    listComprehensionOpportunity: 'Loop que poderia ser list comprehension detectado.',
    loopingOverDict: 'Iteração sobre dict sem .items(); considere usar .items().',
};
export const SeverityLevels = {
    error: 'erro',
    warning: 'aviso',
    info: 'info',
    suggestion: 'sugestao',
};
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
};
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
};
//# sourceMappingURL=plugin-messages.js.map