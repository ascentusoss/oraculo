import { grafoDependencias } from '../detectores/detector-dependencias.js';
import { ARQUETIPOS, normalizarCaminho, } from '../estrategistas/arquetipos-defs.js';
const PENALIDADE_MISSING_REQUIRED = 20;
const PESO_OPTIONAL = 5;
const PESO_REQUIRED = 10;
const PESO_DEPENDENCIA = 10;
const PESO_PATTERN = 5;
const PENALIDADE_FORBIDDEN = 20;
export function scoreArquetipo(def, arquivos) {
    const norm = arquivos.map((f) => String(normalizarCaminho(f)));
    const required = def.requiredDirs || [];
    const matchedRequired = required.filter((d) => norm.some((f) => f.startsWith(`${d}/`) || f === d));
    const missingRequired = required.filter((d) => !matchedRequired.includes(d));
    const optional = def.optionalDirs || [];
    const matchedOptional = optional.filter((d) => norm.some((f) => f.startsWith(`${d}/`) || f === d));
    const allDependencies = new Set();
    for (const set of grafoDependencias.values()) {
        for (const dep of set) {
            allDependencies.add(dep);
        }
    }
    function hasDependencyGlobal(dep) {
        return allDependencies.has(dep);
    }
    const dependencyMatches = (def.dependencyHints || []).filter((dep) => hasDependencyGlobal(dep));
    const filePatternMatches = (def.filePresencePatterns || []).filter((pat) => norm.some((f) => f.includes(pat)));
    const forbiddenPresent = (def.forbiddenDirs || []).filter((d) => norm.some((f) => f.startsWith(`${d}/`) || f === d));
    let score = (def.pesoBase || 1) * 10;
    score += matchedRequired.length * PESO_REQUIRED;
    score -= missingRequired.length * PENALIDADE_MISSING_REQUIRED;
    score += matchedOptional.length * PESO_OPTIONAL;
    score += dependencyMatches.length * PESO_DEPENDENCIA;
    score += filePatternMatches.length * PESO_PATTERN;
    score -= forbiddenPresent.length * PENALIDADE_FORBIDDEN;
    let explicacaoSimilaridade = '';
    let candidatoExtra;
    if (def.nome === 'fullstack') {
        const temPages = matchedRequired.includes('pages');
        const temApi = matchedRequired.includes('api');
        const temPrisma = matchedRequired.includes('prisma');
        const temControllers = norm.some((f) => f.includes('src/controllers'));
        const temExpress = grafoDependencias.has('express');
        const isHibridoCompleto = temPages && temApi && temPrisma && temControllers && temExpress;
        if (isHibridoCompleto) {
            score += 40;
            explicacaoSimilaridade =
                'Estrutura híbrida: fullstack + api-rest-express. Projeto combina frontend (pages/api/prisma) e backend Express/controllers.';
            candidatoExtra = 'api-rest-express';
            explicacaoSimilaridade +=
                '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
        }
        else if (temPages && temApi && temPrisma) {
            score += 20;
            explicacaoSimilaridade =
                'Estrutura segue o padrão fullstack (pages/api/prisma).';
            explicacaoSimilaridade +=
                '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
        }
    }
    if (def.nome === 'api-rest-express' && grafoDependencias.has('express')) {
        if (norm.some((f) => f.includes('pages')) &&
            norm.some((f) => f.includes('prisma')) &&
            norm.some((f) => f.includes('api'))) {
            score += 40;
            if (score > 100)
                score = 100;
            explicacaoSimilaridade =
                'Estrutura híbrida: api-rest-express + fullstack. Projeto combina backend Express/controllers e frontend (pages/prisma/api).';
            explicacaoSimilaridade +=
                '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
        }
        else if (norm.some((f) => f.includes('pages')) &&
            norm.some((f) => f.includes('prisma'))) {
            score += 40;
            if (score > 100)
                score = 100;
            explicacaoSimilaridade =
                'Estrutura híbrida: api-rest-express + fullstack. Projeto combina backend Express/controllers e frontend (pages/prisma).';
            explicacaoSimilaridade +=
                '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
        }
    }
    if (def.nome === 'api-rest-express') {
        const temControllers = matchedRequired.includes('src/controllers');
        const temExpress = dependencyMatches.includes('express');
        if (temControllers && temExpress) {
            score += 50;
        }
        else if (temControllers) {
            score += 25;
        }
        else if (temExpress) {
            score += 15;
        }
        if (norm.some((f) => /api|rest/i.test(f))) {
            score += 10;
        }
        if (score >= 100) {
            explicacaoSimilaridade =
                'Estrutura segue o padrão oficial api-rest-express.';
        }
        else if (score >= 70) {
            explicacaoSimilaridade =
                'Estrutura segue o padrão api-rest-express com pequenas diferenças.';
        }
        else if (score >= 40) {
            explicacaoSimilaridade =
                'Estrutura parcialmente compatível com o padrão api-rest-express. Recomenda-se padronizar src/controllers, dependência express e rotas api/rest.';
        }
        else {
            explicacaoSimilaridade =
                'Estrutura personalizada, mas o padrão mais próximo é api-rest-express. Recomenda-se seguir boas práticas para facilitar manutenção.';
        }
    }
    if (!explicacaoSimilaridade) {
        const partes = [];
        if (missingRequired.length > 0) {
            partes.push(`Diretórios obrigatórios ausentes/faltantes: ${missingRequired.join(', ')}.`);
        }
        if (forbiddenPresent.length > 0) {
            partes.push(`Diretórios não permitidos/proibidos presentes: ${forbiddenPresent.join(', ')}.`);
        }
        if (partes.length > 0) {
            explicacaoSimilaridade = `${partes.join(' ')} Estrutura parcialmente compatível, personalizada ou com diferenças.`;
        }
    }
    const maxPossible = (def.pesoBase || 1) * 10 +
        (def.requiredDirs?.length || 0) * PESO_REQUIRED +
        (def.optionalDirs?.length || 0) * PESO_OPTIONAL +
        (def.dependencyHints?.length || 0) * PESO_DEPENDENCIA +
        (def.filePresencePatterns?.length || 0) * PESO_PATTERN +
        30;
    const confidence = maxPossible > 0
        ? Math.min(100, Math.round((score / maxPossible) * 100))
        : 0;
    const raizFiles = norm.filter((p) => typeof p === 'string' && !p.includes('/'));
    const allowed = new Set([...(def.rootFilesAllowed || [])]);
    const anomalias = [];
    for (const rf of raizFiles) {
        if (typeof rf === 'string' && rf.trim() !== '' && !allowed.has(rf)) {
            anomalias.push({
                path: rf,
                motivo: 'Arquivo na raiz não permitido para este arquétipo',
            });
        }
    }
    let sugestaoPadronizacao = '';
    if (def.nome === 'api-rest-express') {
        if (!matchedRequired.includes('src/controllers')) {
            sugestaoPadronizacao +=
                'Sugestão: adicione o diretório src/controllers para seguir o padrão api-rest-express.\n';
        }
        if (!dependencyMatches.includes('express')) {
            sugestaoPadronizacao +=
                'Sugestão: adicione express nas dependências para seguir o padrão api-rest-express.\n';
        }
        if (!norm.some((f) => /api|rest/i.test(f))) {
            sugestaoPadronizacao +=
                'Sugestão: utilize nomes de arquivos e rotas que incluam "api" ou "rest" para reforçar o padrão.\n';
        }
    }
    return {
        nome: def.nome,
        score,
        confidence,
        matchedRequired,
        missingRequired,
        matchedOptional,
        dependencyMatches,
        filePatternMatches,
        forbiddenPresent,
        anomalias,
        sugestaoPadronizacao,
        explicacaoSimilaridade,
        descricao: def.descricao || '',
        candidatoExtra,
    };
}
export function pontuarTodos(arquivos) {
    const resultados = [];
    for (const def of ARQUETIPOS) {
        const resultado = scoreArquetipo(def, arquivos);
        resultados.push(resultado);
        if (resultado.candidatoExtra) {
            const extra = ARQUETIPOS.find((a) => a.nome === resultado.candidatoExtra);
            if (extra) {
                const extraResultado = scoreArquetipo(extra, arquivos);
                if (!resultados.some((x) => x.nome === extraResultado.nome))
                    resultados.push(extraResultado);
            }
        }
    }
    return resultados.filter((resultado) => (resultado.matchedRequired?.length || 0) > 0 ||
        (resultado.matchedOptional?.length || 0) > 0 ||
        (resultado.dependencyMatches?.length || 0) > 0 ||
        (resultado.filePatternMatches?.length || 0) > 0 ||
        (resultado.forbiddenPresent?.length || 0) > 0);
}
export function scoreArquetipoAvancado(def, arquivos, sinaisAvancados) {
    const resultadoBase = scoreArquetipo(def, arquivos);
    if (!sinaisAvancados) {
        return resultadoBase;
    }
    let score = resultadoBase.score;
    let explicacao = resultadoBase.explicacaoSimilaridade || '';
    const frameworks = sinaisAvancados.frameworksDetectados || [];
    const deps = sinaisAvancados.dependencias || [];
    const scripts = sinaisAvancados.scripts || [];
    const detalhes = sinaisAvancados.detalhes || {};
    score += calcularBonusContextual(def, sinaisAvancados);
    switch (def.nome) {
        case 'next-js':
            if (frameworks.includes('Next.js') || deps.includes('next')) {
                score += 30;
                explicacao +=
                    '\n✓ Framework Next.js detectado via dependências e análise de código.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('pages') ||
                sinaisAvancados.pastasPadrao?.includes('app')) {
                score += 20;
                explicacao +=
                    '\n✓ Estrutura de roteamento Next.js (pages ou app dir) confirmada.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('frontend-framework')) {
                score += 15;
            }
            break;
        case 'fullstack':
            if (frameworks.includes('Next.js') || deps.includes('next')) {
                score += 35;
                explicacao +=
                    '\n✓ Framework Next.js detectado - aplicação fullstack moderna.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('api')) {
                score += 25;
                explicacao += '\n✓ API routes Next.js detectadas - backend integrado.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('pages')) {
                score += 20;
                explicacao += '\n✓ Páginas Next.js (Pages Router) detectadas.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('app')) {
                score += 25;
                explicacao += '\n✓ App Router Next.js detectado - arquitetura moderna.';
            }
            if (deps.includes('prisma') || deps.includes('@prisma/client')) {
                score += 20;
                explicacao += '\n✓ Prisma ORM detectado - banco de dados integrado.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('frontend-framework')) {
                score += 15;
                explicacao += '\n✓ Tecnologias frontend modernas detectadas.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('backend-api')) {
                score += 15;
                explicacao += '\n✓ APIs backend detectadas no fullstack.';
            }
            break;
        case 'vite':
            if (frameworks.includes('Vite') || deps.includes('vite')) {
                score += 30;
                explicacao += '\n✓ Build tool Vite detectado.';
            }
            if (sinaisAvancados.arquivosConfig?.some((f) => f.includes('vite.config'))) {
                score += 15;
                explicacao += '\n✓ Arquivo de configuração Vite presente.';
            }
            break;
        case 'api-rest-express':
            if (frameworks.includes('Express') || deps.includes('express')) {
                score += 25;
                explicacao += '\n✓ Framework Express detectado.';
            }
            if (frameworks.includes('Fastify') || deps.includes('fastify')) {
                score += 25;
                explicacao += '\n✓ Framework Fastify detectado - alta performance.';
            }
            if (frameworks.includes('NestJS') || deps.includes('@nestjs/core')) {
                score += 30;
                explicacao +=
                    '\n✓ Framework NestJS detectado - arquitetura enterprise.';
            }
            if (frameworks.includes('Koa') || deps.includes('koa')) {
                score += 20;
                explicacao += '\n✓ Framework Koa detectado.';
            }
            if (frameworks.includes('Hapi') || deps.includes('@hapi/hapi')) {
                score += 20;
                explicacao += '\n✓ Framework Hapi detectado.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('routes') ||
                sinaisAvancados.pastasPadrao?.includes('api') ||
                sinaisAvancados.pastasPadrao?.includes('controllers')) {
                score += 15;
                explicacao += '\n✓ Estrutura de rotas/controllers API detectada.';
            }
            if (deps.includes('cors') ||
                deps.includes('helmet') ||
                deps.includes('@fastify/cors')) {
                score += 10;
                explicacao += '\n✓ Middleware de segurança/CORS presente.';
            }
            if (deps.includes('joi') || deps.includes('@hapi/joi')) {
                score += 10;
                explicacao += '\n✓ Validação de dados detectada.';
            }
            if (deps.includes('prisma') ||
                deps.includes('mongoose') ||
                deps.includes('typeorm')) {
                score += 15;
                explicacao += '\n✓ ORM/Database layer detectado.';
            }
            if (sinaisAvancados.padroesArquiteturais.includes('repository-service')) {
                score += 10;
                explicacao += '\n✓ Padrão Repository/Service compatível com APIs REST.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('backend-api')) {
                score += 20;
                explicacao += '\n✓ Foco em desenvolvimento backend/API confirmado.';
            }
            break;
        case 'vue-spa':
            if (frameworks.includes('Vue') || deps.includes('vue')) {
                score += 30;
                explicacao += '\n✓ Framework Vue.js detectado - SPA moderna.';
            }
            if (deps.includes('vue-router')) {
                score += 20;
                explicacao += '\n✓ Vue Router detectado - roteamento SPA.';
            }
            if (deps.includes('vuex') || deps.includes('pinia')) {
                score += 20;
                explicacao += '\n✓ State management detectado (Vuex/Pinia).';
            }
            if (deps.includes('@vue/cli-service') || deps.includes('vite')) {
                score += 15;
                explicacao += '\n✓ Build tool Vue detectado (CLI/Vite).';
            }
            if (sinaisAvancados.pastasPadrao?.includes('src/components')) {
                score += 15;
                explicacao += '\n✓ Estrutura de componentes Vue detectada.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('src/composables')) {
                score += 15;
                explicacao += '\n✓ Composables Vue 3 detectados - arquitetura moderna.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('src/views')) {
                score += 10;
                explicacao += '\n✓ Estrutura de views/pages detectada.';
            }
            if (deps.includes('nuxt') || deps.includes('nuxt3')) {
                score += 25;
                explicacao += '\n✓ Nuxt.js detectado - SSR/SSG framework.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('frontend-framework')) {
                score += 15;
                explicacao += '\n✓ Foco em desenvolvimento frontend confirmado.';
            }
            break;
        case 'react-app':
            if (frameworks.includes('React') || deps.includes('react')) {
                score += 30;
                explicacao += '\n✓ Framework React detectado.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('components') ||
                sinaisAvancados.pastasPadrao?.includes('src')) {
                score += 15;
                explicacao += '\n✓ Estrutura React típica com components detectada.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('frontend-framework')) {
                score += 15;
            }
            break;
        case 'vue-app':
            if (frameworks.includes('Vue') || deps.includes('vue')) {
                score += 30;
                explicacao += '\n✓ Framework Vue detectado.';
            }
            if (sinaisAvancados.pastasPadrao?.includes('components') ||
                sinaisAvancados.arquivosPadrao?.some((f) => f.endsWith('.vue'))) {
                score += 15;
                explicacao += '\n✓ Estrutura Vue com components detectada.';
            }
            break;
        case 'typescript-lib':
            if (sinaisAvancados.tipos?.length > 0) {
                score += 20;
                explicacao += `\n✓ Tipos TypeScript detectados (${sinaisAvancados.tipos.length} tipos).`;
            }
            if (deps.includes('typescript') ||
                sinaisAvancados.arquivosConfig?.some((f) => f.includes('tsconfig'))) {
                score += 15;
                explicacao += '\n✓ Configuração TypeScript presente.';
            }
            if (scripts.includes('build') || scripts.includes('compile')) {
                score += 10;
                explicacao += '\n✓ Scripts de build detectados.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('typescript-advanced')) {
                score += 20;
                explicacao += '\n✓ Uso avançado de TypeScript detectado.';
            }
            break;
        case 'monorepo':
            if (sinaisAvancados.arquivosConfig?.some((f) => f.includes('lerna.json') || f.includes('pnpm-workspace'))) {
                score += 25;
                explicacao += '\n✓ Configuração de monorepo detectada (Lerna ou pnpm).';
            }
            if (sinaisAvancados.pastasPadrao?.includes('packages') ||
                sinaisAvancados.pastasPadrao?.includes('apps')) {
                score += 20;
                explicacao += '\n✓ Estrutura de workspaces/packages detectada.';
            }
            if (sinaisAvancados.complexidadeEstrutura === 'alta') {
                score += 20;
                explicacao +=
                    '\n✓ Complexidade estrutural alta compatível com monorepo.';
            }
            break;
        case 'cli':
            if (sinaisAvancados.pastasPadrao?.includes('bin') ||
                sinaisAvancados.pastasPadrao?.includes('cli')) {
                score += 20;
                explicacao += '\n✓ Estrutura de CLI detectada (bin ou cli).';
            }
            if (deps.includes('commander') ||
                deps.includes('yargs') ||
                deps.includes('inquirer')) {
                score += 15;
                explicacao +=
                    '\n✓ Biblioteca de CLI detectada (commander/yargs/inquirer).';
            }
            if (sinaisAvancados.padroesArquiteturais.includes('cli-patterns')) {
                score += 25;
                explicacao += '\n✓ Padrões específicos de CLI detectados.';
            }
            if (sinaisAvancados.tecnologiasDominantes.includes('frontend-framework')) {
                score -= 30;
                explicacao += '\n✗ Estrutura web detectada, incompatível com CLI.';
            }
            break;
    }
    if (detalhes.testRunner) {
        score += 5;
        explicacao += `\n✓ Test runner detectado: ${detalhes.testRunner}.`;
    }
    if (detalhes.linter) {
        score += 3;
        explicacao += `\n✓ Linter configurado: ${detalhes.linter}.`;
    }
    if (detalhes.bundler && !['vite', 'webpack', 'rollup'].includes(def.nome)) {
        score += 5;
        explicacao += `\n✓ Bundler detectado: ${detalhes.bundler}.`;
    }
    const complexidade = (sinaisAvancados.funcoes || 0) +
        (sinaisAvancados.classes || 0) +
        (sinaisAvancados.variaveis || 0);
    if (complexidade > 100) {
        explicacao += `\n📊 Projeto de complexidade alta (${complexidade} elementos).`;
    }
    else if (complexidade > 50) {
        explicacao += `\n📊 Projeto de complexidade média (${complexidade} elementos).`;
    }
    const maxPossible = (def.pesoBase || 1) * 10 +
        (def.requiredDirs?.length || 0) * PESO_REQUIRED +
        (def.optionalDirs?.length || 0) * PESO_OPTIONAL +
        (def.dependencyHints?.length || 0) * PESO_DEPENDENCIA +
        (def.filePresencePatterns?.length || 0) * PESO_PATTERN +
        100;
    const confidence = maxPossible > 0
        ? Math.min(100, Math.round((score / maxPossible) * 100))
        : 0;
    return {
        ...resultadoBase,
        score,
        confidence,
        explicacaoSimilaridade: explicacao.trim(),
    };
}
function calcularBonusContextual(def, sinais) {
    let bonus = 0;
    if (def.nome === 'monorepo' && sinais.complexidadeEstrutura === 'alta') {
        bonus += 20;
    }
    if ((def.nome === 'fullstack' || def.nome === 'monorepo') &&
        sinais.complexidadeEstrutura === 'baixa') {
        bonus -= 15;
    }
    if (def.nome === 'api-rest-express' &&
        sinais.padroesArquiteturais.includes('repository-service')) {
        bonus += 15;
    }
    if (def.nome === 'cli' &&
        sinais.padroesArquiteturais.includes('cli-patterns')) {
        bonus += 20;
    }
    if (def.nome === 'cli' &&
        sinais.tecnologiasDominantes.includes('frontend-framework')) {
        bonus -= 25;
    }
    if (def.nome === 'typescript-lib' &&
        sinais.tecnologiasDominantes.includes('frontend-framework')) {
        bonus -= 20;
    }
    return bonus;
}
export function pontuarTodosAvancado(arquivos, sinaisAvancados) {
    const resultados = [];
    for (const def of ARQUETIPOS) {
        const resultado = scoreArquetipoAvancado(def, arquivos, sinaisAvancados);
        resultados.push(resultado);
        if (resultado.candidatoExtra) {
            const extra = ARQUETIPOS.find((a) => a.nome === resultado.candidatoExtra);
            if (extra) {
                const extraResultado = scoreArquetipoAvancado(extra, arquivos, sinaisAvancados);
                if (!resultados.some((x) => x.nome === extraResultado.nome))
                    resultados.push(extraResultado);
            }
        }
    }
    return resultados.filter((resultado) => (resultado.matchedRequired?.length || 0) > 0 ||
        (resultado.matchedOptional?.length || 0) > 0 ||
        (resultado.dependencyMatches?.length || 0) > 0 ||
        (resultado.filePatternMatches?.length || 0) > 0 ||
        (resultado.forbiddenPresent?.length || 0) > 0);
}
//# sourceMappingURL=pontuador.js.map