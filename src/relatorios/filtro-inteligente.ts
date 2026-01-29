// SPDX-License-Identifier: MIT
//  tipo-literal-inline-complexo
// Justificativa: tipos locais para filtragem de relatórios
// Sistema inteligente de filtragem e priorização de relatórios
// Agrupa problemas similares e prioriza por impacto para evitar sobrecarga de informação

import {
  AGRUPAMENTOS_MENSAGEM,
  PRIORIDADES,
  RelatorioMessages,
} from '/messages/index.js';

import type {
  Ocorrencia,
  OcorrenciaNivel,
  ProblemaAgrupado,
  RelatorioResumo,
} from '@';

/**
 * Processa e filtra ocorrências para gerar um relatório resumido inteligente
 */

export function processarRelatorioResumo(
  ocorrencias: Ocorrencia[],
  limitePrioridade = 30,
): RelatorioResumo {
  // Agrupar ocorrências por tipo e padrões de mensagem
  const gruposPorTipo = new Map<string, Ocorrencia[]>();
  const gruposPorMensagem = new Map<string, Ocorrencia[]>();

  // Agrupar por tipo primeiro
  for (const ocorrencia of ocorrencias) {
    const tipo = String(ocorrencia.tipo || 'OUTROS');
    if (!gruposPorTipo.has(tipo)) {
      gruposPorTipo.set(tipo, []);
    }
    const grupo = gruposPorTipo.get(tipo);
    if (grupo) {
      grupo.push(ocorrencia);
    }
  }

  // Agrupar por padrões de mensagem
  for (const ocorrencia of ocorrencias) {
    const mensagem = String(ocorrencia.mensagem || '');
    let agrupado = false;

    for (const grupo of AGRUPAMENTOS_MENSAGEM) {
      if (grupo.padrao.test(mensagem)) {
        if (!gruposPorMensagem.has(grupo.categoria)) {
          gruposPorMensagem.set(grupo.categoria, []);
        }
        const categoriaGrupo = gruposPorMensagem.get(grupo.categoria);
        if (categoriaGrupo) {
          categoriaGrupo.push(ocorrencia);
        }
        agrupado = true;
        break;
      }
    }

    if (!agrupado) {
      const tipo = String(ocorrencia.tipo || 'OUTROS');
      if (!gruposPorMensagem.has(tipo)) {
        gruposPorMensagem.set(tipo, []);
      }
      const tipoGrupo = gruposPorMensagem.get(tipo);
      if (tipoGrupo) {
        tipoGrupo.push(ocorrencia);
      }
    }
  }

  // Converter grupos em problemas agrupados
  const problemasAgrupados: ProblemaAgrupado[] = [];

  // Processar grupos por tipo
  for (const [tipo, ocorrenciasTipo] of gruposPorTipo) {
    const config = PRIORIDADES[tipo] || {
      prioridade: 'baixa' as const,
      icone: '??',
    };

    // Verificar se já existe agrupamento por mensagem
    const jaAgrupado = Array.from(gruposPorMensagem.keys()).some(
      (categoria) => {
        const ocorrenciasGrupo = gruposPorMensagem.get(categoria) || [];
        return ocorrenciasGrupo.some((o) => o.tipo === tipo);
      },
    );

    if (!jaAgrupado && ocorrenciasTipo.length > 0) {
      problemasAgrupados.push({
        categoria: tipo,
        prioridade: config.prioridade,
        icone: config.icone,
        titulo: formatarTituloTipo(tipo),
        quantidade: ocorrenciasTipo.length,
        ocorrencias: ocorrenciasTipo,
        resumo: gerarResumoOcorrencias(ocorrenciasTipo),
      });
    }
  }

  // Processar grupos por mensagem (prioritários)
  for (const agrupamento of AGRUPAMENTOS_MENSAGEM) {
    const ocorrenciasGrupo = gruposPorMensagem.get(agrupamento.categoria) || [];
    if (ocorrenciasGrupo.length > 0) {
      problemasAgrupados.push({
        categoria: agrupamento.categoria,
        prioridade: 'critica', // Grupos de mensagem são sempre prioritários
        icone: '??',
        titulo: agrupamento.titulo,
        quantidade: ocorrenciasGrupo.length,
        ocorrencias: ocorrenciasGrupo,
        resumo: `${ocorrenciasGrupo.length} ocorrências detectadas`,
        acaoSugerida: agrupamento.acaoSugerida,
      });
    }
  }

  // Ordenar por prioridade e quantidade
  problemasAgrupados.sort((a, b) => {
    const prioridadeOrdem = { critica: 0, alta: 1, media: 2, baixa: 3 };
    const prioA = prioridadeOrdem[a.prioridade];
    const prioB = prioridadeOrdem[b.prioridade];

    if (prioA !== prioB) return prioA - prioB;
    return b.quantidade - a.quantidade; // Mais ocorrências primeiro
  });

  // Separar por n�veis de prioridade
  const problemasCriticos = problemasAgrupados.filter(
    (p) => p.prioridade === 'critica',
  );
  const problemasAltos = problemasAgrupados.filter(
    (p) => p.prioridade === 'alta',
  );
  const problemasOutros = problemasAgrupados.filter((p) =>
    ['media', 'baixa'].includes(p.prioridade),
  );

  // Calcular estat�sticas
  const arquivosAfetados = new Set(
    ocorrencias
      .map((o) => o.relPath)
      .filter((path) => path && path !== 'undefined'),
  ).size;

  const problemasPrioritarios =
    problemasCriticos.length + problemasAltos.length;

  return {
    problemasCriticos: problemasCriticos.slice(0, limitePrioridade / 3),
    problemasAltos: problemasAltos.slice(0, limitePrioridade / 3),
    problemasOutros: problemasOutros.slice(0, limitePrioridade / 3),
    estatisticas: {
      totalOcorrencias: ocorrencias.length,
      arquivosAfetados,
      problemasPrioritarios,
      problemasAgrupados: problemasAgrupados.length,
    },
  };
}

