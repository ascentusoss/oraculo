// SPDX-License-Identifier: MIT
/**
 * @fileoverview Registry centralizado para operações de leitura/escrita de arquivos JSON
 *
 * Este módulo fornece uma camada de abstração sobre a persistência,
 * gerenciando migrações automáticas de arquivos legados e garantindo
 * que todos os arquivos sejam salvos nos locais corretos.
 *
 * Features:
 * - Migração automática de arquivos legados
 * - Validação de integridade de JSONs
 * - Logging de operações de I/O
 * - Fallback para configurações seguras
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { ExcecoesMessages } from '@core/messages/core/excecoes-messages.js';

import type { MigrationResult } from '@';

import { log } from '../messages/log/log.js';
import {
  MIGRATION_MAP,
  ORACULO_DIRS,
  ORACULO_FILES,
  type OraculoFilePath,
} from './paths.js';

/**
 * Opções para operações de leitura
 */
interface ReadOptions<T> {
  /** Valor padrão se arquivo não existir */
  default?: T;
  /** Tentar migrar de arquivo legado automaticamente */
  migrate?: boolean;
  /** Validar estrutura do JSON */
  validate?: (data: unknown) => data is T;
}

/**
 * Opções para operações de escrita
 */
interface WriteOptions {
  /** Criar diretórios pai se não existirem */
  createDirs?: boolean;
  /** Fazer backup antes de sobrescrever */
  backup?: boolean;
  /** Pretty print JSON */
  pretty?: boolean;
}

/**
 * Verifica se arquivo existe
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cria diretórios pai se não existirem
 */
async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Tenta migrar arquivo legado para novo local
 */
async function tryMigrate(targetPath: string): Promise<MigrationResult> {
  const legacyPath = Object.entries(MIGRATION_MAP).find(
    ([_, target]) => target === targetPath,
  )?.[0];

  if (!legacyPath) {
    return { migrated: false };
  }

  const legacyExists = await fileExists(legacyPath);
  if (!legacyExists) {
    return { migrated: false };
  }

  try {
    // Ler arquivo legado
    const content = await fs.readFile(legacyPath, 'utf-8');

    // Garantir diretório de destino
    await ensureDir(targetPath);

    // Escrever no novo local
    await fs.writeFile(targetPath, content, 'utf-8');

    // Renomear arquivo legado (não deletar para segurança)
    const backupPath = `${legacyPath}.migrated`;
    await fs.rename(legacyPath, backupPath);

    log.info(
      `Migração automática: ${path.basename(legacyPath)} → ${path.basename(targetPath)}`,
    );

    return {
      migrated: true,
      from: legacyPath,
      to: targetPath,
    };
  } catch (erro) {
    log.aviso(`Falha na migração de ${legacyPath}: ${(erro as Error).message}`);
    return { migrated: false };
  }
}

/**
 * Lê arquivo JSON do registry
 *
 * @param filePath Caminho do arquivo (use ORACULO_FILES.*)
 * @param options Opções de leitura
 * @returns Conteúdo parseado do JSON
 *
 * @example
 * ```ts
 * const config = await readJSON(ORACULO_FILES.CONFIG, {
 *   default: {}
 * });
 * ```
 */
export async function readJSON<T = unknown>(
  filePath: OraculoFilePath | string,
  options: ReadOptions<T> = {},
): Promise<T> {
  const { default: defaultValue, migrate = true, validate } = options;

  try {
    // Tentar migração se habilitado
    if (migrate) {
      const migration = await tryMigrate(filePath);
      if (migration.migrated && migration.to) {
        // Usar arquivo migrado
        filePath = migration.to;
      }
    }

    // Verificar existência
    const exists = await fileExists(filePath);
    if (!exists) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(ExcecoesMessages.arquivoNaoEncontrado(String(filePath)));
    }

    // Ler e parsear
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content) as T;

    // Validar se fornecido
    if (validate && !validate(parsed)) {
      throw new Error(ExcecoesMessages.validacaoFalhouPara(String(filePath)));
    }

    return parsed;
  } catch (erro) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(
      ExcecoesMessages.erroAoLer(String(filePath), (erro as Error).message),
    );
  }
}

/**
 * Escreve arquivo JSON no registry
 *
 * @param filePath Caminho do arquivo (use ORACULO_FILES.*)
 * @param data Dados a serem salvos
 * @param options Opções de escrita
 *
 * @example
 * ```ts
 * await writeJSON(ORACULO_FILES.GUARDIAN_BASELINE, snapshot, {
 *   createDirs: true,
 *   backup: true
 * });
 * ```
 */
export async function writeJSON<T = unknown>(
  filePath: OraculoFilePath | string,
  data: T,
  options: WriteOptions = {},
): Promise<void> {
  const { createDirs = true, backup = false, pretty = true } = options;

  try {
    // Criar diretórios se necessário
    if (createDirs) {
      await ensureDir(filePath);
    }

    // Fazer backup se solicitado
    if (backup && (await fileExists(filePath))) {
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
    }

    // Serializar JSON
    const content = pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // Escrever arquivo
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (erro) {
    throw new Error(
      ExcecoesMessages.erroAoEscrever(
        String(filePath),
        (erro as Error).message,
      ),
    );
  }
}

/**
 * Deleta arquivo do registry
 *
 * @param filePath Caminho do arquivo (use ORACULO_FILES.*)
 * @param options Opções de deleção
 */
export async function deleteJSON(
  filePath: OraculoFilePath | string,
  options: { backup?: boolean } = {},
): Promise<void> {
  const { backup = true } = options;

  try {
    const exists = await fileExists(filePath);
    if (!exists) {
      return; // Já deletado
    }

    if (backup) {
      const backupPath = `${filePath}.deleted`;
      await fs.rename(filePath, backupPath);
    } else {
      await fs.unlink(filePath);
    }
  } catch (erro) {
    throw new Error(
      ExcecoesMessages.erroAoDeletar(String(filePath), (erro as Error).message),
    );
  }
}

/**
 * Lista todos os arquivos JSON em um diretório do registry
 *
 * @param dirPath Caminho do diretório (use ORACULO_DIRS.*)
 * @returns Lista de caminhos completos
 */
export async function listJSONFiles(dirPath: string): Promise<string[]> {
  try {
    const exists = await fileExists(dirPath);
    if (!exists) {
      return [];
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => path.join(dirPath, entry.name));

    return jsonFiles;
  } catch (erro) {
    log.aviso(
      `Erro ao listar arquivos em ${dirPath}: ${(erro as Error).message}`,
    );
    return [];
  }
}

/**
 * Exporta funções auxiliares para compatibilidade com código existente
 */
export const FileRegistry = {
  read: readJSON,
  write: writeJSON,
  delete: deleteJSON,
  list: listJSONFiles,
  paths: ORACULO_FILES,
  dirs: ORACULO_DIRS,
} as const;
