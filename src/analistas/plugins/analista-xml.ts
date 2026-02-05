// SPDX-License-Identifier: MIT
import {
  AnalystOrigins,
  AnalystTypes,
  SeverityLevels,
  XmlMessages,
} from '@core/messages/core/plugin-messages.js';
import { createLineLookup } from '@shared/helpers/line-lookup.js';
import { maskXmlNonCode } from '@shared/helpers/masking.js';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_XML === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

function warn(
  message: string,
  relPath: string,
  line?: number,
  nivel: (typeof SeverityLevels)[keyof typeof SeverityLevels] = SeverityLevels.warning,
): Msg {
  return criarOcorrencia({
    relPath,
    mensagem: message,
    linha: line,
    nivel,
    origem: AnalystOrigins.xml,
    tipo: AnalystTypes.xml,
  });
}

function collectXmlIssues(src: string, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];

  // Para reduzir falsos positivos (ex.: exemplos comentados), analisamos uma versão mascarada
  // preservando quebras de linha para manter cálculo de linha consistente.
  const scan = maskXmlNonCode(src);
  const lineOf = createLineLookup(scan).lineAt;

  // Prolog (opcional): só alerta se o arquivo parece XML completo e começa direto com tag.
  // Fragmentos XML (como em SOAP ou RSS) podem não ter prolog.
  const trimmed = src.trimStart();
  const seemsCompleteDocument =
    /^<\w/i.test(trimmed) && !trimmed.includes('<?xml');
  if (seemsCompleteDocument && /^</.test(trimmed)) {
    ocorrencias.push(
      warn(XmlMessages.xmlPrologAusente, relPath, 1, SeverityLevels.info),
    );
  }

  // Validação básica de estrutura XML (tags balanceadas)
  // Melhorar regex para capturar tags com atributos complexos, namespaces, etc.
  const tagRegex = /<\/?([a-zA-Z_][\w.-]*(?::[a-zA-Z_][\w.-]*)?)(?:\s[^>]*)?>/g;
  let match;
  const tagStack: string[] = [];
  while ((match = tagRegex.exec(scan)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const line = lineOf(match.index);

    if (fullTag.startsWith('</')) {
      // Tag de fechamento
      const expected = tagStack.pop();
      if (expected !== tagName) {
        ocorrencias.push(
          warn(
            XmlMessages.invalidXmlStructure,
            relPath,
            line,
            SeverityLevels.error,
          ),
        );
        break; // Para evitar cascata de erros
      }
    } else if (!fullTag.endsWith('/>')) {
      // Tag de abertura (não self-closing)
      tagStack.push(tagName);
    }
  }

  if (tagStack.length > 0) {
    ocorrencias.push(
      warn(
        XmlMessages.invalidXmlStructure,
        relPath,
        lineOf(scan.length),
        SeverityLevels.error,
      ),
    );
  }

  // Namespaces não declarados
  // Melhorar para considerar declarações no scan mascarado e evitar falsos positivos
  const xmlnsRegex = /xmlns(?::([a-zA-Z_][\w.-]*))?\s*=\s*['"][^'"]*['"]/g;
  const declaredNamespaces = new Set<string>();
  while ((match = xmlnsRegex.exec(scan)) !== null) {
    const prefix = match[1];
    if (prefix) declaredNamespaces.add(prefix);
  }

  const prefixRegex = /([a-zA-Z_][\w.-]*):[a-zA-Z_][\w.-]*/g;
  while ((match = prefixRegex.exec(scan)) !== null) {
    const prefix = match[1];
    if (
      !declaredNamespaces.has(prefix) &&
      prefix !== 'xml' &&
      prefix !== 'xmlns'
    ) {
      const line = lineOf(match.index);
      ocorrencias.push(
        warn(
          XmlMessages.namespaceUndeclared(prefix),
          relPath,
          line,
          SeverityLevels.warning,
        ),
      );
    }
  }

  // DOCTYPE + ENTITY (XXE)
  for (const m of scan.matchAll(/<!DOCTYPE\b[\s\S]*?(?:\]\s*>|>)/gi)) {
    const chunk = m[0] ?? '';
    const hasExternalId = /\b(SYSTEM|PUBLIC)\b/i.test(chunk);
    const line = lineOf(m.index);
    ocorrencias.push(warn(XmlMessages.doctypeDetectado, relPath, line));
    if (hasExternalId) {
      ocorrencias.push(
        warn(
          XmlMessages.doctypeExternoDetectado,
          relPath,
          line,
          SeverityLevels.error,
        ),
      );
    }
  }

  for (const m of scan.matchAll(/<!ENTITY\b[\s\S]*?>/gi)) {
    const chunk = m[0] ?? '';
    const hasExternal = /\b(SYSTEM|PUBLIC)\b/i.test(chunk);
    const isParamEntity = /<!ENTITY\s+%/i.test(chunk);
    const hasDangerousSystemId =
      /\bSYSTEM\b[\s\S]*?['"]\s*(file:|ftp:|gopher:|jar:|php:|data:)/i.test(
        chunk,
      );
    const line = lineOf(m.index);

    if (isParamEntity) {
      ocorrencias.push(
        warn(
          XmlMessages.entidadeParametroDetectada,
          relPath,
          line,
          SeverityLevels.warning,
        ),
      );
    }

    // Detecta entidades com expansão potencialmente grande (Billion Laughs)
    // Focar em entidades recursivas ou com referências múltiplas, não apenas tamanho
    const entityValue = chunk.match(
      /<!ENTITY\s+[^'"]*\s+['"]([^'"]*)['"]/i,
    )?.[1];
    if (entityValue && entityValue.includes('&') && entityValue.length > 100) {
      // Heurística simples: entidades que referenciam outras e são grandes
      ocorrencias.push(
        warn(
          XmlMessages.largeEntityExpansion,
          relPath,
          line,
          SeverityLevels.error,
        ),
      );
    }

    ocorrencias.push(
      warn(
        hasExternal
          ? XmlMessages.entidadeExternaDetectada
          : XmlMessages.entidadeDetectada,
        relPath,
        line,
        hasExternal || hasDangerousSystemId
          ? SeverityLevels.error
          : SeverityLevels.warning,
      ),
    );
  }

  // XInclude (carregamento externo)
  for (const m of scan.matchAll(/<\s*(?:xi|xinclude):include\b[^>]*>/gi)) {
    ocorrencias.push(
      warn(XmlMessages.xincludeDetectado, relPath, lineOf(m.index)),
    );
  }

  // CDATA em atributos (inválido)
  for (const m of scan.matchAll(/=\s*['"]\s*<![CDATA[[^]]*]]>\s*['"]/gi)) {
    ocorrencias.push(
      warn(
        XmlMessages.cdataInAttribute,
        relPath,
        lineOf(m.index),
        SeverityLevels.error,
      ),
    );
  }

  return ocorrencias;
}

export const analistaXml = criarAnalista({
  nome: 'analista-xml',
  categoria: 'markup',
  descricao:
    'Heurísticas leves para XML (foco em segurança/XXE e compatibilidade).',
  global: false,
  test: (relPath: string): boolean => /\.xml$/i.test(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;
    const msgs = collectXmlIssues(src, relPath);
    return msgs.length ? msgs : null;
  },
});

export default analistaXml;
