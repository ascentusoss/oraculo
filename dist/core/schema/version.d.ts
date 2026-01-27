import type { RelatorioComVersao, SchemaMetadata } from '../../types/index.js';
export type { RelatorioComVersao, SchemaMetadata };
export declare const VERSAO_ATUAL = "1.0.0";
export declare const HISTORICO_VERSOES: Record<string, SchemaMetadata>;
export declare function criarSchemaMetadata(versao?: string, descricaoPersonalizada?: string): SchemaMetadata;
export declare function validarSchema(relatorio: Record<string, unknown>): {
    valido: boolean;
    erros: string[];
};
export declare function migrarParaVersaoAtual<T>(relatorio: Record<string, unknown>): RelatorioComVersao<T>;
export declare function criarRelatorioComVersao<T>(dados: T, versao?: string, descricao?: string): RelatorioComVersao<T>;
export declare function extrairDados<T>(relatorio: RelatorioComVersao<T>): T;
export declare function versaoCompativel(versao: string): boolean;
//# sourceMappingURL=version.d.ts.map