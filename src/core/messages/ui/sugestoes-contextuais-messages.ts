// SPDX-License-Identifier: MIT

import { ICONES_ACAO, ICONES_ARQUIVO, ICONES_FEEDBACK } from './icons.js';

export const SugestoesContextuaisMessages = {
  arquetipoNaoIdentificado:
    'Não foi possível identificar um arquétipo específico. Considere adicionar mais estrutura ao projeto.',

  projetoIdentificado: (
    tecnologia: string | undefined,
    confiancaPercent: number,
  ) =>
    `${ICONES_FEEDBACK.info} Projeto identificado como: ${tecnologia} (confiança: ${confiancaPercent}%)`,

  evidenciaDependencia: (dependencia: string, tecnologia: string | undefined) =>
    `${ICONES_ARQUIVO.package} Dependência ${dependencia} confirma projeto ${tecnologia}`,

  evidenciaImport: (valor: string, localizacao: string | undefined) =>
    `${ICONES_ACAO.import} Import ${valor} detectado em ${localizacao}`,

  evidenciaCodigo: (localizacao: string | undefined) =>
    `${ICONES_ARQUIVO.codigo} Padrão de código específico detectado em ${localizacao}`,

  evidenciaEstrutura: (valor: string, tecnologia: string | undefined) =>
    `${ICONES_ARQUIVO.diretorio} Estrutura ${valor} típica de ${tecnologia}`,

  tecnologiasAlternativas: (alternativas: string) =>
    `${ICONES_ACAO.analise} Outras tecnologias detectadas: ${alternativas}`,

  erroAnaliseContextual: (erro: string) =>
    `Erro na análise contextual: ${erro}`,

  erroDuranteAnalise: 'Erro durante análise contextual inteligente',
} as const;
