import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VitestAlias } from './src/types/shared/vitest-alias.js';

// Helpers extraídos para reduzir complexidade cognitiva da função principal
function mapTsConfigAliases(rootAbs: string): VitestAlias[] {
  try {
    const tsconfigPath = path.join(rootAbs, 'tsconfig.json');
    const raw = fs.readFileSync(tsconfigPath, 'utf8');
    // Simplesmente tenta remover comentários de linha que iniciam com // para permitir JSON.parse
    const withoutComments = raw
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n');
    const json = JSON.parse(withoutComments);
    const paths: Record<string, string[]> = json?.compilerOptions?.paths ?? {};
    const entries: VitestAlias[] = [];
    const mapPrefix = (aliasPrefix: string, rel: string) => ({
      find: aliasPrefix,
      replacement: path.resolve(rootAbs, 'src', rel).replace(/\\/g, '/'),
    });
    if (paths['/*']) entries.push(mapPrefix('', 'core'));
    if (paths['/*']) entries.push(mapPrefix('', 'nucleo'));
    if (paths['/*']) entries.push(mapPrefix('', 'shared'));
    if (paths['/*'])
      entries.push(mapPrefix('', 'analistas'));
    if (paths['/*']) entries.push(mapPrefix('', 'auto'));
    if (paths['/*'])
      entries.push(mapPrefix('', 'arquitetos'));
    if (paths['/*'])
      entries.push(mapPrefix('', 'zeladores'));
    if (paths['/*'])
      entries.push(mapPrefix('', 'relatorios'));
    if (paths['/*']) entries.push(mapPrefix('', 'messages'));
    if (paths['/*']) entries.push(mapPrefix('', 'guardian'));
    if (paths['/*']) entries.push(mapPrefix('', 'cli'));
    if (paths['/*']) entries.push(mapPrefix('', 'tipos'));
    if (paths['@/*']) entries.push(mapPrefix('@', ''));
    if (paths['@/resolver.js'] || paths['@/resolver']) {
      // O arquivo "src/resolver.ts" foi abandonado/excluído em algumas
      // branches. Só adiciona o mapping se o arquivo realmente existir para
      // evitar que o Vitest/ESLint reclamem sobre um alias apontando para
      // caminho inexistente.
      const resolverCandidate = path.resolve(rootAbs, 'src', 'resolver.ts');
      if (fs.existsSync(resolverCandidate)) {
        entries.push({
          find: '@/resolver.js',
          replacement: resolverCandidate.replace(/\\/g, '/'),
        });
        entries.push({
          find: '@/resolver',
          replacement: resolverCandidate.replace(/\\/g, '/'),
        });
      }
    }

    // Alias bare '@' (mapeado em tsconfig para types/index.ts) — necessário
    // porque alguns módulos fazem import runtime de `from '@'`.
    if (paths['@']) {
      entries.push({
        find: '@',
        replacement: path
          .resolve(rootAbs, 'src', paths['@'][0] as string)
          .replace(/\\/g, '/'),
      });
    }

    return entries;
  } catch {
    return [];
  }
}

function createResolvePlugin(rootAbs: string) {
  return {
    name: 'oraculo-resolve-src-ts-from-js',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string | undefined) {
      try {
        if (!importer) return null;
        if (!source.endsWith('.js')) return null;
        if (!(source.startsWith('.') || source.startsWith('/'))) return null;

        const cleanId = (id: string) =>
          id
            .split('?')[0]
            .split('#')[0]
            .replace(/^\/\//, '');
        let importerPath = cleanId(importer as string);
        if (importerPath.startsWith('file://'))
          importerPath = fileURLToPath(importerPath);

        const importerPosix = importerPath.replace(/\\/g, '/');
        const scope = deriveScopeFromImporter(importerPosix);

        // absolute source first
        if (source.startsWith('/'))
          return resolveCandidateToTs(path.join(rootAbs, source));

        // special cases and candidate building
        const special = source.match(
          /^\.\.\/(analistas|arquitetos|cli|guardian|nucleo|relatorios|tipos|zeladores)\/(.*)$/,
        );
        const candidate = special
          ? path.join(rootAbs, 'src', special[1], special[2])
          : source.startsWith('./') && scope
            ? path.join(rootAbs, 'src', scope, source.slice(2))
            : path.resolve(path.dirname(importerPath), source);

        const mapped = resolveCandidateToTs(candidate);
        if (mapped) return mapped;

        return resolveSrcPattern(rootAbs, source);
      } catch {
        return null;
      }
    },
  };
}

