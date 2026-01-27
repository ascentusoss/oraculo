export declare const DetectorDependenciasMessages: {
    readonly importDependenciaExterna: (val: string) => string;
    readonly importRelativoLongo: (val: string) => string;
    readonly importJsEmTs: (val: string) => string;
    readonly importArquivoInexistente: (val: string) => string;
    readonly requireDependenciaExterna: (val: string) => string;
    readonly requireRelativoLongo: (val: string) => string;
    readonly requireJsEmTs: (val: string) => string;
    readonly requireArquivoInexistente: (val: string) => string;
    readonly importUsadoRegistroDinamico: (nome: string) => string;
    readonly usoMistoRequireImport: "Uso misto de require e import no mesmo arquivo. Padronize para um só estilo.";
    readonly importCircularSelf: "Importação circular detectada: o arquivo importa a si mesmo.";
    readonly dependenciaCircular: (totalArquivos: number, caminhoCompleto: string) => string;
};
//# sourceMappingURL=detector-dependencias-messages.d.ts.map