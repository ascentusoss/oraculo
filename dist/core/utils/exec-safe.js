import { execSync } from 'node:child_process';
import { config } from '../config/config.js';
export function executarShellSeguro(cmd, opts = {}) {
    if (config.SAFE_MODE === true && !config.ALLOW_EXEC) {
        throw new Error('Execução de comandos desabilitada em SAFE_MODE. Defina ORACULO_ALLOW_EXEC=1 para permitir.');
    }
    return execSync(cmd, opts);
}
export async function executarShellSeguroAsync(cmd, opts = {}) {
    return executarShellSeguro(cmd, opts);
}
//# sourceMappingURL=exec-safe.js.map