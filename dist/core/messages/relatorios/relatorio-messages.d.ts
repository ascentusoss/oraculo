export declare const RelatorioMessages: {
    principal: {
        titulo: string;
        secoes: {
            metadados: {
                data: string;
                duracao: string;
                arquivos: string;
                ocorrencias: string;
                arquivoManifest: string;
                notaManifest: string;
            };
            guardian: {
                titulo: string;
                status: string;
                timestamp: string;
                totalArquivos: string;
            };
            resumoTipos: {
                titulo: string;
                tipo: string;
                quantidade: string;
            };
            ocorrencias: {
                titulo: string;
                colunas: {
                    arquivo: string;
                    linha: string;
                    nivel: string;
                    mensagem: string;
                };
            };
            estatisticas: {
                titulo: string;
                linhasAnalisadas: string;
                padroesProgramacao: string;
                analiseInteligente: string;
            };
        };
    };
    resumo: {
        titulo: string;
        introducao: string;
        secoes: {
            criticos: {
                titulo: string;
                vazio: string;
            };
            altos: {
                titulo: string;
                vazio: string;
            };
            outros: {
                titulo: string;
                vazio: string;
            };
            estatisticas: {
                titulo: string;
                totalOcorrencias: string;
                arquivosAfetados: string;
                problemasPrioritarios: string;
                problemasAgrupados: string;
            };
        };
        labels: {
            quantidade: string;
            arquivosAfetados: string;
            acaoSugerida: string;
            exemplos: string;
        };
    };
    saude: {
        titulo: string;
        introducao: string;
        secoes: {
            funcoesLongas: {
                titulo: string;
                vazio: string;
                colunas: {
                    tipo: string;
                    quantidade: string;
                };
            };
            constantesDuplicadas: {
                titulo: string;
            };
            modulosRequire: {
                titulo: string;
            };
            fim: {
                titulo: string;
            };
        };
        instrucoes: {
            diagnosticoDetalhado: string;
            tabelasVerbosas: string;
        };
    };
    padroesUso: {
        titulo: string;
    };
    arquetipos: {
        titulo: string;
        secoes: {
            candidatos: {
                titulo: string;
                nome: string;
                score: string;
                confianca: string;
                descricao: string;
            };
            baseline: {
                titulo: string;
                snapshot: string;
                arquivos: string;
            };
            drift: {
                titulo: string;
                alterouArquetipo: string;
                deltaConfianca: string;
                arquivosNovos: string;
                arquivosRemovidos: string;
            };
        };
    };
    poda: {
        titulo: string;
        secoes: {
            metadados: {
                data: string;
                execucao: string;
                simulacao: string;
                real: string;
                arquivosPodados: string;
                arquivosMantidos: string;
            };
            podados: {
                titulo: string;
                vazio: string;
                colunas: {
                    arquivo: string;
                    motivo: string;
                    diasInativo: string;
                    detectadoEm: string;
                };
            };
            mantidos: {
                titulo: string;
                vazio: string;
                colunas: {
                    arquivo: string;
                    motivo: string;
                };
            };
            pendencias: {
                titulo: string;
                total: string;
                tipoArquivo: string;
                tipoDiretorio: string;
                tamanhoTotal: string;
            };
            reativacao: {
                titulo: string;
                total: string;
            };
            historico: {
                titulo: string;
                total: string;
                colunas: {
                    acao: string;
                    caminho: string;
                    timestamp: string;
                };
            };
        };
    };
    reestruturar: {
        titulo: string;
        secoes: {
            metadados: {
                data: string;
                execucao: string;
                simulacao: string;
                real: string;
                origemPlano: string;
                preset: string;
            };
            movimentos: {
                titulo: string;
                total: string;
                vazio: string;
                status: {
                    zonVerde: string;
                    bloqueados: string;
                };
                colunas: {
                    origem: string;
                    destino: string;
                    razao: string;
                    status: string;
                };
            };
            conflitos: {
                titulo: string;
                total: string;
                tipo: string;
                descricao: string;
            };
            preview: {
                titulo: string;
                nota: string;
            };
        };
    };
    comum: {
        separadores: {
            secao: string;
            subsecao: string;
        };
        vazios: {
            nenhumResultado: string;
            nenhumaOcorrencia: string;
            semDados: string;
        };
        acoes: {
            verDetalhes: string;
            executarComando: string;
            aplicarMudancas: string;
            cancelar: string;
        };
    };
};
export declare function formatMessage(template: string, vars: Record<string, string | number>): string;
export declare function pluralize(count: number, singular: string, plural: string, showCount?: boolean): string;
export declare function separator(char?: string, length?: number): string;
//# sourceMappingURL=relatorio-messages.d.ts.map