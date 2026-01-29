// SPDX-License-Identifier: MIT
import { ORACULO_FILES } from '/registry/paths.js';

/**
 * 📌 Caminho absoluto para o arquivo de baseline principal (usado pelo Sentinela).
 *
 * Usa o sistema de paths centralizado: .oraculo/guardian.baseline.json
 * Com fallback automático para baseline.json legado se necessário.
 */
export const BASELINE_PATH = ORACULO_FILES.GUARDIAN_BASELINE;

/**
 * 📌 Caminho padrão para os registros da Vigia Oculta.
 *
 * Integridade de execução armazenada em .oraculo/integridade.json
 */
export const REGISTRO_VIGIA_CAMINHO_PADRAO = ORACULO_FILES.REGISTRO_VIGIA;
/**
 * 🧮 Algoritmo padrão utilizado para hashing de integridade.
 * (BLAKE3 é o padrão universal do Guardian.)
 */
export const ALGORITMO_HASH = 'blake3';
