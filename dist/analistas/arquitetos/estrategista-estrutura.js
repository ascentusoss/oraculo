import { statSync } from 'node:fs';
import path from 'node:path';
import { getTypesDirectoryRelPosix } from '../../core/config/conventions.js';
import { carregarConfigEstrategia, destinoPara, deveIgnorar, normalizarRel, } from '../../shared/helpers/estrutura.js';
export async function gerarPlanoEstrategico(contexto, opcoes = {}, sinaisAvancados) {
    const typesDir = getTypesDirectoryRelPosix();
    const cfg = await carregarConfigEstrategia(contexto.baseDir, {
        ...opcoes,
        ignorarPastas: Array.from(new Set([...(opcoes.ignorarPastas || []), typesDir])).filter(Boolean),
    });
    const mover = [];
    const conflitos = [];
    const rels = contexto.arquivos.map((f) => normalizarRel(f.relPath));
    const isTestLike = (p) => /__(tests|mocks)__/.test(p) ||
        /\.(test|spec)\.[jt]sx?$/.test(p) ||
        /fixtures\//.test(p);
    for (const rel of rels) {
        if (deveIgnorar(rel, cfg.ignorarPastas))
            continue;
        if (isTestLike(rel))
            continue;
        if (!rel.endsWith('.ts') && !rel.endsWith('.js'))
            continue;
        const base = path.posix.basename(rel);
        if (/^(eslint|vitest)\.config\.[jt]s$/i.test(base))
            continue;
        const res = destinoPara(rel, cfg.raizCodigo, cfg.criarSubpastasPorEntidade, cfg.apenasCategoriasConfiguradas, cfg.categoriasMapa);
        if (!res.destinoDir)
            continue;
        const currentDir = path.posix.dirname(rel);
        const alreadyInTarget = currentDir === res.destinoDir ||
            currentDir.startsWith(`${res.destinoDir}/`);
        if (alreadyInTarget)
            continue;
        let destinoDirAjustado = res.destinoDir;
        const motivoAjustado = res.motivo || 'Reorganização padrão';
        if (sinaisAvancados) {
            destinoDirAjustado = ajustarDestinoPorSinais(rel, res.destinoDir, sinaisAvancados, motivoAjustado);
        }
        const destino = path.posix.join(destinoDirAjustado, path.posix.basename(rel));
        let destinoExiste = rels.includes(destino);
        if (!destinoExiste) {
            try {
                const abs = path.join(contexto.baseDir, destino.replace(/\\/g, '/'));
                statSync(abs);
                destinoExiste = true;
            }
            catch {
                destinoExiste = false;
            }
        }
        if (destinoExiste) {
            conflitos.push({ alvo: destino, motivo: 'destino já existe' });
            continue;
        }
        mover.push({ de: rel, para: destino, motivo: motivoAjustado });
    }
    const seen = new Set();
    const moverFiltrado = mover.filter((migracao) => {
        const migrationKey = `${migracao.de}→${migracao.para}`;
        if (seen.has(migrationKey))
            return false;
        seen.add(migrationKey);
        return true;
    });
    return {
        mover: moverFiltrado,
        conflitos,
        resumo: {
            total: moverFiltrado.length + conflitos.length,
            zonaVerde: moverFiltrado.length,
            bloqueados: conflitos.length,
        },
    };
}
function ajustarDestinoPorSinais(relPath, destinoOriginal, sinais, motivoOriginal) {
    let destino = destinoOriginal;
    let _motivo = motivoOriginal;
    if (sinais.tipoDominante) {
        switch (sinais.tipoDominante) {
            case 'api-rest':
                if (relPath.includes('controller') || relPath.includes('route')) {
                    if (!destino.includes('controllers') && !destino.includes('routes')) {
                        destino = 'src/controllers';
                        _motivo += ' | Ajustado para estrutura API REST típica';
                    }
                }
                break;
            case 'frontend-framework':
                if (relPath.includes('component') && !destino.includes('components')) {
                    destino = 'src/components';
                    _motivo += ' | Ajustado para estrutura frontend típica';
                }
                break;
            case 'cli-tool':
                if (relPath.includes('cli') || relPath.includes('command')) {
                    destino = 'src/cli';
                    _motivo += ' | Ajustado para estrutura CLI típica';
                }
                break;
            case 'library':
                if (relPath.includes('index') || relPath.includes('export')) {
                    destino = 'src';
                    _motivo += ' | Mantido na raiz src para biblioteca';
                }
                break;
        }
    }
    if (sinais.padroesArquiteturais.includes('repository-service')) {
        if (relPath.includes('repository') && !destino.includes('repositories')) {
            destino = 'src/repositories';
            _motivo += ' | Padrão Repository/Service detectado';
        }
        if (relPath.includes('service') && !destino.includes('services')) {
            destino = 'src/services';
            _motivo += ' | Padrão Repository/Service detectado';
        }
    }
    if (sinais.padroesArquiteturais.includes('cli-patterns')) {
        if (relPath.includes('command') && !destino.includes('commands')) {
            destino = 'src/commands';
            _motivo += ' | Padrão CLI detectado';
        }
    }
    if (sinais.tecnologiasDominantes.includes('typescript-advanced')) {
        if (relPath.includes('type') || relPath.includes('interface')) {
            destino = 'src/types';
            _motivo += ' | TypeScript avançado detectado';
        }
    }
    if (sinais.complexidadeEstrutura === 'alta') {
        const nomeArquivo = path.posix.basename(relPath, path.posix.extname(relPath));
        if (nomeArquivo.length > 3) {
            const dominioInferido = inferirDominio(nomeArquivo);
            if (dominioInferido && !destino.includes(dominioInferido)) {
                destino = `src/${dominioInferido}`;
                _motivo += ` | Domínio '${dominioInferido}' inferido da complexidade`;
            }
        }
    }
    return destino;
}
function inferirDominio(nomeArquivo) {
    const padroesDominio = {
        auth: ['auth', 'login', 'user', 'session', 'security'],
        payment: ['payment', 'billing', 'invoice', 'transaction', 'checkout'],
        product: ['product', 'item', 'catalog', 'inventory', 'stock'],
        order: ['order', 'cart', 'purchase', 'sale'],
        notification: ['notification', 'email', 'message', 'alert'],
        report: ['report', 'analytics', 'metric', 'dashboard'],
        admin: ['admin', 'management', 'config', 'setting'],
    };
    const nomeLower = nomeArquivo.toLowerCase();
    for (const [dominio, palavras] of Object.entries(padroesDominio)) {
        if (palavras.some((palavra) => nomeLower.includes(palavra))) {
            return dominio;
        }
    }
    return null;
}
export const EstrategistaEstrutura = {
    nome: 'estrategista-estrutura',
    gerarPlano: gerarPlanoEstrategico,
};
//# sourceMappingURL=estrategista-estrutura.js.map