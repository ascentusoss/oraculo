// SPDX-License-Identifier: MIT

export type TipoProjeto =
  | 'desconhecido'
  | 'landing'
  | 'api'
  | 'lib'
  | 'cli'
  | 'fullstack'
  | 'monorepo';

export interface SinaisProjeto {
  temPages?: boolean;
  temComponents?: boolean;
  temControllers?: boolean;
  temApi?: boolean;
  temExpress?: boolean;
  temSrc?: boolean;
  temCli?: boolean;
  temPrisma?: boolean;
  temPackages?: boolean;
}

export interface DiagnosticoProjeto {
  tipo: TipoProjeto;
  sinais: (keyof SinaisProjeto)[];
  confiabilidade: number;
}
