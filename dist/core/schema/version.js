import { ExcecoesMessages } from '../messages/core/excecoes-messages.js';
export const VERSAO_ATUAL = '1.0.0';
export const HISTORICO_VERSOES = {
    '1.0.0': {
        versao: '1.0.0',
        criadoEm: '2025-08-28',
        descricao: 'Versão inicial com campos básicos de relatório',
        compatibilidade: ['1.0.0'],
        camposObrigatorios: [
            '_schema',
            'dados',
            '_schema.versao',
            '_schema.criadoEm',
            '_schema.descricao',
        ],
        camposOpcionais: [
            '_schema.compatibilidade',
            '_schema.camposObrigatorios',
            '_schema.camposOpcionais',
        ],
    },
};
export function criarSchemaMetadata(versao = VERSAO_ATUAL, descricaoPersonalizada) {
    const base = HISTORICO_VERSOES[versao];
    if (!base) {
        throw new Error(ExcecoesMessages.versaoSchemaDesconhecida(versao));
    }
    return {
        ...base,
        ...(descricaoPersonalizada && { descricao: descricaoPersonalizada }),
    };
}
export function validarSchema(relatorio) {
    const erros = [];
    if (!relatorio || typeof relatorio !== 'object') {
        erros.push('Relatório deve ser um objeto');
        return { valido: false, erros };
    }
    if (!('_schema' in relatorio) || !relatorio._schema) {
        erros.push('Campo _schema é obrigatório');
        return { valido: false, erros };
    }
    const schema = relatorio._schema;
    const camposObrigatorios = ['versao', 'criadoEm', 'descricao'];
    for (const campo of camposObrigatorios) {
        if (!(campo in schema)) {
            erros.push(`Campo _schema.${campo} é obrigatório`);
        }
    }
    if (schema.versao &&
        typeof schema.versao === 'string' &&
        !HISTORICO_VERSOES[schema.versao]) {
        erros.push(`Versão de schema desconhecida: ${schema.versao}`);
    }
    if (!('dados' in relatorio)) {
        erros.push('Campo dados é obrigatório');
    }
    return {
        valido: erros.length === 0,
        erros,
    };
}
export function migrarParaVersaoAtual(relatorio) {
    const validacao = validarSchema(relatorio);
    if (validacao.valido && relatorio._schema) {
        return relatorio;
    }
    if (!('_schema' in relatorio) || !relatorio._schema) {
        return criarRelatorioComVersao(relatorio);
    }
    if (!validacao.valido) {
        throw new Error(ExcecoesMessages.relatorioSchemaInvalido(validacao.erros.join(', ')));
    }
    return relatorio;
}
export function criarRelatorioComVersao(dados, versao = VERSAO_ATUAL, descricao) {
    return {
        _schema: criarSchemaMetadata(versao, descricao),
        dados,
    };
}
export function extrairDados(relatorio) {
    return relatorio.dados;
}
export function versaoCompativel(versao) {
    const metadata = HISTORICO_VERSOES[versao];
    if (!metadata)
        return false;
    return metadata.compatibilidade.includes(VERSAO_ATUAL);
}
//# sourceMappingURL=version.js.map