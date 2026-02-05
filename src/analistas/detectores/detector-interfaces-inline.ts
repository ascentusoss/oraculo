// SPDX-License-Identifier: MIT
/**
 * Detector de Interfaces Inline
 * Identifica definições de interfaces e tipos complexos inline que deveriam estar em arquivos de tipos
 *
 * Estratégia:
 * - Detecta interfaces inline em funções, classes e variáveis
 * - Identifica tipos complexos que deveriam ser extraídos
 * - Sugere movimentação para o diretório de tipos configurado (conventions.typesDirectory)
 * - Analisa reutilização e complexidade para priorizar extrações
 */

import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import {
  getTypesDirectoryDisplay,
  isInsideTypesDirectory,
} from '@core/config/conventions.js';
import { DetectorInterfacesInlineMessages } from '@core/messages/analistas/detector-interfaces-inline-messages.js';

import type { Analista, InterfaceInlineDetection, Ocorrencia } from '@';

const ANALISTA: Analista = {
  nome: 'detector-interfaces-inline',
  categoria: 'code-organization',
  descricao:
    'Detecta interfaces e tipos complexos inline que deveriam estar em arquivos de tipos',

  test: (relPath: string) => {
    // Não analisar arquivos que já estão na pasta de tipos
    if (isInsideTypesDirectory(relPath)) {
      return false;
    }

    // Não analisar arquivos de definição de tipos do TypeScript
    if (relPath.endsWith('.d.ts')) {
      return false;
    }

    // Não analisar arquivos deprecados
    if (
      relPath.includes('/.deprecados/') ||
      relPath.includes('\\.deprecados\\')
    ) {
      return false;
    }

    // Não analisar node_modules
    if (
      relPath.includes('/node_modules/') ||
      relPath.includes('\\node_modules\\')
    ) {
      return false;
    }

    return relPath.endsWith('.ts') || relPath.endsWith('.tsx');
  },

  aplicar: async (
    srcParam: string,
    relPath: string,
    _ast: NodePath<Node> | null,
    _fullPath?: string,
  ): Promise<Ocorrencia[]> => {
    const ocorrencias: Ocorrencia[] = [];

    // Normalização de line endings
    const src = srcParam.replace(/\r\n/g, '\n');
    const _linhas = src.split('\n');

    // 1. Detectar interfaces inline em funções EXPORTADAS
    // Funções locais podem ter tipos inline simples sem problema
    const interfaceInlinePattern =
      /export\s+function\s+\w+\s*\([^)]*\):\s*{[^}]+}/g;
    let match: RegExpMatchArray | null;

    while ((match = interfaceInlinePattern.exec(src)) !== null) {
      const position = match.index || 0;
      const linha = src.substring(0, position).split('\n').length;

      if (isInStringOrComment(src, position)) {
        continue;
      }

      const detection = analyzeInlineInterface(
        match[0],
        linha,
        'function-return',
      );
      // Aumentar threshold para 5 propriedades em tipos de retorno
      if (detection && detection.complexidade >= 5) {
        ocorrencias.push(createOcorrencia(detection, relPath));
      }
    }

    // 2. Detectar tipos literais complexos em parâmetros
    // Apenas reportar parâmetros realmente complexos (5+ propriedades)
    const complexParamPattern = /\w+\s*:\s*{\s*[^}]+;\s*[^}]+;\s*[^}]+}/g;

    while ((match = complexParamPattern.exec(src)) !== null) {
      const position = match.index || 0;
      const linha = src.substring(0, position).split('\n').length;

      if (isInStringOrComment(src, position)) {
        continue;
      }

      const detection = analyzeInlineInterface(match[0], linha, 'parameter');
      // Aumentar threshold para 5 propriedades em parâmetros
      if (detection && detection.complexidade >= 5) {
        ocorrencias.push(createOcorrencia(detection, relPath));
      }
    }

    // 3. Detectar type aliases inline com uniões complexas
    // Buscar declarações de type e depois extrair o conteúdo completo
    const typeStartPattern = /type\s+(\w+)\s*=/g;
    let startMatch: RegExpMatchArray | null;

    while ((startMatch = typeStartPattern.exec(src)) !== null) {
      const position = startMatch.index || 0;
      const nomeTipo = startMatch[1];

      if (isInStringOrComment(src, position)) {
        continue;
      }

      // Extrair o tipo completo (até o próximo ponto-e-vírgula no nível raiz)
      const afterEquals = src.substring(position + startMatch[0].length);
      const tipoCompleto = extractTypeDefinition(afterEquals);

      if (!tipoCompleto) {
        continue;
      }

      const linha = src.substring(0, position).split('\n').length;
      const complexidade = calculateComplexidade(tipoCompleto);

      // Aumentar threshold para 5 propriedades em type aliases
      if (complexidade >= 5) {
        const detection: InterfaceInlineDetection = {
          tipo: 'type-alias',
          nome: nomeTipo,
          linha,
          complexidade,
          contexto: tipoCompleto.substring(0, 100),
          sugestao:
            DetectorInterfacesInlineMessages.moverTipoParaTipos(nomeTipo),
        };
        ocorrencias.push(createOcorrencia(detection, relPath));
      }
    }

    // 4. Detectar interfaces exportadas inline (PRIORIDADE MÁXIMA)
    // Pattern para capturar 'export interface Nome' de forma precisa
    const exportInterfacePattern =
      /export\s+interface\s+(\w+)\s*(<[^>]*>)?\s*\{/g;
    while ((match = exportInterfacePattern.exec(src)) !== null) {
      const position = match.index || 0;
      const linha = src.substring(0, position).split('\n').length;
      const nomeInterface = match[1];

      if (isInStringOrComment(src, position)) {
        continue;
      }

      // Interfaces exportadas SEMPRE devem estar em tipos/
      const detection: InterfaceInlineDetection = {
        tipo: 'interface',
        nome: nomeInterface,
        linha,
        complexidade: 0, // Não importa - exportada sempre reporta
        contexto: `export interface ${nomeInterface}`,
        sugestao:
          DetectorInterfacesInlineMessages.interfaceExportadaParaTipos(
            nomeInterface,
          ),
      };
      ocorrencias.push(createOcorrencia(detection, relPath));
    }

    // 5. Detectar interfaces declaradas inline (não exportadas, mas complexas)
    // Pattern melhorado para capturar interfaces multi-linha
    const interfaceDeclarationPattern =
      /(?<!export\s+)interface\s+(\w+)\s*\{[\s\S]+?\}/g;
    while ((match = interfaceDeclarationPattern.exec(src)) !== null) {
      const position = match.index || 0;
      const linha = src.substring(0, position).split('\n').length;
      const nomeInterface = match[1];

      if (isInStringOrComment(src, position)) {
        continue;
      }

      // Verificar se não foi já detectada como exportada
      const jaDetetada = ocorrencias.some(
        (o) => o.linha === linha && o.mensagem?.includes(nomeInterface),
      );
      if (jaDetetada) {
        continue;
      }

      // Verificar se interface é local (começa com minúscula)
      const isLocal = /^[a-z]/.test(nomeInterface);

      // Só reportar se for complexa e não for local
      const interfaceCompleta = match[0];
      const complexidade = calculateComplexidade(interfaceCompleta);

      if (complexidade >= 4 && !isLocal) {
        const detection: InterfaceInlineDetection = {
          tipo: 'interface',
          nome: nomeInterface,
          linha,
          complexidade,
          contexto: interfaceCompleta.substring(0, 100),
          sugestao:
            DetectorInterfacesInlineMessages.interfaceComplexaParaTipos(
              nomeInterface,
            ),
        };
        ocorrencias.push(createOcorrencia(detection, relPath));
      }
    }

    // 6. Detectar tipos inline repetidos (possível duplicação)
    const tiposInline = extractAllInlineTypes(src);
    const tiposRepetidos = findDuplicateTypes(tiposInline);

    for (const [estrutura, ocorrenciasArray] of tiposRepetidos.entries()) {
      const totalOcorrencias = ocorrenciasArray.length;
      const primeiraOcorrencia = ocorrenciasArray[0];

      // Extrair assinatura das propriedades para mensagem
      const propriedades = estrutura
        .split(';')
        .map((p) => p.split(':')[0])
        .slice(0, 3);
      const nomesSugeridos = propriedades.join('_');

      // Detectar contextos de uso
      const contextosUnicos = [
        ...new Set(ocorrenciasArray.map((o) => o.contexto)),
      ];
      const contextoDesc =
        contextosUnicos.length > 1
          ? `em ${contextosUnicos.length} contextos diferentes`
          : 'no mesmo contexto';

      ocorrencias.push({
        tipo: 'interface-inline-duplicada',
        nivel: 'aviso',
        mensagem: DetectorInterfacesInlineMessages.tipoDuplicado({
          propriedades,
          totalOcorrencias,
          contextoDesc,
          nomesSugeridos,
        }),
        relPath,
        linha: primeiraOcorrencia.linha,
        detalhes: {
          estrutura,
          ocorrencias: ocorrenciasArray.length,
          linhas: ocorrenciasArray.map((o) => o.linha),
          contextos: contextosUnicos,
        },
      } as Ocorrencia);
    }

    return ocorrencias;
  },
};

