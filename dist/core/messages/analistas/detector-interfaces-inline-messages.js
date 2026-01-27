export const DetectorInterfacesInlineMessages = {
    moverTipoParaTipos: (nomeTipo, tiposDir = 'src/tipos') => `Mover tipo '${nomeTipo}' para ${tiposDir.endsWith('/') ? tiposDir : `${tiposDir}/`}`,
    interfaceExportadaParaTipos: (nomeInterface, tiposDir = 'src/tipos') => `Interface '${nomeInterface}' exportada deve estar em ${tiposDir.endsWith('/') ? tiposDir : `${tiposDir}/`}`,
    interfaceComplexaParaTipos: (nomeInterface, tiposDir = 'src/tipos') => `Interface '${nomeInterface}' complexa deve ser movida para ${tiposDir.endsWith('/') ? tiposDir : `${tiposDir}/`}`,
    tipoDuplicado: (args) => `Tipo {${args.propriedades.join(', ')}...} duplicado ${args.totalOcorrencias}x ${args.contextoDesc} - extrair como '${args.nomesSugeridos}Type'`,
};
//# sourceMappingURL=detector-interfaces-inline-messages.js.map