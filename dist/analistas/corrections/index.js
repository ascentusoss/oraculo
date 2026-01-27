import { analistaPontuacao, analistaQuickFixes, } from '../corrections/analista-pontuacao.js';
export const analistaCorrecaoAutomatica = {
    nome: 'correcoes-automaticas',
    categoria: 'melhorias',
    descricao: 'Agrega técnicas de correções automáticas (quick-fixes e correções de pontuação)',
    test: (relPath) => {
        const quickFixesApplies = typeof analistaQuickFixes.test === 'function'
            ? analistaQuickFixes.test(relPath)
            : false;
        const pontuacaoApplies = typeof analistaPontuacao.test === 'function'
            ? analistaPontuacao.test(relPath)
            : false;
        return Boolean(quickFixesApplies || pontuacaoApplies);
    },
    aplicar: (src, relPath, ast) => {
        const ocorrencias = [];
        if (typeof analistaQuickFixes.aplicar === 'function') {
            ocorrencias.push(...analistaQuickFixes.aplicar(src, relPath, ast));
        }
        if (typeof analistaPontuacao.aplicar === 'function') {
            ocorrencias.push(...analistaPontuacao.aplicar(src, relPath, ast));
        }
        return ocorrencias;
    },
};
export default analistaCorrecaoAutomatica;
//# sourceMappingURL=index.js.map