/**
 * Formata o título do tipo de problema para exibição
 */

function formatarTituloTipo(tipo: string): string {
  const titulos: Record<string, string> = {
    PROBLEMA_SEGURANCA: 'Problemas de Segurança',
    VULNERABILIDADE_SEGURANCA: 'Vulnerabilidades de Segurança',
    CODIGO_FRAGIL: 'Código Frágil',
    PROBLEMA_TESTE: 'Problemas de Teste',
    PROBLEMA_DOCUMENTACAO: 'Problemas de Documentação',
    CONSTRUCOES_SINTATICAS: 'Construções Sintáticas',
    ANALISE_ARQUITETURA: 'Análise de Arquitetura',
    CARACTERISTICAS_ARQUITETURA: 'Características de Arquitetura',
    METRICAS_ARQUITETURA: 'Métricas de Arquitetura',
    TODO_PENDENTE: 'TODOs Pendentes',
    'padrao-ausente': 'Padrões Ausentes',
    'estrutura-suspeita': 'Estrutura Suspeita',
    'estrutura-config': 'Configuração de Estrutura',
    'estrutura-entrypoints': 'Pontos de Entrada',
    IDENTIFICACAO_PROJETO: 'Identificação do Projeto',
    SUGESTAO_MELHORIA: 'Sugestões de Melhoria',
    EVIDENCIA_CONTEXTO: 'Evidências de Contexto',
    TECNOLOGIAS_ALTERNATIVAS: 'Tecnologias Alternativas',
  };

  return (
    titulos[tipo] ||
    tipo.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Gera um resumo das ocorrências para exibição
 */

function gerarResumoOcorrencias(ocorrencias: Ocorrencia[]): string {
  if (ocorrencias.length === 0) return 'Nenhuma ocorrência';

  const arquivos = new Set(ocorrencias.map((o) => o.relPath).filter(Boolean));
  const niveisFrequentes = ocorrencias
    .map((o) => o.nivel)
    .filter((nivel): nivel is OcorrenciaNivel => Boolean(nivel))
    .reduce(
      (acc, nivel) => {
        acc[nivel] = (acc[nivel] || 0) + 1;
        return acc;
      },
      {} as Record<OcorrenciaNivel, number>,
    );

  const nivelMaisFrequente = Object.entries(niveisFrequentes).sort(
    ([, a], [, b]) => (b as number) - (a as number),
  )[0]?.[0];

  let resumo = `${ocorrencias.length} ocorrências`;
  if (arquivos.size > 1) {
    resumo += ` em ${arquivos.size} arquivos`;
  }
  if (nivelMaisFrequente) {
    resumo += ` (maioria: ${nivelMaisFrequente})`;
  }

  return resumo;
}

/**
 * Gera relatório Markdown resumido
 */

export async function gerarRelatorioMarkdownResumo(
  relatorioResumo: RelatorioResumo,
  outputPath: string,
): Promise<void> {
  const { problemasCriticos, problemasAltos, problemasOutros, estatisticas } =
    relatorioResumo;

  const linhas: string[] = [];

  // Cabeçalho usando mensagens centralizadas
  linhas.push(`# ${RelatorioMessages.resumo.titulo}`);
  linhas.push('');
  linhas.push(`> ${RelatorioMessages.resumo.introducao}`);
  linhas.push('');

  // Estatisticas usando mensagens centralizadas
  linhas.push(`## ${RelatorioMessages.resumo.secoes.estatisticas.titulo}`);
  linhas.push('');
  linhas.push(
    `- **${RelatorioMessages.resumo.secoes.estatisticas.totalOcorrencias}**: ${estatisticas.totalOcorrencias.toLocaleString()}`,
  );
  linhas.push(
    `- **${RelatorioMessages.resumo.secoes.estatisticas.arquivosAfetados}**: ${estatisticas.arquivosAfetados.toLocaleString()}`,
  );
  linhas.push(
    `- **${RelatorioMessages.resumo.secoes.estatisticas.problemasPrioritarios}**: ${estatisticas.problemasPrioritarios}`,
  );
  linhas.push(
    `- **${RelatorioMessages.resumo.secoes.estatisticas.problemasAgrupados}**: ${estatisticas.problemasAgrupados}`,
  );
  linhas.push('');

  // Problemas críticos usando mensagens centralizadas
  if (problemasCriticos.length > 0) {
    linhas.push(`## ${RelatorioMessages.resumo.secoes.criticos.titulo}`);
    linhas.push('');
    for (const problema of problemasCriticos) {
      linhas.push(`### ${problema.icone} ${problema.titulo}`);
      linhas.push('');
      linhas.push(
        `**${RelatorioMessages.resumo.labels.quantidade}**: ${problema.quantidade} ocorrências`,
      );
      linhas.push(`**Resumo**: ${problema.resumo}`);
      if (problema.acaoSugerida) {
        linhas.push(
          `**${RelatorioMessages.resumo.labels.acaoSugerida}**: ${problema.acaoSugerida}`,
        );
      }
      linhas.push('');

      // Mostrar algumas ocorrências de exemplo
      const exemplos = problema.ocorrencias.slice(0, 3);
      if (exemplos.length > 0) {
        linhas.push(`**${RelatorioMessages.resumo.labels.exemplos}:**`);
        for (const exemplo of exemplos) {
          const arquivo = exemplo.relPath || 'arquivo desconhecido';
          const linha = exemplo.linha ? `:${exemplo.linha}` : '';
          linhas.push(`- \`${arquivo}${linha}\`: ${exemplo.mensagem}`);
        }
        if (problema.quantidade > 3) {
          linhas.push(`- ... e mais ${problema.quantidade - 3} ocorrências`);
        }
        linhas.push('');
      }
    }
  }

  // Problemas altos usando mensagens centralizadas
  if (problemasAltos.length > 0) {
    linhas.push(`## ${RelatorioMessages.resumo.secoes.altos.titulo}`);
    linhas.push('');
    for (const problema of problemasAltos) {
      linhas.push(`### ${problema.icone} ${problema.titulo}`);
      linhas.push('');
      linhas.push(
        `**${RelatorioMessages.resumo.labels.quantidade}**: ${problema.quantidade} | **Resumo**: ${problema.resumo}`,
      );
      if (problema.acaoSugerida) {
        linhas.push(
          `**${RelatorioMessages.resumo.labels.acaoSugerida}**: ${problema.acaoSugerida}`,
        );
      }
      linhas.push('');
    }
  }

  // Outros problemas (resumo) usando mensagens centralizadas
  if (problemasOutros.length > 0) {
    linhas.push(`## ${RelatorioMessages.resumo.secoes.outros.titulo}`);
    linhas.push('');
    linhas.push('| Categoria | Quantidade | Resumo |');
    linhas.push('|-----------|------------|--------|');

    for (const problema of problemasOutros) {
      linhas.push(
        `| ${problema.icone} ${problema.titulo} | ${problema.quantidade} | ${problema.resumo} |`,
      );
    }
    linhas.push('');
  }

  // Rodapé
  linhas.push('---');
  linhas.push('');
  linhas.push(
    '?? **Dica**: Para ver todos os detalhes, gere o relatório completo em modo normal.',
  );
  linhas.push('');
  linhas.push(`**Relatório gerado em**: ${new Date().toLocaleString('pt-BR')}`);

  const { salvarEstado } = await import('/persistence/persistencia.js');
  await salvarEstado(outputPath, linhas.join('\n'));
}

/**
 * Gera resumo executivo mostrando apenas problemas críticos e de alta prioridade
 * Ideal para tomada de decisão e overview rápido
 */

export function gerarResumoExecutivo(ocorrencias: Ocorrencia[]): {
  problemasCriticos: number;
  problemasAltos: number;
  vulnerabilidades: number;
  quickFixes: number;
  recomendacao: 'verde' | 'amarelo' | 'vermelho';
  mensagem: string;
  detalhes: ProblemaAgrupado[];
} {
  const relatorio = processarRelatorioResumo(ocorrencias);

  const problemasCriticos = relatorio.problemasCriticos.reduce(
    (sum: number, p: ProblemaAgrupado) => sum + p.quantidade,
    0,
  );
  const problemasAltos = relatorio.problemasAltos.reduce(
    (sum: number, p: ProblemaAgrupado) => sum + p.quantidade,
    0,
  );

  // Contadores específicos
  const vulnerabilidades = ocorrencias.filter(
    (o) =>
      o.tipo === 'VULNERABILIDADE_SEGURANCA' || o.tipo === 'PROBLEMA_SEGURANCA',
  ).length;

  const quickFixes = ocorrencias.filter(
    (o) => o.tipo === 'QUICK_FIX_DISPONIVEL',
  ).length;

  // Determina recomendação baseada em prioridade
  let recomendacao: 'verde' | 'amarelo' | 'vermelho';
  let mensagem: string;

  if (problemasCriticos > 10) {
    recomendacao = 'vermelho';
    mensagem = `?? CRÍTICO: ${problemasCriticos} problemas de segurança/estabilidade. Ação imediata necessária.`;
  } else if (problemasCriticos > 0 || problemasAltos > 50) {
    recomendacao = 'amarelo';
    mensagem = `?? ATENÇÃO: ${problemasCriticos} críticos, ${problemasAltos} altos. Planeje correções.`;
  } else {
    recomendacao = 'verde';
    mensagem = `? BOM: Apenas problemas menores. ${quickFixes} correções automáticas disponíveis.`;
  }

  return {
    problemasCriticos,
    problemasAltos,
    vulnerabilidades,
    quickFixes,
    recomendacao,
    mensagem,
    detalhes: [...relatorio.problemasCriticos, ...relatorio.problemasAltos],
  };
}
