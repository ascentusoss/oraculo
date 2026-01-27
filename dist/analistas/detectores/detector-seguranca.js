import { traverse } from '../../core/config/traverse.js';
import { DetectorAgregadosMessages } from '../../core/messages/analistas/detector-agregados-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import { filtrarOcorrenciasSuprimidas } from '../../shared/helpers/suppressao.js';
import { criarOcorrencia } from '../../types/index.js';
function isPlaceholderSuspeito(linha) {
    const placeholdersComuns = [
        '<YOUR_',
        '<FOO>',
        '<BAR>',
        'REPLACE_ME',
        'EXAMPLE_',
        'PLACEHOLDER',
        'your_',
        'example',
        'sample',
        'demo',
        'test',
        'fake',
        'dummy',
        'mock',
    ];
    const linhaLower = linha.toLowerCase();
    return placeholdersComuns.some((p) => linhaLower.includes(p.toLowerCase()));
}
function isContextoDocumentacao(relPath) {
    const arquivosDoc = [
        'readme',
        'doc/',
        'docs/',
        '.md',
        '.example',
        '.sample',
        '.template',
        'third-party-notices',
        'license',
        'changelog',
    ];
    const pathLower = relPath.toLowerCase();
    return arquivosDoc.some((pattern) => pathLower.includes(pattern));
}
function calcularEntropia(str) {
    const frequencias = new Map();
    for (const char of str) {
        frequencias.set(char, (frequencias.get(char) || 0) + 1);
    }
    let entropia = 0;
    for (const freq of frequencias.values()) {
        const prob = freq / str.length;
        entropia -= prob * Math.log2(prob);
    }
    return entropia;
}
export const analistaSeguranca = {
    nome: 'seguranca',
    categoria: 'seguranca',
    descricao: 'Detecta vulnerabilidades e práticas inseguras no código',
    test: (relPath) => {
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(relPath);
    },
    aplicar: (src, relPath, ast) => {
        if (!src)
            return [];
        const contextoArquivo = detectarContextoProjeto({
            arquivo: relPath,
            conteudo: src,
            relPath,
        });
        const problemas = [];
        try {
            detectarPadroesPerigosos(src, relPath, problemas);
            if (ast) {
                detectarProblemasAST(ast, problemas);
            }
            const ocorrencias = [];
            const porSeveridade = agruparPorSeveridade(problemas);
            for (const [severidade, items] of Object.entries(porSeveridade)) {
                if (items.length > 0) {
                    const nivel = mapearSeveridadeParaNivel(severidade);
                    const nivelAjustado = contextoArquivo.isTest && nivel === 'aviso' ? 'info' : nivel;
                    const resumo = items
                        .slice(0, 3)
                        .map((p) => p.tipo)
                        .join(', ');
                    ocorrencias.push(criarOcorrencia({
                        tipo: 'vulnerabilidade-seguranca',
                        nivel: nivelAjustado,
                        mensagem: DetectorAgregadosMessages.problemasSegurancaResumo(severidade, resumo, items.length),
                        relPath,
                        linha: items[0].linha,
                    }));
                }
            }
            return filtrarOcorrenciasSuprimidas(ocorrencias, 'seguranca', src);
        }
        catch (erro) {
            return [
                criarOcorrencia({
                    tipo: 'ERRO_ANALISE',
                    nivel: 'aviso',
                    mensagem: DetectorAgregadosMessages.erroAnalisarSeguranca(erro),
                    relPath,
                    linha: 1,
                }),
            ];
        }
    },
};
function detectarPadroesPerigosos(src, relPath, problemas) {
    const linhas = src.split('\n');
    function isLikelyHttpHeaderName(value) {
        const v = String(value || '').trim();
        if (!v)
            return false;
        if (v.length < 4 || v.length > 80)
            return false;
        if (!/^[A-Za-z0-9-]+$/.test(v))
            return false;
        if (v.startsWith('-') || v.endsWith('-'))
            return false;
        if (!/-/.test(v) && !/^X[A-Za-z]?/.test(v))
            return false;
        return true;
    }
    function isHttpHeadersKeyValueContext(index) {
        const start = Math.max(0, index - 12);
        const end = Math.min(linhas.length, index + 6);
        const ctx = linhas.slice(start, end).join('\n');
        const hasHeaders = /\bheaders\b\s*[:=]/i.test(ctx) || /\bheader\b/i.test(ctx);
        const hasValueProp = /\bvalue\b\s*[:=]/i.test(ctx);
        return hasHeaders && hasValueProp;
    }
    linhas.forEach((linha, index) => {
        const numeroLinha = index + 1;
        const linhaSemComentarios = linha
            .replace(/\/\/.*$/, '')
            .replace(/\/\*.*?\*\//, '');
        const linhaSemStrings = linhaSemComentarios
            .replace(/'[^']*'/g, '')
            .replace(/"[^"]*"/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/\/[^\/]*\//g, '');
        if (/\beval\s*\(/.test(linhaSemStrings)) {
            problemas.push({
                tipo: 'eval-usage',
                descricao: 'Uso de eval() pode executar código malicioso',
                severidade: 'critica',
                linha: numeroLinha,
                sugestao: 'Use JSON.parse() ou funções específicas ao invés de eval()',
            });
        }
        if (/\.innerHTML\s*=\s*[^"']/.test(linha)) {
            problemas.push({
                tipo: 'dangerous-html',
                descricao: 'innerHTML com variáveis pode causar XSS',
                severidade: 'alta',
                linha: numeroLinha,
                sugestao: 'Use textContent ou sanitize o HTML antes de inserir',
            });
        }
        if (/Math\.random\(\)/.test(linha) &&
            /crypto|password|token|secret/i.test(linha)) {
            problemas.push({
                tipo: 'weak-crypto',
                descricao: 'Math.random() não é seguro para criptografia',
                severidade: 'alta',
                linha: numeroLinha,
                sugestao: 'Use crypto.randomBytes() ou crypto.getRandomValues()',
            });
        }
        if (/createHash\s*\(\s*['"`](md5|md4|sha1)['"`]\s*\)/.test(linha)) {
            const algoritmo = /createHash\s*\(\s*['"`](md5|md4|sha1)['"`]\s*\)/.exec(linha)?.[1];
            const linhaAnterior = index > 0 ? linhas[index - 1] : '';
            const linha2Atras = index > 1 ? linhas[index - 2] : '';
            const comentarioContexto = linhaAnterior + linha2Atras;
            const temJustificativa = /fingerprint|cache|baseline|perf|não.*segurança|not.*security|não.*criptograf/i.test(comentarioContexto) ||
                /apenas.*identifica|only.*identif|deduplica/i.test(comentarioContexto);
            if (!temJustificativa) {
                problemas.push({
                    tipo: 'weak-crypto',
                    descricao: `Algoritmo de hash ${algoritmo?.toUpperCase()} é considerado fraco`,
                    severidade: 'alta',
                    linha: numeroLinha,
                    sugestao: 'Use SHA-256 ou superior: createHash("sha256") - ou adicione comentário se for apenas fingerprinting',
                });
            }
        }
        if (/new RegExp\s*\([^)]*\)/.test(linha) &&
            /req\.|params\.|query\.|body\./.test(linha)) {
            problemas.push({
                tipo: 'unsafe-regex',
                descricao: 'RegExp com input não validado pode causar ReDoS',
                severidade: 'media',
                linha: numeroLinha,
                sugestao: 'Valide e escape o input antes de usar em RegExp',
            });
        }
        if (/__proto__/.test(linhaSemStrings)) {
            problemas.push({
                tipo: 'prototype-pollution',
                descricao: 'Manipulação de __proto__ pode causar prototype pollution',
                severidade: 'alta',
                linha: numeroLinha,
                sugestao: 'Use Object.create(null) ou Object.setPrototypeOf() com cuidado',
            });
        }
        if (/\.\.\//g.test(linha) && /req\.|params\.|query\./.test(linha)) {
            problemas.push({
                tipo: 'path-traversal',
                descricao: 'Possível vulnerabilidade de path traversal',
                severidade: 'alta',
                linha: numeroLinha,
                sugestao: 'Sanitize caminhos de arquivo e use path.resolve() com cuidado',
            });
        }
        const isNonSecretKey = /\b(migration|cache|hash|dedupe|lookup|map|index)key\b/i.test(linha);
        if (!isPlaceholderSuspeito(linha) &&
            !isContextoDocumentacao(relPath) &&
            !isNonSecretKey) {
            const padraoSegredo = /\b(password|pwd|pass|secret|key|token|api_key|apikey)\b\s*[:=]\s*['"`]([^'"`\s]{3,})/i;
            const match = linha.match(padraoSegredo);
            if (match) {
                const campo = String(match[1] || '').toLowerCase();
                const valor = match[2];
                if (campo === 'key' &&
                    isLikelyHttpHeaderName(valor) &&
                    isHttpHeadersKeyValueContext(index)) {
                    return;
                }
                const temInterpolacao = linha.includes('${') || /`[^`]*\$\{[^}]+\}/.test(linha);
                if (temInterpolacao) {
                    return;
                }
                const padroesNomenclatura = [
                    '_role_',
                    '_config_',
                    '_key_',
                    '_type_',
                    '_name_',
                    '_prefix_',
                    '_suffix_',
                    'squad_',
                    'channel_',
                    'guild_',
                ];
                const isPadraoNomenclatura = padroesNomenclatura.some((p) => valor.toLowerCase().includes(p.toLowerCase()));
                if (isPadraoNomenclatura) {
                    return;
                }
                const placeholdersSegurs = [
                    '<YOUR_',
                    '<FOO>',
                    '<BAR>',
                    'REPLACE_ME',
                    'EXAMPLE_',
                    'PLACEHOLDER',
                    'your_',
                    'example',
                    'sample',
                    'demo',
                    'test',
                    'fake',
                    'dummy',
                    'mock',
                ];
                const isPlaceholder = placeholdersSegurs.some((p) => valor.toLowerCase().includes(p.toLowerCase()));
                const entropia = calcularEntropia(valor);
                const temAltaEntropia = entropia > 3.5;
                const pareceTokReal = valor.length > 20 &&
                    (temAltaEntropia || /^[A-Za-z0-9+/]{20,}={0,2}$/.test(valor)) &&
                    !isPlaceholder;
                if (pareceTokReal) {
                    problemas.push({
                        tipo: 'hardcoded-secrets',
                        descricao: 'Credenciais hardcoded no código podem ser expostas',
                        severidade: 'critica',
                        linha: numeroLinha,
                        sugestao: 'Use variáveis de ambiente ou arquivo de configuração seguro',
                    });
                }
            }
        }
    });
    detectarAsyncSemTryCatch(src, problemas);
}
function detectarAsyncSemTryCatch(src, problemas) {
    const lines = src.split('\n');
    const isNextJsServerComponent = /^['"](use server|use client)['"]/.test(src.trim()) ||
        /export\s+(default\s+)?async\s+function/.test(src);
    const hasDynamicImport = /next\/dynamic|import\s*\(/.test(src);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (/\bawait\s+/.test(line) && !trimmedLine.startsWith('//')) {
            const contextLines = lines.slice(Math.max(0, i - 10), i);
            const context = contextLines.join(' ');
            const isEventHandler = /\.on\s*\(/.test(context) ||
                /\.once\s*\(/.test(context) ||
                /addEventListener\s*\(/.test(context) ||
                /collector\.on\s*\(/.test(context) ||
                /emitter\.on\s*\(/.test(context) ||
                /process\.on\s*\(/.test(context);
            const isDynamicImport = hasDynamicImport &&
                (/import\s*\(/.test(line) || /dynamic\s*\(/.test(context));
            if (isNextJsServerComponent || isDynamicImport) {
                continue;
            }
            const extendedContext = lines.slice(Math.max(0, i - 20), Math.min(lines.length, i + 10));
            const fullContext = extendedContext.join('\n');
            const hasErrorHandling = /try\s*\{[\s\S]*?\}\s*catch/.test(fullContext) ||
                /\.catch\s*\(/.test(line) ||
                /\.catch\s*\(/.test(lines[i + 1] || '') ||
                /\.then\s*\([^)]*\)\s*\.catch/.test(fullContext);
            if (!hasErrorHandling) {
                problemas.push({
                    tipo: isEventHandler ? 'unhandled-async-event' : 'unhandled-async',
                    descricao: isEventHandler
                        ? 'await em event handler sem tratamento de erro (considere adicionar .catch se necessário)'
                        : 'await sem tratamento de erro pode causar crashes não tratados',
                    severidade: isEventHandler ? 'baixa' : 'media',
                    linha: i + 1,
                    sugestao: isEventHandler
                        ? 'Event handlers são fire-and-forget. Adicione .catch() apenas se precisar tratar erros específicos'
                        : 'Envolva em try-catch ou use .catch() na Promise',
                });
            }
        }
    }
}
function detectarProblemasAST(ast, problemas) {
    try {
        traverse(ast.node, {
            NewExpression(path) {
                if (path.node.callee.type === 'Identifier' &&
                    path.node.callee.name === 'Function') {
                    problemas.push({
                        tipo: 'eval-usage',
                        descricao: 'Function constructor pode executar código dinâmico',
                        severidade: 'alta',
                        linha: path.node.loc?.start.line || 0,
                        sugestao: 'Evite Function constructor, use funções declaradas',
                    });
                }
            },
            CallExpression(path) {
                if (path.node.callee.type === 'Identifier' &&
                    ['setTimeout', 'setInterval'].includes(path.node.callee.name) &&
                    path.node.arguments[0]?.type === 'StringLiteral') {
                    problemas.push({
                        tipo: 'eval-usage',
                        descricao: 'setTimeout/setInterval com string executa código dinâmico',
                        severidade: 'media',
                        linha: path.node.loc?.start.line || 0,
                        sugestao: 'Use função ao invés de string',
                    });
                }
            },
        });
    }
    catch {
    }
}
function agruparPorSeveridade(problemas) {
    return problemas.reduce((acc, problema) => {
        if (!acc[problema.severidade]) {
            acc[problema.severidade] = [];
        }
        acc[problema.severidade].push(problema);
        return acc;
    }, {});
}
function mapearSeveridadeParaNivel(severidade) {
    switch (severidade) {
        case 'critica':
        case 'alta':
            return 'erro';
        case 'media':
            return 'aviso';
        case 'baixa':
        default:
            return 'info';
    }
}
//# sourceMappingURL=detector-seguranca.js.map