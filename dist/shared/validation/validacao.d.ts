import type { ErroValidacaoCombinacao } from '../../types/index.js';
export type { ErroValidacaoCombinacao };
export declare function normalizePath(p: string): string;
export declare function isPathSafe(filePath: string): boolean;
export declare function isFilenameSafe(filename: string): boolean;
export declare function sanitizeFilename(filename: string): string;
export declare function isRelativePathValid(relativePath: string): boolean;
export declare function getFileExtension(filename: string): string;
export declare function isExtensionAllowed(filename: string, allowedExtensions: string[]): boolean;
export declare function normalizarPathLocal(p: string): string;
export declare function validarNumeroPositivo(v: unknown, _nome: string): number | null;
export declare function validarCombinacoes(flags: Record<string, unknown>): ErroValidacaoCombinacao[];
export declare function sanitizarFlags(flags: Record<string, unknown>): void;
//# sourceMappingURL=validacao.d.ts.map