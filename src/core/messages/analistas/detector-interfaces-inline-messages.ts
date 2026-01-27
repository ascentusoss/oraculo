// SPDX-License-Identifier: MIT

export const DetectorInterfacesInlineMessages = {
  moverTipoParaTipos: (nomeTipo: string, tiposDir = 'src/tipos') =>
    `Mover tipo '${nomeTipo}' para ${tiposDir.endsWith('/') ? tiposDir : `${tiposDir}/`}`,

  interfaceExportadaParaTipos: (
    nomeInterface: string,
    tiposDir = 'src/tipos',
  ) =>
    `Interface '${nomeInterface}' exportada deve estar em ${
      tiposDir.endsWith('/') ? tiposDir : `${tiposDir}/`
    }`,

  interfaceComplexaParaTipos: (nomeInterface: string, tiposDir = 'src/tipos') =>
    `Interface '${nomeInterface}' complexa deve ser movida para ${
      tiposDir.endsWith('/') ? tiposDir : `${tiposDir}/`
    }`,

  tipoDuplicado: (args: {
    propriedades: string[];
    totalOcorrencias: number;
    contextoDesc: string;
    nomesSugeridos: string;
  }) =>
    `Tipo {${args.propriedades.join(', ')}...} duplicado ${args.totalOcorrencias}x ${args.contextoDesc} - extrair como '${args.nomesSugeridos}Type'`,
} as const;
