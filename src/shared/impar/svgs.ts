// SPDX-License-Identifier: MIT

import type { SvgoMinimoMudanca, SvgoMinimoResult } from '@';

// Re-exportar para compatibilidade com código existente
export type { SvgoMinimoMudanca, SvgoMinimoResult } from '@';

// Limiar padrão para evitar ruído em galerias de ícones:
// só sugerimos otimização quando a economia é relevante.
export const SVG_OPT_MIN_BYTES_SAVED = 40;
export const SVG_OPT_MIN_PERCENT_SAVED = 5;

export function shouldSugerirOtimizacaoSvg(
  originalBytes: number,
  optimizedBytes: number,
): boolean {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) return false;
  if (!Number.isFinite(optimizedBytes) || optimizedBytes >= originalBytes)
    return false;

  const saved = originalBytes - optimizedBytes;
  const pct = (saved / originalBytes) * 100;
  return saved >= SVG_OPT_MIN_BYTES_SAVED || pct >= SVG_OPT_MIN_PERCENT_SAVED;
}

function normalizarFimDeLinha(code: string): string {
  return code.replace(/\r\n?/g, '\n');
}

function removerBom(code: string): { out: string; changed: boolean } {
  if (code.length > 0 && code.charCodeAt(0) === 0xfeff) {
    return { out: code.slice(1), changed: true };
  }
  return { out: code, changed: false };
}

function removerXmlProlog(code: string): { out: string; changed: boolean } {
  const out = code.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
  return { out, changed: out !== code };
}

function removerDoctype(code: string): { out: string; changed: boolean } {
  const out = code.replace(/^\s*<!DOCTYPE[^>]*>\s*/i, '');
  return { out, changed: out !== code };
}

function removerComentarios(code: string): { out: string; changed: boolean } {
  let previous: string;
  let current = code;
  do {
    previous = current;
    current = current.replace(/<!--[\s\S]*?-->/g, '');
  } while (current !== previous);
  return { out: current, changed: current !== code };
}

function removerMetadata(code: string): { out: string; changed: boolean } {
  const out = code.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  return { out, changed: out !== code };
}

function removerDefsVazio(code: string): { out: string; changed: boolean } {
  const out = code.replace(/<defs\b[^>]*>\s*<\/defs>/gi, '');
  return { out, changed: out !== code };
}

function removerAtributosRaiz(code: string): {
  out: string;
  changed: boolean;
  mudancas: SvgoMinimoMudanca[];
} {
  let out = code;
  const mudancas: SvgoMinimoMudanca[] = [];

  // remove version="1.1" etc (geralmente redundante)
  const beforeVersion = out;
  out = out.replace(/(<svg\b[^>]*?)\s+version=("[^"]*"|'[^']*')/i, '$1');
  if (out !== beforeVersion) mudancas.push('remover-version');

  // remove enable-background="new ..." (deprecated)
  const beforeEnable = out;
  out = out.replace(
    /(<svg\b[^>]*?)\s+enable-background=("[^"]*"|'[^']*')/i,
    '$1',
  );
  if (out !== beforeEnable) mudancas.push('remover-enable-background');

  // remove xmlns:xlink se xlink: não aparece no arquivo
  if (!/\bxlink:/i.test(out)) {
    const beforeXlink = out;
    out = out.replace(/(<svg\b[^>]*?)\s+xmlns:xlink=("[^"]*"|'[^']*')/i, '$1');
    if (out !== beforeXlink) mudancas.push('remover-xmlns-xlink');
  }

  return { out, changed: out !== code, mudancas };
}

function colapsarEspacosEntreTags(code: string): {
  out: string;
  changed: boolean;
} {
  // Troca sequências de whitespace entre tags por nada: ">\n  <" => "><".
  // Isso não mexe em espaços dentro de nós de texto.
  const out = code.replace(/>\s+</g, '><');
  return { out, changed: out !== code };
}

export function otimizarSvgLikeSvgo(params: { svg: string }): SvgoMinimoResult {
  const warnings: string[] = [];

  const original = params.svg;
  const originalBytes = Buffer.byteLength(original, 'utf8');

  let out = original;
  const mudancas: SvgoMinimoMudanca[] = [];

  // Flags de segurança: não altera, só sinaliza
  if (/<script\b/i.test(out)) warnings.push('script-inline');
  if (/\son\w+\s*=\s*['"]/i.test(out)) warnings.push('evento-inline');
  if (/javascript:\s*/i.test(out)) warnings.push('javascript-url');

  const eol = normalizarFimDeLinha(out);
  if (eol !== out) {
    out = eol;
    mudancas.push('normalizar-eol');
  }

  const bom = removerBom(out);
  if (bom.changed) {
    out = bom.out;
    mudancas.push('remover-bom');
  }

  const prolog = removerXmlProlog(out);
  if (prolog.changed) {
    out = prolog.out;
    mudancas.push('remover-xml-prolog');
  }

  const doctype = removerDoctype(out);
  if (doctype.changed) {
    out = doctype.out;
    mudancas.push('remover-doctype');
  }

  const comments = removerComentarios(out);
  if (comments.changed) {
    out = comments.out;
    mudancas.push('remover-comentarios');
  }

  const meta = removerMetadata(out);
  if (meta.changed) {
    out = meta.out;
    mudancas.push('remover-metadata');
  }

  const defs = removerDefsVazio(out);
  if (defs.changed) {
    out = defs.out;
    mudancas.push('remover-defs-vazio');
  }

  const attrs = removerAtributosRaiz(out);
  if (attrs.changed) {
    out = attrs.out;
    mudancas.push(...attrs.mudancas);
  }

  const collapsed = colapsarEspacosEntreTags(out);
  if (collapsed.changed) {
    out = collapsed.out;
    mudancas.push('colapsar-espacos-entre-tags');
  }

  const trimmed = `${out.trimEnd()}\n`;
  if (trimmed !== out) {
    out = trimmed;
    mudancas.push('trim-final');
  }

  const optimizedBytes = Buffer.byteLength(out, 'utf8');

  return {
    ok: true,
    data: out,
    changed: out !== original,
    mudancas,
    originalBytes,
    optimizedBytes,
    warnings,
  };
}
