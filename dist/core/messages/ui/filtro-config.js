import { ICONES_ARQUIVO, ICONES_DIAGNOSTICO, ICONES_FEEDBACK, } from './icons.js';
export const PRIORIDADES = {
    PROBLEMA_SEGURANCA: {
        prioridade: 'critica',
        icone: '[LOCK]',
        descricao: 'Vulnerabilidade de segurança detectada',
    },
    VULNERABILIDADE_SEGURANCA: {
        prioridade: 'critica',
        icone: '[ERRO]',
        descricao: 'Falha de segurança grave',
    },
    CREDENCIAIS_EXPOSTAS: {
        prioridade: 'critica',
        icone: '[LOCK]',
        descricao: 'Credenciais hardcoded ou expostas',
    },
    CODIGO_FRAGIL: {
        prioridade: 'alta',
        icone: '[AVISO]',
        descricao: 'Código suscetível a falhas',
    },
    'tipo-inseguro-any': {
        prioridade: 'alta',
        icone: '[HIGH]',
        descricao: 'Uso de tipo any que pode ser substituído',
    },
    'tipo-inseguro-unknown': {
        prioridade: 'media',
        icone: '[WARN]',
        descricao: 'Uso de tipo unknown que pode ser específico',
    },
    PROBLEMA_TESTE: {
        prioridade: 'alta',
        icone: '[TEST]',
        descricao: 'Problemas com testes',
    },
    'estrutura-suspeita': {
        prioridade: 'alta',
        icone: '[SCAN]',
        descricao: 'Estrutura de código suspeita',
    },
    COMPLEXIDADE_ALTA: {
        prioridade: 'alta',
        icone: '[STATS]',
        descricao: 'Complexidade ciclomática alta',
    },
    PROBLEMA_DOCUMENTACAO: {
        prioridade: 'media',
        icone: '[DOC]',
        descricao: 'Documentação ausente ou inadequada',
    },
    'padrao-ausente': {
        prioridade: 'media',
        icone: '[GOAL]',
        descricao: 'Padrão recomendado ausente',
    },
    'estrutura-config': {
        prioridade: 'media',
        icone: '[CONFIG]',
        descricao: 'Problemas de configuração',
    },
    'estrutura-entrypoints': {
        prioridade: 'media',
        icone: '[ENTRY]',
        descricao: 'Entrypoints mal definidos',
    },
    ANALISE_ARQUITETURA: {
        prioridade: 'media',
        icone: '[BUILD]',
        descricao: 'Análise arquitetural',
    },
    CONSTRUCOES_SINTATICAS: {
        prioridade: 'baixa',
        icone: '[SYNTAX]',
        descricao: 'Padrões sintáticos detectados',
    },
    CARACTERISTICAS_ARQUITETURA: {
        prioridade: 'baixa',
        icone: '[ARCH]',
        descricao: 'Características arquiteturais',
    },
    METRICAS_ARQUITETURA: {
        prioridade: 'baixa',
        icone: '[SIZE]',
        descricao: 'Métricas arquiteturais',
    },
    TODO_PENDENTE: {
        prioridade: 'baixa',
        icone: ICONES_FEEDBACK.dica,
        descricao: 'TODOs e tarefas pendentes',
    },
    IDENTIFICACAO_PROJETO: {
        prioridade: 'baixa',
        icone: '[TAG]',
        descricao: 'Identificação do tipo de projeto',
    },
    SUGESTAO_MELHORIA: {
        prioridade: 'baixa',
        icone: '[DICA]',
        descricao: 'Sugestão de melhoria',
    },
    EVIDENCIA_CONTEXTO: {
        prioridade: 'baixa',
        icone: '[SCAN]',
        descricao: 'Evidência de contexto',
    },
    TECNOLOGIAS_ALTERNATIVAS: {
        prioridade: 'baixa',
        icone: '[ALT]',
        descricao: 'Tecnologias alternativas sugeridas',
    },
};
export const AGRUPAMENTOS_MENSAGEM = [
    {
        padrao: /token hardcoded|senha hardcoded|chave hardcoded|api.*key.*hardcoded/i,
        categoria: 'SEGURANCA_HARDCODED',
        titulo: 'Credenciais Hardcoded Detectadas',
        prioridade: 'critica',
        icone: ICONES_ARQUIVO.lock,
        acaoSugerida: 'Mover credenciais para variáveis de ambiente (.env)',
    },
    {
        padrao: /sql.*injection|xss|csrf|path.*traversal|command.*injection/i,
        categoria: 'VULNERABILIDADES_WEB',
        titulo: 'Vulnerabilidades Web Detectadas',
        prioridade: 'critica',
        icone: '[ERRO]',
        acaoSugerida: 'Aplicar sanitização e validação de entrada',
    },
    {
        padrao: /tipo.*inseguro.*any|any.*inseguro|unsafe.*any/i,
        categoria: 'TIPOS_ANY_INSEGUROS',
        titulo: 'Tipos Any Inseguros Detectados',
        prioridade: 'alta',
        icone: '[HIGH]',
        acaoSugerida: 'Substituir any por tipos específicos para melhorar type safety',
    },
    {
        padrao: /tipo.*inseguro.*unknown|unknown.*inseguro|unsafe.*unknown/i,
        categoria: 'TIPOS_UNKNOWN_GENERICOS',
        titulo: 'Tipos Unknown Genéricos',
        prioridade: 'media',
        icone: '[WARN]',
        acaoSugerida: 'Adicionar type guards ou substituir por tipos específicos',
    },
    {
        padrao: /missing-tests|missing tests|sem testes|no.*tests/i,
        categoria: 'TESTES_AUSENTES',
        titulo: 'Arquivos Sem Testes',
        prioridade: 'alta',
        icone: '[TEST]',
        acaoSugerida: 'Implementar testes unitários para melhorar cobertura',
    },
    {
        padrao: /complexidade.*alta|complex.*high|cyclomatic.*complexity/i,
        categoria: 'COMPLEXIDADE_ALTA',
        titulo: 'Código com Alta Complexidade',
        prioridade: 'alta',
        icone: '[STATS]',
        acaoSugerida: 'Refatorar em funções menores para melhorar legibilidade',
    },
    {
        padrao: /acoplamento.*alto|coupling.*high|tight.*coupling/i,
        categoria: 'ACOPLAMENTO_ALTO',
        titulo: 'Alto Acoplamento Entre Módulos',
        prioridade: 'alta',
        icone: '[LINK]',
        acaoSugerida: 'Revisar dependências e aplicar padrões de desacoplamento',
    },
    {
        padrao: /missing-jsdoc|missing documentation|sem documentação|no.*documentation/i,
        categoria: 'DOCUMENTACAO_AUSENTE',
        titulo: 'Documentação Ausente',
        prioridade: 'media',
        icone: '[DOC]',
        acaoSugerida: 'Adicionar JSDoc/comentários para melhorar manutenibilidade',
    },
    {
        padrao: /console\.log|console-log|debug.*statement/i,
        categoria: 'CONSOLE_LOGS',
        titulo: 'Console.log em Código de Produção',
        prioridade: 'media',
        icone: '[LOG]',
        acaoSugerida: 'Remover ou substituir por sistema de logging adequado',
    },
    {
        padrao: /código.*duplicado|duplicate.*code|copy.*paste/i,
        categoria: 'DUPLICACAO_CODIGO',
        titulo: 'Código Duplicado Detectado',
        prioridade: 'media',
        icone: '[COPY]',
        acaoSugerida: 'Extrair para funções/módulos reutilizáveis',
    },
    {
        padrao: /função.*longa|long.*function|function.*too.*large/i,
        categoria: 'FUNCOES_LONGAS',
        titulo: 'Funções Muito Longas',
        prioridade: 'media',
        icone: '[SIZE]',
        acaoSugerida: 'Dividir em funções menores e mais coesas',
    },
    {
        padrao: /todo|fixme|hack|workaround/i,
        categoria: 'TAREFAS_PENDENTES',
        titulo: 'Tarefas Pendentes no Código',
        prioridade: 'baixa',
        icone: ICONES_FEEDBACK.dica,
        acaoSugerida: 'Revisar e resolver TODOs/FIXMEs pendentes',
    },
    {
        padrao: /magic.*number|número.*mágico/i,
        categoria: 'NUMEROS_MAGICOS',
        titulo: 'Números Mágicos no Código',
        prioridade: 'baixa',
        icone: ICONES_DIAGNOSTICO.stats,
        acaoSugerida: 'Substituir por constantes nomeadas',
    },
];
export function getPrioridade(tipo) {
    return (PRIORIDADES[tipo] || {
        prioridade: 'baixa',
        icone: ICONES_ARQUIVO.arquivo,
        descricao: 'Problema não categorizado',
    });
}
export function findAgrupamento(mensagem) {
    for (const grupo of AGRUPAMENTOS_MENSAGEM) {
        if (grupo.padrao.test(mensagem)) {
            return grupo;
        }
    }
    return null;
}
export function ordenarPorPrioridade(problemas) {
    const ordem = {
        critica: 0,
        alta: 1,
        media: 2,
        baixa: 3,
    };
    return [...problemas].sort((a, b) => {
        const prioA = a.prioridade || 'baixa';
        const prioB = b.prioridade || 'baixa';
        return ordem[prioA] - ordem[prioB];
    });
}
export function contarPorPrioridade(problemas) {
    const contagem = {
        critica: 0,
        alta: 0,
        media: 0,
        baixa: 0,
    };
    for (const prob of problemas) {
        const prio = prob.prioridade || 'baixa';
        contagem[prio]++;
    }
    return contagem;
}
//# sourceMappingURL=filtro-config.js.map