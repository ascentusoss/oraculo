type EntrypointsAgrupadosArgs = {
    previewGrupos: string;
    sufixoOcultos?: string;
};
export declare const DetectorEstruturaMessages: {
    readonly monorepoDetectado: "Estrutura de monorepo detectada.";
    readonly monorepoSemPackages: "Monorepo sem pasta packages/.";
    readonly fullstackDetectado: "Estrutura fullstack detectada.";
    readonly pagesSemApi: "Projeto possui pages/ mas não possui api/.";
    readonly estruturaMista: "Projeto possui src/ e packages/ (monorepo) ao mesmo tempo. Avalie a organização.";
    readonly muitosArquivosRaiz: "Muitos arquivos na raiz do projeto. Considere organizar em pastas.";
    readonly sinaisBackend: "Sinais de backend detectados (controllers/, prisma/, api/).";
    readonly sinaisFrontend: "Sinais de frontend detectados (components/, pages/).";
    readonly projetoGrandeSemSrc: "Projeto grande sem pasta src/. Considere organizar o código fonte.";
    readonly arquivosConfigDetectados: (detectados: string[]) => string;
    readonly multiplosEntrypointsAgrupados: ({ previewGrupos, sufixoOcultos, }: EntrypointsAgrupadosArgs) => string;
    readonly multiplosEntrypointsLista: (preview: string[], resto: number) => string;
};
export {};
//# sourceMappingURL=detector-estrutura-messages.d.ts.map