// Pequenas funções utilitárias para reduzir complexidade dentro dos plugins
function deriveScopeFromImporter(importerPosix: string): string {
  const testsIdx = importerPosix.lastIndexOf('/tests/');
  return testsIdx >= 0
    ? importerPosix.slice(testsIdx + '/tests/'.length).split('/')[0]
    : '';
}

function resolveCandidateToTs(candidate: string | null) {
  if (!candidate) return null;
  if (fs.existsSync(candidate)) return null;
  const asTs = candidate.replace(/\.js$/i, '.ts');
  if (fs.existsSync(asTs)) return `//${asTs.replace(/\\/g, '/')}`;
  return null;
}

function resolveSrcPattern(rootAbs: string, source: string) {
  const idxSrc = source.indexOf('/src/');
  if (idxSrc >= 0) {
    const sub = source.slice(idxSrc);
    const absFromRoot = path.join(rootAbs, sub);
    const asTsRoot = absFromRoot.replace(/\.js$/i, '.ts');
    if (fs.existsSync(asTsRoot)) return `//${asTsRoot.replace(/\\/g, '/')}`;
  }
  return null;
}

function createTransformPlugin(rootAbs: string) {
  // Deprecated: kept for backward compat but split into two focused plugins below
  return {
    name: 'oraculo-transform-tests-js-to-ts',
    enforce: 'pre' as const,
    transform: () => null,
  };
}

