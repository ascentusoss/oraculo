import { AnalystOrigins, AnalystTypes, FormatadorMessages, SeverityLevels, } from '../../core/messages/core/plugin-messages.js';
import { formatarPrettierMinimo } from '../../shared/impar/formater.js';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_FORMATADOR === '1';
function msg(message, relPath, nivel = SeverityLevels.warning, line = 1) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel,
        origem: AnalystOrigins.formatador,
        tipo: AnalystTypes.formatador,
    });
}
function normalizarEol(code) {
    return code.replace(/\r\n?/g, '\n');
}
function primeiraLinhaDiferente(a, b) {
    const aLines = normalizarEol(a).split('\n');
    const bLines = normalizarEol(b).split('\n');
    const len = Math.max(aLines.length, bLines.length);
    for (let i = 0; i < len; i++) {
        if ((aLines[i] ?? '') !== (bLines[i] ?? ''))
            return i + 1;
    }
    return 1;
}
export const analistaFormatador = criarAnalista({
    nome: 'analista-formatador',
    categoria: 'formatacao',
    descricao: 'Verifica formatação mínima interna do Oráculo (JSON/Markdown/YAML).',
    global: false,
    test: (relPath) => /\.(json|md|markdown|ya?ml)$/i.test(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        const res = formatarPrettierMinimo({ code: src, relPath });
        if (!res.ok) {
            return [
                msg(FormatadorMessages.parseErro(res.parser, res.error), relPath, SeverityLevels.error, 1),
            ];
        }
        if (!res.changed)
            return null;
        const linha = primeiraLinhaDiferente(src, res.formatted);
        const detalhes = [
            `primeira diferença na linha ${linha}`,
            res.reason ? `motivo: ${res.reason}` : null,
        ]
            .filter(Boolean)
            .join(', ');
        return [
            msg(FormatadorMessages.naoFormatado(res.parser, detalhes || undefined), relPath, SeverityLevels.warning, linha),
        ];
    },
});
export default analistaFormatador;
//# sourceMappingURL=analista-formater.js.map