import { type OraculoFilePath } from './paths.js';
interface ReadOptions<T> {
    default?: T;
    migrate?: boolean;
    validate?: (data: unknown) => data is T;
}
interface WriteOptions {
    createDirs?: boolean;
    backup?: boolean;
    pretty?: boolean;
}
export declare function readJSON<T = unknown>(filePath: OraculoFilePath | string, options?: ReadOptions<T>): Promise<T>;
export declare function writeJSON<T = unknown>(filePath: OraculoFilePath | string, data: T, options?: WriteOptions): Promise<void>;
export declare function deleteJSON(filePath: OraculoFilePath | string, options?: {
    backup?: boolean;
}): Promise<void>;
export declare function listJSONFiles(dirPath: string): Promise<string[]>;
export declare const FileRegistry: {
    readonly read: typeof readJSON;
    readonly write: typeof writeJSON;
    readonly delete: typeof deleteJSON;
    readonly list: typeof listJSONFiles;
    readonly paths: {
        readonly CONFIG: string;
        readonly CONFIG_SAFE: string;
        readonly GUARDIAN_BASELINE: string;
        readonly ESTRUTURA_BASELINE: string;
        readonly ESTRUTURA_ARQUETIPO: string;
        readonly MAPA_REVERSAO: string;
        readonly REGISTRO_VIGIA: string;
        readonly METRICAS_HISTORICO: string;
        readonly GUARDIAN_BASELINE_LEGACY: string;
        readonly ESTRUTURA_BASELINE_LEGACY: string;
        readonly ESTRUTURA_ARQUETIPO_LEGACY_ROOT: string;
    };
    readonly dirs: {
        readonly STATE: string;
        readonly METRICS_HISTORY: string;
        readonly REPORTS: string;
        readonly PERF: string;
    };
};
export {};
//# sourceMappingURL=file-registry.d.ts.map