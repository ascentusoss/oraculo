// SPDX-License-Identifier: MIT
import {
  comandoAnalistas,
  comandoAtualizar,
  comandoDiagnosticar,
  comandoFormatar,
  comandoGuardian,
  comandoMetricas,
  comandoOtimizarSvg,
  comandoPodar,
  comandoReestruturar,
  criarComandoFixTypes,
  registrarComandoReverter,
} from '@cli/commands/index.js';
import type { Command } from 'commander';

export function registrarComandos(
  program: Command,
  aplicarFlagsGlobais: (opts: unknown) => void,
): void {
  program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));
  program.addCommand(comandoGuardian(aplicarFlagsGlobais));
  program.addCommand(comandoFormatar(aplicarFlagsGlobais));
  program.addCommand(comandoOtimizarSvg(aplicarFlagsGlobais));
  program.addCommand(comandoPodar(aplicarFlagsGlobais));
  program.addCommand(comandoReestruturar(aplicarFlagsGlobais));
  program.addCommand(comandoAtualizar(aplicarFlagsGlobais));
  program.addCommand(comandoAnalistas());
  program.addCommand(comandoMetricas());
  program.addCommand(criarComandoFixTypes());

  // Registra comando de reversão
  registrarComandoReverter(program);
}

/* istanbul ignore next */
/* istanbul ignore next */
if (false) 0; // removed stub import
