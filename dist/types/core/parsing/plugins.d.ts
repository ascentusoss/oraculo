import type { File as BabelFile, Node } from '/types';
export type PythonPhpAstNode = {
    type: string;
    body?: PythonPhpAstNode | PythonPhpAstNode[];
    [key: string]: PythonPhpAstNode | PythonPhpAstNode[] | string | string[] | number | number[] | boolean | null | undefined;
};
export type HtmlXmlNode = {
    tagName?: string;
    name?: string;
    type?: string;
    children?: HtmlXmlNode[];
    attribs?: Record<string, string>;
    attributes?: Record<string, string | number | boolean>;
    data?: string;
    [key: string]: HtmlXmlNode | HtmlXmlNode[] | string | number | boolean | Record<string, unknown> | null | undefined;
};
export type CssRule = {
    type?: string;
    selectors?: string[];
    declarations?: Array<{
        property: string;
        value: string;
    }>;
    [key: string]: string | string[] | Array<Record<string, string>> | undefined;
};
export type CssAst = {
    type: 'StyleSheet';
    stylesheet?: {
        rules?: CssRule[];
        parsingErrors?: Array<{
            message: string;
            line?: number;
        }>;
    };
};
export type RawAst = Node | PythonPhpAstNode | HtmlXmlNode | CssAst | Record<string, string | string[] | number | boolean | Record<string, unknown> | null | undefined>;
export type ParserRawAst = RawAst;
export interface ParserMetadata {
    parseTime?: number;
    parserVersion?: string;
    language?: string;
    encoding?: string;
    errors?: Array<{
        line: number;
        message: string;
    }>;
    warnings?: string[];
    sourceType?: 'module' | 'script' | 'unambiguous';
}
export interface ParserPlugin {
    name: string;
    version: string;
    extensions: string[];
    parse(codigo: string, opts?: ParserOptions): Promise<BabelFile | null> | BabelFile | null;
    validate?(codigo: string): boolean;
    dependencies?: string[];
    config?: Record<string, unknown>;
}
export interface ParserOptions {
    plugins?: string[];
    timeoutMs?: number;
    pluginConfig?: Record<string, unknown>;
    extension?: string;
    sourceType?: 'module' | 'script' | 'unambiguous';
    allowReturnOutsideFunction?: boolean;
}
export interface BabelFileExtra extends BabelFile {
    oraculoExtra?: {
        lang: string;
        rawAst: RawAst;
        metadata?: ParserMetadata;
    };
}
export interface PluginConfig {
    enabled: string[];
    autoload: boolean;
    registry?: string;
    pluginConfigs?: Record<string, Record<string, unknown>>;
}
export interface LanguageSupport {
    enabled: boolean;
    parser?: string;
    plugin?: string;
    config?: Record<string, unknown>;
}
//# sourceMappingURL=plugins.d.ts.map