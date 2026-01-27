export const DetectorEstruturaMessages = {
    monorepoDetectado: 'Estrutura de monorepo detectada.',
    monorepoSemPackages: 'Monorepo sem pasta packages/.',
    fullstackDetectado: 'Estrutura fullstack detectada.',
    pagesSemApi: 'Projeto possui pages/ mas não possui api/.',
    estruturaMista: 'Projeto possui src/ e packages/ (monorepo) ao mesmo tempo. Avalie a organização.',
    muitosArquivosRaiz: 'Muitos arquivos na raiz do projeto. Considere organizar em pastas.',
    sinaisBackend: 'Sinais de backend detectados (controllers/, prisma/, api/).',
    sinaisFrontend: 'Sinais de frontend detectados (components/, pages/).',
    projetoGrandeSemSrc: 'Projeto grande sem pasta src/. Considere organizar o código fonte.',
    arquivosConfigDetectados: (detectados) => `Arquivos de configuração detectados: ${detectados.join(', ')}`,
    multiplosEntrypointsAgrupados: ({ previewGrupos, sufixoOcultos, }) => sufixoOcultos && sufixoOcultos.length > 0
        ? `Projeto possui múltiplos entrypoints (agrupados por diretório): ${previewGrupos} … (${sufixoOcultos} ocultos)`
        : `Projeto possui múltiplos entrypoints (agrupados por diretório): ${previewGrupos}`,
    multiplosEntrypointsLista: (preview, resto) => resto > 0
        ? `Projeto possui múltiplos entrypoints: ${preview.join(', ')} … (+${resto} ocultos)`
        : `Projeto possui múltiplos entrypoints: ${preview.join(', ')}`,
};
//# sourceMappingURL=detector-estrutura-messages.js.map