/**
 * Analisa uma interface inline e determina se deve ser extraída
 */
function analyzeInlineInterface(
  code: string,
  linha: number,
  contexto: 'function-return' | 'parameter' | 'variable',
): InterfaceInlineDetection | null {
  const tiposDirDisplay = getTypesDirectoryDisplay();
  const complexidade = calculateComplexidade(code);

  // Só reportar se for realmente complexo (5+ propriedades)
  if (complexidade < 5) {
    return null;
  }

  let sugestao = '';
  switch (contexto) {
    case 'function-return':
      sugestao = `Extrair tipo de retorno para interface em ${tiposDirDisplay}`;
      break;
    case 'parameter':
      sugestao = `Extrair tipo de parâmetro para interface em ${tiposDirDisplay}`;
      break;
    case 'variable':
      sugestao = `Extrair tipo da variável para interface em ${tiposDirDisplay}`;
      break;
  }

  return {
    tipo: 'object-literal-type',
    linha,
    complexidade,
    contexto: code.substring(0, 100),
    sugestao,
  };
}

/**
 * Calcula complexidade de um tipo baseado em propriedades, união, interseção, etc
 */
function calculateComplexidade(tipoString: string): number {
  let score = 0;

  // Contar propriedades: cada `;` ou `,` seguido de algo indica uma propriedade
  // Também conta `:` para capturar propriedades sem separador final
  const propriedadesMultilinha = (tipoString.match(/[;:]\s*\n/g) || []).length;
  const propriedadesInline = (tipoString.match(/;\s*\w+\s*:/g) || []).length;
  const propriedadesTotal = (tipoString.match(/\w+\s*\??\s*:/g) || []).length;

  // Usar o maior valor entre as contagens (sem fator de redução para inline)
  score += Math.max(
    propriedadesMultilinha,
    propriedadesInline + 1,
    propriedadesTotal,
  );

  // Contar operadores de união
  const unioes = (tipoString.match(/\|/g) || []).length;
  score += unioes * 0.5;

  // Contar operadores de interseção
  const intersecoes = (tipoString.match(/&/g) || []).length;
  score += intersecoes * 0.5;

  // Contar genéricos aninhados
  const genericosAninhados = (tipoString.match(/<[^>]*</g) || []).length;
  score += genericosAninhados * 2;

  // Contar arrays e objetos aninhados
  const aninhamento = (tipoString.match(/{\s*\w+\s*:/g) || []).length;
  score += aninhamento;

  return Math.floor(score);
}

/**
 * Extrai estrutura normalizada de propriedades de um tipo objeto
 */
function extractTypeStructure(tipoString: string): string {
  // Extrair apenas nomes e tipos das propriedades, ignorando valores específicos
  const props: string[] = [];

  // Pattern melhorado para capturar propriedades com seus tipos
  const propPattern = /(\w+)\??\s*:\s*([^;,}]+)/g;
  let match: RegExpMatchArray | null;

  while ((match = propPattern.exec(tipoString)) !== null) {
    const propName = match[1];
    let propType = match[2].trim();

    // Normalizar tipos comuns
    propType = propType
      .replace(/\s+/g, ' ')
      .replace(/string|number|boolean|null|undefined/gi, (m) => m.toLowerCase())
      .replace(/\[\]/g, 'Array')
      .replace(/Record<[^>]+>/g, 'Record')
      .replace(/Promise<[^>]+>/g, 'Promise')
      .trim();

    props.push(`${propName}:${propType}`);
  }

  // Retornar assinatura normalizada ordenada
  return props.sort().join(';');
}

