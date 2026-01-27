import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ExcecoesMessages } from '../messages/core/excecoes-messages.js';
import { log } from '../messages/log/log.js';
import { MIGRATION_MAP, ORACULO_DIRS, ORACULO_FILES, } from './paths.js';
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
}
async function tryMigrate(targetPath) {
    const legacyPath = Object.entries(MIGRATION_MAP).find(([_, target]) => target === targetPath)?.[0];
    if (!legacyPath) {
        return { migrated: false };
    }
    const legacyExists = await fileExists(legacyPath);
    if (!legacyExists) {
        return { migrated: false };
    }
    try {
        const content = await fs.readFile(legacyPath, 'utf-8');
        await ensureDir(targetPath);
        await fs.writeFile(targetPath, content, 'utf-8');
        const backupPath = `${legacyPath}.migrated`;
        await fs.rename(legacyPath, backupPath);
        log.info(`Migração automática: ${path.basename(legacyPath)} → ${path.basename(targetPath)}`);
        return {
            migrated: true,
            from: legacyPath,
            to: targetPath,
        };
    }
    catch (erro) {
        log.aviso(`Falha na migração de ${legacyPath}: ${erro.message}`);
        return { migrated: false };
    }
}
export async function readJSON(filePath, options = {}) {
    const { default: defaultValue, migrate = true, validate } = options;
    try {
        if (migrate) {
            const migration = await tryMigrate(filePath);
            if (migration.migrated && migration.to) {
                filePath = migration.to;
            }
        }
        const exists = await fileExists(filePath);
        if (!exists) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(ExcecoesMessages.arquivoNaoEncontrado(String(filePath)));
        }
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (validate && !validate(parsed)) {
            throw new Error(ExcecoesMessages.validacaoFalhouPara(String(filePath)));
        }
        return parsed;
    }
    catch (erro) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(ExcecoesMessages.erroAoLer(String(filePath), erro.message));
    }
}
export async function writeJSON(filePath, data, options = {}) {
    const { createDirs = true, backup = false, pretty = true } = options;
    try {
        if (createDirs) {
            await ensureDir(filePath);
        }
        if (backup && (await fileExists(filePath))) {
            const backupPath = `${filePath}.backup`;
            await fs.copyFile(filePath, backupPath);
        }
        const content = pretty
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
        await fs.writeFile(filePath, content, 'utf-8');
    }
    catch (erro) {
        throw new Error(ExcecoesMessages.erroAoEscrever(String(filePath), erro.message));
    }
}
export async function deleteJSON(filePath, options = {}) {
    const { backup = true } = options;
    try {
        const exists = await fileExists(filePath);
        if (!exists) {
            return;
        }
        if (backup) {
            const backupPath = `${filePath}.deleted`;
            await fs.rename(filePath, backupPath);
        }
        else {
            await fs.unlink(filePath);
        }
    }
    catch (erro) {
        throw new Error(ExcecoesMessages.erroAoDeletar(String(filePath), erro.message));
    }
}
export async function listJSONFiles(dirPath) {
    try {
        const exists = await fileExists(dirPath);
        if (!exists) {
            return [];
        }
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const jsonFiles = entries
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => path.join(dirPath, entry.name));
        return jsonFiles;
    }
    catch (erro) {
        log.aviso(`Erro ao listar arquivos em ${dirPath}: ${erro.message}`);
        return [];
    }
}
export const FileRegistry = {
    read: readJSON,
    write: writeJSON,
    delete: deleteJSON,
    list: listJSONFiles,
    paths: ORACULO_FILES,
    dirs: ORACULO_DIRS,
};
//# sourceMappingURL=file-registry.js.map