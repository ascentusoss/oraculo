// SPDX-License-Identifier: MIT
/**
 * Detector de tipos inseguros (any e unknown) - Versão Inteligente
 * Identifica uso de any e unknown com análise contextual avançada
 *
 * Estratégia:
 * - Analisa contexto para determinar legitimidade do uso
 * - Sugere alternativas específicas quando possível
 * - Explica variantes e possibilidades quando análise é incerta
 * - Sempre recomenda revisão manual para casos complexos
 */

import {
  categorizarUnknown,
  extractVariableName,
  isAnyInGenericFunction,
  isInStringOrComment,
  isLegacyOrVendorFile,
  isTypeScriptContext,
  isUnknownInGenericContext,
} from '@analistas/corrections/type-safety/context-analyzer.js';
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import { config } from '@core/config/config.js';
import { shouldSuppressOccurrence } from '@shared/helpers/rule-config.js';

import type { Analista, Ocorrencia } from '@';

const ANALISTA: Analista = {
  nome: 'detector-tipos-inseguros',
  categoria: 'code-quality',
  descricao:
    'Detecta uso de any e unknown que podem ser substituídos por tipos específicos',

  test: (relPath: string) => {
    return relPath.endsWith('.ts') || relPath.endsWith('.tsx');
  },

  aplicar: async (
    srcParam: string,
    relPath: string,
    _ast: NodePath<Node> | null,
    fullPath?: string,
  ): Promise<Ocorrencia[]> => {
    const ocorrencias: Ocorrencia[] = [];

    // IMPORTANTE: Normalização de line endings para compatibilidade Windows/Linux
    // Sem isso, arquivos com \r\n causam split('\n') incorreto (retorna 1 linha)
    // Ver: docs/reports/DEBUG-TYPE-SAFETY-DETECTOR-2025-11-03.md
    const src = srcParam.replace(/\r\n/g, '\n');

    // Ignorar arquivos de teste quando permitido na configuração
    const isTestFile = (p: string) => {
      const rel = p.replace(/\\/g, '/').toLowerCase();
      return (
        /(^|\/)tests?(\/|\.)/.test(rel) ||
        /__tests__/.test(rel) ||
        /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(rel)
      );
    };
    const allowAnyInTests = Boolean(
      (config as unknown as { testPatterns?: { allowAnyType?: boolean } })
        .testPatterns?.allowAnyType,
    );
    if (allowAnyInTests && isTestFile(fullPath || relPath)) {
      return ocorrencias;
    }

    // Verificar se é arquivo que deve ser ignorado
    if (isLegacyOrVendorFile(fullPath || relPath)) {
      return ocorrencias;
    }

    // Detectar uso de any
    const anyPattern = /:\s*any\b/g;
    let anyMatch: RegExpMatchArray | null;

    while ((anyMatch = anyPattern.exec(src)) !== null) {
      const position = anyMatch.index || 0;

      // Pular se estiver em string ou comentário
      if (isInStringOrComment(src, position)) {
        continue;
      }

      // Pular se estiver em contexto TypeScript específico (type assertions)
      if (isTypeScriptContext(src, position)) {
        continue;
      }

      // Pular se any está em função genérica apropriada
      if (isAnyInGenericFunction(src, position)) {
        continue;
      }

      // Extrair nome da variável e contexto
      const varName = extractVariableName(anyMatch, src);
      const linha = src.substring(0, position).split('\n').length;
      const lineContext = src.split('\n')[linha - 1]?.trim() || '';

      // Análise contextual para any
      let mensagem = '';
      let sugestao = '';

      // Detectar padrões específicos
      if (/catch\s*\(\s*\w+\s*:\s*any\s*\)/.test(lineContext)) {
        mensagem = varName
          ? `'any' em catch block '${varName}' - TypeScript recomenda 'unknown'`
          : "'any' em catch block - TypeScript recomenda 'unknown'";
        sugestao = 'Substitua por: catch (error: unknown) { ... }';
      } else if (/callback\s*:\s*\([^)]*:\s*any/.test(lineContext)) {
        mensagem = varName
          ? `Callback '${varName}' com parâmetro 'any' - tipagem fraca`
          : "Callback com parâmetro 'any' - tipagem fraca";
        sugestao =
          'Defina interface do callback: (param: TipoEspecifico) => void';
      } else if (/event\s*:\s*any|e\s*:\s*any/.test(lineContext)) {
        mensagem = varName
          ? `Event handler '${varName}' com 'any' - pode usar Event types`
          : "Event handler com 'any' - pode usar Event types";
        sugestao =
          'Use tipos do DOM: MouseEvent, KeyboardEvent, etc ou React.SyntheticEvent<T>';
      } else if (/\[\s*key\s*:\s*string\s*\]\s*:\s*any/.test(lineContext)) {
        mensagem = 'Índice extensível com any - muito permissivo';
        sugestao =
          'Use: [key: string]: unknown (mais seguro) ou defina union type';
      } else if (/Record<[^,]+,\s*any>/.test(lineContext)) {
        mensagem = varName
          ? `Record com 'any' em '${varName}' - sem type safety`
          : "Record com 'any' - sem type safety";
        sugestao = 'Use Record<string, unknown> ou interface específica';
      } else if (
        /Array<any>/.test(lineContext) ||
        /any\[\]/.test(lineContext)
      ) {
        mensagem = varName
          ? `Array de 'any' em '${varName}' - perde tipagem`
          : "Array de 'any' - perde tipagem";
        sugestao =
          'Especifique tipo do array: string[], number[], CustomType[], etc';
      } else {
        // Caso genérico
        mensagem = varName
          ? `Tipo 'any' em '${varName}' desabilita verificação de tipos`
          : "Tipo 'any' desabilita verificação de tipos";
        sugestao =
          'Analise uso da variável e defina tipo específico ou use unknown com type guards';
      }

      // Adicionar contexto adicional baseado no arquivo
      let contextoAdicional = '';
      if (fullPath?.includes('tipos/')) {
        contextoAdicional =
          ' | ⚠️  Arquivo de tipos - impacta toda base de código';
      } else if (fullPath?.includes('core/') || fullPath?.includes('shared/')) {
        contextoAdicional =
          ' | ⚠️  Módulo core/shared - usado por muitos componentes';
      }

      const mensagemCompleta = `${mensagem} | 💡 ${sugestao}${contextoAdicional} | 🔍 Revisão manual obrigatória`;

      // Verifica se regra está suprimida para este arquivo
      if (shouldSuppressOccurrence('tipo-inseguro-any', relPath)) {
        continue;
      }

      ocorrencias.push({
        tipo: 'tipo-inseguro-any',
        nivel: 'aviso',
        mensagem: mensagemCompleta,
        relPath,
        linha,
        contexto: lineContext,
      });
    }

    /* -------------------------- DETECTAR TYPE ASSERTIONS (as any) -------------------------- */
    const asAnyPattern = /\b(as\s+any)\b/g;
    let asAnyMatch: RegExpMatchArray | null;

    while ((asAnyMatch = asAnyPattern.exec(src)) !== null) {
      const position = asAnyMatch.index || 0;

      // Pular se estiver em string ou comentário
      if (isInStringOrComment(src, position)) {
        continue;
      }

      const linha = src.substring(0, position).split('\n').length;
      const lineContext = src.split('\n')[linha - 1]?.trim() || '';

      // Extrair contexto da expressão
      const after = src.substring(
        position,
        Math.min(src.length, position + 50),
      );

      const mensagem =
        "Type assertion 'as any' desabilita verificação de tipos completamente";
      let sugestao = '';

      // Detectar padrões comuns de type assertion
      if (/\)\s*as\s+any/.test(lineContext)) {
        sugestao =
          'Evite cast de retorno de função - tipar função corretamente ou usar unknown com type guard';
      } else if (/\.\w+\s+as\s+any/.test(lineContext)) {
        sugestao =
          'Evite cast de propriedade - definir tipo correto no objeto pai';
      } else if (/\bas\s+any\s*\)/.test(after)) {
        sugestao =
          'Type assertion em parâmetro - definir tipo correto na assinatura da função chamada';
      } else {
        sugestao =
          'Substitua por tipo específico ou use unknown com validação runtime';
      }

      const mensagemCompleta = `${mensagem} | 💡 ${sugestao} | 🚨 CRÍTICO: Type safety completamente desabilitado | 🔍 Revisão manual obrigatória`;

      // Verifica se regra está suprimida para este arquivo
      if (shouldSuppressOccurrence('tipo-inseguro-any-assertion', relPath)) {
        continue;
      }

      ocorrencias.push({
        tipo: 'tipo-inseguro-any-assertion',
        nivel: 'erro', // Mais severo que declaração de tipo
        mensagem: mensagemCompleta,
        relPath,
        linha,
        contexto: lineContext,
      });
    }

    /* -------------------------- DETECTAR ANGLE BRACKET CASTING (<any>) -------------------------- */
    const angleBracketPattern = /<any>/g;
    let angleBracketMatch: RegExpMatchArray | null;

    while ((angleBracketMatch = angleBracketPattern.exec(src)) !== null) {
      const position = angleBracketMatch.index || 0;

      // Pular se estiver em string ou comentário
      if (isInStringOrComment(src, position)) {
        continue;
      }

      const linha = src.substring(0, position).split('\n').length;
      const lineContext = src.split('\n')[linha - 1]?.trim() || '';

      const mensagemCompleta =
        "Type casting '<any>' (sintaxe legada) desabilita type safety | 💡 Use sintaxe 'as' moderna e tipo específico | 🚨 CRÍTICO: Migrar para sintaxe moderna e tipo correto | 🔍 Revisão manual obrigatória";

      // Verifica se regra está suprimida para este arquivo
      if (shouldSuppressOccurrence('tipo-inseguro-any-cast', relPath)) {
        continue;
      }

      ocorrencias.push({
        tipo: 'tipo-inseguro-any-cast',
        nivel: 'erro',
        mensagem: mensagemCompleta,
        relPath,
        linha,
        contexto: lineContext,
      });
    }

    // Detectar uso de unknown
    const unknownPattern = /:\s*unknown\b/g;
    let unknownMatch: RegExpMatchArray | null;

    while ((unknownMatch = unknownPattern.exec(src)) !== null) {
      const position = unknownMatch.index || 0;

      // Pular se estiver em string ou comentário
      if (isInStringOrComment(src, position)) {
        continue;
      }

      // Pular se unknown está em contexto genérico apropriado (validação básica)
      if (isUnknownInGenericContext(src, position)) {
        continue;
      }

      // Análise contextual inteligente
      const linha = src.substring(0, position).split('\n').length;
      const lineContext = src.split('\n')[linha - 1]?.trim() || '';
      const categorizacao = categorizarUnknown(
        src,
        fullPath || relPath,
        lineContext,
      );

      // Extrair nome da variável
      const varName = extractVariableName(unknownMatch, src);

      // Construir mensagem baseada na categorização
      let mensagem = '';
      let nivel: 'info' | 'aviso' | 'erro' = 'info';

      if (categorizacao.categoria === 'legitimo') {
        // Legítimo com alta confiança (>=95%) - PULAR completamente
        if (categorizacao.confianca >= 95) {
          continue;
        }

        // Legítimo com confiança moderada (85-94%) - info apenas
        mensagem = varName
          ? `Tipo 'unknown' em '${varName}': ${categorizacao.motivo}`
          : `Tipo 'unknown': ${categorizacao.motivo}`;
        nivel = 'info';

        // Se tem sugestão, adicionar
        if (categorizacao.sugestao) {
          mensagem += ` | 💡 ${categorizacao.sugestao}`;
        }
      } else if (categorizacao.categoria === 'melhoravel') {
        // Melhorável - aviso com sugestão
        nivel = 'aviso';
        mensagem = varName
          ? `Tipo 'unknown' em '${varName}' pode ser melhorado (${categorizacao.confianca}% confiança)`
          : `Tipo 'unknown' pode ser melhorado (${categorizacao.confianca}% confiança)`;

        mensagem += ` | ${categorizacao.motivo}`;

        if (categorizacao.sugestao) {
          mensagem += ` | 💡 ${categorizacao.sugestao}`;
        } else {
          mensagem += ` | 💡 Revisar uso para inferir tipo mais específico`;
        }

        mensagem += ` | ⚠️  Revisão manual recomendada`;
      } else {
        // Corrigir - erro que deve ser tratado
        nivel = 'erro';
        mensagem = varName
          ? `Tipo 'unknown' em '${varName}' deve ser corrigido (${categorizacao.confianca}% confiança)`
          : `Tipo 'unknown' deve ser corrigido (${categorizacao.confianca}% confiança)`;

        mensagem += ` | ${categorizacao.motivo}`;

        if (categorizacao.sugestao) {
          mensagem += ` | ✏️  ${categorizacao.sugestao}`;
        }

        mensagem += ` | 🔍 Revisão manual obrigatória`;
      }

      // Verifica se regra está suprimida para este arquivo
      if (shouldSuppressOccurrence('tipo-inseguro-unknown', relPath)) {
        continue;
      }

      ocorrencias.push({
        tipo: 'tipo-inseguro-unknown',
        nivel,
        mensagem,
        relPath,
        linha,
        contexto: lineContext,
      });
    }

    return ocorrencias;
  },
};

export default ANALISTA;
