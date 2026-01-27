// SPDX-License-Identifier: MIT
export enum ExitCode {
  Ok = 0,
  Failure = 1,
  Critical = 2,
  InvalidUsage = 3,
}

export function sair(codigo: ExitCode): void {
  if (!process.env.VITEST) {
    // Encerra o processo imediatamente em execução normal
    process.exit(codigo);
  } else {
    // Em testes, apenas sinaliza o exit code para o runner
    process.exitCode = codigo;
  }
}
