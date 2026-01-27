import { chalk } from '../../core/config/chalk-safe.js';
import { config } from '../../core/config/config.js';
import { log } from '../../core/messages/index.js';
export function exibirBlocoFiltros(includeGroupsExpanded, includeListFlat, excludeList, incluiNodeModules) {
    if (!config.VERBOSE)
        return;
    const gruposFmt = includeGroupsExpanded
        .map((g) => (g.length === 1 ? g[0] : `(${g.join(' & ')})`))
        .join(' | ');
    const linhas = [];
    if (includeListFlat.length)
        linhas.push(`include=[${gruposFmt}]`);
    if (excludeList.length)
        linhas.push(`exclude=[${excludeList.join(', ')}]`);
    if (incluiNodeModules)
        linhas.push('(node_modules incluído: ignorado dos padrões de exclusão)');
    const titulo = 'Filtros ativos:';
    const largura = log
        .calcularLargura
        ? log.calcularLargura(titulo, linhas, config.COMPACT_MODE ? 84 : 96)
        : undefined;
    const logBloco = log.imprimirBloco;
    if (typeof log.info === 'function') {
        if (linhas.length) {
            log.info(`${titulo} ${linhas.join(' ')}`);
        }
        else {
            log.info(titulo);
        }
    }
    if (typeof logBloco === 'function') {
        logBloco(titulo, linhas, chalk.cyan.bold, typeof largura === 'number' ? largura : config.COMPACT_MODE ? 84 : 96);
    }
}
export async function listarAnalistas() {
    let listaAnalistas = [];
    try {
        listaAnalistas = (await import('../../analistas/registry/registry.js')).listarAnalistas();
    }
    catch (err) {
        listaAnalistas = [];
        if (config.DEV_MODE &&
            typeof log.debug === 'function') {
            log.debug(`Falha ao listar analistas: ${String(err)}`);
        }
        if (process.env.VITEST &&
            typeof log.debug === 'function') {
            log.debug('Falha ao listar analistas');
        }
    }
    const linhas = [];
    linhas.push(`${'Nome'.padEnd(18) + 'Categoria'.padEnd(12)}Descrição`);
    linhas.push('-'.repeat(18) + '-'.repeat(12) + '-'.repeat(40));
    for (const a of listaAnalistas) {
        const nome = a.nome && a.nome !== 'n/d' ? a.nome : 'desconhecido';
        const categoria = a.categoria && a.categoria !== 'n/d' ? a.categoria : 'desconhecido';
        const descricao = a.descricao ? a.descricao : 'n/d';
        linhas.push(nome.padEnd(18) + categoria.padEnd(12) + descricao);
    }
    if (listaAnalistas.length === 0) {
        linhas.push(`${'desconhecido'.padEnd(18) + 'desconhecido'.padEnd(12)}n/d`);
    }
    const titulo = 'Técnicas ativas (registro de analistas)';
    let largura = 80;
    if (typeof log.calcularLargura === 'function') {
        largura = log.calcularLargura(titulo, linhas, config.COMPACT_MODE ? 84 : 96);
        if (typeof largura !== 'number' || isNaN(largura))
            largura = config.COMPACT_MODE ? 84 : 96;
    }
    else {
        largura = config.COMPACT_MODE ? 84 : 96;
    }
    const logWithBloco = log;
    if (typeof logWithBloco.imprimirBloco === 'function') {
        logWithBloco.imprimirBloco(titulo, linhas, chalk.cyan.bold, largura);
    }
    else if (typeof logWithBloco.bloco === 'function') {
        logWithBloco.bloco(titulo, linhas);
    }
    else {
        console.log([titulo, ...linhas].join('\n'));
    }
}
//# sourceMappingURL=display.js.map