import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ARQUETIPOS } from '../estrategistas/arquetipos-defs.js';
import { log } from '../../core/messages/index.js';
import { ORACULO_FILES } from '../../core/registry/paths.js';
import { lerEstado, salvarEstado } from '../../shared/persistence/persistencia.js';
const ARQUETIPO_PERSONALIZADO_FILENAME = 'oraculo.repo.arquetipo.json';
export async function carregarArquetipoPersonalizado(baseDir = process.cwd()) {
    const novoCaminho = ORACULO_FILES.ESTRUTURA_ARQUETIPO;
    const caminhoLegado = path.join(baseDir, ARQUETIPO_PERSONALIZADO_FILENAME);
    try {
        const arquetipo = await lerEstado(novoCaminho, null);
        if (arquetipo && arquetipo.nome && arquetipo.arquetipoOficial) {
            return arquetipo;
        }
        const arquetipoLegado = await lerEstado(caminhoLegado, null);
        if (!arquetipoLegado ||
            !arquetipoLegado.nome ||
            !arquetipoLegado.arquetipoOficial) {
            const isTest = (process.env.VITEST ?? '') !== '';
            const isVerbose = log.verbose || false;
            if (!isTest && isVerbose) {
                log.aviso(`⚠️ Arquétipo personalizado não encontrado em ${novoCaminho} nem ${caminhoLegado}`);
            }
            return null;
        }
        return arquetipoLegado;
    }
    catch {
        return null;
    }
}
export async function salvarArquetipoPersonalizado(arquetipo, _baseDir = process.cwd()) {
    const arquetipoCompleto = {
        ...arquetipo,
        metadata: {
            criadoEm: new Date().toISOString(),
            versao: '1.0.0',
            notasUsuario: undefined,
        },
    };
    const novoCaminho = ORACULO_FILES.ESTRUTURA_ARQUETIPO;
    const oraculoDir = path.dirname(novoCaminho);
    try {
        await fs.mkdir(oraculoDir, { recursive: true });
    }
    catch {
    }
    await salvarEstado(novoCaminho, arquetipoCompleto);
    log.sucesso(`✅ Arquétipo personalizado salvo em ${novoCaminho}`);
}
export async function existeArquetipoPersonalizado(baseDir = process.cwd()) {
    try {
        await fs.access(ORACULO_FILES.ESTRUTURA_ARQUETIPO);
        return true;
    }
    catch {
        const arquivoArquetipo = path.join(baseDir, ARQUETIPO_PERSONALIZADO_FILENAME);
        try {
            await fs.access(arquivoArquetipo);
            return true;
        }
        catch {
            return false;
        }
    }
}
export function obterArquetipoOficial(arquetipoPersonalizado) {
    return (ARQUETIPOS.find((arq) => arq.nome ===
        arquetipoPersonalizado.arquetipoOficial) || null);
}
export function gerarSugestaoArquetipoPersonalizado(projetoDesconhecido) {
    const sugestao = `
🌟 Projeto personalizado detectado: "${projetoDesconhecido.nome}"

O Oráculo identificou uma estrutura de projeto que não corresponde a arquétipos oficiais,
mas você pode criar um arquétipo personalizado para receber sugestões otimizadas!

📁 Estrutura detectada:
${projetoDesconhecido.estruturaDetectada.map((dir) => `  • ${dir}`).join('\n')}

📄 Arquivos na raiz:
${projetoDesconhecido.arquivosRaiz
        .slice(0, 5)
        .map((file) => `  • ${file}`)
        .join('\n')}
${projetoDesconhecido.arquivosRaiz.length > 5 ? `  • ... e mais ${projetoDesconhecido.arquivosRaiz.length - 5} arquivos` : ''}

💡 Para criar seu arquétipo personalizado, execute:
   oraculo diagnosticar --criar-arquetipo

Isso criará um arquivo 'oraculo.repo.arquetipo.json' com base na estrutura atual,
que o Oráculo usará para oferecer sugestões personalizadas mantendo as melhores práticas.
`;
    return sugestao;
}
export function criarTemplateArquetipoPersonalizado(nomeProjeto, estruturaDetectada, arquivosRaiz, arquetipoSugerido = 'generico') {
    let arquetipoOficial = arquetipoSugerido;
    if (arquetipoOficial === 'generico' || !arquetipoOficial) {
        const temBin = estruturaDetectada.some((dir) => dir === 'bin' || dir.startsWith('bin/'));
        const temCli = estruturaDetectada.some((dir) => dir.includes('/cli') || dir === 'cli');
        const temCommands = estruturaDetectada.some((dir) => dir.includes('/commands') || dir === 'commands');
        if (temBin && (temCli || temCommands)) {
            arquetipoOficial = 'cli-modular';
        }
        else if (estruturaDetectada.some((dir) => dir === 'src/bot' || dir.startsWith('src/bot/')) &&
            estruturaDetectada.some((dir) => dir.includes('events') || dir.includes('scenes'))) {
            arquetipoOficial = 'bot';
        }
        else if (estruturaDetectada.some((dir) => dir.includes('controllers')) &&
            estruturaDetectada.some((dir) => dir.includes('routes'))) {
            arquetipoOficial = 'api-rest-express';
        }
        else if (estruturaDetectada.some((dir) => dir.includes('pages')) &&
            estruturaDetectada.some((dir) => dir.includes('api'))) {
            arquetipoOficial = 'fullstack';
        }
        else if (estruturaDetectada.some((dir) => dir === 'src' || dir.startsWith('src/'))) {
            arquetipoOficial = 'lib-tsc';
        }
    }
    const diretoriosPrincipais = estruturaDetectada
        .filter((dir) => !dir.includes('/') || dir.split('/').length <= 2)
        .filter((dir) => !dir.startsWith('node_modules') && !dir.startsWith('.git'));
    const arquivosChave = arquivosRaiz
        .filter((file) => ['package.json', 'tsconfig.json', 'README.md', '.env.example'].includes(file) ||
        file.endsWith('.ts') ||
        file.endsWith('.js'))
        .slice(0, 5);
    return {
        nome: nomeProjeto,
        descricao: `Projeto personalizado: ${nomeProjeto}`,
        arquetipoOficial,
        estruturaPersonalizada: {
            diretorios: diretoriosPrincipais,
            arquivosChave,
            padroesNomenclatura: {
                ...(estruturaDetectada.some((d) => d.includes('components')) && {
                    components: '*-component.*',
                }),
                ...(estruturaDetectada.some((d) => d.includes('utils')) && {
                    utils: '*-util.*',
                }),
                ...(estruturaDetectada.some((d) => d.includes('test')) && {
                    tests: '*.test.*',
                }),
            },
        },
        melhoresPraticas: {
            recomendado: ['src/', 'tests/', 'docs/', 'README.md', '.env.example'],
            evitar: ['temp/', 'cache/', '*.log'],
            notas: [
                'Mantenha código fonte organizado em src/',
                'Separe testes em pasta dedicada',
                'Documente APIs e funcionalidades importantes',
            ],
        },
    };
}
export function validarArquetipoPersonalizado(arquetipo) {
    const erros = [];
    if (!arquetipo.nome || typeof arquetipo.nome !== 'string') {
        erros.push('Nome do projeto é obrigatório');
    }
    if (!arquetipo.arquetipoOficial ||
        typeof arquetipo.arquetipoOficial !== 'string') {
        erros.push('Arquétipo oficial base é obrigatório');
    }
    else {
        const arquetipoOficial = ARQUETIPOS.find((arq) => arq.nome === arquetipo.arquetipoOficial);
        if (!arquetipoOficial) {
            erros.push(`Arquétipo oficial '${arquetipo.arquetipoOficial}' não encontrado. Use: ${ARQUETIPOS.map((a) => a.nome).join(', ')}`);
        }
    }
    if (!arquetipo.estruturaPersonalizada) {
        erros.push('Estrutura personalizada é obrigatória');
    }
    else {
        if (!Array.isArray(arquetipo.estruturaPersonalizada.diretorios)) {
            erros.push('Diretórios devem ser um array');
        }
        if (!Array.isArray(arquetipo.estruturaPersonalizada.arquivosChave)) {
            erros.push('Arquivos-chave devem ser um array');
        }
    }
    return {
        valido: erros.length === 0,
        erros,
    };
}
export function listarArquetiposOficiais() {
    return ARQUETIPOS;
}
export function integrarArquetipos(personalizado, oficial) {
    return {
        ...oficial,
        nome: personalizado.nome,
        descricao: personalizado.descricao || oficial.descricao,
        requiredDirs: personalizado.estruturaPersonalizada.diretorios,
        optionalDirs: oficial.optionalDirs,
        rootFilesAllowed: personalizado.estruturaPersonalizada.arquivosChave,
        forbiddenDirs: oficial.forbiddenDirs,
        dependencyHints: oficial.dependencyHints,
        filePresencePatterns: oficial.filePresencePatterns,
        pesoBase: oficial.pesoBase,
    };
}
//# sourceMappingURL=arquetipos-personalizados.js.map