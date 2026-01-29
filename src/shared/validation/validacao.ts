// SPDX-License-Identifier: MIT
import path from 'node:path';

import { ExcecoesMessages } from '/messages/core/excecoes-messages.js';

import type { ErroValidacaoCombinacao } from '@';

// Re-exporta o tipo para compatibilidade
export type { ErroValidacaoCombinacao };

/** Normaliza um caminho assegurando que permanece dentro da CWD (remove tentativas de escape). */
export function normalizePath(p: string): string {
  const normalized = path.normalize(p);
  const resolved = path.resolve(normalized);
  const cwd = process.cwd();

  // Assegurar que o caminho permanece dentro da CWD
  if (!resolved.startsWith(cwd)) {
    throw new Error(ExcecoesMessages.caminhoForaDaCwdNaoPermitido(p));
  }

  return normalized;
}

/** Valida se um caminho de arquivo é seguro para operações de leitura/escrita */
export function isPathSafe(filePath: string): boolean {
  try {
    const normalized = normalizePath(filePath);

    // Verificar padrões perigosos
    const dangerousPatterns = [
      /\.\./, // Directory traversal
      /^\/etc\//, // System directories
      /^\/root\//, // Root directory
      /^\/sys\//, // System files
      /^\/proc\//, // Process files
      /^C:\\Windows\\/i, // Windows system directory
      /^C:\\System32\\/i, // Windows system32
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(normalized));
  } catch {
    return false;
  }
}

/** Valida se um nome de arquivo é válido e seguro */
export function isFilenameSafe(filename: string): boolean {
  if (!filename || filename.length === 0) return false;
  if (filename.length > 255) return false;

  // Caracteres proibidos
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) return false;

  // Nomes reservados no Windows
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) return false;

  return true;
}

/** Sanitiza um nome de arquivo removendo caracteres perigosos */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i, 'file_$1$2')
    .slice(0, 255);
}

/** Valida se uma string representa um caminho relativo válido */
export function isRelativePathValid(relativePath: string): boolean {
  if (!relativePath) return false;
  if (path.isAbsolute(relativePath)) return false;

  const normalized = path.normalize(relativePath);
  return !normalized.startsWith('..');
}

/** Extrai a extensão de um arquivo de forma segura */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext.toLowerCase();
}

/** Verifica se uma extensão está na lista de extensões permitidas */
export function isExtensionAllowed(
  filename: string,
  allowedExtensions: string[],
): boolean {
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
}

// Compatibilidade com funções originais
export function normalizarPathLocal(p: string): string {
  return normalizePath(p);
}

/** Valida se um valor é um número positivo */
export function validarNumeroPositivo(
  v: unknown,
  _nome: string,
): number | null {
  if (typeof v === 'number' && v > 0) return v;
  if (typeof v === 'string') {
    const num = Number.parseFloat(v);
    if (!Number.isNaN(num) && num > 0) return num;
  }
  return null;
}

/** Regras simples de combinação de flags globais. Expandir conforme novos casos. */
export function validarCombinacoes(
  flags: Record<string, unknown>,
): ErroValidacaoCombinacao[] {
  const erros: ErroValidacaoCombinacao[] = [];
  if (flags.scanOnly && flags.incremental) {
    erros.push({
      codigo: 'SCAN_INCREMENTAL',
      mensagem:
        'Não combinar --scan-only com --incremental (incremental exige AST).',
    });
  }
  return erros;
}

export function sanitizarFlags(flags: Record<string, unknown>): void {
  const erros = validarCombinacoes(flags);
  if (erros.length) {
    const detalhe = erros.map((e) => `${e.codigo}: ${e.mensagem}`).join('; ');
    throw new Error(detalhe);
  }
}
