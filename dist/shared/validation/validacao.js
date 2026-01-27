import path from 'node:path';
import { ExcecoesMessages } from '../../core/messages/core/excecoes-messages.js';
export function normalizePath(p) {
    const normalized = path.normalize(p);
    const resolved = path.resolve(normalized);
    const cwd = process.cwd();
    if (!resolved.startsWith(cwd)) {
        throw new Error(ExcecoesMessages.caminhoForaDaCwdNaoPermitido(p));
    }
    return normalized;
}
export function isPathSafe(filePath) {
    try {
        const normalized = normalizePath(filePath);
        const dangerousPatterns = [
            /\.\./,
            /^\/etc\//,
            /^\/root\//,
            /^\/sys\//,
            /^\/proc\//,
            /^C:\\Windows\\/i,
            /^C:\\System32\\/i,
        ];
        return !dangerousPatterns.some((pattern) => pattern.test(normalized));
    }
    catch {
        return false;
    }
}
export function isFilenameSafe(filename) {
    if (!filename || filename.length === 0)
        return false;
    if (filename.length > 255)
        return false;
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(filename))
        return false;
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(filename))
        return false;
    return true;
}
export function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"|?*\x00-\x1f]/g, '_')
        .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i, 'file_$1$2')
        .slice(0, 255);
}
export function isRelativePathValid(relativePath) {
    if (!relativePath)
        return false;
    if (path.isAbsolute(relativePath))
        return false;
    const normalized = path.normalize(relativePath);
    return !normalized.startsWith('..');
}
export function getFileExtension(filename) {
    const ext = path.extname(filename);
    return ext.toLowerCase();
}
export function isExtensionAllowed(filename, allowedExtensions) {
    const ext = getFileExtension(filename);
    return allowedExtensions.includes(ext);
}
export function normalizarPathLocal(p) {
    return normalizePath(p);
}
export function validarNumeroPositivo(v, _nome) {
    if (typeof v === 'number' && v > 0)
        return v;
    if (typeof v === 'string') {
        const num = Number.parseFloat(v);
        if (!Number.isNaN(num) && num > 0)
            return num;
    }
    return null;
}
export function validarCombinacoes(flags) {
    const erros = [];
    if (flags.scanOnly && flags.incremental) {
        erros.push({
            codigo: 'SCAN_INCREMENTAL',
            mensagem: 'Não combinar --scan-only com --incremental (incremental exige AST).',
        });
    }
    return erros;
}
export function sanitizarFlags(flags) {
    const erros = validarCombinacoes(flags);
    if (erros.length) {
        const detalhe = erros.map((e) => `${e.codigo}: ${e.mensagem}`).join('; ');
        throw new Error(detalhe);
    }
}
//# sourceMappingURL=validacao.js.map