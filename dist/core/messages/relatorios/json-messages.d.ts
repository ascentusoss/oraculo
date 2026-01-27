import type { JsonComMetadados } from '../../../types/index.js';
export declare const JsonMessages: {
    comum: {
        timestamp: {
            label: string;
            descricao: string;
        };
        versao: {
            label: string;
            descricao: string;
        };
        schemaVersion: {
            label: string;
            descricao: string;
        };
        duracao: {
            label: string;
            descricao: string;
        };
    };
    diagnostico: {
        root: {
            label: string;
            descricao: string;
        };
        totalArquivos: {
            label: string;
            descricao: string;
        };
        ocorrencias: {
            label: string;
            descricao: string;
            campos: {
                tipo: string;
                nivel: string;
                mensagem: string;
                relPath: string;
                linha: string;
                coluna: string;
                contexto: string;
            };
        };
        metricas: {
            label: string;
            descricao: string;
            campos: {
                totalLinhas: string;
                totalArquivos: string;
                arquivosComErro: string;
                tempoTotal: string;
            };
        };
        linguagens: {
            label: string;
            descricao: string;
            campos: {
                total: string;
                extensoes: string;
            };
        };
        parseErros: {
            label: string;
            descricao: string;
            campos: {
                total: string;
                porArquivo: string;
                agregado: string;
            };
        };
    };
    estrutura: {
        root: {
            label: string;
            descricao: string;
        };
        melhores: {
            label: string;
            descricao: string;
            campos: {
                nome: string;
                score: string;
                confidence: string;
                descricao: string;
                matchedRequired: string;
                missingRequired: string;
                matchedOptional: string;
            };
        };
        baseline: {
            label: string;
            descricao: string;
            campos: {
                arquetipo: string;
                confidence: string;
                timestamp: string;
                arquivosRaiz: string;
            };
        };
        drift: {
            label: string;
            descricao: string;
            campos: {
                alterouArquetipo: string;
                deltaConfidence: string;
                arquivosRaizNovos: string;
                arquivosRaizRemovidos: string;
            };
        };
    };
    guardian: {
        root: {
            label: string;
            descricao: string;
        };
        status: {
            label: string;
            opcoes: {
                sucesso: string;
                alteracoes: string;
                baseline: string;
                erro: string;
                naoExecutada: string;
            };
        };
        totalArquivos: {
            label: string;
            descricao: string;
        };
        alteracoes: {
            label: string;
            descricao: string;
            campos: {
                arquivo: string;
                hashAnterior: string;
                hashAtual: string;
                acao: string;
            };
        };
    };
    poda: {
        root: {
            label: string;
            descricao: string;
        };
        pendencias: {
            label: string;
            descricao: string;
            campos: {
                caminho: string;
                tipo: string;
                motivoOriginal: string;
                timestamp: string;
            };
        };
        reativar: {
            label: string;
            descricao: string;
        };
        historico: {
            label: string;
            descricao: string;
            campos: {
                acao: string;
                caminho: string;
                timestamp: string;
                usuario: string;
            };
        };
    };
    reestruturar: {
        root: {
            label: string;
            descricao: string;
        };
        movimentos: {
            label: string;
            descricao: string;
            campos: {
                id: string;
                origem: string;
                destino: string;
                razao: string;
                status: string;
                dependencias: string;
            };
        };
        conflitos: {
            label: string;
            descricao: string;
            campos: {
                tipo: string;
                arquivos: string;
                descricao: string;
                resolucaoSugerida: string;
            };
        };
        resumo: {
            label: string;
            descricao: string;
            campos: {
                total: string;
                zonaVerde: string;
                bloqueados: string;
                impactoEstimado: string;
            };
        };
    };
    filtroInteligente: {
        root: {
            label: string;
            descricao: string;
        };
        problemasCriticos: {
            label: string;
            descricao: string;
        };
        problemasAltos: {
            label: string;
            descricao: string;
        };
        problemasOutros: {
            label: string;
            descricao: string;
        };
        estatisticas: {
            label: string;
            descricao: string;
            campos: {
                totalOcorrencias: string;
                arquivosAfetados: string;
                problemasPrioritarios: string;
                problemasAgrupados: string;
            };
        };
    };
};
export declare function wrapComMetadados<T>(data: T, schema: string, versao: string, descricao: string): JsonComMetadados<T>;
export declare function getDescricaoCampo(caminho: string): string;
//# sourceMappingURL=json-messages.d.ts.map