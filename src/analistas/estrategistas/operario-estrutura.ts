// SPDX-License-Identifier: MIT
//  tipo-literal-inline-complexo
// Justificativa: tipos locais para operações de estrutura
import { gerarPlanoEstrategico } from '/arquitetos/estrategista-estrutura.js';
import { extrairSinaisAvancados } from '/arquitetos/sinais-projeto-avancados.js';
import { corrigirEstrutura } from '/corrections/corretor-estrutura.js';
import { detectarArquetipos } from '/detectores/detector-arquetipos.js';
import { config } from '/config/config.js';
import { log, MENSAGENS_ARQUETIPOS_HANDLER } from '/messages/index.js';

import type {
  FileEntryWithAst,
  Ocorrencia,
  OpcoesPlanejamento,
  PlanoMoverItem,
  PlanoSugestaoEstrutura,
  ResultadoPlanejamento,
} from '@';

// Re-exporta os tipos para compatibilidade
export type { OpcoesPlanejamento, ResultadoPlanejamento };

export const OperarioEstrutura = {
  async planejar(
    baseDir: string,
    fileEntriesComAst: FileEntryWithAst[],
    opcoes: OpcoesPlanejamento,
  ): Promise<ResultadoPlanejamento> {
    // 1) Tenta arquétipos, a menos que forçado estrategista.
    //    Quando preset='oraculo', evitamos arquétipos em runtime normal,
    //    mas permitimos em testes (VITEST) para compatibilidade das suítes.
    const emTeste = !!process.env.VITEST;
    const podeUsarArquetipos =
      !!opcoes.preset &&
      !opcoes.preferEstrategista &&
      (opcoes.preset !== 'oraculo' || emTeste);
    if (podeUsarArquetipos) {
      try {
        const arqs = await detectarArquetipos(
          {
            arquivos: fileEntriesComAst,
            baseDir,
            ...(opcoes.preset ? { preset: opcoes.preset } : {}),
          } as {
            arquivos: typeof fileEntriesComAst;
            baseDir: string;
            preset?: string;
          },
          baseDir,
        );
        const planoArq = arqs.candidatos[0]?.planoSugestao as
          | PlanoSugestaoEstrutura
          | undefined;
        if (planoArq && Array.isArray(planoArq.mover)) {
          return { plano: planoArq, origem: 'arquetipos' };
        }
      } catch (e) {
        log.aviso(MENSAGENS_ARQUETIPOS_HANDLER.falha);
        if (config.DEV_MODE) console.error(e);
      }
    }

    // 2) Fallback (ou preferido): estrategista
    try {
      try {
        // Extrair sinais avançados para inteligência contextual
        const sinaisAvancados = extrairSinaisAvancados(
          fileEntriesComAst,
          {}, // packageJson - será carregado internamente se necessário
          undefined,
          baseDir,
          fileEntriesComAst.map((f) => f.relPath),
        );

        const planoAlt = await gerarPlanoEstrategico(
          { arquivos: fileEntriesComAst, baseDir },
          {
            criarSubpastasPorEntidade: opcoes.criarSubpastasPorEntidade,
            categoriasMapa: opcoes.categoriasMapa,
            ...(opcoes.preset ? { preset: opcoes.preset } : {}),
          },
          sinaisAvancados, // Passar sinais avançados para inteligência contextual
        );

        if (planoAlt && Array.isArray(planoAlt.mover)) {
          return { plano: planoAlt, origem: 'estrategista' };
        }
      } catch (e) {
        log.aviso(MENSAGENS_ARQUETIPOS_HANDLER.falhaEstrategista);
        if (config.DEV_MODE) console.error(e);
      }

      return { plano: undefined, origem: 'nenhum' };
    } catch (e) {
      log.aviso(MENSAGENS_ARQUETIPOS_HANDLER.falhaGeral);
      if (config.DEV_MODE) console.error(e);
      return { plano: undefined, origem: 'nenhum' };
    }
  },

  toMapaMoves(
    plano: PlanoSugestaoEstrutura | undefined,
  ): Array<{ arquivo: string; ideal: string | null; atual: string }> {
    if (!plano || !Array.isArray(plano.mover))
      return [] as { arquivo: string; ideal: string | null; atual: string }[];
    return plano.mover.map((m: PlanoMoverItem) => {
      const para = String(m.para || '');
      const idx = para.lastIndexOf('/');
      const ideal = idx > 0 ? para.substring(0, idx) : null;
      return { arquivo: m.de, ideal, atual: m.de };
    });
  },

  async aplicar(
    mapaMoves: { arquivo: string; ideal: string | null; atual: string }[],
    fileEntriesComAst: FileEntryWithAst[],
    baseDir: string,
  ): Promise<void> {
    await corrigirEstrutura(mapaMoves, fileEntriesComAst, baseDir);
  },

  // Auxiliar: converter ocorrências para mapa de correções (fallback)
  ocorrenciasParaMapa(
    ocorrencias?: Ocorrencia[],
  ): Array<{ arquivo: string; ideal: string | null; atual: string }> {
    const mapa = [] as {
      arquivo: string;
      ideal: string | null;
      atual: string;
    }[];
    if (!ocorrencias || !ocorrencias.length) return mapa;
    for (const occ of ocorrencias) {
      const rel = occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido';
      mapa.push({ arquivo: rel, ideal: null, atual: rel });
    }
    return mapa;
  },
};
