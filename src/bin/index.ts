#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Bootstrap do binário: registra o loader ESM programaticamente e importa ./cli.js
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { ErrorLike } from '@';
import { extrairMensagemErro } from '@';

// Resolve o diretório raiz do dist usando import.meta.url para funcionar em instalações globais
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distRoot = path.resolve(__dirname, '..');
// Observação: usar o loader original 'node.loader.mjs' (com ponto) para compatibilidade dos testes e runtime
const loaderPath = path.resolve(distRoot, 'node.loader.mjs');
const loaderUrl = pathToFileURL(loaderPath).toString();
const entryPath = path.resolve(distRoot, 'bin', 'cli.js');
const entryUrl = pathToFileURL(entryPath).toString();

// Registra o loader sem usar --experimental-loader (evita ExperimentalWarning)
(async () => {
  try {
    const { register } = await import('node:module');
    register(loaderUrl, pathToFileURL('./'));
    // Importa o módulo CLI e, quando presente, invoca explicitamente a função mainCli
    type CliModule = { mainCli?: () => unknown };
    const cliMod = (await import(entryUrl)) as unknown;
    const maybeCli = cliMod as CliModule;
    if (maybeCli && typeof maybeCli.mainCli === 'function') {
      await maybeCli.mainCli();
    }
  } catch (err: unknown) {
    // Commander lança códigos especiais quando --version ou --help são usados —
    // tratá-los como sucesso silencioso (exit 0) em vez de logar como erro.
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code?: unknown }).code
        : undefined;
    const message =
      err && typeof err === 'object' && 'message' in err
        ? (err as { message?: unknown }).message
        : typeof err === 'string'
          ? err
          : undefined;
    if (
      code === 'commander.version' ||
      code === 'commander.help' ||
      code === 'commander.helpDisplayed' ||
      message === 'outputHelp' ||
      message === '(outputHelp)'
    ) {
      process.exit(0);
    }

    const msg =
      typeof message === 'string' ? message : extrairMensagemErro(err);
    console.error('Erro ao inicializar o oraculo:', msg);
    if (err && typeof err === 'object' && 'stack' in err) {
      console.error((err as { stack?: string }).stack);
    }
    process.exit(1);
  }
})().catch((err: ErrorLike) => {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? (err as { code?: unknown }).code
      : undefined;
  const message =
    err && typeof err === 'object' && 'message' in err
      ? (err as { message?: unknown }).message
      : typeof err === 'string'
        ? err
        : undefined;
  if (
    code === 'commander.version' ||
    code === 'commander.help' ||
    code === 'commander.helpDisplayed' ||
    message === 'outputHelp' ||
    message === '(outputHelp)'
  ) {
    process.exit(0);
  }
  const msg = typeof message === 'string' ? message : extrairMensagemErro(err);
  console.error('Erro ao inicializar o oraculo:', msg);
  if (err && typeof err === 'object' && 'stack' in err) {
    console.error((err as { stack?: string }).stack);
  }
  process.exit(1);
});
