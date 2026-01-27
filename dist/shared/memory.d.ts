import type { MemoryMessage, OraculoContextState, OraculoRunRecord } from '../types/index.js';
export type { MemoryMessage, OraculoContextState, OraculoRunRecord };
export declare class ConversationMemory {
    private maxHistory;
    private persistPath?;
    private history;
    constructor(maxHistory?: number, persistPath?: string | undefined);
    init(): Promise<void>;
    addMessage(message: MemoryMessage): Promise<void>;
    getContext(lastN?: number): MemoryMessage[];
    getSummary(): {
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        firstMessage?: string;
        lastMessage?: string;
    };
    clear(): Promise<void>;
    private persist;
}
export declare class OraculoContextMemory {
    private maxRuns;
    private persistPath?;
    private state;
    constructor(maxRuns?: number, persistPath?: string | undefined);
    init(): Promise<void>;
    getState(): OraculoContextState;
    getLastRun(): OraculoRunRecord | undefined;
    getPreference<T = unknown>(key: string): T | undefined;
    setPreference(key: string, value: unknown): Promise<void>;
    recordRunStart(input: {
        cwd: string;
        argv: string[];
        version?: string;
        timestamp?: string;
    }): Promise<string>;
    recordRunEnd(id: string, update: {
        ok: boolean;
        exitCode?: number;
        durationMs?: number;
        error?: string;
    }): Promise<void>;
    clear(): Promise<void>;
    private persist;
}
export declare function getDefaultMemory(): Promise<ConversationMemory>;
export declare function getDefaultContextMemory(): Promise<OraculoContextMemory>;
//# sourceMappingURL=memory.d.ts.map