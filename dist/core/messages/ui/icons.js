const CORES = {
    RESET: '\x1b[0m',
    VERDE: '\x1b[32m',
    AZUL: '\x1b[34m',
    AMARELO: '\x1b[33m',
    VERMELHO: '\x1b[31m',
    CINZA: '\x1b[37m',
};
export const ICONES_NIVEL = {
    sucesso: `${CORES.VERDE}SUCESSO${CORES.RESET}`,
    info: `${CORES.AZUL}INFO${CORES.RESET}`,
    aviso: `${CORES.AMARELO}AVISO${CORES.RESET}`,
    erro: `${CORES.VERMELHO}ERRO${CORES.RESET}`,
    critico: `${CORES.VERMELHO}ERRO${CORES.RESET}`,
    debug: `${CORES.CINZA}DEBUG${CORES.RESET}`,
};
export const ICONES_STATUS = {
    ok: '[OK]',
    falha: '[FALHA]',
    pendente: '[...]',
    executando: '[>]',
    pausado: '[||]',
    pulado: '[>>]',
};
export const ICONES_ACAO = {
    analise: '[SCAN]',
    correcao: '[FIX]',
    limpeza: '[CLEAN]',
    organizacao: '[ORG]',
    validacao: '[CHECK]',
    compilacao: '[BUILD]',
    teste: '[TEST]',
    export: '[EXPORT]',
    import: '[IMPORT]',
    criar: '[+]',
    deletar: '[-]',
    mover: '[MOVE]',
    copiar: '[COPY]',
    renomear: '[RENAME]',
};
export const ICONES_ARQUIVO = {
    arquivo: '[FILE]',
    diretorio: '[DIR]',
    config: '[CFG]',
    codigo: '[CODE]',
    teste: '[TEST]',
    doc: '[DOC]',
    lock: '[LOCK]',
    package: '[PKG]',
    json: '[JSON]',
    typescript: '[TS]',
    javascript: '[JS]',
};
export const ICONES_FEEDBACK = {
    dica: '[DICA]',
    atencao: '[!]',
    importante: '[!]',
    info: '[i]',
    pergunta: '[?]',
    celebracao: '[!]',
    foguete: '[>]',
};
export const ICONES_DIAGNOSTICO = {
    inicio: '[SCAN]',
    progresso: '[...]',
    arquetipos: '[ARQ]',
    guardian: '[GUARD]',
    autoFix: '[FIX]',
    executive: '[EXEC]',
    rapido: '[FAST]',
    completo: '[FULL]',
    stats: '[STATS]',
};
export const ICONES_TIPOS = {
    any: `${CORES.VERMELHO}[ANY]${CORES.RESET}`,
    unknown: `${CORES.AMARELO}[?]${CORES.RESET}`,
    legitimo: `${CORES.VERDE}[OK]${CORES.RESET}`,
    melhoravel: `${CORES.AMARELO}[!]${CORES.RESET}`,
    corrigir: `${CORES.VERMELHO}[FIX]${CORES.RESET}`,
    seguro: '[OK]',
    inseguro: '[!]',
};
export const ICONES_COMANDO = {
    diagnosticar: '[SCAN]',
    reestruturar: '[ORG]',
    podar: '[CLEAN]',
    fixTypes: '[FIX]',
    guardian: '[GUARD]',
    metricas: '[STATS]',
    reverter: '[UNDO]',
    atualizar: '[UPD]',
    perf: '[PERF]',
};
export const ICONES_RELATORIO = {
    resumo: '[SUMMARY]',
    detalhado: '[DETAIL]',
    grafico: '[GRAPH]',
    tabela: '[TABLE]',
    lista: '[LIST]',
    warning: `${CORES.AMARELO}[!]${CORES.RESET}`,
    error: `${CORES.VERMELHO}[ERR]${CORES.RESET}`,
    success: `${CORES.VERDE}[OK]${CORES.RESET}`,
};
export const ICONES_ZELADOR = {
    inicio: '[START]',
    sucesso: `${CORES.VERDE}[OK]${CORES.RESET}`,
    erro: `${CORES.VERMELHO}[ERR]${CORES.RESET}`,
    aviso: `${CORES.AMARELO}[!]${CORES.RESET}`,
    resumo: '[SUMMARY]',
    arquivo: '[FILE]',
    diretorio: '[DIR]',
    correcao: '[FIX]',
    dryRun: '[DRY]',
    estatistica: '[STATS]',
};
export function getIcone(categoria, nome) {
    switch (categoria) {
        case 'nivel':
            return ICONES_NIVEL[nome] || ICONES_NIVEL.info;
        case 'status':
            return ICONES_STATUS[nome] || ICONES_STATUS.pendente;
        case 'acao':
            return ICONES_ACAO[nome] || '[*]';
        default:
            return '[*]';
    }
}
export function suportaCores() {
    return true;
}
export const ICONES = {
    nivel: ICONES_NIVEL,
    status: ICONES_STATUS,
    acao: ICONES_ACAO,
    arquivo: ICONES_ARQUIVO,
    feedback: ICONES_FEEDBACK,
    diagnostico: ICONES_DIAGNOSTICO,
    tipos: ICONES_TIPOS,
    comando: ICONES_COMANDO,
    relatorio: ICONES_RELATORIO,
    zelador: ICONES_ZELADOR,
};
export default ICONES;
//# sourceMappingURL=icons.js.map