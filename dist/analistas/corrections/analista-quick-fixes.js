import { findQuickFixes, } from '../../core/config/auto/fix-config.js';
import { criarOcorrencia } from '../../types/index.js';
export const analistaQuickFixes = {
    nome: 'quick-fixes',
    categoria: 'melhorias',
    descricao: 'Detecta problemas comuns e oferece correções automáticas',
    test: (relPath) => {
        return /\.(js|jsx|ts|tsx|mjs|cjs|svg)$/.test(relPath);
    },
    aplicar: (src, relPath, _ast) => {
        if (!src)
            return [];
        const ocorrencias = [];
        const quickFixes = findQuickFixes(src, undefined, undefined, relPath);
        const problemaTypes = [
            'unhandled-async',
            'console-log',
            'memory-leak',
            'dangerous-html',
            'eval-usage',
            'complex-regex',
        ];
        for (const problemType of problemaTypes) {
            const specificFixes = findQuickFixes(src, problemType, undefined, relPath);
            quickFixes.push(...specificFixes);
        }
        const uniqueFixes = quickFixes.filter((fix, index, arr) => arr.findIndex((f) => f.id === fix.id) === index);
        for (const fixResult of uniqueFixes) {
            for (const match of fixResult.matches) {
                const beforeMatch = src.substring(0, match.index || 0);
                const linha = beforeMatch.split('\n').length;
                const previewFix = fixResult.fix(match, src);
                const originalLine = src.split('\n')[linha - 1] || '';
                const fixedLine = previewFix.split('\n')[linha - 1] || '';
                const sugestao = [
                    fixResult.description,
                    '',
                    `🔧 Correção sugerida:`,
                    `❌ Antes: ${originalLine.trim()}`,
                    `✅ Depois: ${fixedLine.trim()}`,
                    '',
                    `Confiança: ${fixResult.confidence}%`,
                    `Categoria: ${fixResult.category}`,
                    `ID do Fix: ${fixResult.id}`,
                ].join('\n');
                const nivel = mapearCategoriaNivel(fixResult.category);
                const ocorrencia = criarOcorrencia({
                    tipo: 'auto-fix-disponivel',
                    nivel,
                    mensagem: `${fixResult.title}`,
                    relPath,
                    linha,
                });
                const ocorrenciaGenerica = ocorrencia;
                ocorrenciaGenerica.sugestao = sugestao;
                ocorrenciaGenerica.quickFixId = fixResult.id;
                ocorrenciaGenerica.confidence = fixResult.confidence;
                ocorrenciaGenerica.category = fixResult.category;
                ocorrenciaGenerica.matchIndex = match.index;
                ocorrenciaGenerica.matchLength = match[0].length;
                ocorrencias.push(ocorrencia);
            }
        }
        return ocorrencias;
    },
};
function mapearCategoriaNivel(category) {
    switch (category) {
        case 'security':
            return 'erro';
        case 'performance':
            return 'aviso';
        case 'style':
        case 'documentation':
            return 'info';
        default:
            return 'info';
    }
}
//# sourceMappingURL=analista-quick-fixes.js.map