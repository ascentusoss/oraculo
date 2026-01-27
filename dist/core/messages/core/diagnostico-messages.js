export const ICONES_DIAGNOSTICO = {
    inicio: '[SCAN]',
    progresso: '[...]',
    arquivos: '[DIR]',
    analise: '[SCAN]',
    arquetipos: '[ARQ]',
    guardian: '[GUARD]',
    autoFix: '[FIX]',
    export: '[EXP]',
    sucesso: '[OK]',
    aviso: '[AVISO]',
    erro: '[ERRO]',
    info: '[i]',
    dica: '[DICA]',
    executive: '[STATS]',
    rapido: '[FAST]',
};
export const MENSAGENS_INICIO = {
    compact: `${ICONES_DIAGNOSTICO.inicio} Diagnóstico (modo compacto)`,
    full: `${ICONES_DIAGNOSTICO.inicio} Iniciando diagnóstico completo`,
    executive: `${ICONES_DIAGNOSTICO.executive} Análise executiva (apenas críticos)`,
    quick: `${ICONES_DIAGNOSTICO.rapido} Análise rápida`,
};
export const MENSAGENS_PROGRESSO = {
    varredura: (total) => `${ICONES_DIAGNOSTICO.arquivos} Varrendo ${total} arquivo${total !== 1 ? 's' : ''}...`,
    analise: (atual, total) => `${ICONES_DIAGNOSTICO.analise} Analisando: ${atual}/${total}`,
    arquetipos: `${ICONES_DIAGNOSTICO.arquetipos} Detectando estrutura do projeto...`,
    guardian: `${ICONES_DIAGNOSTICO.guardian} Verificando integridade...`,
    autoFix: (modo) => `${ICONES_DIAGNOSTICO.autoFix} Aplicando correções (modo: ${modo})...`,
    export: (formato) => `${ICONES_DIAGNOSTICO.export} Exportando relatório (${formato})...`,
};
export const MENSAGENS_CONCLUSAO = {
    sucesso: (ocorrencias) => `${ICONES_DIAGNOSTICO.sucesso} Diagnóstico concluído: ${ocorrencias} ocorrência${ocorrencias !== 1 ? 's' : ''} encontrada${ocorrencias !== 1 ? 's' : ''}`,
    semProblemas: `${ICONES_DIAGNOSTICO.sucesso} Nenhum problema encontrado! Código está em ótimo estado.`,
    exportado: (caminho) => `${ICONES_DIAGNOSTICO.export} Relatório salvo em: ${caminho}`,
};
export const MENSAGENS_ERRO = {
    falhaAnalise: (erro) => `${ICONES_DIAGNOSTICO.erro} Falha na análise: ${erro}`,
    falhaExport: (erro) => `${ICONES_DIAGNOSTICO.erro} Falha ao exportar: ${erro}`,
    falhaGuardian: (erro) => `${ICONES_DIAGNOSTICO.erro} Guardian falhou: ${erro}`,
    falhaAutoFix: (erro) => `${ICONES_DIAGNOSTICO.erro} Auto-fix falhou: ${erro}`,
    flagsInvalidas: (erros) => `${ICONES_DIAGNOSTICO.erro} Flags inválidas:\n${erros.map((e) => `  • ${e}`).join('\n')}`,
};
export const MENSAGENS_AVISO = {
    modoFast: `${ICONES_DIAGNOSTICO.info} Modo fast ativo (ORACULO_TEST_FAST=1)`,
    semMutateFS: `${ICONES_DIAGNOSTICO.aviso} Auto-fix desabilitado.`,
    guardianDesabilitado: `${ICONES_DIAGNOSTICO.info} Guardian não executado`,
    arquetiposTimeout: `${ICONES_DIAGNOSTICO.aviso} Detecção de arquetipos expirou (timeout)`,
};
export const MENSAGENS_FILTROS = {
    titulo: 'Filtros Ativos',
    include: (patterns) => `Include: ${patterns.length > 0 ? patterns.join(', ') : 'nenhum'}`,
    exclude: (patterns) => `Exclude: ${patterns.length > 0 ? patterns.join(', ') : 'padrões default'}`,
    nodeModules: (incluido) => `node_modules: ${incluido ? `${ICONES_DIAGNOSTICO.sucesso} incluído` : `${ICONES_DIAGNOSTICO.aviso} ignorado (padrão)`}`,
};
export const MENSAGENS_STATS = {
    titulo: 'Estatísticas da Análise',
    arquivos: (total) => `Arquivos analisados: ${total}`,
    ocorrencias: (total) => `Ocorrências encontradas: ${total}`,
    porTipo: (tipo, count) => `  • ${tipo}: ${count}`,
    duracao: (ms) => {
        if (ms < 1000)
            return `Duração: ${ms}ms`;
        if (ms < 60000)
            return `Duração: ${(ms / 1000).toFixed(1)}s`;
        const min = Math.floor(ms / 60000);
        const seg = Math.floor((ms % 60000) / 1000);
        return `Duração: ${min}m ${seg}s`;
    },
};
export const MENSAGENS_GUARDIAN = {
    iniciando: `${ICONES_DIAGNOSTICO.guardian} Iniciando verificação Guardian...`,
    baseline: 'Usando baseline existente',
    fullScan: 'Full scan ativo (ignorando ignores)',
    saveBaseline: 'Salvando novo baseline...',
    status: {
        verde: `${ICONES_DIAGNOSTICO.sucesso} Guardian: Status VERDE (integridade OK)`,
        amarelo: `${ICONES_DIAGNOSTICO.aviso} Guardian: Status AMARELO (atenção necessária)`,
        vermelho: `${ICONES_DIAGNOSTICO.erro} Guardian: Status VERMELHO (problemas críticos)`,
    },
    drift: (count) => `Drift detectado: ${count} mudança${count !== 1 ? 's' : ''} em relação ao baseline`,
};
export const MENSAGENS_ARQUETIPOS = {
    detectando: `${ICONES_DIAGNOSTICO.arquetipos} Detectando estrutura do projeto...`,
    identificado: (tipo, confianca) => `Arquétipo identificado: ${tipo} (${confianca}% confiança)`,
    multiplos: (count) => `${count} arquétipo${count !== 1 ? 's' : ''} candidato${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`,
    salvando: `Salvando arquétipo personalizado...`,
    salvo: (caminho) => `${ICONES_DIAGNOSTICO.sucesso} Arquétipo salvo em: ${caminho}`,
};
export const TEMPLATES_BLOCO = {
    sugestoes: {
        titulo: 'Sugestões Rápidas',
        formatarFlag: (flag, descricao) => `${flag}: ${descricao}`,
        formatarDica: (dica) => `${ICONES_DIAGNOSTICO.dica} ${dica}`,
    },
    resumo: {
        titulo: 'Resumo do Diagnóstico',
        secoes: {
            filtros: 'Filtros Aplicados',
            estatisticas: 'Estatísticas',
            arquetipos: 'Estrutura do Projeto',
            guardian: 'Integridade (Guardian)',
            autoFix: 'Correções Automáticas',
        },
    },
};
export function formatarBlocoSugestoes(flagsAtivas, dicas) {
    const linhas = [];
    linhas.push('');
    linhas.push(`┌── ${TEMPLATES_BLOCO.sugestoes.titulo} ─────────────────────────────────────────`);
    if (flagsAtivas.length > 0) {
        linhas.push(`Flags ativas: ${flagsAtivas.join(' ')}`);
    }
    else {
        linhas.push('Nenhuma flag especial detectada');
    }
    if (dicas.length > 0) {
        linhas.push('');
        linhas.push('Informações úteis:');
        for (const dica of dicas) {
            linhas.push(`  ${dica}`);
        }
    }
    linhas.push('└───────────────────────────────────────────────────────────────');
    linhas.push('');
    return linhas;
}
export function formatarResumoStats(stats) {
    const linhas = [];
    linhas.push('');
    linhas.push(`┌── ${TEMPLATES_BLOCO.resumo.secoes.estatisticas} ─────────────────────────────────────────`);
    linhas.push(`  ${MENSAGENS_STATS.arquivos(stats.arquivos)}`);
    linhas.push(`  ${MENSAGENS_STATS.ocorrencias(stats.ocorrencias)}`);
    if (stats.porTipo && Object.keys(stats.porTipo).length > 0) {
        linhas.push('');
        linhas.push('  Por tipo:');
        for (const [tipo, count] of Object.entries(stats.porTipo)) {
            linhas.push(`    ${MENSAGENS_STATS.porTipo(tipo, count)}`);
        }
    }
    linhas.push('');
    linhas.push(`  ${MENSAGENS_STATS.duracao(stats.duracao)}`);
    linhas.push('└───────────────────────────────────────────────────────────────');
    linhas.push('');
    return linhas;
}
export function formatarModoJson(ascii) {
    return `${ICONES_DIAGNOSTICO.info} Saída JSON estruturada${ascii ? ' (ASCII escape)' : ''} ativada`;
}
export const CABECALHOS = {
    analistas: {
        tituloFast: `${ICONES_DIAGNOSTICO.info} Analistas registrados (FAST MODE)`,
        titulo: `${ICONES_DIAGNOSTICO.info} Analistas registrados`,
        mdTitulo: '# Analistas Registrados',
    },
    diagnostico: {
        flagsAtivas: 'Flags ativas:',
        informacoesUteis: 'Informações úteis:',
    },
    reestruturar: {
        prioridadeDomainsFlat: `${ICONES_DIAGNOSTICO.aviso} --domains e --flat informados. Priorizando --domains.`,
        planoVazioFast: `${ICONES_DIAGNOSTICO.info} Plano vazio: nenhuma movimentação sugerida. (FAST MODE)`,
        nenhumNecessarioFast: `${ICONES_DIAGNOSTICO.sucesso} Nenhuma correção estrutural necessária. (FAST MODE)`,
        conflitosDetectadosFast: (count) => `${ICONES_DIAGNOSTICO.aviso} Conflitos detectados: ${count} (FAST MODE)`,
    },
};
//# sourceMappingURL=diagnostico-messages.js.map