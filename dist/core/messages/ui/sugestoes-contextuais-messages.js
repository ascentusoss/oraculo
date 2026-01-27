import { ICONES_ACAO, ICONES_ARQUIVO, ICONES_FEEDBACK } from './icons.js';
export const SugestoesContextuaisMessages = {
    arquetipoNaoIdentificado: 'Não foi possível identificar um arquétipo específico. Considere adicionar mais estrutura ao projeto.',
    projetoIdentificado: (tecnologia, confiancaPercent) => `${ICONES_FEEDBACK.info} Projeto identificado como: ${tecnologia} (confiança: ${confiancaPercent}%)`,
    evidenciaDependencia: (dependencia, tecnologia) => `${ICONES_ARQUIVO.package} Dependência ${dependencia} confirma projeto ${tecnologia}`,
    evidenciaImport: (valor, localizacao) => `${ICONES_ACAO.import} Import ${valor} detectado em ${localizacao}`,
    evidenciaCodigo: (localizacao) => `${ICONES_ARQUIVO.codigo} Padrão de código específico detectado em ${localizacao}`,
    evidenciaEstrutura: (valor, tecnologia) => `${ICONES_ARQUIVO.diretorio} Estrutura ${valor} típica de ${tecnologia}`,
    tecnologiasAlternativas: (alternativas) => `${ICONES_ACAO.analise} Outras tecnologias detectadas: ${alternativas}`,
    erroAnaliseContextual: (erro) => `Erro na análise contextual: ${erro}`,
    erroDuranteAnalise: 'Erro durante análise contextual inteligente',
};
//# sourceMappingURL=sugestoes-contextuais-messages.js.map