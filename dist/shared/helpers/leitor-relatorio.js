import { migrarParaVersaoAtual, validarSchema } from '../../core/schema/version.js';
import { lerEstado } from '../persistence/persistencia.js';
export async function lerRelatorioVersionado(options) {
    const { caminho, validar = true, migrar = false } = options;
    try {
        const conteudo = await lerEstado(caminho);
        if (!conteudo) {
            return {
                sucesso: false,
                erro: 'Arquivo não encontrado ou vazio',
            };
        }
        let relatorioFinal = conteudo;
        let migrado = false;
        if (validar) {
            const validacao = validarSchema(conteudo);
            if (!validacao.valido) {
                return {
                    sucesso: false,
                    erro: `Schema inválido: ${validacao.erros.join(', ')}`,
                };
            }
        }
        if (!conteudo._schema || !conteudo.dados) {
            if (migrar) {
                relatorioFinal = migrarParaVersaoAtual(conteudo);
                migrado = true;
            }
            else if (!validar) {
                relatorioFinal = conteudo;
                migrado = false;
            }
            else {
                return {
                    sucesso: false,
                    erro: 'Relatório em formato antigo (sem _schema); habilite migrar para atualizá-lo explicitamente.',
                };
            }
        }
        let dados;
        const relObj = relatorioFinal;
        if ('_schema' in relObj && relObj._schema) {
            dados = relObj.dados;
        }
        else {
            dados = relatorioFinal;
        }
        return {
            sucesso: true,
            dados,
            schema: relObj._schema || undefined,
            migrado,
        };
    }
    catch (error) {
        return {
            sucesso: false,
            erro: `Erro ao ler relatório: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
export async function lerDadosRelatorio(caminho) {
    const resultado = await lerRelatorioVersionado({
        caminho,
        validar: false,
        migrar: true,
    });
    return {
        sucesso: resultado.sucesso,
        dados: resultado.dados,
        erro: resultado.erro,
    };
}
export async function verificarSchemaRelatorio(caminho) {
    try {
        const conteudo = await lerEstado(caminho);
        if (!conteudo) {
            return {
                valido: false,
                erros: ['Arquivo não encontrado ou vazio'],
            };
        }
        const validacao = validarSchema(conteudo);
        return {
            valido: validacao.valido,
            versao: conteudo._schema?.versao,
            erros: validacao.erros,
        };
    }
    catch (error) {
        return {
            valido: false,
            erro: `Erro ao verificar schema: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
//# sourceMappingURL=leitor-relatorio.js.map