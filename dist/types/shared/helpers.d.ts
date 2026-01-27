export interface FrameworkInfo {
    name: string;
    version?: string;
    isDev: boolean;
}
export interface MagicConstantRule {
    value: number;
    description: string;
    contexts?: string[];
}
export interface RuleConfig {
    severity?: 'error' | 'warning' | 'info' | 'off';
    exclude?: string[];
    allowTestFiles?: boolean;
}
export interface RuleOverride {
    files: string[];
    rules: Record<string, RuleConfig | 'off'>;
}
export interface SupressaoInfo {
    linha: number;
    regras: string[];
    tipo: 'linha-seguinte' | 'bloco-inicio' | 'bloco-fim';
}
export interface RegrasSuprimidas {
    porLinha: Map<number, Set<string>>;
    blocosAtivos: Set<string>;
}
export interface MemoryMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=helpers.d.ts.map