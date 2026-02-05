// SPDX-License-Identifier: MIT
import { logConselheiro } from '@core/messages/index.js';

import type { ConselhoContextoOracular } from '@';

// Re-exporta para compatibilidade com nome original
export type ConselhoContexto = ConselhoContextoOracular;

export function emitirConselhoOracular(
  estresse: ConselhoContextoOracular,
): void {
  const {
    hora = new Date().getHours(),
    arquivosParaCorrigir = 0,
    arquivosParaPodar = 0,
  } = estresse;

  const madrugada = hora >= 23 || hora < 4;
  const muitosArquivos = arquivosParaCorrigir > 200 || arquivosParaPodar > 200;

  if (!madrugada && !muitosArquivos) return;

  // Primeira linha com frase-chave esperada pelos testes
  logConselheiro.respira();
  if (madrugada) {
    // Mensagem deve conter a expressão "passa das 2h" para testes
    const horaRef = hora >= 2 && hora < 3 ? '2h' : `${hora}h`;
    logConselheiro.madrugada(horaRef);
  }
  if (muitosArquivos) {
    // Deve conter "volume de tarefas" (minúsculas) para os testes
    logConselheiro.volumeAlto();
  }
  logConselheiro.cuidado();
}