/**
 * Extrai todos os tipos inline do código com estrutura normalizada
 */
function extractAllInlineTypes(
  src: string,
): Array<{ tipo: string; estrutura: string; linha: number; contexto: string }> {
  const tipos: Array<{
    tipo: string;
    estrutura: string;
    linha: number;
    contexto: string;
  }> = [];

  // Pattern melhorado para capturar objetos tipo literal (incluindo multi-linha)
  // Procura por padrões como: { prop: type, ... } em contextos de tipo
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar início de tipo objeto literal
    // Contextos: : { ... }, < { ... }, = { ... } (em tipos, não valores)
    const typeObjStart = /[:=<]\s*\{\s*$/;
    const inlineTypeObj = /:\s*\{[^}]+\}/g;

    // Tentar match inline simples primeiro
    let match: RegExpMatchArray | null;
    while ((match = inlineTypeObj.exec(line)) !== null) {
      const matchIndex = match.index ?? 0;
      const position =
        src.substring(0, src.indexOf(lines.slice(0, i + 1).join('\n'))).length +
        matchIndex;

      if (!isInStringOrComment(src, position)) {
        const tipoOriginal = match[0].substring(match[0].indexOf('{'));
        const complexidade = calculateComplexidade(tipoOriginal);

        if (complexidade >= 4) {
          const estrutura = extractTypeStructure(tipoOriginal);
          const contexto = line
            .substring(0, matchIndex)
            .trim()
            .substring(0, 60);
          const linha = i + 1;

          tipos.push({
            tipo: tipoOriginal.replace(/\s+/g, ' ').trim(),
            estrutura,
            linha,
            contexto,
          });
        }
      }
    }

    // Detectar objetos tipo multi-linha
    if (typeObjStart.test(line) && !line.includes('//')) {
      let depth = 1;
      const tipoLines: string[] = ['{'];
      let j = i + 1;

      while (j < lines.length && depth > 0) {
        const nextLine = lines[j];
        tipoLines.push(nextLine);

        // Contar abertura/fechamento de chaves (simplificado)
        for (const char of nextLine) {
          if (char === '{') depth++;
          if (char === '}') depth--;
          if (depth === 0) break;
        }

        j++;
        if (j - i > 50) break; // Limite de segurança
      }

      if (depth === 0) {
        const tipoOriginal = tipoLines.join('\n').trim();
        const position = src.indexOf(tipoOriginal);

        if (position !== -1 && !isInStringOrComment(src, position)) {
          const complexidade = calculateComplexidade(tipoOriginal);

          if (complexidade >= 4) {
            const estrutura = extractTypeStructure(tipoOriginal);
            const contexto = line
              .substring(0, line.indexOf('{'))
              .trim()
              .substring(0, 60);
            const linha = i + 1;

            tipos.push({
              tipo: tipoOriginal.replace(/\s+/g, ' ').trim(),
              estrutura,
              linha,
              contexto,
            });
          }
        }
      }
    }
  }

  return tipos;
}

