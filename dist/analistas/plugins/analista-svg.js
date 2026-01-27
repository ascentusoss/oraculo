import { AnalystOrigins, AnalystTypes, SeverityLevels, SvgMessages, } from '../../core/messages/core/plugin-messages.js';
import { otimizarSvgLikeSvgo, shouldSugerirOtimizacaoSvg, } from '../../shared/impar/svgs.js';
import { criarAnalista, criarOcorrencia } from '../../types/index.js';
const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_SVG === '1';
function findLine(src, index = 0) {
    const safeIndex = Math.max(0, index);
    let line = 1;
    for (let i = 0; i < safeIndex && i < src.length; i++) {
        if (src.charCodeAt(i) === 10)
            line++;
    }
    return line;
}
function findFirstMatchLine(src, re, fallbackLine = 1) {
    const idx = src.search(re);
    if (idx < 0)
        return fallbackLine;
    return findLine(src, idx);
}
function msg(message, relPath, nivel = SeverityLevels.warning, line = 1) {
    return criarOcorrencia({
        relPath,
        mensagem: message,
        linha: line,
        nivel,
        origem: AnalystOrigins.svg,
        tipo: AnalystTypes.svg,
    });
}
export const analistaSvg = criarAnalista({
    nome: 'analista-svg',
    categoria: 'assets',
    descricao: 'Heurísticas para SVG + sugestão de otimização (modo Oráculo).',
    global: false,
    test: (relPath) => /\.svg$/i.test(relPath),
    aplicar: async (src, relPath) => {
        if (disableEnv)
            return null;
        const ocorrencias = [];
        if (!/<svg\b/i.test(src)) {
            ocorrencias.push(msg(SvgMessages.naoPareceSvg, relPath, SeverityLevels.warning, 1));
            return ocorrencias;
        }
        const idxSvg = src.search(/<svg\b/i);
        const linhaSvg = idxSvg >= 0 ? findLine(src, idxSvg) : 1;
        const opt = otimizarSvgLikeSvgo({ svg: src });
        for (const w of opt.warnings) {
            if (w === 'script-inline') {
                const line = findFirstMatchLine(src, /<script\b/i, linhaSvg);
                ocorrencias.push(msg(SvgMessages.scriptInline, relPath, SeverityLevels.error, line));
            }
            else if (w === 'evento-inline') {
                const line = findFirstMatchLine(src, /\son\w+\s*=\s*['"]/i, linhaSvg);
                ocorrencias.push(msg(SvgMessages.eventoInline, relPath, SeverityLevels.warning, line));
            }
            else if (w === 'javascript-url') {
                const line = findFirstMatchLine(src, /javascript:\s*/i, linhaSvg);
                ocorrencias.push(msg(SvgMessages.javascriptUrl, relPath, SeverityLevels.error, line));
            }
        }
        if (!/\bviewBox\s*=\s*['"][^'"]+['"]/i.test(src)) {
            ocorrencias.push(msg(SvgMessages.semViewBox, relPath, SeverityLevels.info, linhaSvg));
        }
        if (opt.changed &&
            opt.originalBytes > opt.optimizedBytes &&
            shouldSugerirOtimizacaoSvg(opt.originalBytes, opt.optimizedBytes)) {
            ocorrencias.push(msg(SvgMessages.podeOtimizar(opt.originalBytes, opt.optimizedBytes, opt.mudancas), relPath, SeverityLevels.info, linhaSvg));
        }
        return ocorrencias.length ? ocorrencias : null;
    },
});
export default analistaSvg;
//# sourceMappingURL=analista-svg.js.map