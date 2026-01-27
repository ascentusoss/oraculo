// SPDX-License-Identifier: MIT
import type { FiltrosConfig, Ocorrencia, OcorrenciaParseErro } from '@';

// Re-exporta o tipo para compatibilidade
export type { FiltrosConfig };

/**
 * Aplica supressão às ocorrências baseado na configuração.
 * IMPORTANTE: Isso é para filtrar SAÍDA/RELATÓRIOS, não varredura de arquivos.
 */
export function aplicarSupressaoOcorrencias(
  ocorrencias: Array<OcorrenciaParseErro | Ocorrencia>,
  filtros: FiltrosConfig | undefined,
): Ocorrencia[] {
  if (!filtros) {
    return ocorrencias as Ocorrencia[];
  }

  const filtradas = ocorrencias.filter((ocorrencia) => {
    const tipo = (ocorrencia as Ocorrencia).tipo || '';
    const relPath = ocorrencia.relPath || '';
    const nivel = ocorrencia.nivel || '';
    const mensagem = (ocorrencia as Ocorrencia).mensagem || '';

    // Suprime por tipo/regra (verifica tanto o tipo quanto a mensagem)
    if (
      filtros.suppressRules?.some(
        (rule) => tipo.includes(rule) || mensagem.includes(rule),
      )
    ) {
      return false;
    }

    // Suprime por severidade
    if (filtros.suppressBySeverity && filtros.suppressBySeverity[nivel]) {
      return false;
    }

    // Suprime por caminho (glob patterns)
    if (
      filtros.suppressByPath?.some((pattern) => {
        // Implementação simples de glob match
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
        );
        return regex.test(relPath);
      })
    ) {
      return false;
    }

    // Suprime por padrão de arquivo
    if (
      filtros.suppressByFilePattern?.some((pattern) => {
        const fileName = relPath.split('/').pop() || '';
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
        );
        return regex.test(fileName);
      })
    ) {
      return false;
    }

    return true;
  });

  return filtradas as Ocorrencia[];
}
