// SPDX-License-Identifier: MIT

import path from 'node:path';

import { ExitCode, sair } from '@cli/helpers/exit-codes.js';
import { processPatternList } from '@cli/helpers/pattern-helpers.js';
import chalk from '@core/config/chalk-safe.js';
import { scanRepository } from '@core/execution/scanner.js';
import { log } from '@core/messages/index.js';
import {
  otimizarSvgLikeSvgo,
  shouldSugerirOtimizacaoSvg,
} from '@shared/impar/svgs.js';
import { salvarEstado } from '@shared/persistence/persistencia.js';
import { Command } from 'commander';
import micromatch from 'micromatch';

import type { OtimizarSvgOptions } from '@';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
}

export function comandoOtimizarSvg(
  aplicarFlagsGlobais: (opts: Record<string, unknown>) => void,
): Command {
  return new Command('otimizar-svg')
    .description(
      'Otimiza SVGs do projeto usando o otimizador interno (svgo-like).',
    )
    .option('--dir <caminho>', 'Diretório base (default: CWD)')
    .option('--write', 'Aplica otimizações no filesystem', false)
    .option('--dry', 'Executa em modo somente leitura (default)', true)
    .option(
      '--include <padrao>',
      'Glob pattern a INCLUIR (pode repetir ou separar por vírgula/espaço)',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .option(
      '--exclude <padrao>',
      'Glob pattern a EXCLUIR adicionalmente (pode repetir ou separar por vírgula/espaço)',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .action(async function (this: Command, opts: OtimizarSvgOptions) {
      try {
        await aplicarFlagsGlobais(
          this.parent && typeof this.parent.opts === 'function'
            ? this.parent.opts()
            : {},
        );

        const write = Boolean(opts.write);
        const dry = write ? false : Boolean(opts.dry ?? true);

        const baseDir = path.resolve(opts.dir || process.cwd());
        const includeList = processPatternList(opts.include);
        const excludeList = processPatternList(opts.exclude);

        log.info(chalk.bold('OTIMIZAR SVG'));

        const files = await scanRepository(baseDir, {
          includeContent: true,
          filter: (relPath) => relPath.toLowerCase().endsWith('.svg'),
        });

        const entries = Object.values(files);
        let total = 0;
        let candidates = 0;
        let optimized = 0;
        let savedBytes = 0;

        for (const e of entries) {
          const relPath = e.relPath;
          total++;

          if (excludeList.length && micromatch.isMatch(relPath, excludeList))
            continue;
          if (includeList.length) {
            const matchGlob = micromatch.isMatch(relPath, includeList);
            const matchExact = includeList.some(
              (p) => String(p).trim() === relPath,
            );
            if (!matchGlob && !matchExact) continue;
          }

          const src = typeof e.content === 'string' ? e.content : '';
          if (!src || !/<svg\b/i.test(src)) continue;

          const opt = otimizarSvgLikeSvgo({ svg: src });
          if (!opt.changed) continue;
          if (
            !shouldSugerirOtimizacaoSvg(opt.originalBytes, opt.optimizedBytes)
          )
            continue;

          candidates++;
          const saved = opt.originalBytes - opt.optimizedBytes;
          savedBytes += saved;

          if (!dry) {
            const abs = path.resolve(baseDir, relPath);
            await salvarEstado(abs, opt.data);
            optimized++;
            log.info(
              `${relPath} — ${formatBytes(opt.originalBytes)} → ${formatBytes(opt.optimizedBytes)} (−${formatBytes(saved)})`,
            );
          } else {
            log.info(
              `[dry] ${relPath} — ${formatBytes(opt.originalBytes)} → ${formatBytes(opt.optimizedBytes)} (−${formatBytes(saved)})`,
            );
          }
        }

        if (!candidates) {
          log.info('Nenhum SVG acima do limiar de otimização.');
          sair(ExitCode.Ok);
          return;
        }

        log.info(
          `Candidatos: ${candidates} | Economia potencial: ${formatBytes(savedBytes)} | Total de SVGs lidos: ${total}`,
        );

        if (write) {
          log.sucesso(
            `Otimização aplicada em ${optimized}/${candidates} arquivos.`,
          );
        } else {
          log.info('Use --write para aplicar as otimizações.');
        }

        sair(ExitCode.Ok);
      } catch (err) {
        log.erro(
          `Falha ao otimizar SVGs: ${err instanceof Error ? err.message : String(err)}`,
        );
        sair(ExitCode.Failure);
      }
    });
}
