export declare const ReactMessages: {
    readonly linkTargetBlank: "Link com target=\"_blank\" sem rel=\"noreferrer\"/\"noopener\".";
    readonly dangerouslySetInnerHTML: "Uso de dangerouslySetInnerHTML encontrado; valide a necessidade.";
    readonly imgWithoutAlt: "Imagem sem atributo alt (acessibilidade).";
    readonly httpFetch: "Chamada HTTP sem TLS detectada; prefira HTTPS.";
    readonly hardcodedCredential: "Possível credencial hardcoded; use variáveis de ambiente.";
    readonly locationHrefRedirect: "Atribuição direta a location.href; valide origem para evitar open redirect.";
    readonly listItemNoKey: "Item em lista (map) sem atributo key.";
    readonly indexAsKey: "Uso de índice como key (pode causar problemas de reordenação).";
    readonly inlineHandlerJsx: "Handler inline detectado em JSX; prefira funções estáveis (useCallback) ou extrair fora do render.";
};
export declare const ReactHooksMessages: {
    readonly useEffectNoDeps: "useEffect sem array de dependências (avalie deps para evitar loops).";
    readonly memoCallbackNoDeps: "Hook sem array de dependências (useMemo/useCallback).";
    readonly hookInConditional: "Hook declarado dentro de condicional (quebra Rules of Hooks).";
};
export declare const TailwindMessages: {
    readonly conflictingClasses: (key: string, tokens: string[]) => string;
    readonly repeatedClass: (token: string) => string;
    readonly importantUsage: (token: string) => string;
    readonly variantConflict: (prop: string, variants: string[]) => string;
    readonly dangerousArbitraryValue: (token: string) => string;
    readonly arbitraryValue: (token: string) => string;
};
export declare const CssMessages: {
    readonly duplicatePropertySame: (prop: string) => string;
    readonly duplicatePropertyDifferent: (prop: string, prev: string, curr: string) => string;
    readonly importantUsage: "Uso de !important detectado; prefira especificidade adequada.";
    readonly httpImport: "Importação via HTTP detectada; prefira HTTPS ou bundling local.";
    readonly httpUrl: "Recurso externo via HTTP em url(); prefira HTTPS.";
    readonly unifySelectors: (selectors: string[], propsCount: number) => string;
    readonly idSelectorPreferClass: (selector: string) => string;
    readonly invalidProperty: (prop: string) => string;
    readonly malformedSelector: (selector: string) => string;
    readonly emptyRule: "Regra CSS vazia detectada. Remova regras sem declarações.";
    readonly vendorPrefixDeprecated: (prop: string) => string;
    readonly cssHackDetected: (hack: string) => string;
};
export declare const HtmlMessages: {
    readonly doctype: "Documento sem <!DOCTYPE html> declarado.";
    readonly htmlLang: "Elemento <html> sem atributo lang (acessibilidade).";
    readonly metaCharset: "Falta <meta charset=\"utf-8\"> no documento.";
    readonly viewport: "Falta meta viewport para responsividade.";
    readonly title: "Documento sem <title> definido.";
    readonly linkTargetBlank: "Link com target=\"_blank\" sem rel=\"noreferrer\"/\"noopener\".";
    readonly linkNoHref: "Link sem href válido ou sem handler (UX). Use <button> ou role=\"button\".";
    readonly imgWithoutAlt: "Imagem sem atributo alt ou acessibilidade (WCAG 2.1).";
    readonly imgWithoutLoading: "Imagem sem atributo loading (performance). Considere loading=\"lazy\".";
    readonly imgWithoutDimensions: "Imagem sem width/height (layout shift). Defina dimensões para evitar CLS.";
    readonly formWithoutMethod: "Formulário sem method especificado (GET/POST).";
    readonly formWithoutAction: "Formulário sem action ou data-attribute para processamento.";
    readonly inputWithoutLabel: "Input sem name, id ou aria-label (acessibilidade/usabilidade).";
    readonly passwordWithoutAutocomplete: "Campo password sem autocomplete especificado (segurança).";
    readonly inputWithoutType: "Input sem type especificado (assume text, mas seja explícito).";
    readonly inlineHandler: "Handler inline detectado (on*). Prefira listeners externos ou data-attributes com JS.";
    readonly inlineScript: "Script inline detectado. Prefira arquivos externos para melhor cache e CSP.";
    readonly inlineStyle: "Style inline detectado. Prefira arquivos CSS externos para melhor cache.";
    readonly scriptWithoutDefer: "Script sem defer/async. Pode bloquear renderização; considere defer.";
    readonly headingSkipped: (current: number, expected: number) => string;
    readonly buttonWithoutText: "Botão sem texto ou aria-label (acessibilidade).";
    readonly tableWithoutCaption: "Tabela sem <caption> ou aria-label (acessibilidade).";
    readonly iframeWithoutTitle: "Iframe sem title (acessibilidade).";
    readonly largeInlineScript: "Script inline muito grande. Mova para arquivo externo.";
    readonly multipleH1: "Múltiplos <h1> detectados. Use apenas um por página para SEO/acessibilidade.";
};
export declare const XmlMessages: {
    readonly xmlPrologAusente: "XML sem declaração <?xml ...?> (opcional, mas melhora compatibilidade).";
    readonly doctypeDetectado: "XML contém <!DOCTYPE>. Atenção a vetores de XXE (entidades externas).";
    readonly doctypeExternoDetectado: "XML contém DOCTYPE com identificador externo (SYSTEM/PUBLIC). Risco elevado de XXE se parser não for seguro.";
    readonly entidadeDetectada: "XML contém <!ENTITY>. Revise se há risco de expansão/XXE.";
    readonly entidadeExternaDetectada: "XML contém entidade externa (SYSTEM/PUBLIC). Risco alto de XXE se parser não for seguro.";
    readonly entidadeParametroDetectada: "XML contém entidade de parâmetro (<!ENTITY % ...>). Pode ser usada para XXE/DTD injection; revise com cuidado.";
    readonly xincludeDetectado: "XML contém XInclude (<xi:include>). Pode carregar recursos externos; valide origem e parser.";
    readonly namespaceUndeclared: (prefix: string) => string;
    readonly invalidXmlStructure: "Estrutura XML inválida detectada (tags não fechadas ou mal aninhadas).";
    readonly encodingMismatch: (declared: string, detected: string) => string;
    readonly largeEntityExpansion: "Possível entidade com expansão muito grande. Risco de Billion Laughs attack.";
    readonly cdataInAttribute: "CDATA detectado em valor de atributo (inválido em XML).";
};
export declare const FormatadorMessages: {
    readonly naoFormatado: (parser: string, detalhes?: string) => string;
    readonly parseErro: (parser: string, err: string) => string;
};
export declare const SvgMessages: {
    readonly naoPareceSvg: "Arquivo .svg não contém uma tag <svg> válida.";
    readonly semViewBox: "SVG sem viewBox detectado (pode prejudicar responsividade).";
    readonly scriptInline: "SVG contém <script>. Risco de segurança: evite SVGs com script embutido.";
    readonly eventoInline: "SVG contém handlers inline (on*). Evite eventos inline em assets.";
    readonly javascriptUrl: "SVG contém javascript: em URL/href. Risco de segurança.";
    readonly podeOtimizar: (originalBytes: number, optimizedBytes: number, mudancas: string[]) => string;
};
export declare const CssInJsMessages: {
    readonly detectedStyledComponents: "Padrões de styled-components detectados (CSS-in-JS).";
    readonly detectedStyledJsx: "Padrões de styled-jsx detectados (CSS-in-JS em React).";
    readonly globalStyles: (fonte: "styled-components" | "styled-jsx") => string;
    readonly importantUsage: "Uso de !important em CSS-in-JS detectado; prefira especificidade adequada.";
    readonly httpUrl: "Recurso externo via HTTP em url(); prefira HTTPS.";
};
export declare const PythonMessages: {
    readonly missingTypeHints: "Função sem type hints detectada; adicione type hints para melhor legibilidade.";
    readonly hardcodedString: (string: string) => string;
    readonly httpWithoutVerify: "Requisição HTTP sem verify=True detectada; valide certificados SSL.";
    readonly sqlInjection: "Possível SQL injection detectada; use prepared statements.";
    readonly broadExcept: "Exceção genérica (except:) detectada; seja específico.";
    readonly bareRaise: "raise sem contexto detectada; sempre passe a exceção para manter stack trace.";
    readonly passInExcept: "pass em except block; implemente tratamento de erro apropriado.";
    readonly printInsteadOfLog: "print() detectado; prefira logging module para produção.";
    readonly evalUsage: "eval() detectado; evite usar eval - vulnerabilidade de segurança.";
    readonly execUsage: "exec() detectado; evite usar exec - vulnerabilidade de segurança.";
    readonly subprocessShellTrue: "subprocess com shell=True detectado; risco de command injection. Prefira lista de args e shell=False.";
    readonly pickleUsage: "pickle load(s) detectado; nunca desserialize dados não confiáveis (RCE). Prefira formatos seguros (JSON).";
    readonly yamlUnsafeLoad: "yaml.load sem Loader seguro detectado; prefira yaml.safe_load (evita execução).";
    readonly globalKeyword: "Uso de global keyword detectado; prefira passar como parâmetro.";
    readonly mutableDefault: "Argumento com valor padrão mutável (list/dict) detectado; use None como padrão.";
    readonly listComprehensionOpportunity: "Loop que poderia ser list comprehension detectado.";
    readonly loopingOverDict: "Iteração sobre dict sem .items(); considere usar .items().";
};
export declare const SeverityLevels: {
    readonly error: "erro";
    readonly warning: "aviso";
    readonly info: "info";
    readonly suggestion: "sugestao";
};
export declare const AnalystTypes: {
    readonly react: "react/regra";
    readonly reactHooks: "react-hooks/regra";
    readonly tailwind: "tailwindcss/regra";
    readonly css: "css/regra";
    readonly html: "html/regra";
    readonly python: "python/regra";
    readonly xml: "xml/regra";
    readonly formatador: "formatador/regra";
    readonly svg: "svg/regra";
    readonly cssInJs: "css-in-js/regra";
};
export declare const AnalystOrigins: {
    readonly react: "analista-react";
    readonly reactHooks: "analista-react-hooks";
    readonly tailwind: "analista-tailwind";
    readonly css: "analista-css";
    readonly html: "analista-html";
    readonly python: "analista-python";
    readonly xml: "analista-xml";
    readonly formatador: "analista-formatador";
    readonly svg: "analista-svg";
    readonly cssInJs: "analista-css-in-js";
};
//# sourceMappingURL=plugin-messages.d.ts.map