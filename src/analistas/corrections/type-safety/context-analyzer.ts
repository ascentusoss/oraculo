// SPDX-License-Identifier: MIT
//  problema-documentacao
// Justificativa: funções estão tipadas, detector está identificando falsos positivos
/**
 * Analisador de contexto para Type Safety Auto-Fix
 * Detecta contextos onde any/unknown NÃO devem ser modificados
 */

/**
 * Verifica se posição está dentro de string literal
 *
 * IMPORTANTE: Normaliza line endings para garantir compatibilidade Windows/Linux.
 * Sem isso, arquivos com \r\n podem causar problemas de parsing.
 *
 * Ver: docs/reports/DEBUG-TYPE-SAFETY-DETECTOR-2025-11-03.md
 */
/**
 * Categoriza uso de unknown com nível de confiança
 * Retorna: 'legitimo' | 'melhoravel' | 'corrigir' + confiança (0-100)
 */
import type { CategorizacaoUnknown } from '@';

export function isInString(code: string, position: number): boolean {
  // Normaliza line endings para \n (Windows compatibility)
  const normalizedCode = code.replace(/\r\n/g, '\n');
  const before = normalizedCode.substring(0, position);

  // Conta aspas simples, duplas e template strings
  const singleQuotesBefore = (before.match(/(?<!\\)'/g) || []).length;
  const doubleQuotesBefore = (before.match(/(?<!\\)"/g) || []).length;
  const templateQuotesBefore = (before.match(/(?<!\\)`/g) || []).length;

  // Se número ímpar de aspas antes, está dentro de string
  return (
    singleQuotesBefore % 2 === 1 ||
    doubleQuotesBefore % 2 === 1 ||
    templateQuotesBefore % 2 === 1
  );
}

/**
 * Verifica se posição está dentro de comentário
 *
 * CORREÇÕES APLICADAS (2025-11-03):
 * 1. Normalização de line endings (\r\n → \n) para Windows/Linux
 * 2. Lógica corrigida: só marca como comentário se posição está DEPOIS do //
 *    Antes: verificava apenas se havia // na linha (marcava tudo)
 *    Depois: verifica se posInLine >= commentStart
 *
 * Casos de teste:
 * - "// comentário\nconst x = 5;" → linha 2 NÃO está em comentário ✅
 * - "const x = 5; // comentário" → "const x = 5" NÃO está em comentário ✅
 * - "const x = 5; // comentário" → "// comentário" ESTÁ em comentário ✅
 *
 * Ver: docs/reports/DEBUG-TYPE-SAFETY-DETECTOR-2025-11-03.md
 */
export function isInComment(code: string, position: number): boolean {
  // Normaliza line endings para \n (Windows compatibility)
  const normalizedCode = code.replace(/\r\n/g, '\n');
  const lines = normalizedCode.split('\n');
  let pos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = pos;
    const lineEnd = pos + line.length;

    if (position >= lineStart && position <= lineEnd) {
      // Verifica comentário inline (//)
      // A posição relativa na linha
      const posInLine = position - lineStart;
      const commentStart = line.indexOf('//');

      // Se há // na linha E a posição está depois do //, está em comentário
      if (commentStart !== -1 && posInLine >= commentStart) {
        return true;
      }

      // Verifica comentário de bloco (/* */)
      const blockStart = normalizedCode.lastIndexOf('/*', position);
      const blockEnd = normalizedCode.indexOf('*/', position);

      if (blockStart !== -1 && (blockEnd === -1 || blockEnd > position)) {
        return true;
      }

      return false;
    }

    pos = lineEnd + 1; // +1 para o \n
  }

  return false;
} /**
 * Verifica se posição está em string ou comentário
 */
export function isInStringOrComment(code: string, position: number): boolean {
  return isInString(code, position) || isInComment(code, position);
}

/**
 * Verifica se está em contexto TypeScript específico que deve ser ignorado
 * Exemplos: type annotation em interface, generic constraints, etc
 *
 * IMPORTANTE: NÃO ignora type assertions (as any) - esses são CRÍTICOS
 * e devem ser detectados separadamente como tipo-inseguro-any-assertion.
 *
 * CORREÇÃO APLICADA (2025-11-03):
 * Removida detecção de `as any` que estava ignorando type assertions.
 * Type assertions NÃO são legítimos - são exatamente o que queremos detectar!
 *
 * Ver: docs/reports/DEBUG-TYPE-SAFETY-DETECTOR-2025-11-03.md
 */
export function isTypeScriptContext(code: string, position: number): boolean {
  const context = code.substring(Math.max(0, position - 50), position + 50);

  // NÃO ignorar type assertions - eles são CRÍTICOS e detectados separadamente
  // O código abaixo foi removido para que as type assertions sejam sempre detectadas

  // Tipo de retorno de função genérica (isso ainda pode ser legítimo em alguns casos)
  if (/<[^>]*>\s*\([^)]*\)\s*:\s*(any|unknown)/.test(context)) {
    return true;
  }

  return false;
}

/**
 * Verifica se é arquivo legado ou vendor
 */
export function isLegacyOrVendorFile(filePath?: string): boolean {
  if (!filePath) return false;

  const legacyPatterns = [
    '/legacy/',
    '/legado/',
    '/vendor/',
    '/node_modules/',
    '/dist/',
    '/build/',
    '.d.ts',
    '.min.js',
  ];

  return legacyPatterns.some((pattern) => filePath.includes(pattern));
}

/**
 * Verifica se unknown está sendo usado em contexto apropriado
 * Contextos apropriados: entrada genérica, APIs externas, deserialização
 */
export function isUnknownInGenericContext(
  code: string,
  position: number,
): boolean {
  const context = code.substring(Math.max(0, position - 200), position + 100);

  // Função genérica com tipo T
  if (/function\s+\w+<T[^>]*>/.test(context)) {
    return true;
  }

  // Deserialização (JSON.parse, etc)
  if (/JSON\.parse|deserialize|decode/.test(context)) {
    return true;
  }

  // API externa ou fetch
  if (/fetch|axios|request|response\.data/.test(context)) {
    return true;
  }

  // Funções de persistência/serialização que aceitam dados genéricos
  if (
    /salvar|persist|save|store|write.*:\s*\([^)]*dados:\s*unknown/.test(context)
  ) {
    return true;
  }

  // Record<string, unknown> - padrão legítimo para objetos genéricos
  if (/Record<\s*string\s*,\s*unknown\s*>/.test(context)) {
    return true;
  }

  // Array<unknown> ou unknown[] - arrays genéricos
  if (/Array<\s*unknown\s*>|unknown\s*\[\]/.test(context)) {
    return true;
  }

  // Parâmetros opcionais genéricos (estilo?: unknown, options?: unknown)
  if (/\w+\?\s*:\s*unknown/.test(context)) {
    return true;
  } // Type guard function que retorna type predicate
  if (
    /function\s+\w+\([^)]*:\s*unknown\)[^:]*:\s*\w+\s+is\s+\w+/.test(context)
  ) {
    return true;
  }

  return false;
}

/**
 * Verifica se any está em declaração de função genérica
 * Nesses casos, pode ser legítimo dependendo do contexto
 */
export function isAnyInGenericFunction(
  code: string,
  position: number,
): boolean {
  const context = code.substring(Math.max(0, position - 300), position + 100);

  // Função de callback genérica
  if (/callback\s*:\s*\([^)]*:\s*any/.test(context)) {
    return true;
  }

  // Event handler genérico
  if (/on\w+\s*:\s*\([^)]*:\s*any/.test(context)) {
    return true;
  }

  return false;
}

/**
 * Extrai domínio do arquivo baseado no caminho
 */
export function getDomainFromFilePath(filePath: string): string {
  const match = filePath.match(/src\/([\w-]+)\//);
  if (match) {
    return match[1];
  }

  // Fallback para 'shared' se não conseguir determinar
  return 'shared';
}

/**
 * Converte PascalCase/camelCase para kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Verifica se é arquivo de definição de tipos (.d.ts)
 */
export function isDefinitionFile(filePath: string): boolean {
  return filePath.endsWith('.d.ts');
}

/**
 * Verifica se é arquivo TypeScript
 */
export function isTypeScriptFile(filePath: string): boolean {
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

/**
 * Extrai nome da variável/parâmetro do match
 */
export function extractVariableName(
  match: RegExpMatchArray,
  code: string,
): string | null {
  const position = match.index || 0;
  const before = code.substring(
    Math.max(0, position - 100),
    position + match[0].length,
  );

  // Padrão: nome: any ou nome: unknown
  const varMatch = before.match(/(\w+)\s*:\s*(?:any|unknown)\b/);
  if (varMatch) {
    return varMatch[1];
  }

  return null;
}

/**
 * Extrai contexto da linha onde o match ocorre
 */
export function extractLineContext(code: string, position: number): string {
  const lines = code.split('\n');
  let pos = 0;

  for (const line of lines) {
    const lineStart = pos;
    const lineEnd = pos + line.length;

    if (position >= lineStart && position <= lineEnd) {
      return line;
    }

    pos = lineEnd + 1;
  }

  return '';
}

// Re-exporta para compatibilidade
export type { CategorizacaoUnknown };

export function categorizarUnknown(
  code: string,
  filePath: string,
  lineContext: string,
): CategorizacaoUnknown {
  // Type Guards - 100% legítimo
  if (/:\s*unknown\)\s*:\s*\w+\s+is\s+/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 100,
      motivo: 'Type guard padrão TypeScript - unknown é a escolha correta',
    };
  }

  // Catch blocks - 100% legítimo
  if (/catch\s*\(\s*\w+\s*:\s*unknown\s*\)/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 100,
      motivo: 'Catch block padrão TypeScript - unknown é recomendado',
    };
  }

  // Índice extensível [k: string]: unknown - 100% legítimo
  if (/\[\s*\w+\s*:\s*string\s*\]\s*:\s*unknown/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 100,
      motivo: 'Índice extensível - permite propriedades adicionais',
    };
  }

  // Record<string, unknown> ou Map<*, unknown> - 100% legítimo
  if (
    /Record<[^,]+,\s*unknown>/.test(lineContext) ||
    /Map<[^,]+,\s*unknown>/.test(lineContext)
  ) {
    return {
      categoria: 'legitimo',
      confianca: 100,
      motivo: 'Objeto genérico - Record/Map com unknown é apropriado',
    };
  }

  // Array<unknown> ou unknown[] - 100% legítimo
  if (/Array<unknown>/.test(lineContext) || /unknown\[\]/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 100,
      motivo: 'Array genérico - unknown[] é apropriado',
    };
  }

  // Parâmetro opcional com unknown - 95% legítimo
  if (/\w+\?\s*:\s*unknown/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Parâmetro opcional - unknown é aceitável',
      sugestao: 'Considere usar tipo mais específico se o uso for conhecido',
    };
  }

  // Guardian related - análise detalhada
  if (
    /guardian\s*:\s*unknown/.test(lineContext) ||
    filePath.includes('guardian')
  ) {
    if (
      lineContext.includes('detalhes') ||
      lineContext.includes('erros') ||
      lineContext.includes('Error')
    ) {
      return {
        categoria: 'corrigir',
        confianca: 90,
        motivo: 'Guardian error details tem estrutura conhecida',
        sugestao: 'Criar interface GuardianErrorDetails com campos específicos',
        variantes: [
          'interface GuardianErrorDetails { message: string; code?: string; stack?: string }',
          'type GuardianError = Error | { message: string; details?: unknown }',
          'Usar tipo Error nativo do TypeScript',
        ],
      };
    }
    return {
      categoria: 'melhoravel',
      confianca: 85,
      motivo: 'Guardian retorna dados não estruturados',
      sugestao: 'Criar interface GuardianResult com campos conhecidos',
      variantes: [
        'interface GuardianResult { status: "ok" | "erro"; baseline?: Baseline; drift?: Drift }',
        'type GuardianOutput = SuccessResult | ErrorResult (discriminated union)',
        'Usar zod/io-ts para validação runtime + tipos',
      ],
    };
  }

  // AST/Babel nodes - 80% melhorável
  if (
    /\bast\s*:\s*unknown/.test(lineContext) ||
    /\bnode\s*:\s*unknown/.test(lineContext) ||
    lineContext.includes('NodePath')
  ) {
    return {
      categoria: 'melhoravel',
      confianca: 80,
      motivo: 'AST deveria ser tipado com Node do /types',
      sugestao: 'import type { Node } from "/types"; usar Node | null',
      variantes: [
        'Node (AST node genérico do Babel)',
        'NodePath<Node> (para traverse)',
        'File | Program | Statement | Expression (tipos específicos)',
      ],
    };
  }

  // Funções de serialização/persistência - 95% legítimo
  if (
    /salvar|persist|save|store|write|serialize|stringify/.test(lineContext) &&
    /dados\s*:\s*unknown|value\s*:\s*unknown/.test(lineContext)
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo:
        'Função de serialização - unknown é apropriado para dados genéricos',
      sugestao:
        'Se formato for conhecido, use tipo genérico: <T = unknown>(dados: T) => ...',
    };
  }

  // Funções de validação genéricas - 95% legítimo
  if (
    /validar|validate|check|assert|guard/.test(lineContext) &&
    /\w+\s*:\s*unknown/.test(lineContext)
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Função de validação - recebe unknown e valida tipo',
    };
  }

  // Acesso dinâmico protegido (safeGet) - 95% legítimo
  if (
    /safeGet|tryGet|getProperty/.test(lineContext) &&
    /:\s*unknown/.test(lineContext) &&
    !/:\s*unknown\)/.test(lineContext)
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Acesso dinâmico protegido - retorno é unknown por segurança',
      sugestao:
        'Validar tipo após obter valor: const val = safeGet(...); if (typeof val === ...)',
    };
  }

  // Replacer functions em JSON - 95% legítimo
  if (
    /replacer|reviver/.test(lineContext) &&
    /\w+\s*:\s*unknown/.test(lineContext)
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Replacer/reviver do JSON - unknown é esperado',
    };
  }

  // Wrappers de AST/parsing - 95% legítimo
  if (
    /wrap|parse|transform/.test(lineContext) &&
    /ast\s*:\s*unknown|rawAst\s*:\s*unknown/.test(lineContext)
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Wrapper de parser - AST de origem desconhecida',
    };
  }

  // Funções de error handling - 95% legítimo
  if (
    /error\s*:\s*unknown|err\s*:\s*unknown|e\s*:\s*unknown/.test(lineContext) &&
    (/extrair|extract|format|parse/.test(lineContext) ||
      filePath.includes('validacao'))
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo:
        'Error handling - error pode ser de qualquer tipo em catch/callbacks',
    };
  }

  // Mock/test utilities - 95% legítimo
  if (/mock|vitest|expect|args\s*:\s*unknown\[\]/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Test utilities - tipos genéricos de framework de testes',
    };
  }

  // CLI options/callbacks - 95% legítimo quando vem de framework
  if (
    /opts\s*:\s*unknown|options\s*:\s*unknown/.test(lineContext) &&
    (filePath.includes('cli') || /aplicar|process|handle/.test(lineContext))
  ) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'CLI framework callback - opts validado downstream',
    };
  }

  // Propriedades de índice dinâmico em type assertions - 95% legítimo
  if (/as\s+unknown\s+as\s+\{[^}]*:\s*unknown/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo: 'Type assertion para acesso dinâmico - padrão de compatibilidade',
    };
  }

  // Callbacks/handlers genéricos - análise contextual
  if (/(opts|options|params|args)\s*:\s*unknown/.test(lineContext)) {
    if (filePath.includes('cli') || filePath.includes('comando')) {
      return {
        categoria: 'legitimo',
        confianca: 85,
        motivo: 'Callback CLI - opts será validado downstream',
        sugestao: 'Considere tipar se a interface for conhecida',
        variantes: [
          'CommandOptions (interface do commander.js)',
          'Record<string, string | boolean | number> (CLI flags genéricos)',
          'Usar zod schema para validação + inferência de tipos',
        ],
      };
    }
    return {
      categoria: 'melhoravel',
      confianca: 70,
      motivo: 'Parâmetro genérico - pode ser mais específico',
      sugestao: 'Definir interface específica para os parâmetros',
      variantes: [
        'interface FunctionOptions { timeout?: number; verbose?: boolean; ... }',
        'Partial<KnownConfig> (se for subset de config)',
        'Usar tipo genérico com constraint: <T extends BaseOptions>',
      ],
    };
  }

  // Filter/map com unknown - 75% melhorável
  if (/filter\s*\(/.test(lineContext) || /map\s*\(/.test(lineContext)) {
    return {
      categoria: 'melhoravel',
      confianca: 75,
      motivo: 'Array operation com tipo genérico - pode inferir tipo do array',
      sugestao: 'Tipar o array pai para propagar tipos automaticamente',
      variantes: [
        'Especificar tipo do array: items: Item[] em vez de items: unknown[]',
        'Usar generics: function filter<T>(items: T[], predicate: (item: T) => boolean)',
        'Inferir do contexto: const typed = items as KnownType[]',
      ],
    };
  }

  // Relatórios/fragmentação - 70% melhorável
  if (
    filePath.includes('relatorio') ||
    filePath.includes('fragmentar') ||
    lineContext.includes('Manifest')
  ) {
    return {
      categoria: 'melhoravel',
      confianca: 70,
      motivo: 'Dados de relatório - estrutura pode ser definida',
      sugestao: 'Criar interfaces específicas para estruturas de dados',
      variantes: [
        'interface RelatorioCompleto { summary: Summary; detalhes: Detalhe[]; ... }',
        'interface ManifestPart { id: string; tipo: string; conteudo: unknown }',
        'type RelatorioJson = { version: string; data: Record<string, unknown> }',
      ],
    };
  }

  // Compatibilidade de módulos - 95% legítimo
  if (filePath.includes('chalk-safe') || /import\s*\(/.test(lineContext)) {
    return {
      categoria: 'legitimo',
      confianca: 95,
      motivo:
        'Compatibilidade ESM/CJS - unknown necessário para imports dinâmicos',
      sugestao: 'Pode adicionar type assertion após validação runtime',
    };
  }

  // Análise de contexto amplo quando específico falha
  const contextoAmplo = code.substring(
    Math.max(0, lineContext.length - 300),
    lineContext.length + 200,
  );

  // Verifica se há validação/type guard próximo
  if (
    /typeof\s+\w+\s*===/.test(contextoAmplo) ||
    /instanceof/.test(contextoAmplo) ||
    /is\w+\(/.test(contextoAmplo)
  ) {
    return {
      categoria: 'melhoravel',
      confianca: 65,
      motivo:
        'Há validação de tipo próxima - pode extrair para type guard dedicado',
      sugestao:
        'Criar função type guard: function isTipoX(obj: unknown): obj is TipoX { ... }',
      variantes: [
        'Extrair validações para type guard reutilizável',
        'Usar biblioteca de validação (zod, yup, io-ts) para runtime + types',
        'Criar branded types se for validação complexa',
      ],
    };
  }

  // Default: melhorável com análise incerta
  return {
    categoria: 'melhoravel',
    confianca: 60,
    motivo: 'Tipo unknown genérico - análise contextual limitada',
    sugestao: 'Analisar fluxo de dados para inferir tipo correto',
    variantes: [
      'Se vem de API externa: definir interface baseada na resposta esperada',
      'Se é callback: especificar assinatura da função',
      'Se é config/options: criar interface com campos opcionais',
      'Se é polimórfico: considerar discriminated union ou generics',
    ],
  };
}
