import { readFileSync, writeFileSync } from 'node:fs';
export async function aplicarCorrecaoArquivo(arquivo, ocorrencias, config) {
    try {
        const paraCorrigir = ocorrencias.filter((o) => o.categoria === 'corrigir' && o.confianca >= config.minConfianca);
        if (paraCorrigir.length === 0) {
            return {
                sucesso: true,
                arquivo,
                linhasModificadas: 0,
            };
        }
        const conteudo = readFileSync(arquivo, 'utf-8');
        const linhas = conteudo.split('\n');
        let modificadas = 0;
        const ordenadas = [...paraCorrigir].sort((a, b) => (b.ocorrencia.linha || 0) - (a.ocorrencia.linha || 0));
        for (const item of ordenadas) {
            const linha = item.ocorrencia.linha;
            if (!linha || linha < 1 || linha > linhas.length)
                continue;
            const linhaIdx = linha - 1;
            const linhaOriginal = linhas[linhaIdx];
            let linhaCorrigida = linhaOriginal;
            if (item.ocorrencia.tipo === 'tipo-inseguro-any') {
                linhaCorrigida = linhaOriginal.replace(/:\s*any\b/g, ': unknown');
                linhaCorrigida = linhaCorrigida.replace(/\)\s*:\s*any\b/g, '): unknown');
            }
            else if (item.ocorrencia.tipo === 'tipo-inseguro-any-assertion') {
                linhaCorrigida = linhaOriginal.replace(/as\s+any\b/g, 'as unknown');
            }
            else if (item.ocorrencia.tipo === 'tipo-inseguro-any-cast') {
                linhaCorrigida = linhaOriginal.replace(/<any>/g, '<unknown>');
            }
            if (linhaCorrigida !== linhaOriginal) {
                linhas[linhaIdx] = linhaCorrigida;
                modificadas++;
            }
        }
        if (modificadas === 0) {
            return {
                sucesso: true,
                arquivo,
                linhasModificadas: 0,
            };
        }
        const novoConteudo = linhas.join('\n');
        if (!config.dryRun) {
            writeFileSync(arquivo, novoConteudo, 'utf-8');
        }
        return {
            sucesso: true,
            arquivo,
            linhasModificadas: modificadas,
        };
    }
    catch (erro) {
        const mensagemErro = erro instanceof Error ? erro.message : String(erro);
        return {
            sucesso: false,
            arquivo,
            linhasModificadas: 0,
            erro: mensagemErro,
        };
    }
}
export async function aplicarCorrecoesEmLote(porArquivo, config) {
    const resultados = [];
    let sucesso = 0;
    let falhas = 0;
    for (const [arquivo, ocorrencias] of Object.entries(porArquivo)) {
        const resultado = await aplicarCorrecaoArquivo(arquivo, ocorrencias, config);
        resultados.push(resultado);
        if (resultado.sucesso && resultado.linhasModificadas > 0) {
            sucesso++;
        }
        else if (!resultado.sucesso) {
            falhas++;
        }
    }
    return { sucesso, falhas, resultados };
}
//# sourceMappingURL=auto-fix-engine.js.map