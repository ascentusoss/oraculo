// SPDX-License-Identifier: MIT

import {
  ICONES_ACAO,
  ICONES_COMANDO,
  ICONES_DIAGNOSTICO,
  ICONES_STATUS,
} from '../ui/icons.js';

export const CliComandoReestruturarMessages = {
  inicio: `\n${ICONES_COMANDO.reestruturar} Iniciando processo de reestruturação...\n`,
  spinnerCalculandoPlano: `${ICONES_DIAGNOSTICO.progresso} Calculando plano de reestruturação...`,

  planoSugeridoFast: (origem: string, moverLen: number) =>
    `${ICONES_STATUS.ok} Plano sugerido (${origem}) FAST: ${moverLen} movimentação(ões)`,

  dryRunFast: 'Dry-run solicitado (--somente-plano). (FAST MODE)',
  reestruturacaoConcluidaFast: (moverLen: number) =>
    `${ICONES_STATUS.ok} Reestruturação concluída: ${moverLen} movimentos. (FAST MODE)`,

  planoCalculadoFastSemAplicar:
    'Plano calculado em FAST MODE (nenhuma ação aplicada sem --auto).',

  erroDuranteReestruturacao: (erroMensagem: string) =>
    `${ICONES_STATUS.falha} Erro durante a reestruturação: ${erroMensagem}`,

  spinnerPlanoVazio: 'Plano vazio: nenhuma movimentação sugerida.',
  spinnerPlanoSugerido: (origem: string, moverLen: number) =>
    `Plano sugerido (${origem}): ${moverLen} movimentação(ões)`,
  spinnerConflitosDetectados: (qtd: number) => `Conflitos detectados: ${qtd}`,
  spinnerSemPlanoSugestao:
    'Sem planoSugestao (nenhum candidato ou erro). Usando ocorrências.',

  dryRunCompleto:
    'Dry-run solicitado (--somente-plano). Nenhuma ação aplicada.',
  dicaParaAplicar:
    'Para aplicar as movimentações reais, execute novamente com a flag --auto (ou --aplicar).',

  fallbackProblemasEstruturais: (qtd: number) =>
    `\n${qtd} problemas estruturais detectados para correção:`,
  fallbackLinhaOcorrencia: (tipo: string, rel: string, mensagem: string) =>
    `- [${tipo}] ${rel}: ${mensagem}`,

  nenhumNecessario:
    'Nenhuma correção estrutural necessária. Repositório já otimizado!',

  canceladoErroPrompt: `${ICONES_STATUS.falha} Reestruturação cancelada. (Erro no prompt)`,
  canceladoUseAuto: `${ICONES_STATUS.falha} Reestruturação cancelada. (Use --auto para aplicar sem prompt)`,

  spinnerAplicando: `${ICONES_ACAO.correcao} Aplicando movimentos...`,
  reestruturacaoConcluida: (qtd: number, frase: string) =>
    `Reestruturação concluída: ${qtd} ${frase}.`,

  falhaReestruturacao: 'Falha na reestruturação.',
} as const;
