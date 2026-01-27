import path from 'node:path';
import { extrairSinaisAvancados } from '../arquitetos/sinais-projeto-avancados.js';
import { ARQUETIPOS } from '../estrategistas/arquetipos-defs.js';
import { OperarioEstrutura } from '../estrategistas/operario-estrutura.js';
import { carregarArquetipoPersonalizado, integrarArquetipos, obterArquetipoOficial, } from '../js-ts/arquetipos-personalizados.js';
import { scoreArquetipoAvancado } from '../pontuadores/pontuador.js';
import { config } from '../../core/config/config.js';
import { lerEstado, salvarEstado } from '../../shared/persistence/persistencia.js';
function scoreArquetipo(def, arquivos, _sinaisAvancados) {
    const matchedRequired = (def.requiredDirs || []).filter((d) => arquivos.some((f) => f.startsWith(`${d}/`) || f === d));
    const missingRequired = (def.requiredDirs || []).filter((d) => !matchedRequired.includes(d));
    return {
        nome: def.nome,
        score: def.pesoBase ? def.pesoBase * 10 : 10,
        confidence: 50,
        matchedRequired,
        missingRequired,
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: def.descricao || '',
        candidatoExtra: undefined,
    };
}
if (process.env.VITEST) {
    const g = globalThis;
    const prev = g.__ORACULO_TESTS__ ?? {};
    g.__ORACULO_TESTS__ = { ...prev, scoreArquetipo };
}
export async function detectarArquetipos(contexto, baseDir, options) {
    if (!options?.quiet && config.VERBOSE) {
        console.log('🔍 detectarArquetipos chamado com', contexto.arquivos.length, 'arquivos');
    }
    const arquivos = contexto.arquivos.map((f) => f.relPath);
    const arquetipoPersonalizado = await carregarArquetipoPersonalizado(baseDir);
    let arquetiposParaAvaliar = ARQUETIPOS;
    if (arquetipoPersonalizado) {
        const arquetipoOficial = obterArquetipoOficial(arquetipoPersonalizado);
        if (arquetipoOficial) {
            const arquetipoIntegrado = integrarArquetipos(arquetipoPersonalizado, arquetipoOficial);
            arquetiposParaAvaliar = ARQUETIPOS.map((arq) => arq.nome === arquetipoPersonalizado.arquetipoOficial
                ? arquetipoIntegrado
                : arq);
        }
    }
    let packageJsonParaSinais = {};
    try {
        packageJsonParaSinais = (await lerEstado(path.join(baseDir, 'package.json')));
    }
    catch {
        packageJsonParaSinais = {};
    }
    const sinaisAvancados = extrairSinaisAvancados(contexto.arquivos, packageJsonParaSinais, undefined, baseDir, arquivos);
    let candidatos = arquetiposParaAvaliar.map((def) => scoreArquetipoAvancado(def, arquivos, sinaisAvancados));
    if (!options?.quiet && config.VERBOSE) {
        console.log('🔍 Tentando chamar detector contextual...');
    }
    try {
        const { detectarContextoInteligente } = await import('./detector-contexto-inteligente.js');
        const estruturaDetectada = arquivos;
        let packageJsonContent = {};
        try {
            packageJsonContent = (await lerEstado(path.join(baseDir, 'package.json')));
        }
        catch {
            packageJsonContent = {};
        }
        const resultadosContextuais = detectarContextoInteligente(estruturaDetectada, contexto.arquivos, packageJsonContent, options);
        const melhorDeteccao = resultadosContextuais.reduce((melhor, atual) => atual.confiancaTotal > melhor.confiancaTotal ? atual : melhor, { confiancaTotal: 0 });
        if (melhorDeteccao && melhorDeteccao.confiancaTotal > 0.6) {
            const mapeamentoTecnologia = {
                'discord-bot': ['bot-discord', 'bot', 'discord-bot'],
                'telegram-bot': ['bot-telegram', 'bot', 'telegram-bot'],
                'express-api': ['api-rest-express', 'api-rest', 'express-api'],
                'fastify-api': ['api-rest-fastify', 'api-rest', 'fastify-api'],
                'nestjs-api': ['api-rest-nestjs', 'api-rest', 'nestjs-api'],
                'cli-modular': ['cli-modular', 'cli', 'cli-tool'],
                'electron-app': ['electron-app', 'electron', 'desktop-app'],
                'nextjs-app': ['nextjs-app', 'nextjs', 'fullstack'],
                'react-spa': ['react-spa', 'react', 'spa'],
            };
            const tecnologiaDetectada = melhorDeteccao.tecnologia ?? 'desconhecido';
            const arquetiposCandidatos = mapeamentoTecnologia[tecnologiaDetectada] || [];
            let boostAplicado = false;
            candidatos = candidatos.map((candidato) => {
                if (arquetiposCandidatos.some((arq) => candidato.nome.includes(arq) || arq.includes(candidato.nome))) {
                    const boostConfianca = Math.min(melhorDeteccao.confiancaTotal * 100 * 0.8, 60);
                    boostAplicado = true;
                    return {
                        ...candidato,
                        confidence: Math.max(candidato.confidence + boostConfianca, 70),
                        explicacaoSimilaridade: `[Boost contextual: ${melhorDeteccao.tecnologia} detectado com ${(melhorDeteccao.confiancaTotal * 100).toFixed(0)}% confiança] ${candidato.explicacaoSimilaridade || ''}`,
                    };
                }
                return candidato;
            });
            if (!boostAplicado) {
                const arquetipoVirtual = {
                    nome: tecnologiaDetectada,
                    score: Math.round(melhorDeteccao.confiancaTotal * 100),
                    confidence: Math.round(melhorDeteccao.confiancaTotal * 100),
                    matchedRequired: [],
                    missingRequired: [],
                    matchedOptional: [],
                    dependencyMatches: (melhorDeteccao.evidencias || [])
                        .filter((e) => e.tipo === 'dependencia')
                        .map((e) => e.valor),
                    filePatternMatches: (melhorDeteccao.evidencias || [])
                        .filter((e) => e.tipo === 'estrutura')
                        .map((e) => e.valor),
                    forbiddenPresent: [],
                    anomalias: [],
                    sugestaoPadronizacao: (melhorDeteccao.sugestoesMelhoria || []).join('; '),
                    explicacaoSimilaridade: `Detectado via sistema inteligente contextual com ${(melhorDeteccao.confiancaTotal * 100).toFixed(0)}% confiança`,
                    descricao: `Projeto ${melhorDeteccao.tecnologia} identificado por análise contextual`,
                };
                candidatos.unshift(arquetipoVirtual);
            }
        }
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug('Sistema inteligente não disponível:', error);
        }
    }
    candidatos.sort((a, b) => b.confidence - a.confidence || b.score - a.score);
    const scoresValidos = candidatos.filter((c) => c.confidence >= 30);
    if (!scoresValidos.length) {
        const temAlgumaEstrutura = arquivos.some((f) => f.includes('src/') ||
            f.includes('lib/') ||
            f.includes('app/') ||
            f.includes('packages/'));
        candidatos = [
            {
                nome: 'desconhecido',
                score: 0,
                confidence: temAlgumaEstrutura ? 10 : 0,
                matchedRequired: [],
                missingRequired: [],
                matchedOptional: [],
                dependencyMatches: [],
                filePatternMatches: [],
                forbiddenPresent: [],
                anomalias: [],
                sugestaoPadronizacao: temAlgumaEstrutura
                    ? 'Projeto tem alguma estrutura, mas não corresponde a arquétipos conhecidos. Considere organizar em src/, lib/ ou app/.'
                    : 'Projeto sem estrutura clara detectada. Considere criar uma organização básica.',
                explicacaoSimilaridade: temAlgumaEstrutura
                    ? 'Estrutura parcial detectada, mas não suficiente para classificação.'
                    : 'Nenhum arquétipo identificado.',
                descricao: 'Nenhum arquétipo identificado.',
            },
        ];
    }
    else {
        const top = scoresValidos[0];
        const proximos = scoresValidos.filter((c) => c !== top && Math.abs(c.confidence - top.confidence) <= 15);
        const ehHibridoReal = proximos.some((c) => c.matchedRequired.some((req) => top.matchedRequired.includes(req)) ||
            c.dependencyMatches.some((dep) => top.dependencyMatches.includes(dep)));
        if (proximos.length > 0 && ehHibridoReal) {
            const scoreHibrido = top.score * 0.7 +
                proximos.reduce((acc, c) => acc + (c.score * 0.3) / proximos.length, 0);
            const confidenceHibrido = Math.max(top.confidence - 10, 40);
            candidatos = [
                {
                    nome: 'misto',
                    score: Math.round(scoreHibrido),
                    confidence: confidenceHibrido,
                    matchedRequired: [],
                    missingRequired: [],
                    matchedOptional: [],
                    dependencyMatches: [],
                    filePatternMatches: [],
                    forbiddenPresent: [],
                    anomalias: [],
                    sugestaoPadronizacao: '',
                    explicacaoSimilaridade: `Estrutura híbrida detectada: combina elementos de ${[top.nome, ...proximos.map((p) => p.nome)].join(', ')}. Recomenda-se avaliar se a separação em projetos distintos seria benéfica.`,
                    descricao: 'Estrutura híbrida',
                },
            ];
        }
        else {
            candidatos = [top];
        }
    }
    const baselinePath = path.join(baseDir, '.oraculo', 'baseline-estrutura.json');
    let baseline;
    const existente = await lerEstado(baselinePath);
    if (existente &&
        !Array.isArray(existente) &&
        typeof existente === 'object' &&
        'arquetipo' in existente) {
        baseline = existente;
    }
    if (!baseline && candidatos[0]) {
        baseline = {
            version: 1,
            timestamp: new Date().toISOString(),
            arquetipo: candidatos[0].nome,
            confidence: candidatos[0].confidence,
            arquivosRaiz: arquivos.filter((p) => !p.includes('/')).sort(),
        };
        await salvarEstado(baselinePath, baseline);
    }
    if (baseline && baseline.arquetipo !== 'desconhecido') {
        const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/'));
        const setBase = new Set(baseline.arquivosRaiz || []);
        const temIntersecao = arquivosRaizAtuais.some((f) => setBase.has(f));
        const candidatoTop = candidatos[0];
        if (temIntersecao &&
            (candidatoTop.nome === 'desconhecido' || candidatoTop.confidence < 50)) {
            const melhorBaseline = {
                nome: baseline.arquetipo,
                score: 999,
                confidence: baseline.confidence,
                matchedRequired: [],
                missingRequired: [],
                matchedOptional: [],
                dependencyMatches: [],
                filePatternMatches: [],
                forbiddenPresent: [],
                anomalias: [],
                sugestaoPadronizacao: '',
                explicacaoSimilaridade: 'Detectado via baseline existente (.oraculo/baseline-estrutura.json).',
                descricao: 'Arquétipo determinado pelo baseline',
            };
            candidatos = [
                melhorBaseline,
                ...candidatos.filter((c) => c.nome !== baseline.arquetipo),
            ];
        }
    }
    let drift;
    if (baseline && candidatos[0]) {
        const atual = candidatos[0];
        const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/')).sort();
        const setBase = new Set(baseline.arquivosRaiz);
        const setAtual = new Set(arquivosRaizAtuais);
        const novos = [];
        const removidos = [];
        for (const f of setAtual)
            if (!setBase.has(f))
                novos.push(f);
        for (const f of setBase)
            if (!setAtual.has(f))
                removidos.push(f);
        drift = {
            alterouArquetipo: baseline.arquetipo !== atual.nome,
            anterior: baseline.arquetipo,
            atual: atual.nome,
            deltaConfidence: atual.confidence - baseline.confidence,
            arquivosRaizNovos: novos,
            arquivosRaizRemovidos: removidos,
        };
    }
    if (candidatos[0]) {
        try {
            const preset = contexto.preset ?? 'oraculo';
            const emTeste = !!process.env.VITEST;
            const preferEstrategista = preset === 'oraculo' && !emTeste;
            const { plano } = await OperarioEstrutura.planejar(baseDir, contexto.arquivos, {
                preferEstrategista,
                preset,
            });
            if (plano)
                candidatos[0].planoSugestao = plano;
        }
        catch {
        }
    }
    return {
        candidatos,
        baseline,
        drift,
        arquetipoPersonalizado,
    };
}
//# sourceMappingURL=detector-arquetipos.js.map