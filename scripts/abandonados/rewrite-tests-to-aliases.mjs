// SPDX-License-Identifier: MIT
// Reescreve imports em tests/** para usar aliases @<domínio>/..., com base na estrutura em src/.
// - Suporta: import ... from '...'; import '...'; dynamic import('...'); vi.mock/vi.doMock('...')
// - Mantém imports já com alias/@ ou bare (ex.: 'chalk', 'node:fs').
// - Evita reescrever caminhos de fixtures/mocks.
// - Converte extensão .js => .ts quando o arquivo .ts existir em src.
// - Flags:
//   --dry            Apenas mostra o que mudaria
//   --verbose        Log detalhado por arquivo
//   --scope=<dir>    Limita à pasta de testes (ex.: analistas, zeladores, cli)
//   --check          Não altera arquivos; sai com código 2 se houver mudanças necessárias
//
// Evoluções 2025-09-09:
//   * Suporte a relativos que sobem para src (../../nucleo/constelacao/log.js → @nucleo/constelacao/log.ts)
//   * Resolução baseada no caminho real + existência do arquivo
//   * Mantém relativos que não caem em src/<dominio>/... (helpers locais de teste)
//   * Opção --check para uso em CI.

import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, 'src');
const TESTS_ROOT = path.join(ROOT, 'tests');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const VERBOSE = argv.includes('--verbose');
const CHECK = argv.includes('--check');
const SCOPE = (() => {
  const a = argv.find((x) => x.startsWith('--scope='));
  return a ? a.split('=')[1] : '';
})();

const TOP_DIRS = new Set([
  'analistas',
  'arquitetos',
  'mdo',
  'guardian',
  'nucleo',
  'relatorios',
  'tipos',
  'zeladores',
]);

// Remapeamentos de aliases legados -> atuais (base sem extensão)
// Ex.: '@analistas/plano-reorganizacao' => '@analistas/estrategistas/plano-sugestao'
const LEGACY_ALIAS_MAP = new Map([
  ['@analistas/plano-reorganizacao', '@analistas/estrategistas/plano-sugestao'],
  ['@analistas/deteccao/pontuador', '@analistas/pontuadores/pontuador'],
  ['@analistas/pontuador', '@analistas/pontuadores/pontuador'],
  ['@analistas/registry', '@analistas/registry/registry'],
  ['@analistas/detector-dependencias', '@analistas/detectores/detector-dependencias'],
  ['@analistas/detector-arquetipos', '@analistas/detectores/detector-arquetipos'],
  ['@analistas/detector-node', '@analistas/detectores/detector-node'],
  ['@analistas/arquetipos-defs', '@analistas/estrategistas/arquetipos-defs'],
  // Mapeamentos @mdo herdados que apontavam para src/cli/*
  // Normalizar para @mdo/<arquivo> em vez de @mdo/src/cli/<arquivo>
  ['@mdo/src/cli/comando-diagnosticar', '@mdo/comando-diagnosticar'],
  ['@mdo/src/cli/comando-guardian', '@mdo/comando-guardian'],
  ['@mdo/src/cli/comando-podar', '@mdo/comando-podar'],
  ['@mdo/src/cli/comando-perf', '@mdo/comando-perf'],
  ['@mdo/src/cli/comando-reestruturar', '@mdo/comando-reestruturar'],
  ['@mdo/src/cli/comando-analistas', '@mdo/comando-analistas'],
  ['@mdo/src/cli/comando-metricas', '@mdo/comando-metricas'],
  ['@mdo/src/cli/processamento-diagnostico', '@mdo/processamento-diagnostico'],
  // Mapeamentos diretos @mdo/cli/* → @mdo/* (casos conhecidos)
  ['@mdo/cli/comando-diagnosticar', '@mdo/comando-diagnosticar'],
  ['@mdo/cli/comando-guardian', '@mdo/comando-guardian'],
  ['@mdo/cli/comando-podar', '@mdo/comando-podar'],
  ['@mdo/cli/comando-perf', '@mdo/comando-perf'],
  ['@mdo/cli/comando-reestruturar', '@mdo/comando-reestruturar'],
  ['@mdo/cli/comando-analistas', '@mdo/comando-analistas'],
  ['@mdo/cli/comando-metricas', '@mdo/comando-metricas'],
  ['@mdo/cli/processamento-diagnostico', '@mdo/processamento-diagnostico'],
  ['@mdo/cli/comandos', '@mdo/comandos'],
  // fallback genérico @mdo/src/* → @mdo/* (aplicado via lógica abaixo)
]);

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function exists(p) {
  try {
    return fsSync.existsSync(p);
  } catch {
    return false;
  }
}

async function listarTestFiles(dir) {
  const out = [];
  
  async function walk(d) {
    const ents = await fs.readdir(d, { withFileTypes: true });
    for (const ent of ents) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (SCOPE && toPosix(path.relative(TESTS_ROOT, full)).split('/')[0] !== SCOPE) continue;
        await walk(full);
  } else if (/\.(test|spec)\.[cm]?tsx?$/i.test(ent.name)) {
        if (!SCOPE || toPosix(path.relative(TESTS_ROOT, full)).startsWith(SCOPE + '/')) {
          out.push(full);
        }
      }
    }
  }
  await walk(dir);
  return out;
}

