// SPDX-License-Identifier: MIT
import { ExitCode, sair } from '/helpers/exit-codes.js';
import chalk from '/config/chalk-safe.js';
import { config } from '/config/config.js';
import { iniciarInquisicao } from '/execution/inquisidor.js';
import { ICONES_DIAGNOSTICO, log, logSistema } from '/messages/index.js';
import { executarShellSeguro } from '/utils/exec-safe.js';
import { scanSystemIntegrity } from '/sentinela.js';
import { Command } from 'commander';

import type { FileEntryWithAst } from '@';

export function comandoAtualizar(
  aplicarFlagsGlobais: (opts: Record<string, unknown>) => void,
): Command {
  return new Command('atualizar')
    .description('Atualiza o Oráculo se a integridade estiver preservada')
    .option('--global', 'atualiza globalmente via npm i -g')
    .action(async function (this: Command, opts: { global?: boolean }) {
      try {
        await aplicarFlagsGlobais(
          this.parent && typeof this.parent.opts === 'function'
            ? this.parent.opts()
            : {},
        );
      } catch (err) {
        log.erro(
          `Falha ao aplicar flags: ${err instanceof Error ? err.message : String(err)}`,
        );
        sair(ExitCode.Failure);
        return;
      }

      log.info(chalk.bold('\n🔄 Iniciando processo de atualização...\n'));

      const baseDir = process.cwd();
      let fileEntries: FileEntryWithAst[] = [];

      try {
        const resultado = await iniciarInquisicao(baseDir, {
          incluirMetadados: false,
        });
        fileEntries = resultado.fileEntries;

        const guardianResultado = await scanSystemIntegrity(fileEntries);

        if (
          guardianResultado.status ===
            ('ok' as typeof guardianResultado.status) ||
          guardianResultado.status ===
            ('baseline-aceito' as typeof guardianResultado.status)
        ) {
          log.sucesso(
            `${ICONES_DIAGNOSTICO.sucesso} Guardian: integridade validada. Prosseguindo atualização.`,
          );
        } else {
          log.aviso(
            '🌀 Guardian gerou novo baseline ou detectou alterações. Prosseguindo com cautela.',
          );
          log.info(
            'Recomendado: `oraculo guardian --diff` e `oraculo guardian --accept-baseline` antes de atualizar.',
          );
        }

        const cmd = opts.global
          ? 'npm install -g oraculo'
          : 'npm install oraculo';

        logSistema.atualizacaoExecutando(cmd);
        executarShellSeguro(cmd, { stdio: 'inherit' });

        logSistema.atualizacaoSucesso();
      } catch (err: unknown) {
        logSistema.atualizacaoFalha();
        if (
          typeof err === 'object' &&
          err &&
          'detalhes' in err &&
          Array.isArray((err as { detalhes?: unknown }).detalhes)
        ) {
          (err as { detalhes: string[] }).detalhes.forEach((d: string) => {
            logSistema.atualizacaoDetalhes(d);
          });
        }
        if (config.DEV_MODE)
          log.erro(err instanceof Error ? err.message : String(err));
        // Em ambiente de teste (Vitest), n\u00e3o encerre o processo para n\u00e3o derrubar o runner
        sair(ExitCode.Failure);
        return;
      }
    });
}
