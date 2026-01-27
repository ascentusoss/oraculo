// SPDX-License-Identifier: MIT

import type { LocBabel, Ocorrencia } from '@';

/** Tipo intermediário para normalização com campos opcionais de localização */
type OcorrenciaNormalizavel = Ocorrencia & {
  arquivo?: string;
  loc?: LocBabel;
  fimLinha?: number;
  fimColuna?: number;
};

// Em JSON, queremos incluir localização sempre que possível.
// Muitos analistas armazenam `loc` (ex.: Babel) mas nem sempre preenchem `linha/coluna`.
export function normalizarOcorrenciaParaJson(oc: Ocorrencia): Ocorrencia {
  try {
    const out: OcorrenciaNormalizavel = { ...oc };

    if (!out.relPath && typeof out.arquivo === 'string') {
      out.relPath = out.arquivo;
    }

    const hasLinha = typeof out.linha === 'number' && !Number.isNaN(out.linha);
    const hasColuna =
      typeof out.coluna === 'number' && !Number.isNaN(out.coluna);

    const loc = out.loc;
    const start = loc && typeof loc === 'object' ? loc.start : null;
    const end = loc && typeof loc === 'object' ? loc.end : null;

    if (!hasLinha && start && typeof start.line === 'number') {
      out.linha = start.line;
    }
    if (!hasColuna && start && typeof start.column === 'number') {
      out.coluna = start.column;
    }

    const hasFimLinha =
      typeof out.fimLinha === 'number' && !Number.isNaN(out.fimLinha);
    const hasFimColuna =
      typeof out.fimColuna === 'number' && !Number.isNaN(out.fimColuna);

    if (!hasFimLinha && end && typeof end.line === 'number') {
      out.fimLinha = end.line;
    }
    if (!hasFimColuna && end && typeof end.column === 'number') {
      out.fimColuna = end.column;
    }

    return out as Ocorrencia;
  } catch {
    return oc;
  }
}
