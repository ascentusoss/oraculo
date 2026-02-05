import type { File as BabelFile } from '@babel/types';
import type { ParserOptions, ParserPlugin } from '../../types/index.js';
export declare class CorePlugin implements ParserPlugin {
    name: string;
    version: string;
    extensions: string[];
    parse(codigo: string, opts?: ParserOptions): Promise<BabelFile | null>;
    private parseJavaScript;
    private parseTypeScript;
    private parseComBabel;
    private parseComTypeScriptCompiler;
    private parseHtml;
    private parseCss;
    private parseXml;
    private parsePhp;
    private parsePython;
    private wrapMinimal;
    private inferExtension;
    validate(codigo: string): boolean;
}
declare const corePlugin: CorePlugin;
export default corePlugin;
//# sourceMappingURL=core-plugin.d.ts.map