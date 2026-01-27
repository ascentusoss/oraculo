// SPDX-License-Identifier: MIT
/**
 * Mensagens e descrições centralizadas para exportação JSON
 * Define textos explicativos, labels e metadados para campos JSON
 */

import type { JsonComMetadados } from '@';

export const JsonMessages = {
  /* -------------------------- CAMPOS COMUNS -------------------------- */
  comum: {
    timestamp: {
      label: 'timestamp',
      descricao: 'Data e hora da geração do relatório (ISO 8601)',
    },
    versao: {
      label: 'versao',
      descricao: 'Versão do Oráculo que gerou este relatório',
    },
    schemaVersion: {
      label: 'schemaVersion',
      descricao: 'Versão do schema JSON (para compatibilidade backward)',
    },
    duracao: {
      label: 'duracaoMs',
      descricao: 'Duração total da execução em milissegundos',
    },
  },

  /* -------------------------- DIAGNÓSTICO -------------------------- */
  diagnostico: {
    root: {
      label: 'diagnostico',
      descricao: 'Resultado completo do diagnóstico do projeto',
    },
    totalArquivos: {
      label: 'totalArquivos',
      descricao: 'Número total de arquivos escaneados',
    },
    ocorrencias: {
      label: 'ocorrencias',
      descricao: 'Lista de todas as ocorrências detectadas pelos analistas',
      campos: {
        tipo: 'Tipo/categoria da ocorrência',
        nivel: 'Nível de severidade (info, aviso, erro)',
        mensagem: 'Descrição detalhada do problema',
        relPath: 'Caminho relativo do arquivo',
        linha: 'Linha onde ocorre o problema',
        coluna: 'Coluna onde ocorre o problema',
        contexto: 'Contexto adicional (snippet de código)',
      },
    },
    metricas: {
      label: 'metricas',
      descricao: 'Métricas agregadas do projeto',
      campos: {
        totalLinhas: 'Total de linhas de código analisadas',
        totalArquivos: 'Total de arquivos processados',
        arquivosComErro: 'Arquivos que falharam no parsing',
        tempoTotal: 'Tempo total de processamento',
      },
    },
    linguagens: {
      label: 'linguagens',
      descricao: 'Estatísticas de uso de linguagens no projeto',
      campos: {
        total: 'Total de arquivos de código',
        extensoes: 'Mapa de extensão -> quantidade',
      },
    },
    parseErros: {
      label: 'parseErros',
      descricao: 'Erros de parsing agrupados',
      campos: {
        total: 'Total de erros de parsing',
        porArquivo: 'Mapa de arquivo -> lista de erros',
        agregado: 'Indica se houve agregação de erros',
      },
    },
  },

  /* -------------------------- ESTRUTURA / ARQUETIPOS -------------------------- */
  estrutura: {
    root: {
      label: 'estruturaIdentificada',
      descricao: 'Identificação da estrutura e arquétipo do projeto',
    },
    melhores: {
      label: 'melhores',
      descricao: 'Lista ordenada dos melhores candidatos de arquétipo',
      campos: {
        nome: 'Nome do arquétipo',
        score: 'Pontuação calculada',
        confidence: 'Nível de confiança (%)',
        descricao: 'Descrição do arquétipo',
        matchedRequired: 'Arquivos obrigatórios encontrados',
        missingRequired: 'Arquivos obrigatórios ausentes',
        matchedOptional: 'Arquivos opcionais encontrados',
      },
    },
    baseline: {
      label: 'baseline',
      descricao: 'Snapshot salvo da estrutura para detecção de drift',
      campos: {
        arquetipo: 'Arquétipo identificado',
        confidence: 'Confiança quando salvo',
        timestamp: 'Data do snapshot',
        arquivosRaiz: 'Lista de arquivos na raiz',
      },
    },
    drift: {
      label: 'drift',
      descricao: 'Mudanças detectadas em relação ao baseline',
      campos: {
        alterouArquetipo: 'Se houve mudança de arquétipo',
        deltaConfidence: 'Variação percentual de confiança',
        arquivosRaizNovos: 'Novos arquivos na raiz',
        arquivosRaizRemovidos: 'Arquivos removidos da raiz',
      },
    },
  },

  /* -------------------------- GUARDIAN -------------------------- */
  guardian: {
    root: {
      label: 'guardian',
      descricao: 'Verificação de integridade e proteção do código',
    },
    status: {
      label: 'status',
      opcoes: {
        sucesso: 'Verificação bem-sucedida, sem alterações',
        alteracoes: 'Alterações detectadas em arquivos protegidos',
        baseline: 'Baseline criado (primeira execução)',
        erro: 'Erro durante verificação',
        naoExecutada: 'Guardian não foi executado',
      },
    },
    totalArquivos: {
      label: 'totalArquivos',
      descricao: 'Número de arquivos protegidos',
    },
    alteracoes: {
      label: 'alteracoes',
      descricao: 'Lista de alterações detectadas',
      campos: {
        arquivo: 'Caminho do arquivo modificado',
        hashAnterior: 'Hash SHA-256 anterior',
        hashAtual: 'Hash SHA-256 atual',
        acao: 'Tipo de ação (modificado, adicionado, removido)',
      },
    },
  },

  /* -------------------------- PODA -------------------------- */
  poda: {
    root: {
      label: 'poda',
      descricao: 'Relatório de arquivos/diretórios marcados para remoção',
    },
    pendencias: {
      label: 'pendencias',
      descricao: 'Lista de itens pendentes de remoção',
      campos: {
        caminho: 'Caminho completo',
        tipo: 'arquivo ou diretorio',
        motivoOriginal: 'Razão da marcação',
        timestamp: 'Data da marcação',
      },
    },
    reativar: {
      label: 'listaReativar',
      descricao: 'Lista de itens marcados para reativação',
    },
    historico: {
      label: 'historico',
      descricao: 'Histórico de ações de poda executadas',
      campos: {
        acao: 'Tipo de ação (remover, reativar, pendente)',
        caminho: 'Caminho afetado',
        timestamp: 'Data da ação',
        usuario: 'Usuário que executou',
      },
    },
  },

  /* -------------------------- REESTRUTURAÇÃO -------------------------- */
  reestruturar: {
    root: {
      label: 'reestruturacao',
      descricao: 'Plano de reestruturação do projeto',
    },
    movimentos: {
      label: 'movimentos',
      descricao: 'Lista de movimentos de arquivos planejados',
      campos: {
        id: 'ID único do movimento',
        origem: 'Caminho de origem',
        destino: 'Caminho de destino',
        razao: 'Razão do movimento',
        status: 'Status (zona-verde, bloqueado, pendente)',
        dependencias: 'Arquivos dependentes afetados',
      },
    },
    conflitos: {
      label: 'conflitos',
      descricao: 'Conflitos detectados que impedem movimentos',
      campos: {
        tipo: 'Tipo de conflito',
        arquivos: 'Arquivos envolvidos',
        descricao: 'Descrição do conflito',
        resolucaoSugerida: 'Como resolver',
      },
    },
    resumo: {
      label: 'resumo',
      descricao: 'Resumo estatístico do plano',
      campos: {
        total: 'Total de movimentos',
        zonaVerde: 'Movimentos seguros',
        bloqueados: 'Movimentos bloqueados',
        impactoEstimado: 'Número de arquivos afetados',
      },
    },
  },

  /* -------------------------- FILTRO INTELIGENTE -------------------------- */
  filtroInteligente: {
    root: {
      label: 'relatorioResumo',
      descricao: 'Relatório filtrado com problemas priorizados',
    },
    problemasCriticos: {
      label: 'problemasCriticos',
      descricao: 'Problemas de severidade crítica (segurança, dados)',
    },
    problemasAltos: {
      label: 'problemasAltos',
      descricao: 'Problemas de alta prioridade (bugs, código frágil)',
    },
    problemasOutros: {
      label: 'problemasOutros',
      descricao: 'Demais problemas (baixa/média prioridade)',
    },
    estatisticas: {
      label: 'estatisticas',
      descricao: 'Estatísticas do agrupamento inteligente',
      campos: {
        totalOcorrencias: 'Total de ocorrências processadas',
        arquivosAfetados: 'Número de arquivos únicos afetados',
        problemasPrioritarios: 'Problemas críticos + altos',
        problemasAgrupados: 'Número de grupos criados',
      },
    },
  },
};

/**
 * Envolve dados JSON com metadados explicativos
 */
export function wrapComMetadados<T>(
  data: T,
  schema: string,
  versao: string,
  descricao: string,
): JsonComMetadados<T> {
  return {
    _metadata: {
      schema,
      versao,
      geradoEm: new Date().toISOString(),
      descricao,
    },
    dados: data,
  };
}

/**
 * Helper para gerar descrição de campo JSON com tipagem segura
 */
export function getDescricaoCampo(caminho: string): string {
  const parts = caminho.split('.');
  // Tipo seguro para navegação no objeto de mensagens
  let current: unknown = JsonMessages;

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return `Campo: ${caminho}`;
    }
  }

  // Type guard para verificar se tem descrição
  if (
    typeof current === 'object' &&
    current !== null &&
    'descricao' in current &&
    typeof (current as { descricao: unknown }).descricao === 'string'
  ) {
    return (current as { descricao: string }).descricao;
  }

  return `Campo: ${caminho}`;
}
