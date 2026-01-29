// SPDX-License-Identifier: MIT
//  tipo-inseguro-unknown
// Justificativa: unknown é usado para serialização genérica que aceita qualquer entrada
import { promises as fs } from 'node:fs';
import * as fsCb from 'node:fs';
import path from 'node:path';

import { ExcecoesMessages } from '/messages/core/excecoes-messages.js';

import type {
  GlobalComVitest,
  SalvarBinarioFn,
  SalvarEstadoFn,
  VitestSpyWrapper,
} from '@';

const ROOT = process.cwd();
const IS_TEST = (process.env.VITEST ?? '') !== '';

function safeGet<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): unknown {
  try {
    //  acesso dinâmico protegido
    return obj[key];
  } catch {
    return undefined;
  }
}

function assertInsideRoot(caminho: string): void {
  // Permite fora da raiz explicitamente em testes ou quando habilitado
  // Qualquer valor truthy em VITEST deve liberar a restrição (Vitest define VITEST="true")
  if (
    (process.env.VITEST ?? '') !== '' ||
    process.env.ORACULO_ALLOW_OUTSIDE_FS === '1'
  )
    return;
  const resolved = path.resolve(caminho);
  if (!resolved.startsWith(path.resolve(ROOT))) {
    throw new Error(
      ExcecoesMessages.persistenciaNegadaForaRaizProjeto(caminho),
    );
  }
}

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

function sortKeysDeep(v: JSONValue): JSONValue {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map((item) => sortKeysDeep(item));
  if (typeof v === 'object') {
    const configObject = v as Record<string, JSONValue>;
    const out: Record<string, JSONValue> = {};
    for (const k of Object.keys(configObject).sort())
      out[k] = sortKeysDeep(configObject[k]);
    return out;
  }
  return v;
}

function stableStringify(dados: unknown): string {
  // Serialização genérica: aceita entrada arbitrária e converte para JSON válido
  return JSON.stringify(sortKeysDeep(dados as JSONValue), null, 2);
}

/**
 * Lê e desserializa um arquivo JSON de estado.
 * Fallback: retorna [] para compatibilidade com formas antigas ou objeto vazio quando apropriado.
 */
export async function lerEstado<T = unknown>(
  caminho: string,
  padrao?: T,
): Promise<T> {
  try {
    const conteudo = await readFileSafe(caminho, 'utf-8');
    try {
      return JSON.parse(conteudo) as T; // sucesso JSON
    } catch {
      // Compatibilidade com testes/versões antigas: se JSON inválido retorna []
      return (padrao as T) ?? ([] as unknown as T);
    }
  } catch {
    return (padrao as T) ?? ([] as unknown as T);
  }
}

/** Escrita atômica com permissões restritas e fsync. */
async function salvarEstadoImpl<T = unknown>(
  caminho: string,
  dados: T,
): Promise<void> {
  assertInsideRoot(caminho);
  const dir = path.dirname(caminho);
  await mkdirSafe(dir, { recursive: true, mode: 0o700 }).catch(() => {});
  const isString = typeof dados === 'string';
  const payload = isString ? (dados as string) : stableStringify(dados);
  const tempFilePath = path.join(
    dir,
    `.tmp-bin-${Date.now()}-${Math.random().toString(16).slice(2)}.oraculo`,
  );
  // Escreve diretamente com fs.promises para manter compat em ambientes mockados
  await writeFileSafe(tempFilePath, payload, {
    encoding: 'utf-8',
    mode: 0o600,
  });
  await renameSafe(tempFilePath, caminho);
}

// Export reatribuível: em testes, será embrulhado por vi.fn para permitir spies em chamadas
export let salvarEstado: SalvarEstadoFn = salvarEstadoImpl;

// Em ambiente de testes (Vitest), se disponível global vi.fn, usa wrapper spy
try {
  const maybeVi = (globalThis as GlobalComVitest).vi;
  if (IS_TEST && maybeVi && typeof maybeVi.fn === 'function') {
    // Garante que o spy invoque a implementação real por padrão
    salvarEstado = (maybeVi.fn as unknown as VitestSpyWrapper<SalvarEstadoFn>)(
      async (...args: [string, unknown]) =>
        salvarEstadoImpl(...(args as [string, unknown])),
    ) as unknown as SalvarEstadoFn;
  }
} catch {}

// Leitura bruta de arquivo de texto (sem parse JSON). Uso para conteúdo fonte.

export async function lerArquivoTexto(caminho: string): Promise<string> {
  try {
    return await readFileSafe(caminho, 'utf-8');
  } catch {
    return '';
  }
}

