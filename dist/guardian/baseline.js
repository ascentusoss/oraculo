import path from 'node:path';
import { lerEstado, salvarEstado } from '../shared/persistence/persistencia.js';
import { BASELINE_PATH } from './constantes.js';
export async function carregarBaseline() {
    try {
        const json = await lerEstado(BASELINE_PATH);
        if (json && typeof json === 'object' && !Array.isArray(json)) {
            const entries = Object.entries(json).filter(([k, v]) => typeof k === 'string' && typeof v === 'string');
            return Object.fromEntries(entries);
        }
        return null;
    }
    catch {
        return null;
    }
}
export async function salvarBaseline(snapshot) {
    const fs = await import('node:fs');
    await fs.promises.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
    await salvarEstado(BASELINE_PATH, snapshot);
}
//# sourceMappingURL=baseline.js.map