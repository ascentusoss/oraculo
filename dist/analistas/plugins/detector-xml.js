export function detectarArquetipoXML(arquivos) {
    const xmlFiles = arquivos.filter((f) => f.endsWith('.xml'));
    if (xmlFiles.length === 0) {
        return [];
    }
    const hasWebXml = xmlFiles.some((f) => f.includes('web.xml') ||
        f.includes('sitemap.xml') ||
        f.includes('rss.xml') ||
        f.includes('feed.xml') ||
        f.includes('soap'));
    if (hasWebXml) {
        return [
            {
                nome: 'web-xml-project',
                score: 75,
                confidence: 85,
                matchedRequired: ['web-xml-files'],
                missingRequired: [],
                matchedOptional: xmlFiles,
                dependencyMatches: [],
                filePatternMatches: xmlFiles.filter((f) => f.includes('web.xml') ||
                    f.includes('sitemap') ||
                    f.includes('rss') ||
                    f.includes('feed') ||
                    f.includes('soap')),
                forbiddenPresent: [],
                anomalias: [],
                sugestaoPadronizacao: 'Projeto web com XML detectado (RSS, SOAP, sitemap, etc)',
                explicacaoSimilaridade: 'Arquivos XML típicos de aplicações web',
                descricao: 'Projeto web usando XML para feeds, configuração ou APIs',
                planoSugestao: {
                    mover: [],
                    conflitos: [],
                    resumo: { total: 0, zonaVerde: xmlFiles.length, bloqueados: 0 },
                },
            },
        ];
    }
    const hasSvg = xmlFiles.some((f) => f.endsWith('.svg'));
    if (hasSvg) {
        return [
            {
                nome: 'svg-graphics-project',
                score: 65,
                confidence: 80,
                matchedRequired: ['svg-files'],
                missingRequired: [],
                matchedOptional: xmlFiles.filter((f) => !f.endsWith('.svg')),
                dependencyMatches: [],
                filePatternMatches: xmlFiles.filter((f) => f.endsWith('.svg')),
                forbiddenPresent: [],
                anomalias: [],
                sugestaoPadronizacao: 'Projeto com gráficos SVG detectado',
                explicacaoSimilaridade: 'Arquivos SVG (Scalable Vector Graphics)',
                descricao: 'Projeto usando gráficos vetoriais SVG',
                planoSugestao: {
                    mover: [],
                    conflitos: [],
                    resumo: { total: 0, zonaVerde: xmlFiles.length, bloqueados: 0 },
                },
            },
        ];
    }
    if (xmlFiles.length >= 3) {
        return [
            {
                nome: 'xml-config-project',
                score: 50,
                confidence: 60,
                matchedRequired: ['xml-files'],
                missingRequired: [],
                matchedOptional: [],
                dependencyMatches: [],
                filePatternMatches: xmlFiles.slice(0, 3),
                forbiddenPresent: [],
                anomalias: [],
                sugestaoPadronizacao: 'Projeto com arquivos XML de configuração detectado',
                explicacaoSimilaridade: 'Múltiplos arquivos XML para configuração ou dados',
                descricao: 'Projeto que usa XML para configuração ou armazenamento de dados',
                planoSugestao: {
                    mover: [],
                    conflitos: [],
                    resumo: { total: 0, zonaVerde: xmlFiles.length, bloqueados: 0 },
                },
            },
        ];
    }
    return [];
}
//# sourceMappingURL=detector-xml.js.map