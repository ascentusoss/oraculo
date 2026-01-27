export interface SchemaMetadata {
    versao: string;
    criadoEm: string;
    descricao: string;
    compatibilidade: string[];
    camposObrigatorios: string[];
    camposOpcionais: string[];
    version?: string;
    generatedAt?: string;
    schemaVersion?: string;
    formato?: string;
}
export interface RelatorioComVersao<T = unknown> {
    _schema: SchemaMetadata;
    dados: T;
    metadata?: SchemaMetadata;
}
//# sourceMappingURL=schema.d.ts.map