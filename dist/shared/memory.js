import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
export class ConversationMemory {
    maxHistory;
    persistPath;
    history = [];
    constructor(maxHistory = 10, persistPath) {
        this.maxHistory = maxHistory;
        this.persistPath = persistPath;
    }
    async init() {
        if (!this.persistPath)
            return;
        try {
            const raw = await readFile(this.persistPath, 'utf-8');
            this.history = JSON.parse(raw);
        }
        catch {
            this.history = [];
        }
    }
    async addMessage(message) {
        this.history.push(message);
        if (this.history.length > this.maxHistory * 2) {
            this.history = this.history.slice(-this.maxHistory * 2);
        }
        await this.persist();
    }
    getContext(lastN) {
        if (lastN)
            return this.history.slice(-lastN);
        return [...this.history];
    }
    getSummary() {
        return {
            totalMessages: this.history.length,
            userMessages: this.history.filter((m) => m.role === 'user').length,
            assistantMessages: this.history.filter((m) => m.role === 'assistant')
                .length,
            firstMessage: this.history[0]?.timestamp,
            lastMessage: this.history[this.history.length - 1]?.timestamp,
        };
    }
    async clear() {
        this.history = [];
        await this.persist();
    }
    async persist() {
        if (!this.persistPath)
            return;
        try {
            await mkdir(dirname(this.persistPath), { recursive: true });
            await writeFile(this.persistPath, JSON.stringify(this.history, null, 2), 'utf-8');
        }
        catch {
        }
    }
}
export class OraculoContextMemory {
    maxRuns;
    persistPath;
    state = {
        schemaVersion: 1,
        lastRuns: [],
        preferences: {},
    };
    constructor(maxRuns = 20, persistPath) {
        this.maxRuns = maxRuns;
        this.persistPath = persistPath;
    }
    async init() {
        if (!this.persistPath)
            return;
        try {
            const raw = await readFile(this.persistPath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.schemaVersion === 1) {
                this.state = {
                    schemaVersion: 1,
                    lastRuns: Array.isArray(parsed.lastRuns)
                        ? parsed.lastRuns
                        : [],
                    preferences: parsed.preferences && typeof parsed.preferences === 'object'
                        ? parsed.preferences
                        : {},
                };
            }
        }
        catch {
        }
    }
    getState() {
        return {
            schemaVersion: 1,
            lastRuns: [...this.state.lastRuns],
            preferences: { ...this.state.preferences },
        };
    }
    getLastRun() {
        return this.state.lastRuns[this.state.lastRuns.length - 1];
    }
    getPreference(key) {
        return this.state.preferences[key];
    }
    async setPreference(key, value) {
        this.state.preferences[key] = value;
        await this.persist();
    }
    async recordRunStart(input) {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const record = {
            id,
            timestamp: input.timestamp ?? new Date().toISOString(),
            cwd: input.cwd,
            argv: [...input.argv],
            version: input.version,
        };
        this.state.lastRuns.push(record);
        if (this.state.lastRuns.length > this.maxRuns) {
            this.state.lastRuns = this.state.lastRuns.slice(-this.maxRuns);
        }
        await this.persist();
        return id;
    }
    async recordRunEnd(id, update) {
        const idx = this.state.lastRuns.findIndex((r) => r.id === id);
        if (idx === -1)
            return;
        const prev = this.state.lastRuns[idx];
        this.state.lastRuns[idx] = {
            ...prev,
            ok: update.ok,
            exitCode: update.exitCode,
            durationMs: update.durationMs,
            error: update.error,
        };
        await this.persist();
    }
    async clear() {
        this.state.lastRuns = [];
        this.state.preferences = {};
        await this.persist();
    }
    async persist() {
        if (!this.persistPath)
            return;
        try {
            await mkdir(dirname(this.persistPath), { recursive: true });
            await writeFile(this.persistPath, JSON.stringify(this.state, null, 2), 'utf-8');
        }
        catch {
        }
    }
}
export async function getDefaultMemory() {
    const persistPath = join(process.cwd(), '.oraculo', 'history.json');
    const mem = new ConversationMemory(10, persistPath);
    await mem.init();
    return mem;
}
export async function getDefaultContextMemory() {
    const persistPath = join(process.cwd(), '.oraculo', 'context.json');
    const mem = new OraculoContextMemory(20, persistPath);
    await mem.init();
    return mem;
}
//# sourceMappingURL=memory.js.map