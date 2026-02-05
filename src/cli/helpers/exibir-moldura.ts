// SPDX-License-Identifier: MIT
/**
 * Helper para exibição segura de molduras (blocos formatados)
 * Fornece fallback para ambientes onde log.bloco não está disponível
 */

import { CliExibirMolduraMessages } from '@core/messages/cli/cli-exibir-moldura-messages.js';
import { log } from '@core/messages/index.js';

/**
 * Exibe uma moldura formatada com fallback seguro
 *
 * Tenta usar log.bloco para exibir uma moldura estilizada.
 * Se falhar (ambiente de teste ou log.bloco não disponível),
 * usa fallback simples com log.info.
 *
 * @param titulo - Título da moldura
 * @param linhas - Linhas de conteúdo a exibir
 * @param fallbackFn - Função de fallback customizada (opcional)
 * @returns true se usou moldura, false se usou fallback
 *
 * @example
 * ```typescript
 * exibirMolduraSegura('Plano de reestruturação', [
 *   'De                  → Para',
 *   '-------------------  -------------------',
 *   'src/old.ts          → src/new.ts',
 * ]);
 * ```
 */
export function exibirMolduraSegura(
  titulo: string,
  linhas: string[],
  fallbackFn?: () => void,
): boolean {
  try {
    // Tenta usar log.bloco (disponível em produção)
    const bloco = (
      log as unknown as { bloco: (t: string, l: string[]) => string }
    ).bloco(titulo, linhas);
    console.log(bloco);
    return true;
  } catch {
    // Fallback: usa função customizada ou exibição simples
    if (fallbackFn) {
      fallbackFn();
    } else {
      // Fallback padrão: exibe linhas simples com log.info
      linhas.forEach((linha) =>
        log.info(CliExibirMolduraMessages.fallbackLinha(linha)),
      );
    }
    return false;
  }
}

/**
 * Exibe moldura de plano de reestruturação com tratamento de overflow
 *
 * @param movimentos - Lista de movimentos (formato: { de, para })
 * @param limite - Número máximo de linhas a exibir (padrão: 10)
 */
export function exibirMolduraPlano(
  movimentos: Array<{ de: string; para: string }>,
  limite = 10,
): void {
  const linhas: string[] = [
    CliExibirMolduraMessages.planoCabecalhoLinha1,
    CliExibirMolduraMessages.planoCabecalhoLinha2,
  ];

  const primeiros = movimentos.slice(0, limite);
  for (const m of primeiros) {
    const de = String(m.de).replace(/\\/g, '/').slice(0, 34).padEnd(34, ' ');
    const para = String(m.para).replace(/\\/g, '/').slice(0, 39);
    linhas.push(`${de}  → ${para}`);
  }

  if (movimentos.length > limite) {
    linhas.push(
      CliExibirMolduraMessages.planoOverflow(movimentos.length - limite),
    );
  }

  exibirMolduraSegura(CliExibirMolduraMessages.planoTitulo, linhas, () => {
    primeiros.forEach((m) =>
      log.info(CliExibirMolduraMessages.planoFallbackLinha(m.de, m.para)),
    );
    if (movimentos.length > limite) {
      log.info(
        CliExibirMolduraMessages.planoFallbackOverflow(
          movimentos.length - limite,
        ),
      );
    }
  });
}

/**
 * Exibe moldura de conflitos com tratamento de overflow
 *
 * @param conflitos - Lista de conflitos (formato: { alvo, motivo })
 * @param limite - Número máximo de linhas a exibir (padrão: 10)
 */
export function exibirMolduraConflitos(
  conflitos: Array<{ alvo?: string; motivo?: string } | unknown>,
  limite = 10,
): void {
  const linhas: string[] = [
    CliExibirMolduraMessages.conflitosCabecalhoLinha1,
    CliExibirMolduraMessages.conflitosCabecalhoLinha2,
  ];

  const primeiros = conflitos.slice(0, limite);
  for (const c of primeiros) {
    const alvo = String(
      (c && typeof c === 'object' && 'alvo' in c && c.alvo) ??
        JSON.stringify(c),
    )
      .replace(/\\/g, '/')
      .slice(0, 31)
      .padEnd(31, ' ');
    const motivo = String(
      (c && typeof c === 'object' && 'motivo' in c && c.motivo) ?? '-',
    ).slice(0, 30);
    linhas.push(`${alvo}   ${motivo}`);
  }

  if (conflitos.length > limite) {
    linhas.push(
      CliExibirMolduraMessages.conflitosOverflow(conflitos.length - limite),
    );
  }

  exibirMolduraSegura(CliExibirMolduraMessages.conflitosTitulo, linhas, () => {
    primeiros.forEach((c) => {
      const alvoStr =
        (c && typeof c === 'object' && 'alvo' in c && c.alvo) ??
        'alvo desconhecido';
      const motivoStr =
        (c && typeof c === 'object' && 'motivo' in c && c.motivo) ?? '-';
      log.aviso(
        CliExibirMolduraMessages.conflitosFallbackLinha(
          String(alvoStr),
          String(motivoStr),
        ),
      );
    });
    if (conflitos.length > limite) {
      log.aviso(
        CliExibirMolduraMessages.conflitosFallbackOverflow(
          conflitos.length - limite,
        ),
      );
    }
  });
}
