import { grafoDependencias } from '../detectores/detector-dependencias.js';
import { config } from '../../core/config/config.js';
import { isInsideSrc } from '../../core/config/paths.js';
import { DetectorEstruturaMessages } from '../../core/messages/analistas/detector-estrutura-messages.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
import micromatch from 'micromatch';
export const sinaisDetectados = {};
export const detectorEstrutura = {
    nome: 'detector-estrutura',
    global: true,
    test(_relPath) {
        return true;
    },
    aplicar(_src, _relPath, _ast, _fullPath, contexto) {
        if (!contexto)
            return [];
        const caminhos = contexto.arquivos.map((f) => f.relPath);
        const caminhosNorm = caminhos.map((p) => (p ? p.replace(/\\/g, '/') : ''));
        const setCaminhos = new Set(caminhos);
        const arquivoPrincipal = caminhos.find((p) => /package\.json$/.test(p)) || caminhos[0] || '';
        const conteudoPrincipal = contexto.arquivos.find((f) => f.relPath === arquivoPrincipal)?.content ||
            '';
        const contextoProjeto = detectarContextoProjeto({
            arquivo: arquivoPrincipal,
            conteudo: conteudoPrincipal,
            relPath: arquivoPrincipal,
        });
        const isProjetoPequeno = caminhos.length < 20;
        const isProjetoTeste = contextoProjeto.isTest ||
            caminhos.every((p) => /(test|spec|mock)/i.test(p));
        const sinais = {
            temPages: caminhosNorm.some((p) => p.includes('pages/') || p.includes('app/')),
            temApi: caminhosNorm.some((p) => p.includes('api/')),
            temControllers: caminhosNorm.some((p) => p.includes('controllers/')),
            temComponents: caminhosNorm.some((p) => p.includes('components/')),
            temCli: caminhosNorm.some((p) => /(^|\/)cli\.(ts|js)$/.test(p)),
            temSrc: caminhosNorm.some((p) => isInsideSrc(p)),
            temPrisma: caminhosNorm.some((p) => p.includes('prisma/') || p.includes('schema.prisma')),
            temPackages: caminhosNorm.some((p) => p.includes('packages/') || p.includes('turbo.json')),
            temExpress: grafoDependencias.has('express'),
        };
        const ehFullstack = !!(sinais.temPages &&
            sinais.temApi &&
            sinais.temPrisma);
        const ehMonorepo = !!sinais.temPackages;
        Object.assign(sinaisDetectados, sinais);
        const ocorrencias = [];
        if (ehMonorepo) {
            ocorrencias.push({
                tipo: 'estrutura-monorepo',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.monorepoDetectado,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
            if (!caminhos.some((p) => p.includes('packages/'))) {
                ocorrencias.push({
                    tipo: 'estrutura-monorepo-incompleto',
                    nivel: 'aviso',
                    mensagem: DetectorEstruturaMessages.monorepoSemPackages,
                    origem: 'detector-estrutura',
                    relPath: '[raiz do projeto]',
                    linha: 0,
                });
            }
        }
        if (ehFullstack) {
            ocorrencias.push({
                tipo: 'estrutura-fullstack',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.fullstackDetectado,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        else if (sinais.temPages && !sinais.temApi && !isProjetoPequeno) {
            ocorrencias.push({
                tipo: 'estrutura-incompleta',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.pagesSemApi,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        if (sinais.temSrc && sinais.temPackages && !contextoProjeto.isTest) {
            ocorrencias.push({
                tipo: 'estrutura-mista',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.estruturaMista,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        const arquivosRaiz = caminhosNorm.filter((p) => !p.includes('/') && p.trim() !== '');
        const LIMITE_RAIZ = Number(config.ESTRUTURA_ARQUIVOS_RAIZ_MAX || 15);
        if (arquivosRaiz.length > LIMITE_RAIZ &&
            !isProjetoPequeno &&
            !isProjetoTeste) {
            ocorrencias.push({
                tipo: 'estrutura-suspeita',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.muitosArquivosRaiz,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        if (sinais.temControllers || sinais.temPrisma || sinais.temApi) {
            ocorrencias.push({
                tipo: 'estrutura-backend',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.sinaisBackend,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        if (sinais.temComponents || sinais.temPages) {
            ocorrencias.push({
                tipo: 'estrutura-frontend',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.sinaisFrontend,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        const arquivosConfig = [
            'package.json',
            'tsconfig.json',
            'turbo.json',
            'pnpm-workspace.yaml',
        ];
        const detectados = arquivosConfig.filter((cfg) => setCaminhos.has(cfg));
        if (detectados.length > 0) {
            ocorrencias.push({
                tipo: 'estrutura-config',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.arquivosConfigDetectados(detectados),
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 1,
            });
        }
        const entrypointsAll = caminhosNorm.filter((p) => /(^|[\\/])(cli|index|main)\.(ts|js)$/.test(p));
        const ignoredDyn = (config.INCLUDE_EXCLUDE_RULES &&
            config.INCLUDE_EXCLUDE_RULES.globalExcludeGlob) ||
            [];
        const entrypoints = entrypointsAll
            .filter((p) => !micromatch.isMatch(p, ignoredDyn || []))
            .sort();
        if (entrypoints.length > 1) {
            const MAX_LIST = 20;
            if (entrypoints.length > MAX_LIST) {
                const dirCounts = new Map();
                for (const p of entrypoints) {
                    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.';
                    dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
                }
                const ordenado = [...dirCounts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
                const MAX_DIRS = 10;
                const top = ordenado.slice(0, MAX_DIRS);
                const ocultosDir = ordenado.length - top.length;
                const mostradosEntrypoints = top.reduce((acc, [, n]) => acc + n, 0);
                const ocultosEntrypoints = entrypoints.length - mostradosEntrypoints;
                const previewGrupos = top.map(([d, n]) => `${d} (${n})`).join(', ');
                const sufixoOcultos = [
                    ocultosDir > 0 ? `+${ocultosDir} dirs` : null,
                    ocultosEntrypoints > 0 ? `+${ocultosEntrypoints} entrypoints` : null,
                ]
                    .filter(Boolean)
                    .join(', ');
                ocorrencias.push({
                    tipo: 'estrutura-entrypoints',
                    nivel: 'aviso',
                    mensagem: DetectorEstruturaMessages.multiplosEntrypointsAgrupados({
                        previewGrupos,
                        sufixoOcultos,
                    }),
                    origem: 'detector-estrutura',
                    relPath: '[raiz do projeto]',
                    linha: 0,
                });
            }
            else {
                const preview = entrypoints.slice(0, MAX_LIST);
                const resto = entrypoints.length - preview.length;
                ocorrencias.push({
                    tipo: 'estrutura-entrypoints',
                    nivel: 'aviso',
                    mensagem: DetectorEstruturaMessages.multiplosEntrypointsLista(preview, resto),
                    origem: 'detector-estrutura',
                    relPath: '[raiz do projeto]',
                    linha: 0,
                });
            }
        }
        const deveriaTerSrc = !contextoProjeto.isTest &&
            !contextoProjeto.isConfig &&
            (contextoProjeto.isLibrary || contextoProjeto.frameworks.length > 0);
        if (!sinais.temSrc && caminhosNorm.length > 50 && deveriaTerSrc) {
            ocorrencias.push({
                tipo: 'estrutura-sem-src',
                nivel: 'info',
                mensagem: DetectorEstruturaMessages.projetoGrandeSemSrc,
                origem: 'detector-estrutura',
                relPath: '[raiz do projeto]',
                linha: 0,
            });
        }
        return Array.isArray(ocorrencias) ? ocorrencias : [];
    },
};
//# sourceMappingURL=detector-estrutura.js.map