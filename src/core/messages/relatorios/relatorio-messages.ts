// SPDX-License-Identifier: MIT
/**
 * Mensagens centralizadas para relatórios (Markdown e JSON)
 * Todas as strings de títulos, cabeçalhos, descrições e textos explicativos
 * devem ser definidas aqui para facilitar manutenção e internacionalização futura.
 */

import {
  ICONES_ACAO,
  ICONES_COMANDO,
  ICONES_DIAGNOSTICO,
  ICONES_RELATORIO,
} from '../ui/icons.js';

export const RelatorioMessages = {
  /* -------------------------- RELATÓRIO PRINCIPAL (gerador-relatorio.ts) -------------------------- */
  principal: {
    titulo: `${ICONES_RELATORIO.resumo} Relatório Oráculo`,
    secoes: {
      metadados: {
        data: 'Data',
        duracao: 'Duração',
        arquivos: 'Arquivos escaneados',
        ocorrencias: 'Ocorrências encontradas',
        arquivoManifest: 'Arquivo manifest',
        notaManifest:
          'Para explorar o relatório completo, baixe/descomprima os shards listados no manifest.',
      },
      guardian: {
        titulo: `${ICONES_DIAGNOSTICO.guardian} Verificação de Integridade (Guardian)`,
        status: 'Status',
        timestamp: 'Timestamp',
        totalArquivos: 'Total de arquivos protegidos',
      },
      resumoTipos: {
        titulo: `${ICONES_DIAGNOSTICO.stats} Resumo dos tipos de problemas`,
        tipo: 'Tipo',
        quantidade: 'Quantidade',
      },
      ocorrencias: {
        titulo: `${ICONES_RELATORIO.lista} Ocorrências encontradas`,
        colunas: {
          arquivo: 'Arquivo',
          linha: 'Linha',
          nivel: 'Nível',
          mensagem: 'Mensagem',
        },
      },
      estatisticas: {
        titulo: `${ICONES_RELATORIO.grafico} Estatísticas gerais`,
        linhasAnalisadas: 'Linhas analisadas',
        padroesProgramacao: 'Padrões de programação',
        analiseInteligente: 'Análise inteligente de código',
      },
    },
  },

  /* -------------------------- RELATÓRIO RESUMIDO / FILTRO INTELIGENTE -------------------------- */
  resumo: {
    titulo: `${ICONES_RELATORIO.resumo} Relatório Resumido - Problemas Prioritários`,
    introducao:
      'Este relatório agrupa problemas similares e prioriza por impacto para facilitar a análise.',
    secoes: {
      criticos: {
        titulo: `${ICONES_RELATORIO.error} Problemas Críticos`,
        vazio: 'Nenhum problema crítico detectado.',
      },
      altos: {
        titulo: `${ICONES_RELATORIO.warning} Problemas de Alta Prioridade`,
        vazio: 'Nenhum problema de alta prioridade detectado.',
      },
      outros: {
        titulo: `${ICONES_RELATORIO.lista} Outros Problemas`,
        vazio: 'Nenhum outro problema detectado.',
      },
      estatisticas: {
        titulo: `${ICONES_DIAGNOSTICO.stats} Estatísticas do Relatório`,
        totalOcorrencias: 'Total de ocorrências',
        arquivosAfetados: 'Arquivos afetados',
        problemasPrioritarios: 'Problemas prioritários',
        problemasAgrupados: 'Problemas agrupados',
      },
    },
    labels: {
      quantidade: 'Quantidade',
      arquivosAfetados: 'Arquivos afetados',
      acaoSugerida: 'Ação Sugerida',
      exemplos: 'Exemplos',
    },
  },

  /* -------------------------- RELATÓRIO DE SAÚDE DO CÓDIGO (zelador-saude.ts) -------------------------- */
  saude: {
    titulo: `${ICONES_ACAO.limpeza} Relatório de Saúde do Código`,
    introducao: `${ICONES_DIAGNOSTICO.stats} Padrões de Uso do Código`,
    secoes: {
      funcoesLongas: {
        titulo: 'Detalhes de funções longas por arquivo',
        vazio: 'Nenhuma função acima do limite.',
        colunas: {
          tipo: 'Tipo',
          quantidade: 'Quantidade',
        },
      },
      constantesDuplicadas: {
        titulo: `${ICONES_RELATORIO.detalhado} Constantes definidas mais de 3 vezes`,
      },
      modulosRequire: {
        titulo: `${ICONES_RELATORIO.detalhado} Módulos require utilizados mais de 3 vezes`,
      },
      fim: {
        titulo: 'Fim do relatório do zelador',
      },
    },
    instrucoes: {
      diagnosticoDetalhado:
        'Para diagnóstico detalhado, execute: oraculo diagnosticar --export',
      tabelasVerbosas:
        'Para ver tabelas com moldura no terminal (muito verboso), use: --debug',
    },
  },

  /* -------------------------- RELATÓRIO DE PADRÕES DE USO -------------------------- */
  padroesUso: {
    titulo: `${ICONES_DIAGNOSTICO.stats} Padrões de Uso do Código`,
  },

  /* -------------------------- RELATÓRIO DE ARQUETIPOS -------------------------- */
  arquetipos: {
    titulo: `${ICONES_DIAGNOSTICO.arquetipos} Relatório de Arquetipos`,
    secoes: {
      candidatos: {
        titulo: 'Candidatos Identificados',
        nome: 'Nome',
        score: 'Score',
        confianca: 'Confiança',
        descricao: 'Descrição',
      },
      baseline: {
        titulo: 'Baseline Salvo',
        snapshot: 'Snapshot',
        arquivos: 'Arquivos',
      },
      drift: {
        titulo: 'Drift Detectado',
        alterouArquetipo: 'Alterou Arquétipo',
        deltaConfianca: 'Delta de Confiança',
        arquivosNovos: 'Arquivos Novos',
        arquivosRemovidos: 'Arquivos Removidos',
      },
    },
  },

  /* -------------------------- RELATÓRIO DE PODA -------------------------- */
  poda: {
    titulo: `${ICONES_COMANDO.podar} Relatório de Poda Oracular`,
    secoes: {
      metadados: {
        data: 'Data',
        execucao: 'Execução',
        simulacao: 'Simulação',
        real: 'Real',
        arquivosPodados: 'Arquivos podados',
        arquivosMantidos: 'Arquivos mantidos',
      },
      podados: {
        titulo: 'Arquivos Podados',
        vazio: 'Nenhum arquivo foi podado neste ciclo.',
        colunas: {
          arquivo: 'Arquivo',
          motivo: 'Motivo',
          diasInativo: 'Dias Inativo',
          detectadoEm: 'Detectado em',
        },
      },
      mantidos: {
        titulo: 'Arquivos Mantidos',
        vazio: 'Nenhum arquivo mantido neste ciclo.',
        colunas: {
          arquivo: 'Arquivo',
          motivo: 'Motivo',
        },
      },
      pendencias: {
        titulo: 'Pendências de Remoção',
        total: 'Total de pendências',
        tipoArquivo: 'Tipo: Arquivo',
        tipoDiretorio: 'Tipo: Diretório',
        tamanhoTotal: 'Tamanho total aproximado',
      },
      reativacao: {
        titulo: 'Lista de Reativação',
        total: 'Total a reativar',
      },
      historico: {
        titulo: 'Histórico de Ações',
        total: 'Total de ações',
        colunas: {
          acao: 'Ação',
          caminho: 'Caminho',
          timestamp: 'Timestamp',
        },
      },
    },
  },

  /* -------------------------- RELATÓRIO DE REESTRUTURAÇÃO -------------------------- */
  reestruturar: {
    titulo: `${ICONES_COMANDO.reestruturar} Relatório de Reestruturação Oracular`,
    secoes: {
      metadados: {
        data: 'Data',
        execucao: 'Execução',
        simulacao: 'Simulação',
        real: 'Real',
        origemPlano: 'Origem do plano',
        preset: 'Preset',
      },
      movimentos: {
        titulo: 'Movimentos',
        total: 'Total de movimentos',
        vazio: 'Nenhum movimento sugerido neste ciclo.',
        status: {
          zonVerde: 'Zona Verde (seguros)',
          bloqueados: 'Bloqueados',
        },
        colunas: {
          origem: 'De',
          destino: 'Para',
          razao: 'Razão',
          status: 'Status',
        },
      },
      conflitos: {
        titulo: 'Conflitos Detectados',
        total: 'Conflitos detectados',
        tipo: 'Tipo',
        descricao: 'Descrição',
      },
      preview: {
        titulo: 'Preview das Mudanças',
        nota: `Nenhum arquivo será movido até executar com --apply`,
      },
    },
  },

  /* -------------------------- MENSAGENS COMUNS -------------------------- */
  comum: {
    separadores: {
      secao: '---',
      subsecao: '~~~',
    },
    vazios: {
      nenhumResultado: 'Nenhum resultado encontrado.',
      nenhumaOcorrencia: 'Nenhuma ocorrência detectada.',
      semDados: 'Sem dados disponíveis.',
    },
    acoes: {
      verDetalhes: 'Ver detalhes completos',
      executarComando: 'Executar comando',
      aplicarMudancas: 'Aplicar mudanças',
      cancelar: 'Cancelar',
    },
  },
};

/**
 * Helper para formatar mensagens com variáveis
 *
 * formatMessage(RelatorioMessages.principal.secoes.metadados.arquivos, { count: 42 })
 * // => "Arquivos escaneados: 42"
 */
export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}

/**
 * Helper para pluralização simples
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  showCount = true,
): string {
  const word = count === 1 ? singular : plural;
  return showCount ? `${count} ${word}` : word;
}

/**
 * Helper para criar linha de separador
 */
export function separator(char = '-', length = 80): string {
  return char.repeat(length);
}
