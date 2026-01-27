export function scoreArquetipo(def, _arquivos, _sinaisAvancados) {
    return {
        nome: def.nome,
        descricao: def.descricao ?? '',
        score: 0,
        confidence: 0,
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
    };
}
export function extrairSinaisAvancados(fileEntries, packageJson, _p0, _baseDir, _arquivos) {
    const hasIdName = (node) => {
        return (typeof node === 'object' &&
            node !== null &&
            'id' in node &&
            typeof node.id?.name === 'string');
    };
    const sinais = {
        funcoes: 0,
        imports: [],
        variaveis: 0,
        tipos: [],
        classes: 0,
        frameworksDetectados: [],
        dependencias: [],
        scripts: [],
        pastasPadrao: [],
        arquivosPadrao: [],
        arquivosConfig: [],
        padroesArquiteturais: [],
        tecnologiasDominantes: [],
        complexidadeEstrutura: 'baixa',
        tipoDominante: 'desconhecido',
    };
    const padroesDetectados = new Set();
    const tecnologias = new Map();
    for (const fe of fileEntries) {
        let body = [];
        if (fe.ast &&
            'node' in fe.ast &&
            fe.ast.node &&
            fe.ast.node.type === 'Program' &&
            Array.isArray(fe.ast.node.body)) {
            body = fe.ast.node.body;
        }
        const conteudo = fe.content || '';
        const relPath = fe.relPath.toLowerCase();
        if (relPath.includes('controller') ||
            relPath.includes('model') ||
            relPath.includes('view')) {
            padroesDetectados.add('mvc');
        }
        if (relPath.includes('repository') || relPath.includes('service')) {
            padroesDetectados.add('repository-service');
        }
        if (conteudo.includes('useState') || conteudo.includes('useEffect')) {
            tecnologias.set('react-hooks', (tecnologias.get('react-hooks') || 0) + 1);
        }
        if (conteudo.includes('async') && conteudo.includes('await')) {
            padroesDetectados.add('async-await');
        }
        if (conteudo.includes('interface') || conteudo.includes('type ')) {
            tecnologias.set('typescript-advanced', (tecnologias.get('typescript-advanced') || 0) + 1);
        }
        if (conteudo.includes('commander') ||
            conteudo.includes('yargs') ||
            relPath.includes('bin/')) {
            padroesDetectados.add('cli-patterns');
        }
        sinais.funcoes += body.filter((n) => n.type === 'FunctionDeclaration').length;
        const imports = body.filter((n) => n.type === 'ImportDeclaration');
        sinais.imports.push(...imports.map((i) => i.source.value));
        sinais.variaveis += body.filter((n) => n.type === 'VariableDeclaration').length;
        sinais.tipos.push(...body
            .filter((n) => [
            'TSTypeAliasDeclaration',
            'TSInterfaceDeclaration',
            'TSEnumDeclaration',
        ].includes(n.type))
            .map((n) => (hasIdName(n) ? n.id.name : undefined))
            .filter((v) => typeof v === 'string'));
        sinais.classes += body.filter((n) => n.type === 'ClassDeclaration').length;
        for (const i of imports) {
            if (typeof i.source.value === 'string') {
                const importSource = i.source.value.toLowerCase();
                if (importSource.includes('react') ||
                    importSource.includes('vue') ||
                    importSource.includes('angular')) {
                    tecnologias.set('frontend-framework', (tecnologias.get('frontend-framework') || 0) + 1);
                }
                if (importSource.includes('express') ||
                    importSource.includes('fastify') ||
                    importSource.includes('nestjs')) {
                    tecnologias.set('backend-framework', (tecnologias.get('backend-framework') || 0) + 1);
                }
                if (importSource.includes('prisma') ||
                    importSource.includes('mongoose') ||
                    importSource.includes('typeorm')) {
                    tecnologias.set('orm', (tecnologias.get('orm') || 0) + 1);
                }
                if (importSource.includes('jest') ||
                    importSource.includes('vitest') ||
                    importSource.includes('mocha')) {
                    tecnologias.set('testing-framework', (tecnologias.get('testing-framework') || 0) + 1);
                }
                if (/express|react|next|electron|discord\.js|telegraf/.test(importSource)) {
                    sinais.frameworksDetectados.push(i.source.value);
                }
            }
        }
        const rel = fe.relPath.replace(/\\/g, '/');
        if (/src\/controllers|pages|api|prisma|packages|apps|src\/routes|src\/services|src\/repositories/.test(rel)) {
            sinais.pastasPadrao.push(rel);
        }
        if (/main\.js|index\.ts|bot\.ts|electron\.js|server\.js|app\.js/.test(rel)) {
            sinais.arquivosPadrao.push(rel);
        }
        if (/tsconfig\.json|turbo\.json|pnpm-workspace\.yaml|webpack\.config|rollup\.config|vite\.config/.test(rel)) {
            sinais.arquivosConfig.push(rel);
        }
    }
    sinais.padroesArquiteturais = Array.from(padroesDetectados);
    let maxCount = 0;
    let dominante = 'desconhecido';
    for (const [tech, count] of tecnologias) {
        if (count > maxCount) {
            maxCount = count;
            dominante = tech;
        }
    }
    sinais.tecnologiasDominantes = Array.from(tecnologias.keys());
    sinais.tipoDominante = dominante;
    const totalArquivos = fileEntries.length;
    const totalPastas = new Set(fileEntries.map((fe) => fe.relPath.split('/').slice(0, -1).join('/'))).size;
    if (totalArquivos > 100 || totalPastas > 20) {
        sinais.complexidadeEstrutura = 'alta';
    }
    else if (totalArquivos > 50 || totalPastas > 10) {
        sinais.complexidadeEstrutura = 'media';
    }
    else {
        sinais.complexidadeEstrutura = 'baixa';
    }
    if (packageJson) {
        sinais.dependencias.push(...Object.keys(packageJson.dependencies || {}));
        sinais.scripts.push(...Object.keys(packageJson.scripts || {}));
    }
    sinais.imports = Array.from(new Set(sinais.imports));
    sinais.frameworksDetectados = Array.from(new Set(sinais.frameworksDetectados));
    sinais.pastasPadrao = Array.from(new Set(sinais.pastasPadrao));
    sinais.arquivosPadrao = Array.from(new Set(sinais.arquivosPadrao));
    sinais.arquivosConfig = Array.from(new Set(sinais.arquivosConfig));
    sinais.tipos = Array.from(new Set(sinais.tipos));
    return sinais;
}
//# sourceMappingURL=sinais-projeto-avancados.js.map