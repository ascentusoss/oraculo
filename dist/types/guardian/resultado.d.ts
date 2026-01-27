export interface GuardianBaseline {
    hash: string;
    timestamp: number;
    files: Record<string, string>;
}
export interface GuardianViolation {
    tipo: string;
    mensagem: string;
    arquivo?: string;
    esperado?: string;
    encontrado?: string;
}
export type GuardianResult = {
    status: 'ok';
    baseline: GuardianBaseline;
    message?: string;
} | {
    status: 'alteracoes-detectadas';
    baseline: GuardianBaseline;
    violations: GuardianViolation[];
    message: string;
} | {
    status: 'erro';
    error: string;
    details?: unknown;
} | null | undefined;
export declare function isGuardianResult(value: unknown): value is GuardianResult;
export declare function converterResultadoGuardian(resultado: import('./integridade.js').ResultadoGuardian | undefined): GuardianResult;
//# sourceMappingURL=resultado.d.ts.map