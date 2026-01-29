// SPDX-License-Identifier: MIT
/**
 * Tipos para sistema de Type Safety Auto-Fix
 * Suporta análise e correção inteligente de tipos `any` e `unknown`
 */

import type { Node } from '/types';

/**
 * Tipo auxiliar para nós AST com propriedades específicas
 */
export interface ASTNode {
  type?: string;
  name?: string;
  object?: ASTNode;
  property?: ASTNode;
  callee?: ASTNode;
  value?: unknown;
  loc?: {
    start?: { line?: number; column?: number };
  };
  [key: string]: unknown;
}

export interface TypeAnalysis {
  /** Confiança na inferência do tipo (0-100) */
  confidence: number;

  /** Tipo inferido a partir da análise */
  inferredType: string;

  /** Se é tipo primitivo (string, number, boolean, etc) */
  isSimpleType: boolean;

  /** Nome do tipo se for interface/type complexo */
  typeName: string;

  /** Definição completa do tipo (para criação de arquivo) */
  typeDefinition: string;

  /** Caminho sugerido para criar o tipo (ex: 'analistas/dados-padroes.ts') */
  suggestedPath: string;

  /** Sugestão adicional para o usuário */
  suggestion?: string;

  /** Se criou novo tipo */
  createdNewType?: boolean;

  /** Se requer import */
  requiresImport?: boolean;
}

export interface UsagePattern {
  /** Todos os usos são de string */
  allUsagesAreString: boolean;

  /** Todos os usos são de number */
  allUsagesAreNumber: boolean;

  /** Todos os usos são de boolean */
  allUsagesAreBoolean: boolean;

  /** Tem estrutura de objeto com propriedades acessadas */
  hasObjectStructure: boolean;

  /** Propriedades acessadas no objeto */
  objectProperties?: PropertyUsage[];

  /** Tem type guards (typeof, instanceof, in, etc) */
  hasTypeGuards: boolean;

  /** Type guards encontrados */
  typeGuards?: TypeGuard[];

  /** É usado como função */
  isFunction: boolean;

  /** É usado como array */
  isArray: boolean;

  /** Tipos encontrados em uniões */
  unionTypes?: string[];
}

export interface PropertyUsage {
  /** Nome da propriedade */
  name: string;

  /** Tipo inferido da propriedade */
  inferredType: string;

  /** Confiança na inferência */
  confidence: number;

  /** É opcional (não usado sempre) */
  isOptional: boolean;

  /** Métodos chamados nesta propriedade */
  methodsCalled?: string[];
}

export interface TypeGuard {
  /** Tipo do guard (typeof, instanceof, in, custom) */
  type: 'typeof' | 'instanceof' | 'in' | 'custom';

  /** Expressão do type guard */
  expression: string;

  /** Tipo inferido do guard */
  inferredType: string;

  /** Confiança no guard */
  confidence: number;
}

export interface InferredInterface {
  /** Nome da interface */
  name: string;

  /** Definição TypeScript da interface */
  definition: string;

  /** Confiança na inferência */
  confidence: number;

  /** Propriedades da interface */
  properties: PropertyUsage[];
}

export interface TypeReplacementValidation {
  /** Se o tipo é compatível com os usos */
  isCompatible: boolean;

  /** Tipo esperado baseado em uso */
  expectedType: string;

  /** Erros de compilação TypeScript */
  errors: string[];

  /** Avisos */
  warnings: string[];
}

export interface AdditionalChange {
  /** Tipo de mudança adicional */
  type: 'add-import' | 'create-type-file' | 'update-index' | 'add-type-guard';

  /** Conteúdo da mudança */
  content: string;

  /** Caminho do arquivo afetado (para create-type-file) */
  path?: string;
}

export interface TypeSafetyWarning {
  /** Tipo do aviso */
  type: 'type-suggestion' | 'unsafe-type' | 'keep-unknown' | 'duplicate-type';

  /** Mensagem do aviso */
  message: string;

  /** Sugestão para o usuário */
  suggestion: string;

  /** Confiança da análise */
  confidence?: number;

  /** Requer revisão manual */
  needsManualReview?: boolean;

  /** Caminho do arquivo com tipo conflitante */
  conflictingTypePath?: string;
}

export interface QuickFixResult {
  /** Código modificado */
  code: string;

  /** Mudanças adicionais necessárias */
  additionalChanges?: AdditionalChange[];

  /** Avisos gerados */
  warnings?: TypeSafetyWarning[];

  /** Se a correção foi aplicada */
  applied?: boolean;

  /** Motivo de não aplicação */
  reason?: string;
}

export interface VariableUsage {
  /** Nome da variável */
  name: string;

  /** Tipo do nó AST */
  nodeType: string;

  /** Linha no código */
  line: number;

  /** Coluna no código */
  column: number;

  /** Contexto ao redor */
  context: string;

  /** Operação realizada (call, access, assignment, etc) */
  operation:
    | 'call'
    | 'access'
    | 'assignment'
    | 'comparison'
    | 'return'
    | 'argument';

  /** Propriedade acessada (se aplicável) */
  property?: string;

  /** Método chamado (se aplicável) */
  method?: string;

  /** Argumento de função (se aplicável) */
  argumentIndex?: number;
}

export interface TypeInferenceContext {
  /** Arquivo sendo analisado */
  filePath: string;

  /** Domínio do arquivo (analistas, cli, core, etc) */
  domain: string;

  /** Se é arquivo TypeScript */
  isTypeScript: boolean;

  /** Se é arquivo de definição (.d.ts) */
  isDefinitionFile: boolean;

  /** Se é arquivo legado */
  isLegacy: boolean;

  /** AST do arquivo (Babel Node) */
  ast: Node | null;

  /** Código completo */
  code: string;
}

export interface ExistingType {
  /** Nome do tipo */
  name: string;

  /** Caminho do arquivo */
  path: string;

  /** Definição do tipo */
  definition: string;

  /** Se é tipo exportado */
  isExported: boolean;

  /** Domínio do tipo */
  domain: string;
}

/**
 * Categorização de uso de unknown
 */
export interface CategorizacaoUnknown {
  categoria: 'legitimo' | 'melhoravel' | 'corrigir';
  confianca: number;
  motivo: string;
  sugestao?: string;
  variantes?: string[]; // Possibilidades alternativas quando análise é incerta
}
