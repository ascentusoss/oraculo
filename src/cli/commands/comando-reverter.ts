// SPDX-License-Identifier: MIT
import { mapaReversao } from '@analistas/corrections/mapa-reversao.js';
import { ExitCode, sair } from '@cli/helpers/exit-codes.js';
import { CliComandoReverterMessages } from '@core/messages/cli/cli-comando-reverter-messages.js';
import {
  ICONES_DIAGNOSTICO,
  log,
  logAuto,
  logSistema,
} from '@core/messages/index.js';
import { Command } from 'commander';

export function registrarComandoReverter(program: Command): void {
  program
    .command('reverter')
    .description('Gerencia mapa de reversão para moves aplicados')
    .hook('preAction', async () => {
      if (process.env.ORACULO_TEST_FAST === '1') {
        try {
          await mapaReversao.carregar();
        } catch (err) {
          // Em modo de teste rápido, falhas ao carregar o mapa são ignoradas para evitar timeout.
          // Porém, em outros ambientes, registramos um aviso para reduzir casos de promises 'swallowed'.
          if (process.env.VITEST === '1') return;
          log.aviso(
            `Falha ao carregar mapa de reversão (fast-mode): ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    })
    .addCommand(
      new Command('listar')
        .description('Lista todos os moves registrados no mapa de reversão')
        .action(async () => {
          try {
            await mapaReversao.carregar();
            const _lista = mapaReversao.listarMoves();
          } catch (err) {
            log.erro(
              `Falha ao listar moves: ${err instanceof Error ? err.message : String(err)}`,
            );
            sair(ExitCode.Failure);
          }
        }),
    )
    .addCommand(
      new Command('arquivo')
        .description('Reverte todos os moves de um arquivo específico')
        .argument('<arquivo>', 'Caminho do arquivo para reverter')
        .action(async (arquivo: string) => {
          try {
            await mapaReversao.carregar();

            if (!mapaReversao.podeReverterArquivo(arquivo)) {
              logSistema.reversaoNenhumMove(arquivo);
              sair(ExitCode.Failure);
              return;
            }

            logSistema.reversaoRevertendo(arquivo);
            const sucesso = await mapaReversao.reverterArquivo(arquivo);

            if (sucesso) {
              logSistema.reversaoSucesso(arquivo);
            } else {
              logSistema.reversaoFalha(arquivo);
              sair(ExitCode.Failure);
              return;
            }
          } catch (err) {
            log.erro(
              `Falha ao reverter arquivo: ${err instanceof Error ? err.message : String(err)}`,
            );
            sair(ExitCode.Failure);
          }
        }),
    )
    .addCommand(
      new Command('move')
        .description('Reverte um move específico pelo ID')
        .argument('<id>', 'ID do move para reverter')
        .action(async (id: string) => {
          try {
            await mapaReversao.carregar();

            logAuto.mapaReversaoRevertendoMove(id);
            const sucesso = await mapaReversao.reverterMove(id);

            if (sucesso) {
              logAuto.mapaReversaoMoveRevertido(id);
            } else {
              logAuto.mapaReversaoFalhaReverterMove(id);
              sair(ExitCode.Failure);
              return;
            }
          } catch (err) {
            log.erro(
              `Falha ao reverter move: ${err instanceof Error ? err.message : String(err)}`,
            );
            sair(ExitCode.Failure);
          }
        }),
    )
    .addCommand(
      new Command('limpar')
        .description('Limpa todo o mapa de reversão (perde histórico)')
        .option('-f, --force', 'Não pede confirmação')
        .action(async (options: { force?: boolean }) => {
          try {
            await mapaReversao.carregar();

            if (!options.force) {
              sair(ExitCode.Failure);
              return;
            }

            await mapaReversao.limpar();
            log.sucesso(
              CliComandoReverterMessages.mapaLimpoComSucesso(
                ICONES_DIAGNOSTICO.sucesso,
              ),
            );
          } catch (err) {
            log.erro(
              `Falha ao limpar mapa: ${err instanceof Error ? err.message : String(err)}`,
            );
            sair(ExitCode.Failure);
          }
        }),
    )
    .addCommand(
      new Command('status')
        .description('Mostra status do mapa de reversão')
        .action(async () => {
          try {
            await mapaReversao.carregar();
            const moves = mapaReversao.obterMoves();
            if (moves.length > 0) {
              const ultimoMove = moves.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              )[0];

              const dataPtBr = new Date(ultimoMove.timestamp).toLocaleString(
                'pt-BR',
              );
              log.info(CliComandoReverterMessages.ultimoMove(dataPtBr));
            }
          } catch (err) {
            log.erro(
              `Falha ao obter status: ${err instanceof Error ? err.message : String(err)}`,
            );
            sair(ExitCode.Failure);
          }
        }),
    );
}