function detectScopeFromTestPath(fileAbs) {
  const rel = toPosix(path.relative(TESTS_ROOT, fileAbs));
  const first = rel.split('/')[0];
  return first || '';
}

function pathFromAlias(aliasSpec) {
  // '@analistas/foo/bar.ts' => <ROOT>/src/analistas/foo/bar.ts
  const spec = aliasSpec.replace(/^@/, '');
  const parts = spec.split('/');
  const top = parts.shift();
  return path.join(SRC_ROOT, top, parts.join('/'));
}

function pickExtForAlias(aliasBase) {
  // aliasBase sem extensão
  const absTs = pathFromAlias(aliasBase + '.ts');
  const absJs = pathFromAlias(aliasBase + '.js');
  if (exists(absTs)) return aliasBase + '.ts';
  if (exists(absJs)) return aliasBase + '.js';
  // fallback: .ts por padrão
  return aliasBase + '.ts';
}

/**

 * TODO: Adicionar descrição da função

 * @param {*} fileAbs - TODO: Descrever parâmetro

 * @param {*} spec - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} fileAbs - TODO: Descrever parâmetro

 * @param {*} spec - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} fileAbs - TODO: Descrever parâmetro

 * @param {*} spec - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} fileAbs - TODO: Descrever parâmetro

 * @param {*} spec - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} fileAbs - TODO: Descrever parâmetro

 * @param {*} spec - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function resolveRelativeIntoSrc(fileAbs, spec) {
  try {
    const baseDir = path.dirname(fileAbs);
    const clean = spec.split('?')[0].split('#')[0];
    const hasExt = /\.(c|m)?[tj]sx?$/i.test(clean);
    const variants = hasExt ? [clean] : [clean + '.ts', clean + '.js'];
    for (const v of variants) {
      const abs = path.resolve(baseDir, v);
      const posixAbs = toPosix(abs);
      if (!posixAbs.startsWith(toPosix(SRC_ROOT))) continue;
      if (!exists(abs)) continue; // precisa existir
      const rel = toPosix(path.relative(SRC_ROOT, abs));
      const [top, ...rest] = rel.split('/');
      if (!TOP_DIRS.has(top)) continue;
      const aliasBase = '@' + [top, ...rest].join('/').replace(/\.(c|m)?[tj]sx?$/i, '');
      return aliasBase; // sem extensão; pickExtForAlias decidirá
    }
  } catch {
    return null;
  }
  return null;
}

/**

 * TODO: Adicionar descrição da função

 * @param {*} spec - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} spec - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} spec - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} spec - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} spec - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function rewriteToAlias(spec, ctx) {
  const posixSpec = toPosix(spec);
  // já é alias ou bare — ainda tentamos remapear aliases legados
  if (posixSpec.startsWith('@') || /^([a-zA-Z]+:|node:|[a-zA-Z0-9_-]+)$/.test(posixSpec)) {
    if (!posixSpec.startsWith('@')) return { changed: false, value: spec };
    const withoutExt = posixSpec.replace(/\.(ts|js|mjs|cjs|tsx|jsx)$/i, '');
    let mapped = LEGACY_ALIAS_MAP.get(withoutExt);
    // Regra genérica: @mdo/src/* → @mdo/*
    if (!mapped && withoutExt.startsWith('@mdo/src/')) {
      mapped = withoutExt.replace(/^@mdo\/src\//, '@mdo/');
    }
    // Regra genérica: @mdo/cli/* → @mdo/*
    if (!mapped && withoutExt.startsWith('@mdo/cli/')) {
      mapped = withoutExt.replace(/^@mdo\/cli\//, '@mdo/');
    }
    if (mapped) {
      const withExt = pickExtForAlias(mapped);
      return { changed: true, value: withExt };
    }
    return { changed: false, value: spec };
  }

  // não tocar fixtures/mocks
  if (/\/(fixtures|__fixtures__|mocks?)\//.test(posixSpec)) {
    return { changed: false, value: spec };
  }

  // caminho contendo '/src/' explícito
  const idxSrc = posixSpec.indexOf('/src/');
  if (idxSrc >= 0) {
    const after = posixSpec.slice(idxSrc + '/src/'.length);
    const [top, ...rest] = after.split('/');
    if (TOP_DIRS.has(top)) {
      const aliasBase = `@${top}/${rest.join('/')}`.replace(/\.(ts|js)$/i, '');
      const withExt = pickExtForAlias(aliasBase);
      return { changed: true, value: withExt };
    }
  }

  // relativo ('./' ou '../'): primeiro tenta resolver para src; fallback para lógica antiga limitada ao escopo
  if (posixSpec.startsWith('./') || posixSpec.startsWith('../')) {
    // Caso especial: caminhos que sobem e apontam explicitamente para outro domínio (ex.: ../nucleo/inquisidor.js)
    const crossDomain = posixSpec.match(/^(?:\.\.\/)+(analistas|arquitetos|mdo|guardian|nucleo|relatorios|tipos|zeladores)\/(.+)$/);
    if (crossDomain) {
      const domain = crossDomain[1];
      const rest = crossDomain[2].replace(/\.(c|m)?[tj]sx?$/i, '');
      const aliasBase = `@${domain}/${rest}`;
      const withExt = pickExtForAlias(aliasBase);
      return { changed: true, value: withExt };
    }
    const resolved = resolveRelativeIntoSrc(ctx.fileAbs, posixSpec);
    if (resolved) {
      const withExt = pickExtForAlias(resolved);
      return { changed: true, value: withExt };
    }
    const scope = ctx.scope;
    if (TOP_DIRS.has(scope)) {
      const joined = path.posix.normalize(path.posix.join(ctx.withinScope, posixSpec));
      if (joined.startsWith(scope + '/')) {
        const relWithinScope = joined.replace(new RegExp(`^${scope}/`), '');
        const aliasBase = `@${scope}/${relWithinScope}`.replace(/\.(ts|js)$/i, '');
        const withExt = pickExtForAlias(aliasBase);
        return { changed: true, value: withExt };
      }
    }
    return { changed: false, value: spec };
  }

  return { changed: false, value: spec };
}

function buildCtx(fileAbs) {
  const scope = detectScopeFromTestPath(fileAbs);
  const relFromTests = toPosix(path.relative(TESTS_ROOT, path.dirname(fileAbs)));
  const withinScope = relFromTests.startsWith(scope + '/')
    ? relFromTests
    : scope
      ? scope
      : '';
  return { scope, withinScope, fileAbs };
}

/**

 * TODO: Adicionar descrição da função

 * @param {*} code - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} code - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} code - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} code - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

/**

 * TODO: Adicionar descrição da função

 * @param {*} code - TODO: Descrever parâmetro

 * @param {*} ctx - TODO: Descrever parâmetro

 * @returns {*} TODO: Descrever retorno

 */

