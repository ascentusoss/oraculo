export type MemoryMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
};
export type OraculoRunRecord = {
    id: string;
    timestamp: string;
    cwd: string;
    argv: string[];
    version?: string;
    ok?: boolean;
    exitCode?: number;
    durationMs?: number;
    error?: string;
};
export type OraculoContextState = {
    schemaVersion: 1;
    lastRuns: OraculoRunRecord[];
    preferences: Record<string, unknown>;
};
//# sourceMappingURL=memory.d.ts.map