import { gerarPlanoEstrategico } from '../arquitetos/estrategista-estrutura.js';
import { extrairSinaisAvancados } from '../arquitetos/sinais-projeto-avancados.js';
import { corrigirEstrutura } from '../corrections/corretor-estrutura.js';
import { detectarArquetipos } from '../detectores/detector-arquetipos.js';
import { config } from '../../core/config/config.js';
import { log, MENSAGENS_ARQUETIPOS_HANDLER } from '../../core/messages/index.js';
export const OperarioEstrutura = {
    async planejar(baseDir, fileEntriesComAst, opcoes) {
        const emTeste = !!process.env.VITEST;
        const podeUsarArquetipos = !!opcoes.preset &&
            !opcoes.preferEstrategista &&
            (opcoes.preset !== 'oraculo' || emTeste);
        if (podeUsarArquetipos) {
            try {
                const arqs = await detectarArquetipos({
                    arquivos: fileEntriesComAst,
                    baseDir,
                    ...(opcoes.preset ? { preset: opcoes.preset } : {}),
                }, baseDir);
                const planoArq = arqs.candidatos[0]?.planoSugestao;
                if (planoArq && Array.isArray(planoArq.mover)) {
                    return { plano: planoArq, origem: 'arquetipos' };
                }
            }
            catch (e) {
                log.aviso(MENSAGENS_ARQUETIPOS_HANDLER.falha);
                if (config.DEV_MODE)
                    console.error(e);
            }
        }
        try {
            try {
                const sinaisAvancados = extrairSinaisAvancados(fileEntriesComAst, {}, undefined, baseDir, fileEntriesComAst.map((f) => f.relPath));
                const planoAlt = await gerarPlanoEstrategico({ arquivos: fileEntriesComAst, baseDir }, {
                    criarSubpastasPorEntidade: opcoes.criarSubpastasPorEntidade,
                    categoriasMapa: opcoes.categoriasMapa,
                    ...(opcoes.preset ? { preset: opcoes.preset } : {}),
                }, sinaisAvancados);
                if (planoAlt && Array.isArray(planoAlt.mover)) {
                    return { plano: planoAlt, origem: 'estrategista' };
                }
            }
            catch (e) {
                log.aviso(MENSAGENS_ARQUETIPOS_HANDLER.falhaEstrategista);
                if (config.DEV_MODE)
                    console.error(e);
            }
            return { plano: undefined, origem: 'nenhum' };
        }
        catch (e) {
            log.aviso(MENSAGENS_ARQUETIPOS_HANDLER.falhaGeral);
            if (config.DEV_MODE)
                console.error(e);
            return { plano: undefined, origem: 'nenhum' };
        }
    },
    toMapaMoves(plano) {
        if (!plano || !Array.isArray(plano.mover))
            return [];
        return plano.mover.map((m) => {
            const para = String(m.para || '');
            const idx = para.lastIndexOf('/');
            const ideal = idx > 0 ? para.substring(0, idx) : null;
            return { arquivo: m.de, ideal, atual: m.de };
        });
    },
    async aplicar(mapaMoves, fileEntriesComAst, baseDir) {
        await corrigirEstrutura(mapaMoves, fileEntriesComAst, baseDir);
    },
    ocorrenciasParaMapa(ocorrencias) {
        const mapa = [];
        if (!ocorrencias || !ocorrencias.length)
            return mapa;
        for (const occ of ocorrencias) {
            const rel = occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido';
            mapa.push({ arquivo: rel, ideal: null, atual: rel });
        }
        return mapa;
    },
};
//# sourceMappingURL=operario-estrutura.js.map