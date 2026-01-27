import { ExitCode, sair } from '../helpers/exit-codes.js';
import chalk from '../../core/config/chalk-safe.js';
import { config } from '../../core/config/config.js';
import { iniciarInquisicao } from '../../core/execution/inquisidor.js';
import { ICONES_DIAGNOSTICO, log, logSistema } from '../../core/messages/index.js';
import { executarShellSeguro } from '../../core/utils/exec-safe.js';
import { scanSystemIntegrity } from '../../guardian/sentinela.js';
import { Command } from 'commander';
export function comandoAtualizar(aplicarFlagsGlobais) {
    return new Command('atualizar')
        .description('Atualiza o Oráculo se a integridade estiver preservada')
        .option('--global', 'atualiza globalmente via npm i -g')
        .action(async function (opts) {
        try {
            await aplicarFlagsGlobais(this.parent && typeof this.parent.opts === 'function'
                ? this.parent.opts()
                : {});
        }
        catch (err) {
            log.erro(`Falha ao aplicar flags: ${err instanceof Error ? err.message : String(err)}`);
            sair(ExitCode.Failure);
            return;
        }
        log.info(chalk.bold('\n🔄 Iniciando processo de atualização...\n'));
        const baseDir = process.cwd();
        let fileEntries = [];
        try {
            const resultado = await iniciarInquisicao(baseDir, {
                incluirMetadados: false,
            });
            fileEntries = resultado.fileEntries;
            const guardianResultado = await scanSystemIntegrity(fileEntries);
            if (guardianResultado.status ===
                'ok' ||
                guardianResultado.status ===
                    'baseline-aceito') {
                log.sucesso(`${ICONES_DIAGNOSTICO.sucesso} Guardian: integridade validada. Prosseguindo atualização.`);
            }
            else {
                log.aviso('🌀 Guardian gerou novo baseline ou detectou alterações. Prosseguindo com cautela.');
                log.info('Recomendado: `oraculo guardian --diff` e `oraculo guardian --accept-baseline` antes de atualizar.');
            }
            const cmd = opts.global
                ? 'npm install -g oraculo@latest'
                : 'npm install oraculo@latest';
            logSistema.atualizacaoExecutando(cmd);
            executarShellSeguro(cmd, { stdio: 'inherit' });
            logSistema.atualizacaoSucesso();
        }
        catch (err) {
            logSistema.atualizacaoFalha();
            if (typeof err === 'object' &&
                err &&
                'detalhes' in err &&
                Array.isArray(err.detalhes)) {
                err.detalhes.forEach((d) => {
                    logSistema.atualizacaoDetalhes(d);
                });
            }
            if (config.DEV_MODE)
                log.erro(err instanceof Error ? err.message : String(err));
            sair(ExitCode.Failure);
            return;
        }
    });
}
//# sourceMappingURL=comando-atualizar.js.map