/**
 * Encontra tipos inline duplicados com base na estrutura normalizada
 */
function findDuplicateTypes(
  tipos: Array<{
    tipo: string;
    estrutura: string;
    linha: number;
    contexto: string;
  }>,
): Map<string, Array<{ linha: number; tipo: string; contexto: string }>> {
  const mapa = new Map<
    string,
    Array<{ linha: number; tipo: string; contexto: string }>
  >();

  // Agrupar por estrutura normalizada (não por tipo literal exato)
  for (const { estrutura, linha, tipo, contexto } of tipos) {
    if (!mapa.has(estrutura)) {
      mapa.set(estrutura, []);
    }
    const arr = mapa.get(estrutura);
    if (arr) {
      arr.push({ linha, tipo, contexto });
    }
  }

  // Filtrar apenas duplicados significativos
  const duplicados = new Map<
    string,
    Array<{ linha: number; tipo: string; contexto: string }>
  >();

  for (const [estrutura, ocorrencias] of mapa.entries()) {
    // Critérios mais refinados:
    // - >= 4 ocorrências: duplicação clara que deve ser extraída
    // - >= 3 ocorrências com contextos diferentes: possível tipo comum
    const contextosUnicos = new Set(ocorrencias.map((o) => o.contexto)).size;

    if (
      ocorrencias.length >= 4 ||
      (ocorrencias.length >= 3 && contextosUnicos >= 2)
    ) {
      duplicados.set(estrutura, ocorrencias);
    }
  }

  return duplicados;
}

