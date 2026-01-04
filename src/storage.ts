import { LocalStorage } from '@vicinae/api';
import type { ShellCommand } from './types';

const STORAGE_KEY = 'shell-commands';

export async function getAllCommands(): Promise<ShellCommand[]> {
  const data = await LocalStorage.getItem(STORAGE_KEY);
  if (!data || typeof data !== 'string') {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveCommand(command: ShellCommand): Promise<void> {
  const commands = await getAllCommands();
  const existingIndex = commands.findIndex((c) => c.id === command.id);

  if (existingIndex >= 0) {
    commands[existingIndex] = command;
  } else {
    commands.push(command);
  }

  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
}

export async function deleteCommand(id: string): Promise<void> {
  const commands = await getAllCommands();
  const filtered = commands.filter((c) => c.id !== id);
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function updateLastUsed(id: string): Promise<void> {
  const commands = await getAllCommands();
  const command = commands.find((c) => c.id === id);

  if (command) {
    command.lastUsed = Date.now();
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  }
}

export async function togglePin(id: string): Promise<void> {
  const commands = await getAllCommands();
  const command = commands.find((c) => c.id === id);

  if (command) {
    command.isPinned = !command.isPinned;
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function exportCommands(): Promise<string> {
  const commands = await getAllCommands();
  return JSON.stringify(commands, null, 2);
}

export async function importCommands(
  jsonData: string,
  mode: 'merge' | 'replace'
): Promise<{ imported: number; skipped: number }> {
  const existingCommands = await getAllCommands();
  const importedCommands = JSON.parse(jsonData) as ShellCommand[];

  if (mode === 'replace') {
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(importedCommands));
    return { imported: importedCommands.length, skipped: 0 };
  }

  // Merge mode: add new commands, skip duplicates (by id)
  const existingIds = new Set(existingCommands.map((c) => c.id));
  let skipped = 0;
  let imported = 0;

  for (const cmd of importedCommands) {
    if (existingIds.has(cmd.id)) {
      skipped++;
    } else {
      existingCommands.push(cmd);
      imported++;
    }
  }

  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(existingCommands));
  return { imported, skipped };
}
