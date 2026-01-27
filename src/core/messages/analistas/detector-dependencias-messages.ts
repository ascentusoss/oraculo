// SPDX-License-Identifier: MIT

export const DetectorDependenciasMessages = {
  importDependenciaExterna: (val: string) =>
    `Importação de dependência externa: '${val}'`,
  importRelativoLongo: (val: string) =>
    `Import relativo sobe muitos diretórios: '${val}'`,
  importJsEmTs: (val: string) =>
    `Importação de arquivo .js em TypeScript: '${val}'`,
  importArquivoInexistente: (val: string) =>
    `Importação de arquivo inexistente: '${val}'`,

  requireDependenciaExterna: (val: string) =>
    `Require de dependência externa: '${val}'`,
  requireRelativoLongo: (val: string) =>
    `Require relativo sobe muitos diretórios: '${val}'`,
  requireJsEmTs: (val: string) =>
    `Require de arquivo .js em TypeScript: '${val}'`,
  requireArquivoInexistente: (val: string) =>
    `Require de arquivo inexistente: '${val}'`,

  importUsadoRegistroDinamico: (nome: string) =>
    `Import '${nome}' usado via registro dinâmico (heurística)`,

  usoMistoRequireImport:
    'Uso misto de require e import no mesmo arquivo. Padronize para um só estilo.',

  importCircularSelf:
    'Importação circular detectada: o arquivo importa a si mesmo.',

  dependenciaCircular: (totalArquivos: number, caminhoCompleto: string) =>
    `Dependência circular detectada (${totalArquivos} arquivo(s)): ${caminhoCompleto}`,
} as const;
