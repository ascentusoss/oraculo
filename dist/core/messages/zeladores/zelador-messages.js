import { ICONES_ACAO, ICONES_STATUS, ICONES_ZELADOR as ICONES_ZELADOR_CENTRAL, } from '../ui/icons.js';
export const ICONES_ZELADOR = {
    ...ICONES_ZELADOR_CENTRAL,
};
export const MENSAGENS_IMPORTS = {
    titulo: `${ICONES_ACAO.correcao} Zelador de Imports - Iniciando correções...`,
    resumo: `${ICONES_ZELADOR.resumo} Resumo:`,
    dryRunAviso: `${ICONES_ZELADOR.dryRun} Modo dry-run: nenhum arquivo foi modificado`,
    sucessoFinal: `${ICONES_STATUS.ok} Correções aplicadas com sucesso!`,
};
export const PROGRESSO_IMPORTS = {
    diretorioNaoEncontrado: (dir) => `${ICONES_ZELADOR.aviso} Diretório não encontrado: ${dir}`,
    arquivoProcessado: (arquivo, count) => `${ICONES_ZELADOR.sucesso} ${arquivo} (${count} correção${count !== 1 ? 'ões' : ''})`,
    arquivoErro: (arquivo, erro) => `${ICONES_ZELADOR.erro} ${arquivo}: ${erro}`,
    lendoDiretorio: (dir) => `Lendo diretório: ${dir}`,
};
export const ERROS_IMPORTS = {
    lerDiretorio: (dir, error) => {
        const mensagem = error instanceof Error ? error.message : String(error);
        return `Erro ao ler diretório ${dir}: ${mensagem}`;
    },
    processar: (arquivo, error) => {
        const mensagem = error instanceof Error ? error.message : String(error);
        return `Erro ao processar ${arquivo}: ${mensagem}`;
    },
};
export function formatarEstatistica(label, valor, icone) {
    const prefixo = icone ? `${icone} ` : '   ';
    return `${prefixo}${label}: ${valor}`;
}
export function gerarResumoImports(stats) {
    const linhas = [
        '',
        MENSAGENS_IMPORTS.resumo,
        formatarEstatistica('Arquivos processados', stats.processados),
        formatarEstatistica('Arquivos modificados', stats.modificados),
        formatarEstatistica('Total de correções', stats.totalCorrecoes),
    ];
    if (stats.erros > 0) {
        linhas.push(formatarEstatistica('Erros', stats.erros, ICONES_ZELADOR.aviso));
    }
    linhas.push('');
    if (stats.dryRun) {
        linhas.push(MENSAGENS_IMPORTS.dryRunAviso);
    }
    else {
        linhas.push(MENSAGENS_IMPORTS.sucessoFinal);
    }
    return linhas;
}
export const MENSAGENS_TIPOS = {
    titulo: `${ICONES_ACAO.correcao} Zelador de Tipos - Iniciando correções...`,
    analisandoTipo: (tipo) => `Analisando tipo: ${tipo}`,
    tipoCorrigido: (antes, depois) => `Corrigido: ${antes} → ${depois}`,
};
export const MENSAGENS_ESTRUTURA = {
    titulo: `${ICONES_ACAO.organizacao} Zelador de Estrutura - Reorganizando arquivos...`,
    movendo: (origem, destino) => `Movendo: ${origem} → ${destino}`,
    criandoDiretorio: (dir) => `Criando diretório: ${dir}`,
};
export const MENSAGENS_ZELADOR_GERAL = {
    iniciando: (zelador) => `${ICONES_ZELADOR.inicio} ${zelador} - Iniciando...`,
    concluido: (zelador) => `${ICONES_ZELADOR.sucesso} ${zelador} - Concluído!`,
    erro: (zelador, mensagem) => `${ICONES_ZELADOR.erro} ${zelador} - Erro: ${mensagem}`,
};
export const TEMPLATES_SAIDA = {
    compacto: {
        inicio: (nome) => `${ICONES_ZELADOR.inicio} ${nome}`,
        progresso: (atual, total) => `[${atual}/${total}]`,
        fim: (sucesso) => sucesso ? ICONES_ZELADOR.sucesso : ICONES_ZELADOR.erro,
    },
    detalhado: {
        inicio: (nome, descricao) => `${ICONES_ZELADOR.inicio} ${nome}\n   ${descricao}`,
        progresso: (arquivo, atual, total) => `   [${atual}/${total}] ${arquivo}`,
        fim: (stats) => `\n${ICONES_ZELADOR.resumo} Sucesso: ${stats.sucesso}, Falha: ${stats.falha}`,
    },
};
export const EXIT_CODES = {
    SUCESSO: 0,
    ERRO_GERAL: 1,
    ERRO_ARQUIVO: 2,
    ERRO_PERMISSAO: 3,
    CANCELADO_USUARIO: 4,
};
export function formatarListaArquivos(arquivos, maxExibir = 10) {
    const linhas = [];
    const mostrar = arquivos.slice(0, maxExibir);
    for (const arquivo of mostrar) {
        linhas.push(`   ${ICONES_ZELADOR.arquivo} ${arquivo}`);
    }
    const restantes = arquivos.length - maxExibir;
    if (restantes > 0) {
        linhas.push(`   ... e mais ${restantes} arquivo${restantes !== 1 ? 's' : ''}`);
    }
    return linhas;
}
export function formatarDuracao(ms) {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`;
    }
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    return `${minutos}m ${segundos}s`;
}
export function formatarComTimestamp(mensagem) {
    const timestamp = new Date().toISOString().substring(11, 19);
    return `[${timestamp}] ${mensagem}`;
}
//# sourceMappingURL=zelador-messages.js.map