function createTransformImportsPlugin(rootAbs: string) {
  return {
    name: 'oraculo-transform-imports-js-to-ts',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      try {
        const cleanId = (s: string) => s.split('?')[0].split('#')[0];
        let file = cleanId(id);
        if (file.startsWith('file://')) file = fileURLToPath(file);
        const isTest = file.replace(/\\/g, '/').includes('/tests/');
        if (!isTest) return null;

        let changed = false;
        const tryReplaceImport = (
          m: string,
          pre: string,
          rel: string,
          rest: string,
        ) => {
          try {
            const spec = `${rel}/src/${rest}.js`;
            const absJs = path.resolve(path.dirname(file), spec);
            const absTs = absJs.replace(/\.js$/i, '.ts');
            if (!fs.existsSync(absJs) && fs.existsSync(absTs)) {
              changed = true;
              return `${pre}${rel}/src/${rest}.ts`;
            }
          } catch {}
          return m;
        };

        const out = code.replace(
          /(\W)(\.\.?(?:\/[^/'"`]+)*)\/src\/([^'"`]+?)\.js/g,
          tryReplaceImport,
        );
        return changed || out !== code ? { code: out, map: null } : null;
      } catch {
        return null;
      }
    },
  };
}

function createTransformMocksPlugin(rootAbs: string) {
  return {
    name: 'oraculo-transform-mocks-js-to-ts',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      try {
        const cleanId = (s: string) => s.split('?')[0].split('#')[0];
        let file = cleanId(id);
        if (file.startsWith('file://')) file = fileURLToPath(file);
        const isTest = file.replace(/\\/g, '/').includes('/tests/');
        if (!isTest) return null;

        let changed = false;
        const tryReplaceMock = (
          _full: string,
          prefix: string,
          spec: string,
          suffix: string,
        ) => {
          try {
            const isRel = spec.startsWith('./') || spec.startsWith('../');
            if (isRel) {
              let absTarget = path.resolve(path.dirname(file), spec);
              const absTs = absTarget.replace(/\.js$/i, '.ts');
              if (!fs.existsSync(absTarget) && fs.existsSync(absTs))
                absTarget = absTs;
              if (fs.existsSync(absTarget)) {
                changed = true;
                return `${prefix}//${absTarget.replace(/\\/g, '/')} ${suffix}`.replace(
                  ' ',
                  '',
                );
              }
            }
          } catch {}
          return `${prefix}${spec}${suffix}`;
        };

        const out = code.replace(
          /(vi\.(?:do)?mock\(\s*['"])([^'"`]+)(['"`])/g,
          tryReplaceMock,
        );
        return changed || out !== code ? { code: out, map: null } : null;
      } catch {
        return null;
      }
    },
  };
}

export default defineConfig(() => {
  const isCI = process.env.CI === 'true';
  const coverageEnabled = isCI || process.env.COVERAGE === 'true';
  const enforceThresholds = isCI || process.env.COVERAGE_ENFORCE === 'true';
  const coverageProvider = process.env.COVERAGE_PROVIDER || 'c8';
  const providerMapped =
    coverageProvider === 'c8'
      ? 'istanbul'
      : coverageProvider === 'v8'
        ? 'v8'
        : 'v8';
  const rootAbs = path.resolve(process.cwd());
  const onWindows = process.platform === 'win32';
  const requestedPool = String(process.env.VITEST_POOL || '').toLowerCase();
  const pool =
    requestedPool === 'forks' || requestedPool === 'threads'
      ? (requestedPool as 'forks' | 'threads')
      : onWindows
        ? 'forks'
        : 'threads';
  const maxWorkersEnv = Number(
    process.env.VITEST_MAX_WORKERS || (onWindows ? '1' : ''),
  );

  const alias = mapTsConfigAliases(rootAbs);

  return {
    resolve: { alias },
    plugins: [
      createResolvePlugin(rootAbs),
      createTransformImportsPlugin(rootAbs),
      createTransformMocksPlugin(rootAbs),
    ],
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./tests/cli/setup-fast-mode.ts'],
      testTimeout: Number(process.env.VITEST_TEST_TIMEOUT_MS || 120000),
      hookTimeout: Number(process.env.VITEST_HOOK_TIMEOUT_MS || 60000),
      teardownTimeout: Number(process.env.VITEST_TEARDOWN_TIMEOUT_MS || 60000),
      reporters: (process.env.VITEST_REPORTER || 'dot')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as unknown as (
        | 'default'
        | 'basic'
        | 'dot'
        | 'verbose'
        | 'tap'
        | 'junit'
      )[],
      pool,
      ...(Number.isFinite(maxWorkersEnv) && maxWorkersEnv > 0
        ? { maxWorkers: maxWorkersEnv }
        : {}),
      poolOptions: {
        threads: {
          singleThread: process.platform === 'win32',
        },
      },
      fileParallelism: !onWindows,
      sequence: { concurrent: process.platform !== 'win32' },
      onConsoleLog(log, type) {
        try {
          const noisyTypes = ['stdout'];
          if (noisyTypes.includes(type as string)) return false;
          const s = String(log);
          if (
            s.includes('FINAL_EMIT_') ||
            s.includes('DEBUG:') ||
            s.includes('SUCESSO') ||
            s.includes('LOG.') ||
            /\[\d{2}:\d{2}:\d{2}\]\s/.test(s)
          ) {
            return false;
          }
        } catch {}
        return undefined;
      },
      include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
      exclude: [
        '.deprecados/**',
        '.abandonados/**',
        'tests/fixtures/estruturas/**/node_modules/**',
      ],
      coverage: {
        provider: providerMapped as 'v8' | 'istanbul',
        reportsDirectory: './coverage',
        enabled: coverageEnabled,
        include: ['src/**/*.ts'],
        exclude: ((): string[] => {
          try {
            const exPath = path.join(
              rootAbs,
              'scripts',
              'coverage-exclude.json',
            );
            if (fs.existsSync(exPath)) {
              const raw = fs.readFileSync(exPath, 'utf8');
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed as string[];
            }
          } catch {}
          return [];
        })(),
        all: false,
        ...(enforceThresholds
          ? {
              thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90,
              },
            }
          : {}),
      },
    },
  };
});
