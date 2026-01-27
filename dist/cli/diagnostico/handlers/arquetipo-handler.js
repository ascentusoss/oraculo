import { detectarArquetipos } from '../../../analistas/detectores/detector-arquetipos.js';
import { config } from '../../../core/config/config.js';
import { CliArquetipoHandlerMessages } from '../../../core/messages/cli/cli-arquetipo-handler-messages.js';
import { MENSAGENS_ARQUETIPOS } from '../../../core/messages/core/diagnostico-messages.js';
import { log } from '../../../core/messages/index.js';
const DEFAULT_TIMEOUT_MS = process.env.VITEST ? 1000 : 30000;
export async function executarDeteccaoArquetipos(entries, baseDir, options) {
    if (!options.enabled) {
        return {
            executado: false,
        };
    }
    try {
        if (!options.silent) {
            log.info(MENSAGENS_ARQUETIPOS.detectando);
        }
        const ctx = {
            arquivos: entries,
            baseDir,
        };
        const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;
        const resultado = await executarComTimeout(detectarArquetipos(ctx, baseDir), timeoutMs);
        if (!resultado) {
            if (!options.silent) {
                log.aviso(CliArquetipoHandlerMessages.timeoutDeteccao);
            }
            return {
                executado: true,
                erro: 'timeout',
            };
        }
        const arquetipos = resultado.candidatos || [];
        const principal = arquetipos.length > 0 ? arquetipos[0] : undefined;
        if (!options.silent && principal) {
            log.info(MENSAGENS_ARQUETIPOS.identificado(principal.nome, principal.confidence));
            if (arquetipos.length > 1) {
                log.info(MENSAGENS_ARQUETIPOS.multiplos(arquetipos.length));
            }
        }
        let salvo = false;
        if (options.salvar && resultado) {
            salvo = await salvarArquetipo(resultado, baseDir, options.silent);
        }
        return {
            executado: true,
            arquetipos: arquetipos.map((a) => ({
                tipo: a.nome,
                confianca: a.confidence,
                caracteristicas: a.matchedRequired || [],
            })),
            principal: principal
                ? {
                    tipo: principal.nome,
                    confianca: principal.confidence,
                }
                : undefined,
            salvo,
        };
    }
    catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        if (!options.silent) {
            log.aviso(CliArquetipoHandlerMessages.erroDeteccao(mensagem));
        }
        if (config.DEV_MODE) {
            console.error(CliArquetipoHandlerMessages.devErroPrefixo, erro);
        }
        return {
            executado: true,
            erro: mensagem,
        };
    }
}
async function executarComTimeout(promise, timeoutMs) {
    try {
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(undefined), timeoutMs));
        return (await Promise.race([promise, timeoutPromise]));
    }
    catch {
        return undefined;
    }
}
async function salvarArquetipo(resultado, baseDir, silent) {
    try {
        if (!silent) {
            log.info(MENSAGENS_ARQUETIPOS.salvando);
        }
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const arquetipo = {
            timestamp: new Date().toISOString(),
            projeto: path.basename(baseDir),
            arquetipos: resultado.candidatos,
            baseline: resultado.baseline,
            drift: resultado.drift,
        };
        const outputPath = path.join(baseDir, 'oraculo.repo.arquetipo.json');
        await fs.writeFile(outputPath, JSON.stringify(arquetipo, null, 2), 'utf-8');
        if (!silent) {
            log.sucesso(MENSAGENS_ARQUETIPOS.salvo(outputPath));
        }
        return true;
    }
    catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        if (!silent) {
            log.aviso(CliArquetipoHandlerMessages.falhaSalvar(mensagem));
        }
        return false;
    }
}
export function formatarArquetiposParaJson(result) {
    if (!result.executado) {
        return {
            executado: false,
        };
    }
    if (result.erro) {
        return {
            executado: true,
            erro: result.erro,
        };
    }
    return {
        executado: true,
        arquetipos: result.arquetipos || [],
        principal: result.principal || null,
        salvo: result.salvo || false,
    };
}
export function gerarSugestoesArquetipo(result) {
    const sugestoes = [];
    if (!result.executado || !result.principal) {
        return sugestoes;
    }
    const { tipo, confianca } = result.principal;
    switch (tipo.toLowerCase()) {
        case 'monorepo':
            sugestoes.push('💡 Monorepo detectado: considere usar filtros por workspace');
            sugestoes.push('💡 Use --include packages/* para analisar workspaces específicos');
            break;
        case 'biblioteca':
        case 'library':
            sugestoes.push('💡 Biblioteca detectada: foque em exports públicos e documentação');
            sugestoes.push('💡 Use --guardian para verificar API pública');
            break;
        case 'cli':
        case 'cli-tool':
            sugestoes.push('💡 CLI detectado: priorize testes de comandos e flags');
            break;
        case 'api':
        case 'api-rest':
        case 'api-server':
            sugestoes.push('💡 API detectada: foque em endpoints e contratos');
            sugestoes.push('💡 Considere testes de integração para rotas');
            break;
        case 'frontend':
        case 'web-app':
            sugestoes.push('💡 Frontend detectado: priorize componentes e state management');
            break;
    }
    if (confianca < 70) {
        sugestoes.push('⚠️  Confiança baixa na detecção: estrutura pode ser híbrida');
        sugestoes.push('💡 Use --criar-arquetipo --salvar-arquetipo para personalizar');
    }
    return sugestoes;
}
//# sourceMappingURL=arquetipo-handler.js.map