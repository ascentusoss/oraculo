import { getTypesDirectoryDisplay, isInsideTypesDirectory, } from '../../core/config/conventions.js';
import { DetectorInterfacesInlineMessages } from '../../core/messages/analistas/detector-interfaces-inline-messages.js';
const ANALISTA = {
    nome: 'detector-interfaces-inline',
    categoria: 'code-organization',
    descricao: 'Detecta interfaces e tipos complexos inline que deveriam estar em arquivos de tipos',
    test: (relPath) => {
        if (isInsideTypesDirectory(relPath)) {
            return false;
        }
        if (relPath.endsWith('.d.ts')) {
            return false;
        }
        if (relPath.includes('/.deprecados/') ||
            relPath.includes('\\.deprecados\\')) {
            return false;
        }
        if (relPath.includes('/node_modules/') ||
            relPath.includes('\\node_modules\\')) {
            return false;
        }
        return relPath.endsWith('.ts') || relPath.endsWith('.tsx');
    },
    aplicar: async (srcParam, relPath, _ast, _fullPath) => {
        const ocorrencias = [];
        const src = srcParam.replace(/\r\n/g, '\n');
        const _linhas = src.split('\n');
        const interfaceInlinePattern = /export\s+function\s+\w+\s*\([^)]*\):\s*{[^}]+}/g;
        let match;
        while ((match = interfaceInlinePattern.exec(src)) !== null) {
            const position = match.index || 0;
            const linha = src.substring(0, position).split('\n').length;
            if (isInStringOrComment(src, position)) {
                continue;
            }
            const detection = analyzeInlineInterface(match[0], linha, 'function-return');
            if (detection && detection.complexidade >= 5) {
                ocorrencias.push(createOcorrencia(detection, relPath));
            }
        }
        const complexParamPattern = /\w+\s*:\s*{\s*[^}]+;\s*[^}]+;\s*[^}]+}/g;
        while ((match = complexParamPattern.exec(src)) !== null) {
            const position = match.index || 0;
            const linha = src.substring(0, position).split('\n').length;
            if (isInStringOrComment(src, position)) {
                continue;
            }
            const detection = analyzeInlineInterface(match[0], linha, 'parameter');
            if (detection && detection.complexidade >= 5) {
                ocorrencias.push(createOcorrencia(detection, relPath));
            }
        }
        const typeStartPattern = /type\s+(\w+)\s*=/g;
        let startMatch;
        while ((startMatch = typeStartPattern.exec(src)) !== null) {
            const position = startMatch.index || 0;
            const nomeTipo = startMatch[1];
            if (isInStringOrComment(src, position)) {
                continue;
            }
            const afterEquals = src.substring(position + startMatch[0].length);
            const tipoCompleto = extractTypeDefinition(afterEquals);
            if (!tipoCompleto) {
                continue;
            }
            const linha = src.substring(0, position).split('\n').length;
            const complexidade = calculateComplexidade(tipoCompleto);
            if (complexidade >= 5) {
                const detection = {
                    tipo: 'type-alias',
                    nome: nomeTipo,
                    linha,
                    complexidade,
                    contexto: tipoCompleto.substring(0, 100),
                    sugestao: DetectorInterfacesInlineMessages.moverTipoParaTipos(nomeTipo),
                };
                ocorrencias.push(createOcorrencia(detection, relPath));
            }
        }
        const exportInterfacePattern = /export\s+interface\s+(\w+)\s*(<[^>]*>)?\s*\{/g;
        while ((match = exportInterfacePattern.exec(src)) !== null) {
            const position = match.index || 0;
            const linha = src.substring(0, position).split('\n').length;
            const nomeInterface = match[1];
            if (isInStringOrComment(src, position)) {
                continue;
            }
            const detection = {
                tipo: 'interface',
                nome: nomeInterface,
                linha,
                complexidade: 0,
                contexto: `export interface ${nomeInterface}`,
                sugestao: DetectorInterfacesInlineMessages.interfaceExportadaParaTipos(nomeInterface),
            };
            ocorrencias.push(createOcorrencia(detection, relPath));
        }
        const interfaceDeclarationPattern = /(?<!export\s+)interface\s+(\w+)\s*\{[\s\S]+?\}/g;
        while ((match = interfaceDeclarationPattern.exec(src)) !== null) {
            const position = match.index || 0;
            const linha = src.substring(0, position).split('\n').length;
            const nomeInterface = match[1];
            if (isInStringOrComment(src, position)) {
                continue;
            }
            const jaDetetada = ocorrencias.some((o) => o.linha === linha && o.mensagem?.includes(nomeInterface));
            if (jaDetetada) {
                continue;
            }
            const isLocal = /^[a-z]/.test(nomeInterface);
            const interfaceCompleta = match[0];
            const complexidade = calculateComplexidade(interfaceCompleta);
            if (complexidade >= 4 && !isLocal) {
                const detection = {
                    tipo: 'interface',
                    nome: nomeInterface,
                    linha,
                    complexidade,
                    contexto: interfaceCompleta.substring(0, 100),
                    sugestao: DetectorInterfacesInlineMessages.interfaceComplexaParaTipos(nomeInterface),
                };
                ocorrencias.push(createOcorrencia(detection, relPath));
            }
        }
        const tiposInline = extractAllInlineTypes(src);
        const tiposRepetidos = findDuplicateTypes(tiposInline);
        for (const [estrutura, ocorrenciasArray] of tiposRepetidos.entries()) {
            const totalOcorrencias = ocorrenciasArray.length;
            const primeiraOcorrencia = ocorrenciasArray[0];
            const propriedades = estrutura
                .split(';')
                .map((p) => p.split(':')[0])
                .slice(0, 3);
            const nomesSugeridos = propriedades.join('_');
            const contextosUnicos = [
                ...new Set(ocorrenciasArray.map((o) => o.contexto)),
            ];
            const contextoDesc = contextosUnicos.length > 1
                ? `em ${contextosUnicos.length} contextos diferentes`
                : 'no mesmo contexto';
            ocorrencias.push({
                tipo: 'interface-inline-duplicada',
                nivel: 'aviso',
                mensagem: DetectorInterfacesInlineMessages.tipoDuplicado({
                    propriedades,
                    totalOcorrencias,
                    contextoDesc,
                    nomesSugeridos,
                }),
                relPath,
                linha: primeiraOcorrencia.linha,
                detalhes: {
                    estrutura,
                    ocorrencias: ocorrenciasArray.length,
                    linhas: ocorrenciasArray.map((o) => o.linha),
                    contextos: contextosUnicos,
                },
            });
        }
        return ocorrencias;
    },
};
function analyzeInlineInterface(code, linha, contexto) {
    const tiposDirDisplay = getTypesDirectoryDisplay();
    const complexidade = calculateComplexidade(code);
    if (complexidade < 5) {
        return null;
    }
    let sugestao = '';
    switch (contexto) {
        case 'function-return':
            sugestao = `Extrair tipo de retorno para interface em ${tiposDirDisplay}`;
            break;
        case 'parameter':
            sugestao = `Extrair tipo de parâmetro para interface em ${tiposDirDisplay}`;
            break;
        case 'variable':
            sugestao = `Extrair tipo da variável para interface em ${tiposDirDisplay}`;
            break;
    }
    return {
        tipo: 'object-literal-type',
        linha,
        complexidade,
        contexto: code.substring(0, 100),
        sugestao,
    };
}
function calculateComplexidade(tipoString) {
    let score = 0;
    const propriedadesMultilinha = (tipoString.match(/[;:]\s*\n/g) || []).length;
    const propriedadesInline = (tipoString.match(/;\s*\w+\s*:/g) || []).length;
    const propriedadesTotal = (tipoString.match(/\w+\s*\??\s*:/g) || []).length;
    score += Math.max(propriedadesMultilinha, propriedadesInline + 1, propriedadesTotal);
    const unioes = (tipoString.match(/\|/g) || []).length;
    score += unioes * 0.5;
    const intersecoes = (tipoString.match(/&/g) || []).length;
    score += intersecoes * 0.5;
    const genericosAninhados = (tipoString.match(/<[^>]*</g) || []).length;
    score += genericosAninhados * 2;
    const aninhamento = (tipoString.match(/{\s*\w+\s*:/g) || []).length;
    score += aninhamento;
    return Math.floor(score);
}
function extractTypeStructure(tipoString) {
    const props = [];
    const propPattern = /(\w+)\??\s*:\s*([^;,}]+)/g;
    let match;
    while ((match = propPattern.exec(tipoString)) !== null) {
        const propName = match[1];
        let propType = match[2].trim();
        propType = propType
            .replace(/\s+/g, ' ')
            .replace(/string|number|boolean|null|undefined/gi, (m) => m.toLowerCase())
            .replace(/\[\]/g, 'Array')
            .replace(/Record<[^>]+>/g, 'Record')
            .replace(/Promise<[^>]+>/g, 'Promise')
            .trim();
        props.push(`${propName}:${propType}`);
    }
    return props.sort().join(';');
}
function extractAllInlineTypes(src) {
    const tipos = [];
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const typeObjStart = /[:=<]\s*\{\s*$/;
        const inlineTypeObj = /:\s*\{[^}]+\}/g;
        let match;
        while ((match = inlineTypeObj.exec(line)) !== null) {
            const matchIndex = match.index ?? 0;
            const position = src.substring(0, src.indexOf(lines.slice(0, i + 1).join('\n'))).length +
                matchIndex;
            if (!isInStringOrComment(src, position)) {
                const tipoOriginal = match[0].substring(match[0].indexOf('{'));
                const complexidade = calculateComplexidade(tipoOriginal);
                if (complexidade >= 4) {
                    const estrutura = extractTypeStructure(tipoOriginal);
                    const contexto = line
                        .substring(0, matchIndex)
                        .trim()
                        .substring(0, 60);
                    const linha = i + 1;
                    tipos.push({
                        tipo: tipoOriginal.replace(/\s+/g, ' ').trim(),
                        estrutura,
                        linha,
                        contexto,
                    });
                }
            }
        }
        if (typeObjStart.test(line) && !line.includes('//')) {
            let depth = 1;
            const tipoLines = ['{'];
            let j = i + 1;
            while (j < lines.length && depth > 0) {
                const nextLine = lines[j];
                tipoLines.push(nextLine);
                for (const char of nextLine) {
                    if (char === '{')
                        depth++;
                    if (char === '}')
                        depth--;
                    if (depth === 0)
                        break;
                }
                j++;
                if (j - i > 50)
                    break;
            }
            if (depth === 0) {
                const tipoOriginal = tipoLines.join('\n').trim();
                const position = src.indexOf(tipoOriginal);
                if (position !== -1 && !isInStringOrComment(src, position)) {
                    const complexidade = calculateComplexidade(tipoOriginal);
                    if (complexidade >= 4) {
                        const estrutura = extractTypeStructure(tipoOriginal);
                        const contexto = line
                            .substring(0, line.indexOf('{'))
                            .trim()
                            .substring(0, 60);
                        const linha = i + 1;
                        tipos.push({
                            tipo: tipoOriginal.replace(/\s+/g, ' ').trim(),
                            estrutura,
                            linha,
                            contexto,
                        });
                    }
                }
            }
        }
    }
    return tipos;
}
function findDuplicateTypes(tipos) {
    const mapa = new Map();
    for (const { estrutura, linha, tipo, contexto } of tipos) {
        if (!mapa.has(estrutura)) {
            mapa.set(estrutura, []);
        }
        const arr = mapa.get(estrutura);
        if (arr) {
            arr.push({ linha, tipo, contexto });
        }
    }
    const duplicados = new Map();
    for (const [estrutura, ocorrencias] of mapa.entries()) {
        const contextosUnicos = new Set(ocorrencias.map((o) => o.contexto)).size;
        if (ocorrencias.length >= 4 ||
            (ocorrencias.length >= 3 && contextosUnicos >= 2)) {
            duplicados.set(estrutura, ocorrencias);
        }
    }
    return duplicados;
}
function createOcorrencia(detection, relPath) {
    const tiposDirDisplay = getTypesDirectoryDisplay();
    let tipo = '';
    let nivel = 'info';
    let mensagem = '';
    switch (detection.tipo) {
        case 'interface':
            tipo = 'interface-inline-exportada';
            nivel = 'aviso';
            mensagem = detection.nome
                ? `Interface '${detection.nome}' deve estar em ${tiposDirDisplay}`
                : `Interface inline deve estar em ${tiposDirDisplay}`;
            break;
        case 'type-alias':
            tipo = 'type-alias-inline-complexo';
            nivel = 'aviso';
            mensagem = detection.nome
                ? `Tipo '${detection.nome}' complexo deve estar em ${tiposDirDisplay}`
                : `Tipo complexo deve estar em ${tiposDirDisplay}`;
            break;
        case 'object-literal-type':
            tipo = 'tipo-literal-inline-complexo';
            nivel = 'info';
            mensagem = `Tipo literal complexo (${detection.complexidade} propriedades) - considere extrair`;
            break;
    }
    return {
        tipo,
        nivel,
        mensagem,
        relPath,
        linha: detection.linha,
    };
}
function extractTypeDefinition(afterEquals) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let result = '';
    for (let i = 0; i < afterEquals.length; i++) {
        const char = afterEquals[i];
        const prevChar = i > 0 ? afterEquals[i - 1] : '';
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (inString && char === stringChar) {
                inString = false;
            }
            else if (!inString) {
                inString = true;
                stringChar = char;
            }
        }
        if (inString) {
            result += char;
            continue;
        }
        if (char === '{' || char === '<' || char === '[' || char === '(') {
            depth++;
        }
        else if (char === '}' || char === '>' || char === ']' || char === ')') {
            depth--;
        }
        result += char;
        if (char === ';' && depth === 0) {
            return result;
        }
    }
    return null;
}
function isInStringOrComment(src, position) {
    const beforePosition = src.substring(0, position);
    const linha = beforePosition.split('\n').pop() || '';
    if (linha.includes('//')) {
        const commentPos = linha.indexOf('//');
        const posInLine = beforePosition.length - beforePosition.lastIndexOf('\n') - 1;
        if (posInLine > commentPos) {
            return true;
        }
    }
    const lastBlockCommentStart = beforePosition.lastIndexOf('/*');
    const lastBlockCommentEnd = beforePosition.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
        return true;
    }
    const singleQuotes = (beforePosition.match(/'/g) || []).length;
    const doubleQuotes = (beforePosition.match(/"/g) || []).length;
    const backticks = (beforePosition.match(/`/g) || []).length;
    return (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0);
}
export default ANALISTA;
//# sourceMappingURL=detector-interfaces-inline.js.map