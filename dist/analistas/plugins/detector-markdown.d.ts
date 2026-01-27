import type { Ocorrencia } from '../../types/index.js';
import type { MarkdownAnaliseArquivo, MarkdownDetectorOptions } from '../../types/analistas/markdown.js';
declare function analisarArquivoMarkdown(fullPath: string, relPath: string, options: MarkdownDetectorOptions): Promise<MarkdownAnaliseArquivo>;
export declare const detectorMarkdown: {
    nome: string;
    categoria: string;
    descricao: string;
    test: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string, _ast: unknown, fullPath?: string) => Promise<Ocorrencia[]>;
};
export { analisarArquivoMarkdown };
//# sourceMappingURL=detector-markdown.d.ts.map