/**
 * Cria ocorrência a partir de uma detecção
 */
function createOcorrencia(
  detection: InterfaceInlineDetection,
  relPath: string,
): Ocorrencia {
  const tiposDirDisplay = getTypesDirectoryDisplay();
  let tipo = '';
  let nivel: 'info' | 'aviso' | 'erro' = 'info';
  let mensagem = '';

  switch (detection.tipo) {
    case 'interface':
      tipo = 'interface-inline-exportada';
      nivel = 'aviso';
      mensagem = detection.nome
        ? `Interface '${detection.nome}' deve estar em ${tiposDirDisplay}`
        : `Interface inline deve estar em ${tiposDirDisplay}`;
      break;
    case 'type-alias':
      tipo = 'type-alias-inline-complexo';
      nivel = 'aviso';
      mensagem = detection.nome
        ? `Tipo '${detection.nome}' complexo deve estar em ${tiposDirDisplay}`
        : `Tipo complexo deve estar em ${tiposDirDisplay}`;
      break;
    case 'object-literal-type':
      tipo = 'tipo-literal-inline-complexo';
      nivel = 'info';
      mensagem = `Tipo literal complexo (${detection.complexidade} propriedades) - considere extrair`;
      break;
  }

  return {
    tipo,
    nivel,
    mensagem,
    relPath,
    linha: detection.linha,
  } as Ocorrencia;
} /**
 * Extrai definição completa de um tipo a partir do ponto após o '='
 */
function extractTypeDefinition(afterEquals: string): string | null {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let result = '';

  for (let i = 0; i < afterEquals.length; i++) {
    const char = afterEquals[i];
    const prevChar = i > 0 ? afterEquals[i - 1] : '';

    // Controle de strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (inString && char === stringChar) {
        inString = false;
      } else if (!inString) {
        inString = true;
        stringChar = char;
      }
    }

    if (inString) {
      result += char;
      continue;
    }

    // Contar chaves
    if (char === '{' || char === '<' || char === '[' || char === '(') {
      depth++;
    } else if (char === '}' || char === '>' || char === ']' || char === ')') {
      depth--;
    }

    result += char;

    // Parar no ponto-e-vírgula no nível raiz
    if (char === ';' && depth === 0) {
      return result;
    }
  }

  return null;
}

/**
 * Verifica se posição está dentro de string ou comentário
 */
function isInStringOrComment(src: string, position: number): boolean {
  const beforePosition = src.substring(0, position);
  const linha = beforePosition.split('\n').pop() || '';

  // Comentário de linha
  if (linha.includes('//')) {
    const commentPos = linha.indexOf('//');
    const posInLine =
      beforePosition.length - beforePosition.lastIndexOf('\n') - 1;
    if (posInLine > commentPos) {
      return true;
    }
  }

  // Comentário de bloco
  const lastBlockCommentStart = beforePosition.lastIndexOf('/*');
  const lastBlockCommentEnd = beforePosition.lastIndexOf('*/');
  if (lastBlockCommentStart > lastBlockCommentEnd) {
    return true;
  }

  // String (aspas simples ou duplas)
  const singleQuotes = (beforePosition.match(/'/g) || []).length;
  const doubleQuotes = (beforePosition.match(/"/g) || []).length;
  const backticks = (beforePosition.match(/`/g) || []).length;

  return (
    singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0
  );
}

export default ANALISTA;
