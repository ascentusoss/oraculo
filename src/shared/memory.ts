// SPDX-License-Identifier: MIT
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { MemoryMessage, OraculoContextState, OraculoRunRecord } from '@';

// Re-exporta para compatibilidade com código existente
export type { MemoryMessage, OraculoContextState, OraculoRunRecord };

export class ConversationMemory {
  private history: MemoryMessage[] = [];
  constructor(
    private maxHistory = 10,
    private persistPath?: string,
  ) {}

  async init(): Promise<void> {
    if (!this.persistPath) return;
    try {
      const raw = await readFile(this.persistPath, 'utf-8');
      this.history = JSON.parse(raw);
    } catch {
      this.history = [];
    }
  }

  async addMessage(message: MemoryMessage): Promise<void> {
    this.history.push(message);
    if (this.history.length > this.maxHistory * 2) {
      this.history = this.history.slice(-this.maxHistory * 2);
    }
    await this.persist();
  }

  getContext(lastN?: number): MemoryMessage[] {
    if (lastN) return this.history.slice(-lastN);
    return [...this.history];
  }

  getSummary(): {
    // @oraculo-disable: tipo-literal-inline-complexo
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    firstMessage?: string;
    lastMessage?: string;
  } {
    return {
      totalMessages: this.history.length,
      userMessages: this.history.filter((m) => m.role === 'user').length,
      assistantMessages: this.history.filter((m) => m.role === 'assistant')
        .length,
      firstMessage: this.history[0]?.timestamp,
      lastMessage: this.history[this.history.length - 1]?.timestamp,
    };
  }

  async clear(): Promise<void> {
    this.history = [];
    await this.persist();
  }

  private async persist(): Promise<void> {
    if (!this.persistPath) return;
    try {
      await mkdir(dirname(this.persistPath), { recursive: true });
      await writeFile(
        this.persistPath,
        JSON.stringify(this.history, null, 2),
        'utf-8',
      );
    } catch {
      // ignore persist errors
    }
  }
}

export class OraculoContextMemory {
  private state: OraculoContextState = {
    schemaVersion: 1,
    lastRuns: [],
    preferences: {},
  };

  constructor(
    private maxRuns = 20,
    private persistPath?: string,
  ) {}

  async init(): Promise<void> {
    if (!this.persistPath) return;
    try {
      const raw = await readFile(this.persistPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<OraculoContextState>;
      if (parsed && parsed.schemaVersion === 1) {
        this.state = {
          // @oraculo-disable: tipo-literal-inline-complexo
          schemaVersion: 1,
          lastRuns: Array.isArray(parsed.lastRuns)
            ? (parsed.lastRuns as OraculoRunRecord[])
            : [],
          preferences:
            parsed.preferences && typeof parsed.preferences === 'object'
              ? (parsed.preferences as Record<string, unknown>)
              : {},
        };
      }
    } catch {
      // mantém defaults
    }
  }

  getState(): OraculoContextState {
    return {
      // @oraculo-disable: tipo-literal-inline-complexo
      schemaVersion: 1,
      lastRuns: [...this.state.lastRuns],
      preferences: { ...this.state.preferences },
    };
  }

  getLastRun(): OraculoRunRecord | undefined {
    return this.state.lastRuns[this.state.lastRuns.length - 1];
  }

  getPreference<T = unknown>(key: string): T | undefined {
    return this.state.preferences[key] as T | undefined;
  }

  async setPreference(key: string, value: unknown): Promise<void> {
    this.state.preferences[key] = value;
    await this.persist();
  }

  async recordRunStart(
    // @oraculo-disable: tipo-literal-inline-complexo
    input: {
      cwd: string;
      argv: string[];
      version?: string;
      timestamp?: string;
    },
  ): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const record: OraculoRunRecord = {
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

  async recordRunEnd(
    id: string,
    // @oraculo-disable: tipo-literal-inline-complexo
    update: {
      ok: boolean;
      exitCode?: number;
      durationMs?: number;
      error?: string;
    },
  ): Promise<void> {
    const idx = this.state.lastRuns.findIndex((r) => r.id === id);
    if (idx === -1) return;
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

  async clear(): Promise<void> {
    this.state.lastRuns = [];
    this.state.preferences = {};
    await this.persist();
  }

  private async persist(): Promise<void> {
    if (!this.persistPath) return;
    try {
      await mkdir(dirname(this.persistPath), { recursive: true });
      await writeFile(
        this.persistPath,
        JSON.stringify(this.state, null, 2),
        'utf-8',
      );
    } catch {
      // ignore persist errors
    }
  }
}

export async function getDefaultMemory(): Promise<ConversationMemory> {
  // Preferimos memória por projeto (cwd) para evitar misturar repositórios.
  const persistPath = join(process.cwd(), '.oraculo', 'history.json');
  const mem = new ConversationMemory(10, persistPath);
  await mem.init();
  return mem;
}

export async function getDefaultContextMemory(): Promise<OraculoContextMemory> {
  const persistPath = join(process.cwd(), '.oraculo', 'context.json');
  const mem = new OraculoContextMemory(20, persistPath);
  await mem.init();
  return mem;
}
