// Tipos mínimos para o zelador de pontuação
export interface ProblemaPontuacao {
  // tipo do problema, ex: 'unicode-invalido', 'pontuacao-repetida', 'espacamento-incorreto', 'caracteres-incomuns'
  tipo: string;
  // posição no arquivo (índice) quando aplicável
  posicao?: number;
  // comprimento do trecho afetado
  comprimento?: number;
  // texto descritivo curto do problema
  descricao: string;
  // sugestão de correção (texto)
  sugestao?: string;
  // confiança de 0 a 100
  confianca?: number;
  // campos auxiliares usados ao gerar ocorrências
  relPath?: string;
  linha?: number;
  coluna?: number;
}

export interface ConfiguracaoPontuacaoZelador {
  aplicarAutomaticamente?: boolean;
  backupExt?: string;
  maxFixesPerFile?: number;

  // opções específicas para pontuação
  normalizarUnicode?: boolean;
  colapsarPontuacaoRepetida?: boolean;
  corrigirEspacamento?: boolean;
  balancearParenteses?: boolean;
  detectarCaracteresIncomuns?: boolean;
  limiteCaracteresIncomuns?: number;
}
