import { optionsDiagnosticar } from '../options-diagnosticar.js';
import { processarDiagnostico } from '../processamento-diagnostico.js';
import { CliComandoDiagnosticarMessages } from '../../core/messages/cli/cli-comando-diagnosticar-messages.js';
import { CABECALHOS, log } from '../../core/messages/index.js';
import { ativarModoJson } from '../../shared/helpers/json-mode.js';
import { Command } from 'commander';
import ora from 'ora';
export function comandoDiagnosticar(aplicarFlagsGlobais) {
    const cmd = new Command('diagnosticar')
        .alias('diag')
        .description('Executa uma análise completa do repositório');
    cmd.allowUnknownOption(true);
    cmd.allowExcessArguments(true);
    for (const opt of optionsDiagnosticar) {
        if ('parser' in opt && opt.parser) {
            cmd.option(opt.flags, opt.desc, opt.parser, opt.defaultValue);
        }
        else if ('defaultValue' in opt) {
            cmd.option(opt.flags, opt.desc, opt.defaultValue);
        }
        else {
            cmd.option(opt.flags, opt.desc);
        }
    }
    cmd.action(async (opts, command) => {
        try {
            const parentObj = command.parent;
            const parentFlags = parentObj && typeof parentObj.opts === 'function'
                ? parentObj.opts()
                : {};
            const localFlags = typeof command.opts === 'function' ? command.opts() : {};
            const merged = {
                ...(parentFlags || {}),
                ...(localFlags || {}),
                ...(opts || {}),
            };
            await aplicarFlagsGlobais(merged);
        }
        catch {
            try {
                await aplicarFlagsGlobais(opts);
            }
            catch {
            }
        }
        if (process.env.ORACULO_TEST_FAST === '1') {
            if (opts.json) {
                console.log(JSON.stringify({
                    meta: {
                        fast: true,
                        tipo: CliComandoDiagnosticarMessages.fastModeTipo,
                    },
                    totalArquivos: 0,
                    ocorrencias: [],
                }, null, 2));
                return;
            }
            return;
        }
        if (opts.json) {
            ativarModoJson();
        }
        const logLevel = opts.logLevel || 'info';
        const isVerbose = opts.full || logLevel === 'debug' || opts.detalhado;
        if (!opts.json && isVerbose) {
            try {
                const { default: chalk } = await import('../../core/config/chalk-safe.js');
                const { config } = await import('../../core/config/config.js');
                const activeFlags = [];
                const details = [];
                const parent = command.parent;
                const parentOpts = parent && typeof parent.opts === 'function' ? parent.opts() : {};
                if (opts.json) {
                    activeFlags.push('--json');
                    details.push(CliComandoDiagnosticarMessages.detalheSaidaEstruturada);
                }
                if (opts.guardianCheck) {
                    activeFlags.push('--guardian-check');
                    details.push(CliComandoDiagnosticarMessages.detalheGuardian);
                }
                if (opts.executive) {
                    activeFlags.push('--executive');
                    details.push(CliComandoDiagnosticarMessages.detalheExecutive);
                }
                if (opts.full) {
                    activeFlags.push('--full');
                    details.push(CliComandoDiagnosticarMessages.detalheFull);
                }
                if (opts.fast) {
                    activeFlags.push('--fast');
                    details.push(CliComandoDiagnosticarMessages.detalheFast);
                }
                const localCompact = Boolean(opts['compact']);
                const effectiveCompact = localCompact || (!opts.full && !localCompact);
                if (effectiveCompact && !opts.full) {
                    activeFlags.push('--compact');
                    details.push(CliComandoDiagnosticarMessages.detalheCompact);
                }
                if (opts.listarAnalistas) {
                    activeFlags.push('--listar-analistas');
                }
                if (opts.autoFix) {
                    activeFlags.push('--auto-fix');
                    details.push(CliComandoDiagnosticarMessages.detalheAutoFix);
                }
                if (opts.autoFixConservative) {
                    activeFlags.push('--auto-fix-conservative');
                    details.push(CliComandoDiagnosticarMessages.detalheAutoFixConservative);
                }
                const includes = opts.include || [];
                const excludes = opts.exclude || [];
                if (includes.length)
                    details.push(CliComandoDiagnosticarMessages.detalheIncludePatterns(includes.length, includes.join(', ')));
                if (excludes.length)
                    details.push(CliComandoDiagnosticarMessages.detalheExcludePatterns(excludes.length, excludes.join(', ')));
                const parentExport = Boolean(parentOpts &&
                    Object.prototype.hasOwnProperty.call(parentOpts, 'export') &&
                    Boolean(parentOpts['export']));
                const parentExportFull = Boolean(parentOpts &&
                    Object.prototype.hasOwnProperty.call(parentOpts, 'exportFull') &&
                    Boolean(parentOpts['exportFull']));
                const localExport = Boolean(opts['export']);
                const localExportFull = Boolean(opts['exportFull']);
                if (parentExport || localExport) {
                    activeFlags.push('--export');
                    const relDir = (config &&
                        config['RELATORIOS_DIR']) ||
                        'relatorios';
                    details.push(CliComandoDiagnosticarMessages.detalheExport(String(relDir)));
                }
                if (parentExportFull || localExportFull) {
                    activeFlags.push('--export-full');
                    details.push(CliComandoDiagnosticarMessages.detalheExportFull);
                }
                const resolvedParentLogLevel = parentOpts &&
                    Object.prototype.hasOwnProperty.call(parentOpts, 'logLevel')
                    ? String(parentOpts['logLevel'])
                    : undefined;
                const logLevel = opts.logLevel || resolvedParentLogLevel || 'info';
                details.push(CliComandoDiagnosticarMessages.detalheLogLevel(String(logLevel)));
                details.push(CliComandoDiagnosticarMessages.dicaPrefiraLogLevelDebug);
                details.push(CliComandoDiagnosticarMessages.dicaAutoFixConservative);
                if (activeFlags.length || details.length) {
                    const header = chalk.cyan(CliComandoDiagnosticarMessages.sugestoesHeader);
                    const footer = chalk.cyan(CliComandoDiagnosticarMessages.sugestoesFooter);
                    log.info(header);
                    if (activeFlags.length)
                        log.info(chalk.yellow(`${CABECALHOS.diagnostico.flagsAtivas} `) +
                            activeFlags.join(' '));
                    else
                        log.info(chalk.gray(CliComandoDiagnosticarMessages.nenhumaFlagRelevante));
                    log.info(CliComandoDiagnosticarMessages.linhaEmBranco);
                    log.info(chalk.green(CABECALHOS.diagnostico.informacoesUteis));
                    for (const d of details)
                        log.info(CliComandoDiagnosticarMessages.detalheLinha(String(d)));
                    log.info(footer);
                }
            }
            catch {
            }
        }
        const spinner = opts.json
            ? { text: '', start: () => spinner, succeed: () => { }, fail: () => { } }
            : ora({
                text: CliComandoDiagnosticarMessages.spinnerExecutando,
                spinner: 'dots',
            }).start();
        try {
            const logWithFase = log;
            logWithFase.fase = (t) => {
                if (typeof t === 'string' && t.trim()) {
                    spinner.text = CliComandoDiagnosticarMessages.spinnerFase(t);
                }
            };
        }
        catch {
        }
        try {
            await processarDiagnostico(opts);
            spinner.succeed(CliComandoDiagnosticarMessages.spinnerConcluido);
        }
        catch (err) {
            spinner.fail(CliComandoDiagnosticarMessages.spinnerFalhou);
            throw err;
        }
    });
    return cmd;
}
//# sourceMappingURL=comando-diagnosticar.js.map