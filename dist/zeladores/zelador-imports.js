import { promises as fs } from 'node:fs';
import path from 'node:path';
import { log } from '../core/messages/index.js';
import { ERROS_IMPORTS, gerarResumoImports, MENSAGENS_IMPORTS, PROGRESSO_IMPORTS, } from '../core/messages/zeladores/zelador-messages.js';
const DEFAULT_ALIAS_CONFIG = {
    '': './core',
    '': './analistas',
    '': './types',
    '': './shared',
    '': './cli',
    '': './guardian',
    '': './relatorios',
    '': './zeladores',
};
const PATTERNS = {
    tiposComExtensao: /\/types\.js\b/g,
    importRelativo: /from\s+(['"])(\.\.[\/\\].+?)\1/g,
};
async function* walkDirectory(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (['node_modules', 'dist', 'coverage', '.git'].includes(entry.name)) {
                    continue;
                }
                yield* walkDirectory(fullPath);
            }
            else if (entry.isFile()) {
                if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
                    yield fullPath;
                }
            }
        }
    }
    catch (error) {
        log.erro(ERROS_IMPORTS.lerDiretorio(dir, error));
    }
}
function corrigirImportsTipos(conteudo) {
    const correcoes = [];
    let conteudoAtualizado = conteudo;
    conteudoAtualizado = conteudoAtualizado.replace(PATTERNS.tiposComExtensao, (match, offset) => {
        correcoes.push({
            tipo: 'tipos-extensao',
            de: match,
            para: '/types',
            linha: conteudo.substring(0, offset).split('\n').length,
        });
        return '/types';
    });
    const regex = /(['"])\/([^'"\n]+?)\1/g;
    conteudoAtualizado = conteudoAtualizado.replace(regex, (match, quote, subpath, offset) => {
        const normalized = String(subpath || '').trim();
        if (normalized === 'types')
            return match;
        if (normalized === 'types.js') {
            const novoImport = `${quote}/types${quote}`;
            correcoes.push({
                tipo: 'tipos-extensao',
                de: match,
                para: novoImport,
                linha: conteudo.substring(0, offset).split('\n').length,
            });
            return novoImport;
        }
        const novoImport = `${quote}/types${quote}`;
        correcoes.push({
            tipo: 'tipos-subpath',
            de: match,
            para: novoImport,
            linha: conteudo.substring(0, offset).split('\n').length,
        });
        return novoImport;
    });
    return { conteudo: conteudoAtualizado, correcoes };
}
function corrigirImportsRelativos(conteudo, _filePath, _projectRoot, _aliasConfig) {
    const correcoes = [];
    const conteudoAtualizado = conteudo;
    return { conteudo: conteudoAtualizado, correcoes };
}
async function processarArquivo(filePath, options) {
    const resultado = {
        arquivo: path.relative(options.projectRoot, filePath),
        correcoes: [],
        modificado: false,
    };
    try {
        const conteudoOriginal = await fs.readFile(filePath, 'utf-8');
        let conteudoAtualizado = conteudoOriginal;
        if (options.corrigirTipos !== false) {
            const { conteudo, correcoes } = corrigirImportsTipos(conteudoAtualizado);
            conteudoAtualizado = conteudo;
            resultado.correcoes.push(...correcoes);
        }
        if (options.corrigirRelativos !== false) {
            const { conteudo, correcoes } = corrigirImportsRelativos(conteudoAtualizado, filePath, options.projectRoot, options.aliasConfig || DEFAULT_ALIAS_CONFIG);
            conteudoAtualizado = conteudo;
            resultado.correcoes.push(...correcoes);
        }
        if (conteudoAtualizado !== conteudoOriginal) {
            if (!options.dryRun) {
                await fs.writeFile(filePath, conteudoAtualizado, 'utf-8');
            }
            resultado.modificado = true;
        }
    }
    catch (error) {
        resultado.erro = error instanceof Error ? error.message : String(error);
    }
    return resultado;
}
export async function executarZeladorImports(targetDirs, options = {}) {
    const projectRoot = options.projectRoot || process.cwd();
    const fullOptions = {
        projectRoot,
        dryRun: options.dryRun ?? false,
        verbose: options.verbose ?? false,
        corrigirTipos: options.corrigirTipos ?? true,
        corrigirRelativos: options.corrigirRelativos ?? false,
        aliasConfig: options.aliasConfig || DEFAULT_ALIAS_CONFIG,
    };
    const resultados = [];
    for (const dir of targetDirs) {
        const fullPath = path.resolve(projectRoot, dir);
        try {
            await fs.access(fullPath);
        }
        catch {
            if (fullOptions.verbose) {
                log.aviso(PROGRESSO_IMPORTS.diretorioNaoEncontrado(dir));
            }
            continue;
        }
        for await (const filePath of walkDirectory(fullPath)) {
            const resultado = await processarArquivo(filePath, fullOptions);
            if (resultado.modificado || resultado.erro) {
                resultados.push(resultado);
                if (fullOptions.verbose) {
                    if (resultado.modificado) {
                        log.sucesso(PROGRESSO_IMPORTS.arquivoProcessado(resultado.arquivo, resultado.correcoes.length));
                    }
                    if (resultado.erro) {
                        log.erro(PROGRESSO_IMPORTS.arquivoErro(resultado.arquivo, resultado.erro));
                    }
                }
            }
        }
    }
    return resultados;
}
export function gerarRelatorioCorrecoes(resultados) {
    const modificados = resultados.filter((r) => r.modificado);
    const comErro = resultados.filter((r) => r.erro);
    const totalCorrecoes = modificados.reduce((sum, r) => sum + r.correcoes.length, 0);
    const linhas = [
        '# Relatório de Correções de Imports\n',
        `Arquivos processados: ${resultados.length}`,
        `Arquivos modificados: ${modificados.length}`,
        `Total de correções: ${totalCorrecoes}`,
        `Erros: ${comErro.length}\n`,
    ];
    if (modificados.length > 0) {
        linhas.push('## Arquivos Modificados\n');
        for (const resultado of modificados) {
            linhas.push(`### ${resultado.arquivo}`);
            linhas.push(`**Correções:** ${resultado.correcoes.length}\n`);
            const porTipo = resultado.correcoes.reduce((acc, c) => {
                acc[c.tipo] = (acc[c.tipo] || 0) + 1;
                return acc;
            }, {});
            for (const [tipo, count] of Object.entries(porTipo)) {
                linhas.push(`- ${tipo}: ${count}`);
            }
            linhas.push('');
        }
    }
    if (comErro.length > 0) {
        linhas.push('## Erros\n');
        for (const resultado of comErro) {
            linhas.push(`- **${resultado.arquivo}**: ${resultado.erro}`);
        }
        linhas.push('');
    }
    return linhas.join('\n');
}
export async function corrigirImports(dirs = ['src', 'tests'], options = {}) {
    log.fase?.(MENSAGENS_IMPORTS.titulo);
    console.log();
    const resultados = await executarZeladorImports(dirs, {
        ...options,
        verbose: true,
    });
    const modificados = resultados.filter((r) => r.modificado);
    const totalCorrecoes = modificados.reduce((sum, r) => sum + r.correcoes.length, 0);
    const comErro = resultados.filter((r) => r.erro);
    const resumo = gerarResumoImports({
        processados: resultados.length,
        modificados: modificados.length,
        totalCorrecoes,
        erros: comErro.length,
        dryRun: options.dryRun ?? false,
    });
    for (const linha of resumo) {
        if (linha === '') {
            console.log();
        }
        else if (linha.includes('✅')) {
            log.sucesso(linha);
        }
        else if (linha.includes('⚠️')) {
            log.aviso(linha);
        }
        else {
            log.info(linha);
        }
    }
}
//# sourceMappingURL=zelador-imports.js.map