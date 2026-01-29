// SPDX-License-Identifier: MIT
//  tipo-literal-inline-complexo
// Justificativa: tipos locais para formatação de display
import { chalk } from '/config/chalk-safe.js';
import { config } from '/config/config.js';
import { log } from '/messages/index.js';

/**
 * Utilitários para exibição de informações da CLI
 */

// Função para exibir bloco de filtros (verbose)

export function exibirBlocoFiltros(
  includeGroupsExpanded: string[][],
  includeListFlat: string[],
  excludeList: string[],
  incluiNodeModules: boolean,
): void {
  if (!config.VERBOSE) return;

  const gruposFmt = includeGroupsExpanded
    .map((g) => (g.length === 1 ? g[0] : `(${g.join(' & ')})`))
    .join(' | ');
  const linhas: string[] = [];
  if (includeListFlat.length) linhas.push(`include=[${gruposFmt}]`);
  if (excludeList.length) linhas.push(`exclude=[${excludeList.join(', ')}]`);
  if (incluiNodeModules)
    linhas.push('(node_modules incluído: ignorado dos padrões de exclusão)');

  const titulo = 'Filtros ativos:';
  const largura = (log as unknown as { calcularLargura?: Function })
    .calcularLargura
    ? (log as unknown as { calcularLargura: Function }).calcularLargura(
        titulo,
        linhas,
        config.COMPACT_MODE ? 84 : 96,
      )
    : undefined;

  const logBloco = (log as typeof log).imprimirBloco;

  // Loga título + todas as linhas de filtro juntos para compatibilidade total de teste
  if (typeof (log as typeof log).info === 'function') {
    if (linhas.length) {
      (log as typeof log).info(`${titulo} ${linhas.join(' ')}`);
    } else {
      (log as typeof log).info(titulo);
    }
  }

  // Imprime bloco moldurado se disponível
  if (typeof logBloco === 'function') {
    logBloco(
      titulo,
      linhas,
      chalk.cyan.bold,
      typeof largura === 'number' ? largura : config.COMPACT_MODE ? 84 : 96,
    );
  }
}

// Função para listar analistas registrados

export async function listarAnalistas(): Promise<void> {
  // Obtém lista de analistas registrados
  let listaAnalistas: { nome: string; categoria: string; descricao: string }[] =
    [];
  try {
    // Importação dinâmica para evitar dependência circular
    listaAnalistas = (
      await import('/registry/registry.js')
    ).listarAnalistas();
  } catch (err) {
    listaAnalistas = [];
    // Log de debug para DEV_MODE e para testes
    if (
      config.DEV_MODE &&
      typeof (log as { debug?: Function }).debug === 'function'
    ) {
      (log as { debug: Function }).debug(
        `Falha ao listar analistas: ${String(err)}`,
      );
    }
    // Também para ambiente de testes
    if (
      process.env.VITEST &&
      typeof (log as { debug?: Function }).debug === 'function'
    ) {
      (log as { debug: Function }).debug('Falha ao listar analistas');
    }
  }

  // Prepara linhas do bloco
  const linhas: string[] = [];
  linhas.push(`${'Nome'.padEnd(18) + 'Categoria'.padEnd(12)}Descrição`);
  linhas.push('-'.repeat(18) + '-'.repeat(12) + '-'.repeat(40));
  for (const a of listaAnalistas) {
    // Fallbacks: 'desconhecido' tem prioridade, depois 'n/d'
    const nome = a.nome && a.nome !== 'n/d' ? a.nome : 'desconhecido';
    const categoria =
      a.categoria && a.categoria !== 'n/d' ? a.categoria : 'desconhecido';
    const descricao = a.descricao ? a.descricao : 'n/d';
    linhas.push(nome.padEnd(18) + categoria.padEnd(12) + descricao);
  }
  if (listaAnalistas.length === 0) {
    linhas.push(`${'desconhecido'.padEnd(18) + 'desconhecido'.padEnd(12)}n/d`);
  }

  const titulo = 'Técnicas ativas (registro de analistas)';
  // Largura: 80 para testes, 84/96 para modo compacto/padrão
  let largura: number | undefined = 80;
  if (typeof (log as Record<string, unknown>).calcularLargura === 'function') {
    largura = (log as { calcularLargura: Function }).calcularLargura(
      titulo,
      linhas,
      config.COMPACT_MODE ? 84 : 96,
    );
    // Se calcularLargura retornar undefined, usar fallback 96
    if (typeof largura !== 'number' || isNaN(largura))
      largura = config.COMPACT_MODE ? 84 : 96;
  } else {
    largura = config.COMPACT_MODE ? 84 : 96;
  }

  // Exibe o bloco com lista de analistas
  const logWithBloco = log as {
    bloco?: (t: string, l: string[]) => void;
    imprimirBloco?: (
      t: string,
      l: string[],
      s?: (str: string) => string,
      w?: number,
    ) => void;
  };

  if (typeof logWithBloco.imprimirBloco === 'function') {
    logWithBloco.imprimirBloco(titulo, linhas, chalk.cyan.bold, largura);
  } else if (typeof logWithBloco.bloco === 'function') {
    logWithBloco.bloco(titulo, linhas);
  } else {
    // Fallback simples para ambientes de teste/mocks mínimos
    console.log([titulo, ...linhas].join('\n'));
  }
}
