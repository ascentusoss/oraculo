import { traverse } from '../../core/config/traverse.js';
import { DetectorArquiteturaMessages } from '../../core/messages/analistas/detector-arquitetura-messages.js';
import * as path from 'path';
import { criarOcorrencia } from '../../types/index.js';
export const analistaArquitetura = {
    nome: 'arquitetura',
    categoria: 'estrutura',
    descricao: 'Analisa padrões arquiteturais e detecta violações de design',
    test: (relPath) => {
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
    },
    aplicar: async (src, relPath, ast, fullPath, contexto) => {
        if (!ast || !src || !contexto) {
            return [];
        }
        try {
            const estatisticasArquivo = analisarArquivo(ast, relPath, src);
            let analiseCompleta;
            const ocorrencias = [];
            try {
                analiseCompleta = await analisarArquiteturaCompleta(contexto, estatisticasArquivo);
            }
            catch (erro) {
                return [
                    criarOcorrencia({
                        tipo: 'erro-analise',
                        nivel: 'aviso',
                        mensagem: DetectorArquiteturaMessages.erroAnalisarArquitetura(erro),
                        relPath,
                        linha: 1,
                    }),
                ];
            }
            ocorrencias.push(criarOcorrencia({
                tipo: 'analise-arquitetura',
                nivel: (analiseCompleta.violacoes?.length ?? 0) > 0 ? 'aviso' : 'info',
                mensagem: DetectorArquiteturaMessages.padraoArquitetural(analiseCompleta.padraoIdentificado, analiseCompleta.confianca ?? 0),
                relPath,
                linha: 1,
            }));
            if ((analiseCompleta.caracteristicas?.length ?? 0) > 0) {
                ocorrencias.push(criarOcorrencia({
                    tipo: 'caracteristicas-arquitetura',
                    nivel: 'info',
                    mensagem: DetectorArquiteturaMessages.caracteristicas(analiseCompleta.caracteristicas || []),
                    relPath,
                    linha: 1,
                }));
            }
            for (const violacao of (analiseCompleta.violacoes ?? []).slice(0, 3)) {
                ocorrencias.push(criarOcorrencia({
                    tipo: 'violacao-arquitetura',
                    nivel: 'aviso',
                    mensagem: DetectorArquiteturaMessages.violacao(violacao),
                    relPath,
                    linha: 1,
                }));
            }
            const metricas = analiseCompleta.metricas;
            if (metricas &&
                typeof metricas === 'object' &&
                'acoplamento' in metricas &&
                'coesao' in metricas) {
                if ((metricas.acoplamento ?? 0) > 0.7 || (metricas.coesao ?? 1) < 0.3) {
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'metricas-arquitetura',
                        nivel: 'aviso',
                        mensagem: DetectorArquiteturaMessages.metricas(metricas.acoplamento ?? 0, metricas.coesao ?? 0),
                        relPath,
                        linha: 1,
                    }));
                }
            }
            return ocorrencias;
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'erro-analise',
                    nivel: 'aviso',
                    mensagem: DetectorArquiteturaMessages.erroAnalisarArquitetura(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function analisarArquivo(ast, relPath, _src) {
    const imports = [];
    const exports = [];
    const dependenciasExternas = [];
    const dependenciasInternas = [];
    const aliases = {};
    let complexidade = 0;
    traverse(ast.node, {
        ImportDeclaration(path) {
            const origem = path.node.source.value;
            const items = path.node.specifiers.map((spec) => {
                if (spec.type === 'ImportDefaultSpecifier')
                    return 'default';
                if (spec.type === 'ImportNamespaceSpecifier')
                    return '*';
                return spec.local.name;
            });
            let tipo = 'external';
            if (origem.startsWith('@')) {
                tipo = 'alias';
                const alias = origem.split('/')[0];
                aliases[alias] = (aliases[alias] || 0) + 1;
                dependenciasInternas.push(origem);
            }
            else if (origem.startsWith('.')) {
                tipo = 'relative';
                dependenciasInternas.push(origem);
            }
            else {
                dependenciasExternas.push(origem);
            }
            imports.push({ origem, tipo, items });
        },
        ExportNamedDeclaration(path) {
            if (path.node.declaration) {
                const decl = path.node.declaration;
                if ('id' in decl && decl.id && 'name' in decl.id) {
                    exports.push({ nome: decl.id.name, tipo: 'named' });
                }
                else if ('declarations' in decl && decl.declarations) {
                    for (const declarator of decl.declarations) {
                        if (declarator.id && 'name' in declarator.id) {
                            exports.push({
                                nome: declarator.id.name,
                                tipo: 'named',
                            });
                        }
                    }
                }
            }
            else {
                for (const spec of path.node.specifiers) {
                    const name = 'exported' in spec &&
                        spec.exported.type === 'Identifier' &&
                        'name' in spec.exported
                        ? spec.exported.name
                        : 'exported';
                    exports.push({ nome: name, tipo: 'named' });
                }
            }
        },
        ExportDefaultDeclaration() {
            exports.push({ nome: 'default', tipo: 'default' });
        },
        'IfStatement|WhileStatement|ForStatement|DoWhileStatement|SwitchCase|CatchClause'() {
            complexidade++;
        },
        'ConditionalExpression|LogicalExpression'() {
            complexidade++;
        },
    });
    return {
        caminho: relPath,
        imports,
        exports,
        dependenciasExternas,
        dependenciasInternas,
        aliases,
        complexidade: complexidade || 1,
    };
}
async function analisarArquiteturaCompleta(contexto, arquivoAtual) {
    const todasEstatisticas = [];
    for (const arquivo of contexto.arquivos.slice(0, 50)) {
        if (arquivo.ast &&
            arquivo.content &&
            arquivo.relPath.match(/\.(js|jsx|ts|tsx)$/)) {
            if ('parent' in arquivo.ast && 'node' in arquivo.ast) {
                const stats = analisarArquivo(arquivo.ast, arquivo.relPath, arquivo.content);
                todasEstatisticas.push(stats);
            }
        }
    }
    todasEstatisticas.push(arquivoAtual);
    const padraoDetectado = detectarPadraoArquitetural(todasEstatisticas);
    const metricas = calcularMetricas(todasEstatisticas);
    const violacoes = detectarViolacoes(todasEstatisticas, padraoDetectado);
    const caracteristicas = gerarCaracteristicas(todasEstatisticas);
    return {
        padraoIdentificado: padraoDetectado.tipo,
        confianca: padraoDetectado.confianca,
        caracteristicas,
        violacoes,
        recomendacoes: [],
        metricas,
        imports: [],
        exports: [],
        stats: arquivoAtual,
    };
}
function detectarPadraoArquitetural(estatisticas) {
    const aliases = new Set();
    let temNucleo = false;
    let temAnalistas = false;
    let _temCLI = false;
    let temShared = false;
    let temTipos = false;
    for (const stats of estatisticas) {
        if (stats.aliases) {
            Object.keys(stats.aliases).forEach((alias) => aliases.add(alias));
            if (stats.aliases['@nucleo'])
                temNucleo = true;
            if (stats.aliases['@analistas'])
                temAnalistas = true;
            if (stats.aliases['@cli'])
                _temCLI = true;
            if (stats.aliases['@shared'])
                temShared = true;
            if (stats.aliases['@types'])
                temTipos = true;
        }
    }
    const temDependenciasCirculares = detectarDependenciasCirculares(estatisticas);
    if (temNucleo && temAnalistas && !temDependenciasCirculares) {
        if (temShared && temTipos) {
            return {
                tipo: 'Arquitetura Hexagonal com Clean Architecture',
                confianca: 90,
            };
        }
        return {
            tipo: 'Arquitetura Hexagonal (Ports and Adapters)',
            confianca: 85,
        };
    }
    if (aliases.size >= 4 && temTipos) {
        return { tipo: 'Arquitetura Modular Bem Estruturada', confianca: 80 };
    }
    if (aliases.size >= 2) {
        return { tipo: 'Arquitetura Modular', confianca: 70 };
    }
    if (temDependenciasCirculares) {
        return { tipo: 'Arquitetura com Problemas de Acoplamento', confianca: 60 };
    }
    return { tipo: 'Arquitetura Simples ou Monolítica', confianca: 50 };
}
function calcularMetricas(estatisticas) {
    if (estatisticas.length === 0) {
        return { modularidade: 0, acoplamento: 0, coesao: 0, complexidadeMedia: 0 };
    }
    const totalImports = estatisticas.reduce((sum, s) => {
        if (Array.isArray(s.imports)) {
            return sum + s.imports.length;
        }
        else if (typeof s.imports === 'number') {
            return sum + s.imports;
        }
        return sum;
    }, 0);
    const importsAlias = estatisticas.reduce((sum, s) => {
        if (Array.isArray(s.imports)) {
            return (sum + s.imports.filter((i) => i.tipo === 'alias').length);
        }
        return sum;
    }, 0);
    const modularidade = totalImports > 0 ? importsAlias / totalImports : 0;
    const totalDeps = estatisticas.reduce((sum, s) => {
        const externas = s.dependenciasExternas?.length ?? 0;
        const internas = s.dependenciasInternas?.length ?? 0;
        return sum + externas + internas;
    }, 0);
    const depsExternas = estatisticas.reduce((sum, s) => {
        return sum + (s.dependenciasExternas?.length ?? 0);
    }, 0);
    const acoplamento = totalDeps > 0 ? depsExternas / totalDeps : 0;
    const totalExports = estatisticas.reduce((sum, s) => {
        if (Array.isArray(s.exports)) {
            return sum + s.exports.length;
        }
        else if (typeof s.exports === 'number') {
            return sum + s.exports;
        }
        return sum;
    }, 0);
    const coesao = totalImports > 0 ? Math.min(totalExports / totalImports, 1) : 0;
    const complexidadeMedia = estatisticas.reduce((sum, s) => sum + (s.complexidade ?? 0), 0) /
        estatisticas.length;
    return {
        modularidade: Math.max(0, Math.min(1, modularidade)),
        acoplamento: Math.max(0, Math.min(1, acoplamento)),
        coesao: Math.max(0, Math.min(1, coesao)),
        complexidadeMedia,
    };
}
function detectarViolacoes(estatisticas, _padrao) {
    const violacoes = [];
    const totalImports = estatisticas.reduce((sum, s) => {
        if (Array.isArray(s.imports)) {
            return sum + s.imports.length;
        }
        else if (typeof s.imports === 'number') {
            return sum + s.imports;
        }
        return sum;
    }, 0);
    const importsRelativos = estatisticas.reduce((sum, s) => {
        if (Array.isArray(s.imports)) {
            return (sum + s.imports.filter((i) => i.tipo === 'relative').length);
        }
        return sum;
    }, 0);
    if (totalImports > 0 && importsRelativos / totalImports > 0.3) {
        violacoes.push('Uso excessivo de imports relativos (>30%)');
    }
    for (const stats of estatisticas) {
        const importsCount = Array.isArray(stats.imports)
            ? stats.imports.length
            : typeof stats.imports === 'number'
                ? stats.imports
                : 0;
        if (importsCount > 20) {
            const caminho = stats.caminho ?? 'arquivo-desconhecido';
            violacoes.push(`Arquivo ${path.basename(caminho)} com muitas dependências (${importsCount})`);
        }
    }
    return violacoes;
}
function gerarCaracteristicas(estatisticas) {
    const caracteristicas = [];
    const aliases = new Set();
    estatisticas.forEach((s) => {
        if (s.aliases) {
            Object.keys(s.aliases).forEach((a) => aliases.add(a));
        }
    });
    if (aliases.size > 0) {
        caracteristicas.push(`Uso de ${aliases.size} aliases de importação`);
    }
    const mediaComplexidade = estatisticas.reduce((sum, s) => sum + (s.complexidade ?? 0), 0) /
        estatisticas.length;
    caracteristicas.push(`Complexidade média: ${mediaComplexidade.toFixed(1)}`);
    const totalExports = estatisticas.reduce((sum, s) => {
        if (Array.isArray(s.exports)) {
            return sum + s.exports.length;
        }
        else if (typeof s.exports === 'number') {
            return sum + s.exports;
        }
        return sum;
    }, 0);
    caracteristicas.push(`${totalExports} exports públicos`);
    return caracteristicas;
}
function detectarDependenciasCirculares(estatisticas) {
    const dependencias = new Map();
    for (const stats of estatisticas) {
        const caminho = stats.caminho ?? 'arquivo-desconhecido';
        const deps = new Set();
        if (stats.dependenciasInternas) {
            stats.dependenciasInternas.forEach((dep) => deps.add(dep));
        }
        dependencias.set(caminho, deps);
    }
    for (const [arquivo, deps] of dependencias) {
        for (const dep of deps) {
            const depsDoDepdep = dependencias.get(dep);
            if (depsDoDepdep?.has(arquivo)) {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=detector-arquitetura.js.map