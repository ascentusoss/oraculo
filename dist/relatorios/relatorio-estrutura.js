export function gerarRelatorioEstrutura(mapa) {
    const desalinhados = mapa.filter((item) => item.ideal && item.atual !== item.ideal);
    if (desalinhados.length === 0) {
        return [
            '# ?? Estrutura verificada',
            '',
            '? Tudo está em sua camada ideal.',
            '',
        ].join('\\n');
    }
    return [
        '# ?? Diagnóstico de Estrutura',
        '',
        `?? Foram encontrados ${desalinhados.length} arquivo(s) fora da camada esperada:\\n`,
        ...desalinhados.map(({ arquivo, atual, ideal }) => `- \`${arquivo}\` está em \`${atual}\`, deveria estar em \`${ideal}\``),
        '',
    ].join('\\n');
}
//# sourceMappingURL=relatorio-estrutura.js.map