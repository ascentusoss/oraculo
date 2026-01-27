import type { EvidenciaContexto, FileEntryWithAst, PackageJson, ResultadoDeteccaoContextual } from '../../types/index.js';
export type { EvidenciaContexto, ResultadoDeteccaoContextual };
export declare function detectarContextoInteligente(estruturaDetectada: string[], arquivos: FileEntryWithAst[], packageJson?: PackageJson, options?: {
    quiet?: boolean;
}): ResultadoDeteccaoContextual[];
export declare function inferirArquetipoInteligente(estruturaDetectada: string[], arquivos: FileEntryWithAst[], packageJson?: PackageJson, options?: {
    quiet?: boolean;
}): string;
//# sourceMappingURL=detector-contexto-inteligente.d.ts.map