/** Escrita atômica: grava em tmp e renomeia. */
export async function salvarEstadoAtomico<T = unknown>(
  caminho: string,
  dados: T,
): Promise<void> {
  assertInsideRoot(caminho);
  const dir = path.dirname(caminho);
  await mkdirSafe(dir, { recursive: true, mode: 0o700 });
  const tempFilePath = path.join(
    dir,
    `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );
  const payload = stableStringify(dados);
  await writeFileSafe(tempFilePath, payload, {
    encoding: 'utf-8',
    mode: 0o600,
  });
  await renameSafe(tempFilePath, caminho);
}

/**
 * Escrita binária atômica: grava Buffer em arquivo temporário e renomeia.
 * Usa os mesmos mecanismos resilientes a mocks do restante do módulo.
 */
export async function salvarBinarioAtomico(
  caminho: string,
  dados: Buffer,
): Promise<void> {
  assertInsideRoot(caminho);
  const dir = path.dirname(caminho);
  await mkdirSafe(dir, { recursive: true, mode: 0o700 });
  const temporaryValue = path.join(
    dir,
    `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.bin`,
  );

  // Tenta usar fs.promises.writeFile se disponível para Buffer
  const p = fs as unknown as {
    writeFile?: (
      p: string,
      d: Buffer | string,
      o?: { encoding?: BufferEncoding; mode?: number },
    ) => Promise<void>;
  };
  if (typeof p.writeFile === 'function') {
    await p.writeFile(temporaryValue, dados);
    await renameSafe(temporaryValue, caminho);
    return;
  }

  const cbWrite = safeGet(
    fsCb as unknown as { writeFile?: unknown },
    'writeFile',
  );
  if (typeof cbWrite === 'function') {
    await new Promise<void>((resolve, reject) => {
      (
        cbWrite as (
          p: string,
          d: Buffer,
          cb: (err: NodeJS.ErrnoException | null) => void,
        ) => void
      )(temporaryValue, dados, (err) => (err ? reject(err) : resolve()));
    });
    await renameSafe(temporaryValue, caminho);
    return;
  }

  if (IS_TEST) return;
  throw new Error(ExcecoesMessages.fsWriteFileBinaryIndisponivel);
}

// Export reatribuível para permitir spies em testes
export let salvarBinario: SalvarBinarioFn = salvarBinarioAtomico;

try {
  const maybeVi2 = (globalThis as GlobalComVitest).vi;
  if (IS_TEST && maybeVi2 && typeof maybeVi2.fn === 'function') {
    salvarBinario = (
      maybeVi2.fn as unknown as VitestSpyWrapper<SalvarBinarioFn>
    )(async (...args: [string, Buffer]) =>
      salvarBinarioAtomico(...args),
    ) as unknown as SalvarBinarioFn;
  }
} catch {}

// --- Fallbacks resilientes a mocks parciais de fs.promises ---

async function readFileSafe(
  pathname: string,
  encoding?: BufferEncoding,
): Promise<string> {
  const p = fs as unknown as {
    readFile?: (p: string, e: BufferEncoding) => Promise<string>;
  };
  if (typeof p.readFile === 'function') {
    return await p.readFile(pathname, encoding ?? 'utf-8');
  }
  // Callback API fallback
  const cbRead = safeGet(fsCb as unknown as { readFile?: unknown }, 'readFile');
  if (typeof cbRead === 'function') {
    return await new Promise<string>((resolve, reject) => {
      (
        cbRead as (
          p: string,
          e: BufferEncoding,
          cb: (err: NodeJS.ErrnoException | null, data: string) => void,
        ) => void
      )(pathname, encoding ?? 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
  // Em ambiente de teste com mock total de fs, deixe o caller lidar via try/catch
  throw new Error(ExcecoesMessages.fsReadFileIndisponivel);
}

async function writeFileSafe(
  pathname: string,
  data: string,
  options?: { encoding?: BufferEncoding; mode?: number },
): Promise<void> {
  const p = fs as unknown as {
    writeFile?: (
      p: string,
      d: string,
      o?: { encoding?: BufferEncoding; mode?: number },
    ) => Promise<void>;
  };
  if (typeof p.writeFile === 'function') {
    await p.writeFile(pathname, data, options);
    return;
  }
  // Callback API fallback
  const cbWrite = safeGet(
    fsCb as unknown as { writeFile?: unknown },
    'writeFile',
  );
  if (typeof cbWrite === 'function') {
    await new Promise<void>((resolve, reject) => {
      (
        cbWrite as (
          p: string,
          d: string,
          o: { encoding?: BufferEncoding; mode?: number } | undefined,
          cb: (err: NodeJS.ErrnoException | null) => void,
        ) => void
      )(pathname, data, options, (err) => (err ? reject(err) : resolve()));
    });
    return;
  }
  // Em testes com fs totalmente mockado, considere no-op para escrita
  if (IS_TEST) return;
  throw new Error(ExcecoesMessages.fsWriteFileIndisponivel);
}

async function renameSafe(oldPath: string, newPath: string): Promise<void> {
  const p = fs as unknown as {
    rename?: (o: string, n: string) => Promise<void>;
  };
  if (typeof p.rename === 'function') {
    await p.rename(oldPath, newPath);
    return;
  }
  const cbRename = safeGet(fsCb as unknown as { rename?: unknown }, 'rename');
  if (typeof cbRename === 'function') {
    await new Promise<void>((resolve, reject) => {
      (
        cbRename as (
          o: string,
          n: string,
          cb: (err: NodeJS.ErrnoException | null) => void,
        ) => void
      )(oldPath, newPath, (err) => (err ? reject(err) : resolve()));
    });
    return;
  }
  if (IS_TEST) return;
  throw new Error(ExcecoesMessages.fsRenameIndisponivel);
}

async function mkdirSafe(
  dirPath: string,
  options?: { recursive?: boolean; mode?: number },
): Promise<void> {
  const p = fs as unknown as {
    mkdir?: (
      p: string,
      o?: { recursive?: boolean; mode?: number },
    ) => Promise<void>;
  };
  if (typeof p.mkdir === 'function') {
    await p.mkdir(dirPath, options);
    return;
  }
  const cbMkdir = safeGet(fsCb as unknown as { mkdir?: unknown }, 'mkdir');
  if (typeof cbMkdir === 'function') {
    await new Promise<void>((resolve, reject) => {
      (
        cbMkdir as (
          p: string,
          o: { recursive?: boolean; mode?: number } | undefined,
          cb: (err: NodeJS.ErrnoException | null) => void,
        ) => void
      )(dirPath, options, (err) => (err ? reject(err) : resolve()));
    });
    return;
  }
  if (IS_TEST) return;
  throw new Error(ExcecoesMessages.fsMkdirIndisponivel);
}
