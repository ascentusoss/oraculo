import { traverse } from '../../core/config/traverse.js';
import { DetectorAgregadosMessages } from '../../core/messages/analistas/detector-agregados-messages.js';
import { createHash } from 'crypto';
import { criarOcorrencia } from '../../types/index.js';
export const analistaDuplicacoes = {
    nome: 'detector-duplicacoes',
    categoria: 'estrutura',
    descricao: 'Detecta funções e blocos de código duplicados ou muito similares',
    limites: {
        similaridadeMinima: 80,
        tamanhoMinimoFuncao: 5,
    },
    test: (relPath) => {
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
    },
    aplicar: async (src, relPath, ast, fullPath, contexto) => {
        if (!ast || !src || !contexto) {
            return [];
        }
        try {
            const funcoesAtuais = extrairFuncoes(ast, relPath, src);
            let todasFuncoes = [];
            try {
                todasFuncoes = await extrairFuncoesDoContexto(contexto, relPath);
            }
            catch (erro) {
                return [
                    criarOcorrencia({
                        tipo: 'erro_analise',
                        nivel: 'aviso',
                        mensagem: DetectorAgregadosMessages.erroAnalisarDuplicacoes(erro),
                        relPath,
                        linha: 1,
                    }),
                ];
            }
            todasFuncoes.push(...funcoesAtuais);
            const duplicacoes = detectarDuplicacoes(funcoesAtuais, todasFuncoes);
            if (duplicacoes.length === 0) {
                return [];
            }
            const porTipo = agruparPorTipoSimilaridade(duplicacoes);
            const ocorrencias = [];
            for (const [tipo, dups] of Object.entries(porTipo)) {
                if (dups.length > 0) {
                    const nivel = tipo === 'identica' ? 'aviso' : 'info';
                    const primeiraFunc = dups[0]?.funcaoA;
                    const resumo = dups
                        .map((d) => `${d.funcaoA?.nome || 'unknown'} ≈ ${d.funcaoB?.nome || 'unknown'} (${d.similaridade.toFixed(0)}%)`)
                        .slice(0, 3)
                        .join(', ');
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'codigo_duplicado',
                        nivel,
                        mensagem: DetectorAgregadosMessages.duplicacoesResumo(tipo, resumo, dups.length),
                        relPath,
                        linha: primeiraFunc?.inicio || 1,
                    }));
                }
            }
            return ocorrencias;
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'erro_analise',
                    nivel: 'aviso',
                    mensagem: DetectorAgregadosMessages.erroAnalisarDuplicacoes(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function extrairFuncoes(ast, caminho, src) {
    const funcoes = [];
    const linhas = src.split('\n');
    traverse(ast.node, {
        FunctionDeclaration(path) {
            const func = extrairInfoFuncao(path, caminho, 'declaration', linhas);
            if (func)
                funcoes.push(func);
        },
        FunctionExpression(path) {
            const func = extrairInfoFuncao(path, caminho, 'expression', linhas);
            if (func)
                funcoes.push(func);
        },
        ArrowFunctionExpression(path) {
            const func = extrairInfoFuncao(path, caminho, 'arrow', linhas);
            if (func)
                funcoes.push(func);
        },
        ObjectMethod(path) {
            const func = extrairInfoFuncao(path, caminho, 'method', linhas);
            if (func)
                funcoes.push(func);
        },
        ClassMethod(path) {
            const func = extrairInfoFuncao(path, caminho, 'method', linhas);
            if (func)
                funcoes.push(func);
        },
    });
    return funcoes;
}
function extrairInfoFuncao(path, caminho, tipoFuncao, linhas) {
    const node = path.node;
    const inicio = node.loc?.start.line || 0;
    const fim = node.loc?.end.line || 0;
    if (fim - inicio < 3) {
        return null;
    }
    const conteudo = linhas.slice(inicio - 1, fim).join('\n');
    const conteudoNormalizado = normalizarConteudo(conteudo);
    const hash = createHash('md5').update(conteudoNormalizado).digest('hex');
    let nome = 'anonymous';
    if ('id' in node && node.id && 'name' in node.id) {
        nome = node.id.name;
    }
    else if ('key' in node && node.key && 'name' in node.key) {
        nome = node.key.name;
    }
    else if (path.parentPath?.isVariableDeclarator()) {
        const parent = path.parentPath.node;
        nome =
            'id' in parent && parent.id && 'name' in parent.id
                ? parent.id.name
                : 'assigned';
    }
    const parametros = ('params' in node && Array.isArray(node.params) ? node.params : []).map((param) => {
        if (param.type === 'Identifier' && 'name' in param)
            return param.name;
        if (param.type === 'RestElement' &&
            'argument' in param &&
            param.argument &&
            'name' in param.argument) {
            return `...${param.argument.name}`;
        }
        return param.type;
    });
    return {
        hash,
        conteudo: conteudoNormalizado,
        nome,
        caminho,
        inicio,
        fim,
        parametros,
        tipoFuncao,
        codigo: conteudoNormalizado,
    };
}
async function extrairFuncoesDoContexto(contexto, caminhoAtual) {
    const todasFuncoes = [];
    const arquivosParaComparar = contexto.arquivos
        .filter((arq) => arq.relPath !== caminhoAtual && arq.ast)
        .slice(0, 20);
    for (const arquivo of arquivosParaComparar) {
        if (arquivo.ast && arquivo.content) {
            if ('parent' in arquivo.ast && 'node' in arquivo.ast) {
                const funcoes = extrairFuncoes(arquivo.ast, arquivo.relPath, arquivo.content);
                todasFuncoes.push(...funcoes);
            }
        }
    }
    return todasFuncoes;
}
function detectarDuplicacoes(funcoesAtuais, todasFuncoes) {
    const duplicacoes = [];
    for (const funcaoAtual of funcoesAtuais) {
        for (const outraFuncao of todasFuncoes) {
            if (funcaoAtual.caminho === outraFuncao.caminho &&
                funcaoAtual.inicio === outraFuncao.inicio) {
                continue;
            }
            const similaridade = calcularSimilaridade(funcaoAtual, outraFuncao);
            if (similaridade >= 80) {
                const tipoSimilaridade = determinarTipoSimilaridade(funcaoAtual, outraFuncao, similaridade);
                duplicacoes.push({
                    funcaoA: funcaoAtual,
                    funcaoB: outraFuncao,
                    similaridade,
                    tipoSimilaridade,
                    arquivo1: funcaoAtual.caminho || '',
                    arquivo2: outraFuncao.caminho || '',
                    bloco1: funcaoAtual,
                    bloco2: outraFuncao,
                });
            }
        }
    }
    return duplicacoes;
}
function calcularSimilaridade(funcaoA, funcaoB) {
    if (funcaoA.hash === funcaoB.hash) {
        return 100;
    }
    const tokensA = tokenizar(funcaoA.conteudo || '');
    const tokensB = tokenizar(funcaoB.conteudo || '');
    const similaridadeJaccard = calcularJaccard(tokensA, tokensB);
    const similaridadeParametros = calcularSimilaridadeParametros(funcaoA.parametros || [], funcaoB.parametros || []);
    return (similaridadeJaccard * 0.8 + similaridadeParametros * 0.2) * 100;
}
function determinarTipoSimilaridade(funcaoA, funcaoB, similaridade) {
    if (similaridade >= 95)
        return 'identica';
    if (similaridade >= 85)
        return 'estrutural';
    return 'semantica';
}
function normalizarConteudo(conteudo) {
    return (conteudo
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}();,])\s*/g, '$1')
        .trim());
}
function tokenizar(texto) {
    return texto
        .split(/[\s\(\)\{\}\[\];,\.]+/)
        .filter((token) => token.length > 0 && !/^[0-9]+$/.test(token));
}
function calcularJaccard(tokensA, tokensB) {
    const conjuntoA = new Set(tokensA);
    const conjuntoB = new Set(tokensB);
    const intersecao = new Set([...conjuntoA].filter((x) => conjuntoB.has(x)));
    const uniao = new Set([...conjuntoA, ...conjuntoB]);
    return uniao.size === 0 ? 0 : intersecao.size / uniao.size;
}
function calcularSimilaridadeParametros(paramsA, paramsB) {
    if (paramsA.length === 0 && paramsB.length === 0)
        return 1;
    if (paramsA.length === 0 || paramsB.length === 0)
        return 0;
    const maxLength = Math.max(paramsA.length, paramsB.length);
    let matches = 0;
    for (let i = 0; i < maxLength; i++) {
        if (paramsA[i] === paramsB[i]) {
            matches++;
        }
    }
    return matches / maxLength;
}
function agruparPorTipoSimilaridade(duplicacoes) {
    return duplicacoes.reduce((acc, dup) => {
        const tipo = dup.tipoSimilaridade;
        if (tipo) {
            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push(dup);
        }
        return acc;
    }, {});
}
//# sourceMappingURL=detector-duplicacoes.js.map