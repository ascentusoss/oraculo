import { buildTypesRelPathPosix, getTypesDirectoryDisplay, } from '../../config/conventions.js';
import { ICONES } from '../ui/icons.js';
export const MENSAGENS_FIX_TYPES = {
    fixAny: {
        title: 'Substituir any por tipos seguros',
        description: `Analisa uso de any e infere/cria tipos corretos em ${getTypesDirectoryDisplay()}`,
    },
    fixUnknown: {
        title: 'Substituir unknown por tipos específicos',
        description: 'Detecta padrões de type guards e cria tipos dedicados',
    },
    validacao: {
        falha: (erros) => `Validação falhou: ${erros.join(', ')}`,
        revisar: 'Revise manualmente',
    },
    warnings: {
        confiancaBaixa: (confianca) => `Tipo inseguro (any) com confiança muito baixa (${confianca}%) para correção automática`,
        confiancaMedia: (confianca, tipoSugerido) => `Tipo inseguro detectado. Sugestão: ${tipoSugerido} (confiança: ${confianca}%)`,
        unknownApropriado: 'unknown apropriado aqui (entrada genérica ou baixa confiança)',
        useTiposCentralizados: () => `Use tipos centralizados em diretório dedicado (${getTypesDirectoryDisplay()})`,
        criarTipoDedicado: (caminho) => `Considere criar tipo dedicado em ${buildTypesRelPathPosix(caminho)}`,
        adicioneTypeGuards: () => `Se possível, adicione type guards ou crie tipo dedicado em ${getTypesDirectoryDisplay()}`,
    },
    erros: {
        extrairNome: 'Não foi possível extrair nome da variável',
        variavelNaoUsada: 'Variável não utilizada - impossível inferir tipo',
        analise: (erro) => `Erro na análise: ${erro}`,
    },
};
export const MENSAGENS_AUTOFIX = {
    iniciando: (modo) => `${ICONES.acao.correcao} Iniciando auto-fix (modo: ${modo})`,
    dryRun: `${ICONES.feedback.info} Dry-run: simulando correções (nenhuma mudança será aplicada)`,
    aplicando: (count) => `Aplicando ${count} correção${count !== 1 ? 'ões' : ''}...`,
    concluido: (aplicadas, falhas) => `${ICONES.nivel.sucesso} Auto-fix concluído: ${aplicadas} aplicada${aplicadas !== 1 ? 's' : ''}, ${falhas} falha${falhas !== 1 ? 's' : ''}`,
    naoDisponivel: `${ICONES.feedback.info} Nenhuma correção automática disponível`,
    flags: {
        fixSafe: `${ICONES.comando.guardian} Flag --fix-safe detectada: ativando modo conservador`,
        requireMutateFS: `${ICONES.status.falha} Auto-fix indisponível no momento.`,
    },
    logs: {
        modoConservador: `${ICONES.comando.guardian} Modo conservador ativado - aplicando apenas correções de alta confiança`,
        validacaoEslint: `${ICONES.acao.analise} Executando validação ESLint pós-auto-fix...`,
        arquivoMovido: (origem, destino) => `${ICONES.status.ok} Movido: ${origem} → ${destino}`,
        arquivoRevertido: (origem, destino) => `↩️ Arquivo revertido: ${destino} → ${origem}`,
        arquivoRevertidoConteudo: (origem, destino) => `↩️ Arquivo revertido com conteúdo original: ${destino} → ${origem}`,
    },
    resultados: {
        sucesso: (count) => `${ICONES.status.ok} ${count} arquivo(s) corrigido(s)`,
        falhas: (count) => `${ICONES.status.falha} ${count} arquivo(s) com erro`,
        erroArquivo: (arquivo, erro) => `${ICONES.status.falha} ${arquivo}: ${erro}`,
    },
    dicas: {
        executarLint: `${ICONES.feedback.dica} Execute \`npm run lint\` para verificar as correções`,
        executarBuild: `${ICONES.feedback.dica} Execute \`npm run build\` para verificar se o código compila`,
        removerDryRun: `${ICONES.feedback.dica} Remova --dry-run para aplicar correções automaticamente`,
        ajustarConfianca: `${ICONES.feedback.dica} Use --confidence <num> para ajustar o limiar (atual: 85%)`,
    },
};
export const MENSAGENS_RELATORIOS_ANALISE = {
    asyncPatterns: {
        titulo: `${ICONES.relatorio.resumo} Análise de Padrões Async/Await`,
        padroes: `\n${ICONES.relatorio.resumo} Padrões de Uso do Código:`,
        recomendacoes: `\n${ICONES.feedback.dica} Recomendações de Correção:\n`,
        critico: `${ICONES.nivel.erro} CRÍTICO (Revisar Imediatamente):`,
        alto: `\n${ICONES.feedback.atencao} ALTO (Revisar em Sprint Atual):`,
        salvo: (caminho) => `${ICONES.nivel.sucesso} Relatório async salvo em: ${caminho}`,
    },
    fixTypes: {
        analiseSalva: `${ICONES.arquivo.json} Análise detalhada salva em: .oraculo/fix-types-analise.json`,
        possibilidades: `└─ ${ICONES.acao.analise} Possibilidades alternativas:`,
        sugestao: (texto) => `└─ ${ICONES.feedback.dica} ${texto}`,
        exportado: `${ICONES.arquivo.doc} Relatórios de fix-types exportados:`,
    },
    guardian: {
        baselineAceito: `${ICONES.status.ok} Guardian: baseline aceito manualmente (--aceitar).`,
        exportado: `${ICONES.arquivo.doc} Relatórios Guardian exportados:`,
    },
};
export const MENSAGENS_ARQUETIPOS_HANDLER = {
    timeout: `${ICONES.feedback.atencao} Detecção de arquetipos expirou (timeout)`,
    salvo: (caminho) => `${ICONES.status.ok} Arquétipo personalizado salvo em ${caminho}`,
    falha: `${ICONES.feedback.atencao} Falha ao gerar plano via arquétipos.`,
    falhaEstrategista: `${ICONES.feedback.atencao} Estrategista falhou ao sugerir plano.`,
    falhaGeral: `${ICONES.feedback.atencao} Falha geral no planejamento.`,
};
export const MENSAGENS_PLUGINS = {
    registrado: (nome, extensoes) => `${ICONES.status.ok} Plugin ${nome} registrado com extensões: ${extensoes.join(', ')}`,
    configAtualizada: `${ICONES.acao.correcao} Configuração do registry atualizada`,
    erroParsear: (linguagem, erro) => `${ICONES.feedback.atencao} Erro ao parsear ${linguagem}: ${erro}`,
};
export const MENSAGENS_EXECUTOR = {
    analiseCompleta: (tecnica, arquivo, duracao) => `${ICONES.arquivo.arquivo} '${tecnica}' analisou ${arquivo} em ${duracao}`,
};
export const MENSAGENS_CORRECOES = {
    fixTypes: MENSAGENS_FIX_TYPES,
    autofix: MENSAGENS_AUTOFIX,
    relatorios: MENSAGENS_RELATORIOS_ANALISE,
    arquetipos: MENSAGENS_ARQUETIPOS_HANDLER,
    plugins: MENSAGENS_PLUGINS,
    executor: MENSAGENS_EXECUTOR,
};
export default MENSAGENS_CORRECOES;
//# sourceMappingURL=correcoes-messages.js.map