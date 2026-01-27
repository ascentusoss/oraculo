#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registrarComandos } from '../cli/comandos.js';
import { comandoPerf } from '../cli/commands/index.js';
import { ExitCode, sair } from '../cli/helpers/exit-codes.js';
import chalk from '../core/config/chalk-safe.js';
import { aplicarConfigParcial, config, inicializarConfigDinamica, } from '../core/config/config.js';
import { ICONES_NIVEL } from '../core/messages/index.js';
import { getDefaultMemory } from '../shared/memory.js';
import { lerArquivoTexto } from '../shared/persistence/persistencia.js';
import { Command } from 'commander';
import { extrairMensagemErro } from '../types/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
async function getVersion() {
    try {
        const packagePath = join(__dirname, '..', '..', 'package.json');
        const raw = await lerArquivoTexto(packagePath);
        const pkg = raw ? JSON.parse(raw) : {};
        return (pkg && pkg.version) || '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
const program = new Command();
async function aplicarFlagsGlobais(opts) {
    const flags = opts;
    try {
        const { sanitizarFlags } = await import('../shared/validation/validacao.js');
        sanitizarFlags(flags);
    }
    catch (e) {
        console.error(chalk.red(`${ICONES_NIVEL.erro} Flags inválidas: ${e.message}`));
        sair(ExitCode.InvalidUsage);
    }
    config.REPORT_SILENCE_LOGS = Boolean(flags.silence);
    config.REPORT_EXPORT_ENABLED = Boolean(flags.export);
    config.REPORT_EXPORT_FULL = Boolean(flags['exportFull']);
    const debugAtivo = Boolean(flags.debug) || process.env.ORACULO_DEBUG === 'true';
    config.DEV_MODE = debugAtivo;
    config.SCAN_ONLY = Boolean(flags.scanOnly);
    config.VERBOSE = flags.silence ? false : Boolean(flags.verbose);
    const overrides = {};
    const optObj = opts;
    if (typeof optObj.logEstruturado === 'boolean')
        overrides.LOG_ESTRUTURADO = optObj.logEstruturado;
    if (typeof optObj.incremental === 'boolean')
        overrides.ANALISE_INCREMENTAL_ENABLED = optObj.incremental;
    if (typeof optObj.metricas === 'boolean')
        overrides.ANALISE_METRICAS_ENABLED = optObj.metricas;
    if (Object.keys(overrides).length)
        aplicarConfigParcial(overrides);
}
registrarComandos(program, (o) => aplicarFlagsGlobais(o));
program.addCommand(comandoPerf());
export async function mainCli() {
    function __oraculo_unhandledRejectionHandler(err) {
        const MARKER = 'Oraculo: unhandled rejection';
        const mensagem = extrairMensagemErro(err);
        console.error(MARKER, mensagem);
        if (!process.env.VITEST) {
            if (err && typeof err === 'object' && 'stack' in err) {
                console.error(err.stack);
            }
            process.exit(1);
        }
    }
    process.on('unhandledRejection', __oraculo_unhandledRejectionHandler);
    process.on('uncaughtException', (err) => {
        const mensagem = extrairMensagemErro(err);
        console.error(chalk.red(`${ICONES_NIVEL.erro} Exceção não capturada: ${mensagem}`));
        if (err && typeof err === 'object' && 'stack' in err) {
            console.error(err.stack);
        }
        if (!process.env.VITEST)
            sair(ExitCode.Critical);
    });
    let memoria;
    try {
        memoria = await getDefaultMemory();
    }
    catch { }
    try {
        if (process.env.NODE_ENV === 'production') {
            try {
                const safeCfgPath = join(__dirname, '..', '..', 'oraculo.config.safe.json');
                const raw = await lerArquivoTexto(safeCfgPath);
                const safeCfg = raw ? JSON.parse(raw) : {};
                const prod = safeCfg?.productionDefaults;
                if (prod && typeof prod === 'object') {
                    for (const [k, v] of Object.entries(prod)) {
                        if (process.env[k] === undefined)
                            process.env[k] = String(v);
                    }
                }
            }
            catch {
            }
        }
        try {
            const versionNumber = await getVersion();
            if (typeof program
                .version === 'function') {
                program.version(versionNumber);
            }
            else {
                program._version = versionNumber;
            }
        }
        catch { }
        await inicializarConfigDinamica();
    }
    catch {
    }
    const argv = process.argv.slice(2);
    if (argv.includes('--historico')) {
        if (memoria) {
            const resumo = memoria.getSummary();
            console.log(chalk.cyan('\n📊 RESUMO DA CONVERSA'));
            console.log(`Total: ${resumo.totalMessages}`);
            console.log(`Usuário: ${resumo.userMessages}`);
            console.log(`Oráculo: ${resumo.assistantMessages}`);
            if (resumo.firstMessage)
                console.log(`Primeira: ${resumo.firstMessage}`);
            if (resumo.lastMessage)
                console.log(`Última: ${resumo.lastMessage}`);
            console.log('');
        }
        else {
            console.log(chalk.yellow('Histórico indisponível.'));
        }
        return;
    }
    if (argv.includes('--limpar-historico')) {
        if (memoria)
            await memoria.clear();
        console.log(chalk.green('Histórico limpo.'));
        return;
    }
    try {
        await memoria?.addMessage({
            role: 'user',
            content: `Execução CLI: ${argv.join(' ') || '(sem argumentos)'}`,
            timestamp: new Date().toISOString(),
        });
    }
    catch { }
    program.exitOverride((err) => {
        const code = err?.code || '';
        const isUsoInvalido = code === 'commander.unknownCommand' ||
            code === 'commander.unknownOption' ||
            code === 'commander.missingArgument' ||
            code === 'commander.optionMissingArgument' ||
            code === 'commander.missingMandatoryOptionValue' ||
            code === 'commander.invalidArgument';
        if (isUsoInvalido) {
            console.error(chalk.red(`${ICONES_NIVEL.erro} ${err.message}`));
            sair(ExitCode.InvalidUsage);
            return;
        }
        throw err;
    });
    await program.parseAsync(process.argv);
}
function __oraculo_unhandledRejectionHandler(err) {
    const MARKER = 'Oraculo: unhandled rejection';
    const mensagem = extrairMensagemErro(err);
    console.error(MARKER, mensagem);
    if (!process.env.VITEST) {
        if (err && typeof err === 'object' && 'stack' in err) {
            console.error(err.stack);
        }
        process.exit(1);
    }
}
process.on('unhandledRejection', __oraculo_unhandledRejectionHandler);
if (import.meta.url === `file://${process.argv[1]}` ||
    (process.argv[1] && process.argv[1].endsWith('/bin/cli.js'))) {
    mainCli().catch((err) => {
        const mensagem = extrairMensagemErro(err);
        console.error(chalk.red(`${ICONES_NIVEL.erro} ${mensagem}`));
        if (err && typeof err === 'object' && 'stack' in err) {
            console.error(err.stack);
        }
        if (!process.env.VITEST)
            process.exit(1);
    });
}
else {
}
//# sourceMappingURL=cli.js.map