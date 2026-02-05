// SPDX-License-Identifier: MIT
import {
  AnalystOrigins,
  AnalystTypes,
  FormatadorMessages,
  SeverityLevels,
} from '@core/messages/core/plugin-messages.js';
import { formatarPrettierMinimo } from '@shared/impar/formater.js';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_FORMATADOR === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

function msg(
  message: string,
  relPath: string,
  nivel: (typeof SeverityLevels)[keyof typeof SeverityLevels] = SeverityLevels.warning,
  line = 1,
): Msg {
  return criarOcorrencia({
    relPath,
    mensagem: message,
    linha: line,
    nivel,
    origem: AnalystOrigins.formatador,
    tipo: AnalystTypes.formatador,
  });
}

function normalizarEol(code: string): string {
  return code.replace(/\r\n?/g, '\n');
}

function primeiraLinhaDiferente(a: string, b: string): number {
  const aLines = normalizarEol(a).split('\n');
  const bLines = normalizarEol(b).split('\n');
  const len = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < len; i++) {
    if ((aLines[i] ?? '') !== (bLines[i] ?? '')) return i + 1;
  }
  return 1;
}

export const analistaFormatador = criarAnalista({
  nome: 'analista-formatador',
  categoria: 'formatacao',
  descricao:
    'Verifica formatação mínima interna do Oráculo (JSON/Markdown/YAML).',
  global: false,
  test: (relPath: string): boolean =>
    /\.(json|md|markdown|ya?ml)$/i.test(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;

    const res = formatarPrettierMinimo({ code: src, relPath });

    if (!res.ok) {
      return [
        msg(
          FormatadorMessages.parseErro(res.parser, res.error),
          relPath,
          SeverityLevels.error,
          1,
        ),
      ];
    }

    if (!res.changed) return null;

    const linha = primeiraLinhaDiferente(src, res.formatted);
    const detalhes = [
      `primeira diferença na linha ${linha}`,
      res.reason ? `motivo: ${res.reason}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    // Manter como aviso (alinha com intenção de "check" sem mutação)
    return [
      msg(
        FormatadorMessages.naoFormatado(res.parser, detalhes || undefined),
        relPath,
        SeverityLevels.warning,
        linha,
      ),
    ];
  },
});

export default analistaFormatador;
