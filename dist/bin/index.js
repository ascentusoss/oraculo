#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extrairMensagemErro } from '../types/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distRoot = path.resolve(__dirname, '..');
const loaderPath = path.resolve(distRoot, 'node.loader.mjs');
const loaderUrl = pathToFileURL(loaderPath).toString();
const entryPath = path.resolve(distRoot, 'bin', 'cli.js');
const entryUrl = pathToFileURL(entryPath).toString();
(async () => {
    try {
        const { register } = await import('node:module');
        register(loaderUrl, pathToFileURL('./'));
        const cliMod = (await import(entryUrl));
        const maybeCli = cliMod;
        if (maybeCli && typeof maybeCli.mainCli === 'function') {
            await maybeCli.mainCli();
        }
    }
    catch (err) {
        const code = err && typeof err === 'object' && 'code' in err
            ? err.code
            : undefined;
        const message = err && typeof err === 'object' && 'message' in err
            ? err.message
            : typeof err === 'string'
                ? err
                : undefined;
        if (code === 'commander.version' ||
            code === 'commander.help' ||
            code === 'commander.helpDisplayed' ||
            message === 'outputHelp' ||
            message === '(outputHelp)') {
            process.exit(0);
        }
        const msg = typeof message === 'string' ? message : extrairMensagemErro(err);
        console.error('Erro ao inicializar o oraculo:', msg);
        if (err && typeof err === 'object' && 'stack' in err) {
            console.error(err.stack);
        }
        process.exit(1);
    }
})().catch((err) => {
    const code = err && typeof err === 'object' && 'code' in err
        ? err.code
        : undefined;
    const message = err && typeof err === 'object' && 'message' in err
        ? err.message
        : typeof err === 'string'
            ? err
            : undefined;
    if (code === 'commander.version' ||
        code === 'commander.help' ||
        code === 'commander.helpDisplayed' ||
        message === 'outputHelp' ||
        message === '(outputHelp)') {
        process.exit(0);
    }
    const msg = typeof message === 'string' ? message : extrairMensagemErro(err);
    console.error('Erro ao inicializar o oraculo:', msg);
    if (err && typeof err === 'object' && 'stack' in err) {
        console.error(err.stack);
    }
    process.exit(1);
});
//# sourceMappingURL=index.js.map