function transformCode(code, ctx) {
  let changed = false;
  const rewrite = (spec) => rewriteToAlias(spec, ctx);

  // import ... from '...'
  code = code.replace(/(import\s+[^'"\n]+?from\s+)(["'])([^"']+?)\2/g, (m, p1, q, spec) => {
    const r = rewrite(spec);
    if (!r.changed) return m;
    changed = true;
    return `${p1}${q}${r.value}${q}`;
  });

  // import '...'
  code = code.replace(/(import\s*)(["'])([^"']+?)\2/g, (m, p1, q, spec) => {
    const r = rewrite(spec);
    if (!r.changed) return m;
    changed = true;
    return `${p1}${q}${r.value}${q}`;
  });

  // dynamic import('...')
  code = code.replace(/(import\s*\()(\s*["'])([^"']+?)(["']\s*\))/g, (m, p1, q1, spec, q2) => {
    const r = rewrite(spec);
    if (!r.changed) return m;
    changed = true;
    return `${p1}${q1}${r.value}${q2}`;
  });

  // vi.mock / vi.doMock
  code = code.replace(/(vi\.(?:do)?mock\s*\()(\s*["'])([^"']+?)(["'])(\s*,?)/g, (m, p1, q1, spec, q2, comma = '') => {
    const r = rewrite(spec);
    if (!r.changed) return m;
    changed = true;
    return `${p1}${q1}${r.value}${q2}${comma}`;
  });

  return { code, changed };
}

async function main() {
  const files = await listarTestFiles(TESTS_ROOT);
  let modified = 0;
  let pending = 0; // para --dry/--check
  for (const file of files) {
    const ctx = buildCtx(file);
    const orig = await fs.readFile(file, 'utf-8');
    const { code, changed } = transformCode(orig, ctx);
    if (changed) {
      if (DRY || CHECK) {
        pending++;
      } else {
        modified++;
      }
      if (VERBOSE) {
        console.log('[alias-rewrite]', toPosix(path.relative(ROOT, file)));
      }
      if (!DRY && !CHECK) await fs.writeFile(file, code, 'utf-8');
    }
  }
  if (CHECK) {
    if (pending > 0) {
      console.log(`Aliases: check — ${pending} arquivo(s) precisam de reescrita.`);
      process.exit(2);
    }// console.log('Aliases: check — nenhum arquivo precisa de reescrita.'); // TODO: Remover antes da produção
    return;
  }
  if (DRY) {// console.log(`Aliases: dry-run — arquivos que seriam alterados: ${pending} / ${files.length}`); // TODO: Remover antes da produção
  } else {// console.log(`Aliases: aplicado — arquivos alterados: ${modified} / ${files.length}`); // TODO: Remover antes da produção
  }
}

main().catch((e) => {
  console.error('Falha ao reescrever para aliases:', e?.message || e);
  process.exit(1);
});
