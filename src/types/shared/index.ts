// SPDX-License-Identifier: MIT
/**
 * Exportações centralizadas de tipos do shared
 * (Tipos movidos: contexto→projeto, fragmentacao/leitor→relatorios)
 */

// Contexto - MOVIDO para projeto/contexto.ts
// export type { ContextoProjeto, DetectarContextoOpcoes } from '../projeto/contexto.js';

// Estrutura
export type {
  NomeacaoEstilo,
  OpcoesEstrategista,
  ParseNomeResultado,
} from './estrutura.js';

// Fragmentação - MOVIDO para relatorios/fragmentacao.ts
// export type { FragmentOptions, ManifestPart, RelatorioCompleto, FileEntry, Manifest } from '../relatorios/fragmentacao.js';

// Imports
export type { ImportReescrito } from './imports.js';

// Leitor de relatórios - MOVIDO para relatorios/leitor.ts
// export type { LeitorRelatorioOptions } from '../relatorios/leitor.js';

// Validação (tipos que não conflitam com outros módulos)
export type {
  ConfigPlugin,
  DisplayNamesAPI,
  DisplayNamesConstructor,
  EntradaMapaReversao,
  ErroComMensagem,
  ErrorLike,
  ErroValidacaoCombinacao,
  GlobalComImport,
  GlobalComVitest,
  ImportDinamico,
  IntlComDisplayNames,
  SnapshotAnalise,
  VitestMockFn,
} from './validacao.js';
export {
  extrairMensagemErro,
  isConfigPlugin,
  isErroComMensagem,
  isGlobalComImport,
  isGlobalComVitest,
  isIntlComDisplayNames,
  validarSeguro,
} from './validacao.js';

// Vitest Alias
export type { VitestAlias } from './vitest-alias.js';

// Persistência
export type {
  SalvarBinarioFn,
  SalvarEstadoFn,
  VitestSpyWrapper,
} from './persistencia.js';

// Helpers
export type {
  FrameworkInfo,
  MagicConstantRule,
  MemoryMessage,
  RegrasSuprimidas,
  RuleConfig,
  RuleOverride,
  SupressaoInfo,
} from './helpers.js';

// Impar (formatter e svgs)
export type {
  FormatadorMinimoParser,
  FormatadorMinimoResult,
  FormatadorMinimoResultError,
  FormatadorMinimoResultOk,
  SvgoMinimoMudanca,
  SvgoMinimoResult,
} from './impar.js';

// Stylelint
export type {
  CssDuplicateContext,
  CssLintSeverity,
  CssLintWarning,
  CssTreeNode,
} from './stylelint.js';

// Memory
export type { OraculoContextState, OraculoRunRecord } from './memory.js';
