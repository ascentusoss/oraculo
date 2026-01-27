export const DetectorDependenciasMessages = {
    importDependenciaExterna: (val) => `Importação de dependência externa: '${val}'`,
    importRelativoLongo: (val) => `Import relativo sobe muitos diretórios: '${val}'`,
    importJsEmTs: (val) => `Importação de arquivo .js em TypeScript: '${val}'`,
    importArquivoInexistente: (val) => `Importação de arquivo inexistente: '${val}'`,
    requireDependenciaExterna: (val) => `Require de dependência externa: '${val}'`,
    requireRelativoLongo: (val) => `Require relativo sobe muitos diretórios: '${val}'`,
    requireJsEmTs: (val) => `Require de arquivo .js em TypeScript: '${val}'`,
    requireArquivoInexistente: (val) => `Require de arquivo inexistente: '${val}'`,
    importUsadoRegistroDinamico: (nome) => `Import '${nome}' usado via registro dinâmico (heurística)`,
    usoMistoRequireImport: 'Uso misto de require e import no mesmo arquivo. Padronize para um só estilo.',
    importCircularSelf: 'Importação circular detectada: o arquivo importa a si mesmo.',
    dependenciaCircular: (totalArquivos, caminhoCompleto) => `Dependência circular detectada (${totalArquivos} arquivo(s)): ${caminhoCompleto}`,
};
//# sourceMappingURL=detector-dependencias-messages.js.map