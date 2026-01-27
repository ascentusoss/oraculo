import chalk from '../../config/chalk-safe.js';
import { config } from '../../config/config.js';
import { isJsonMode } from '../../../shared/helpers/json-mode.js';
export { config } from '../../config/config.js';
export const LOG_SIMBOLOS = {
    info: '[INFO]',
    sucesso: '[OK]',
    erro: '[ERRO]',
    aviso: '[AVISO]',
    debug: '[DEBUG]',
    fase: '[>]',
    passo: '[*]',
    scan: '[SCAN]',
    guardian: '[GUARD]',
    pasta: '[DIR]',
};
function shouldSilence() {
    if (isJsonMode())
        return true;
    if (process.env.ORACULO_FORCE_SILENT_JSON === '1')
        return true;
    return config.REPORT_SILENCE_LOGS;
}
function shouldSuppressParcial(msg) {
    try {
        if (!config.SUPPRESS_PARCIAL_LOGS &&
            process.env.ORACULO_SUPPRESS_PARCIAL !== '1')
            return false;
        if (!msg || typeof msg !== 'string')
            return false;
        return /parcial/i.test(msg);
    }
    catch {
        return false;
    }
}
function isDebugMode() {
    return config.DEV_MODE || process.env.ORACULO_DEBUG === 'true';
}
function shouldLogLevel(nivel) {
    const niveis = ['erro', 'aviso', 'info', 'debug'];
    const nivelAtual = niveis.indexOf(config.LOG_LEVEL);
    const nivelMensagem = niveis.indexOf(nivel);
    if (nivel === 'erro' || nivel === 'sucesso')
        return true;
    if (nivel === 'debug')
        return isDebugMode() || config.LOG_LEVEL === 'debug';
    return nivelMensagem <= nivelAtual;
}
function getTimestamp() {
    const now = new Date().toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return `[${now}]`;
}
function stripLeadingSimbolos(msg) {
    if (!msg)
        return msg;
    const ansiRegex = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    let plain = msg.replace(ansiRegex, '');
    plain = plain.replace(/^\s+/, '');
    const extras = [];
    const candidatos = Array.from(new Set([...Object.values(LOG_SIMBOLOS), ...extras])).filter(Boolean);
    let mudou = true;
    while (mudou) {
        mudou = false;
        const trimmed = plain.trimStart();
        for (const s of candidatos) {
            if (trimmed.startsWith(s)) {
                plain = trimmed.slice(s.length);
                mudou = true;
                break;
            }
        }
    }
    return plain.trimStart();
}
export function formatarLinha({ nivel, mensagem, sanitize = true, }) {
    const ts = getTimestamp();
    const colNivelRaw = nivel.toUpperCase().padEnd(7);
    const hasBold = (v) => !!v && typeof v.bold === 'function';
    const resolveStyle = (v) => {
        if (typeof v === 'function')
            return v;
        if (hasBold(v))
            return v.bold;
        return (s) => String(s);
    };
    let cor = (s) => s;
    switch (nivel) {
        case 'info':
            cor = resolveStyle(chalk.cyan);
            break;
        case 'sucesso':
            cor = resolveStyle(chalk.green);
            break;
        case 'erro':
            cor = resolveStyle(chalk.red);
            break;
        case 'aviso':
            cor = resolveStyle(chalk.yellow);
            break;
        case 'debug':
            cor = resolveStyle(chalk.magenta);
            break;
    }
    const boldFn = resolveStyle(chalk.bold);
    const colNivel = boldFn(colNivelRaw);
    const corpo = sanitize ? stripLeadingSimbolos(mensagem) : mensagem;
    const corpoFmt = nivel === 'info' || nivel === 'debug' ? corpo : cor(corpo);
    const grayFn = typeof chalk.gray === 'function' ? chalk.gray : (s) => String(s);
    const linha = `${grayFn(ts)} ${colNivel} ${corpoFmt}`;
    if (!process.env.VITEST && process.env.ORACULO_CENTER === '1') {
        try {
            const cols = obterColunasTerm();
            const out = process.stdout &&
                typeof process.stdout.isTTY !== 'undefined'
                ? process.stdout
                : undefined;
            const isTty = !!out && out.isTTY !== false;
            if (isTty && cols && cols > 0) {
                const ANSI_REGEX = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
                const visLen = (s) => (s || '').replace(ANSI_REGEX, '').length;
                const pad = Math.floor(Math.max(0, cols - visLen(linha)) / 2);
                if (pad > 0)
                    return ' '.repeat(pad) + linha;
            }
        }
        catch {
        }
    }
    return linha;
}
function obterColunasTerm() {
    try {
        const out = process.stdout &&
            typeof process.stdout.columns !== 'undefined'
            ? process.stdout
            : undefined;
        const cols = out?.columns;
        if (typeof cols === 'number' && cols > 0)
            return cols;
    }
    catch { }
    const envOverride = Number(process.env.ORACULO_FRAME_MAX_COLS || '0');
    if (Number.isFinite(envOverride) && envOverride > 0)
        return envOverride;
    const envCols = Number(process.env.COLUMNS || process.env.TERM_COLUMNS || '0');
    return Number.isFinite(envCols) && envCols > 0 ? envCols : undefined;
}
function calcularLarguraInterna(titulo, linhas, larguraMax) {
    const ANSI_REGEX = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    const visLen = (s) => (s || '').replace(ANSI_REGEX, '').length;
    const desejada = Math.min(100, Math.max(visLen(titulo) + 4, ...linhas.map((l) => visLen(l) + 4), 20));
    const preferida = typeof larguraMax === 'number'
        ? Math.max(20, Math.min(larguraMax, 120))
        : desejada;
    const cols = obterColunasTerm();
    const tetoTela = typeof cols === 'number' && cols > 0
        ? Math.max(20, Math.min(cols, 120))
        : 120;
    const width = Math.max(20, Math.min(preferida, tetoTela));
    const barraLen = Math.max(10, width - 2);
    const maxInner = barraLen - 1;
    return { width, maxInner, visLen, ANSI_REGEX };
}
export function formatarBloco(titulo, linhas, corTitulo = typeof chalk.bold === 'function'
    ? chalk.bold
    : (s) => String(s), larguraMax) {
    const { width, maxInner, visLen, ANSI_REGEX } = calcularLarguraInterna(titulo, linhas, larguraMax);
    const padEndVisible = (s, target) => {
        const diff = target - visLen(s);
        return diff > 0 ? s + ' '.repeat(diff) : s;
    };
    const truncateVisible = (s, max) => {
        if (visLen(s) <= max)
            return s;
        let out = '';
        let count = 0;
        let i = 0;
        while (i < s.length && count < max - 1) {
            const ch = s[i];
            if (ch === '\u001B' || ch === '\u009B') {
                const m = s.slice(i).match(ANSI_REGEX);
                if (m && m.index === 0) {
                    out += m[0];
                    i += m[0].length;
                    continue;
                }
            }
            out += ch;
            i++;
            count++;
        }
        return `${out}…`;
    };
    const barra = '─'.repeat(Math.max(10, width - 2));
    const topo = `┌${barra}┐`;
    const base = `└${barra}┘`;
    const normalizar = (s) => truncateVisible(s, maxInner);
    const corpo = linhas
        .map((l) => `│ ${padEndVisible(normalizar(l), maxInner)}│`)
        .join('\n');
    const headTxt = `│ ${padEndVisible(normalizar(titulo), maxInner)}│`;
    const corTituloFn = typeof corTitulo === 'function' ? corTitulo : (s) => String(s);
    const gray = typeof chalk.gray === 'function' ? chalk.gray : (x) => String(x);
    return [gray(topo), corTituloFn(headTxt), gray(corpo), gray(base)]
        .filter(Boolean)
        .join('\n');
}
function deveUsarAsciiFrames() {
    return process.env.ORACULO_ASCII_FRAMES === '1';
}
function converterMolduraParaAscii(bloco) {
    return bloco
        .replaceAll('┌', '+')
        .replaceAll('┐', '+')
        .replaceAll('└', '+')
        .replaceAll('┘', '+')
        .replaceAll('─', '-')
        .replaceAll('│', '|');
}
export function fase(titulo) {
    if (shouldSilence())
        return;
    if (!shouldLogLevel('info'))
        return;
    const bold = typeof chalk.bold === 'function' ? chalk.bold : (s) => String(s);
    const cyan = typeof chalk.cyan === 'function' ? chalk.cyan : (s) => String(s);
    console.log(formatarLinha({
        nivel: 'info',
        mensagem: bold(cyan(`${LOG_SIMBOLOS.fase} ${titulo}`)),
        sanitize: false,
    }));
}
export function passo(descricao) {
    if (shouldSilence())
        return;
    if (!shouldLogLevel('info'))
        return;
    console.log(formatarLinha({
        nivel: 'info',
        mensagem: `${LOG_SIMBOLOS.passo} ${descricao}`,
        sanitize: false,
    }));
}
export const log = {
    info(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        if (!shouldLogLevel('info'))
            return;
        console.log(formatarLinha({ nivel: 'info', mensagem: msg }));
    },
    infoSemSanitizar(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        if (!shouldLogLevel('info'))
            return;
        console.log(formatarLinha({ nivel: 'info', mensagem: msg, sanitize: false }));
    },
    infoDestaque(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        if (!shouldLogLevel('info'))
            return;
        const bold = typeof chalk.bold === 'function' ? chalk.bold : (s) => String(s);
        const cyan = typeof chalk.cyan === 'function' ? chalk.cyan : (s) => String(s);
        console.log(formatarLinha({
            nivel: 'info',
            mensagem: bold(cyan(msg)),
            sanitize: false,
        }));
    },
    sucesso(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        if (!shouldLogLevel('sucesso'))
            return;
        console.log(formatarLinha({ nivel: 'sucesso', mensagem: msg }));
    },
    erro(msg) {
        console.error(formatarLinha({ nivel: 'erro', mensagem: msg }));
    },
    aviso(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        if (!shouldLogLevel('aviso'))
            return;
        console.log(formatarLinha({ nivel: 'aviso', mensagem: msg }));
    },
    debug(msg) {
        if (!shouldLogLevel('debug'))
            return;
        if (shouldSuppressParcial(msg))
            return;
        console.log(formatarLinha({ nivel: 'debug', mensagem: msg }));
    },
    fase,
    passo,
    bloco: formatarBloco,
    calcularLargura(titulo, linhas, larguraMax) {
        return calcularLarguraInterna(titulo, linhas, larguraMax).width;
    },
    imprimirBloco(titulo, linhas, corTitulo = typeof chalk.bold === 'function'
        ? chalk.bold
        : (s) => String(s), larguraMax) {
        if (shouldSilence())
            return;
        if (config.SUPPRESS_PARCIAL_LOGS) {
            if (shouldSuppressParcial(titulo))
                return;
            for (const l of linhas)
                if (shouldSuppressParcial(l))
                    return;
        }
        const bloco = formatarBloco(titulo, linhas, corTitulo, larguraMax);
        const out = deveUsarAsciiFrames()
            ? converterMolduraParaAscii(bloco)
            : bloco;
        if (!process.env.VITEST && process.env.ORACULO_CENTER === '1') {
            try {
                const lines = out.split('\n');
                if (!lines.length) {
                    return;
                }
                const ANSI_REGEX = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
                const visibleLen = (s) => s.replace(ANSI_REGEX, '').length;
                const frameWidth = Math.max(...lines.map((l) => visibleLen(l)));
                const cols = obterColunasTerm() || 0;
                const outStream = process.stdout &&
                    typeof process.stdout.isTTY !== 'undefined'
                    ? process.stdout
                    : undefined;
                const isTty = !!outStream && outStream.isTTY !== false;
                if (isTty) {
                    const pad = Math.floor(Math.max(0, cols - frameWidth) / 2);
                    if (pad > 0) {
                        const pref = ' '.repeat(pad);
                        console.log(lines.map((l) => pref + l).join('\n'));
                        return;
                    }
                }
            }
            catch {
            }
        }
    },
};
//# sourceMappingURL=log.js.map