import { AnalystOrigins, AnalystTypes, PythonMessages, SeverityLevels, } from '../../core/messages/core/plugin-messages.js';
import { createLineLookup } from '../../shared/helpers/line-lookup.js';
import { maskPythonComments, maskPythonStringsAndComments, } from '../../shared/helpers/masking.js';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_PYTHON === '1';
function isPythonFile(relPath) {
    return /\.(py|pyx|pyi)$/i.test(relPath);
}
function warn(message, relPath, line, nivel = SeverityLevels.warning) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel,
        origem: AnalystOrigins.python,
        tipo: AnalystTypes.python,
    });
}
function collectPythonIssues(src, relPath) {
    const ocorrencias = [];
    const lineOf = createLineLookup(src).lineAt;
    const scan = maskPythonStringsAndComments(src);
    const scanNoComments = maskPythonComments(src);
    for (const match of scan.matchAll(/^\s*(?:async\s+)?def\s+([a-z_][a-z0-9_]*)\s*\((.*?)\)(?!\s*->)/gm)) {
        const funcName = match[1] || '';
        const line = lineOf(match.index);
        if (/^__|main|__init__|setUp|tearDown|get_|set_/.test(funcName))
            continue;
        ocorrencias.push(warn(PythonMessages.missingTypeHints, relPath, line));
    }
    for (const match of scan.matchAll(/^\s*print\s*\(/gm)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.printInsteadOfLog, relPath, line));
    }
    for (const match of scan.matchAll(/\beval\s*\(/gi)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.evalUsage, relPath, line, SeverityLevels.error));
    }
    for (const match of scan.matchAll(/\bexec\s*\(/gi)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.execUsage, relPath, line, SeverityLevels.error));
    }
    for (const match of scan.matchAll(/\bsubprocess\.(?:run|Popen|call|check_call|check_output)\s*\([\s\S]*?\)/g)) {
        if (!/\bshell\s*=\s*True\b/.test(match[0]))
            continue;
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.subprocessShellTrue, relPath, line, SeverityLevels.error));
    }
    for (const match of scan.matchAll(/\bpickle\.(?:load|loads)\s*\(/gi)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.pickleUsage, relPath, line, SeverityLevels.error));
    }
    for (const match of scan.matchAll(/\byaml\.load\s*\([\s\S]*?\)/gi)) {
        const text = match[0] ?? '';
        const hasSafeLoader = /\bLoader\s*=\s*yaml\.(?:SafeLoader|CSafeLoader)\b/.test(text);
        const hasFullLoader = /\bLoader\s*=\s*yaml\.(?:FullLoader|CFullLoader)\b/.test(text);
        const hasExplicitLoader = /\bLoader\s*=/.test(text);
        if (hasSafeLoader)
            continue;
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.yamlUnsafeLoad, relPath, line, hasFullLoader || hasExplicitLoader
            ? SeverityLevels.warning
            : SeverityLevels.error));
    }
    for (const match of scanNoComments.matchAll(/(?:requests|urllib)\.(?:get|post|request)\s*\([^)]*\)/g)) {
        const hasVerify = /verify\s*=/i.test(match[0]);
        if (!hasVerify && /http:\/\//i.test(match[0])) {
            const line = lineOf(match.index);
            ocorrencias.push(warn(PythonMessages.httpWithoutVerify, relPath, line));
        }
    }
    for (const match of scanNoComments.matchAll(/\b(?:execute|executemany|executescript)\s*\(\s*f(['"])(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*?\1/gi)) {
        const text = match[0] ?? '';
        if (!/\{[^}]+\}/.test(text))
            continue;
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.sqlInjection, relPath, line, SeverityLevels.error));
    }
    for (const match of scan.matchAll(/^\s*except\s*:\s*$/gm)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.broadExcept, relPath, line));
    }
    for (const match of scan.matchAll(/except\s+\w+\s*(?:as\s+\w+)?\s*:\s*pass/g)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.passInExcept, relPath, line));
    }
    for (const match of scan.matchAll(/except\s+\w+\s*(?:as\s+\w+)?\s*:\s*\n\s*raise\s*\n/gm)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.bareRaise, relPath, line));
    }
    for (const match of scan.matchAll(/^\s*global\s+\w+/gm)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.globalKeyword, relPath, line));
    }
    for (const match of scan.matchAll(/def\s+\w+\s*\([^)]*=\s*(?:\[|\{)[^\]}]*(?:\]|\})/g)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.mutableDefault, relPath, line));
    }
    for (const match of scan.matchAll(/for\s+\w+\s+in\s+\w+:\s*\n\s*(\w+)\.append\s*\(/g)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.listComprehensionOpportunity, relPath, line, SeverityLevels.suggestion));
    }
    for (const match of scan.matchAll(/for\s+\w+\s+in\s+(\w+):\s*\n\s*(?:value|val)\s*=\s*\1\[/gm)) {
        const line = lineOf(match.index);
        ocorrencias.push(warn(PythonMessages.loopingOverDict, relPath, line, SeverityLevels.suggestion));
    }
    return ocorrencias;
}
export const analistaPython = criarAnalista({
    nome: 'analista-python',
    categoria: 'framework',
    descricao: 'Heurísticas leves para Python (boas práticas e segurança).',
    global: false,
    test: (relPath) => isPythonFile(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        if (relPath.includes('src/analistas/plugins/analista-python.ts'))
            return null;
        const msgs = collectPythonIssues(src, relPath);
        return msgs.length ? msgs : null;
    },
});
export default analistaPython;
//# sourceMappingURL=analista-python.js.map