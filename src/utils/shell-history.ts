import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface HistoryEntry {
  command: string;
  count: number;
}

// zsh EXTENDED_HISTORY entry header: ": <epoch>:<duration>;<command>"
const ZSH_ENTRY_HEADER = /^: \d+:\d+;/;
const FISH_ENTRY_PREFIX = '- cmd: ';

// Bare commands that are noise rather than something worth saving.
const TRIVIAL_COMMANDS = new Set([
  'cd',
  'ls',
  'll',
  'la',
  'pwd',
  'clear',
  'exit',
  'history',
]);

function unescapeFish(text: string): string {
  return text.replace(/\\(n|\\)/g, (_, char: string) =>
    char === 'n' ? '\n' : '\\'
  );
}

/**
 * Extracts commands, oldest first, from the contents of a bash, zsh or fish
 * history file. The format is detected from the content.
 */
export function parseHistory(content: string): string[] {
  const text = content.replace(/\r\n/g, '\n');
  let entries: string[];

  if (text.split('\n').some((line) => line.startsWith(FISH_ENTRY_PREFIX))) {
    entries = text
      .split('\n')
      .filter((line) => line.startsWith(FISH_ENTRY_PREFIX))
      .map((line) => unescapeFish(line.slice(FISH_ENTRY_PREFIX.length)));
  } else if (/^: \d+:\d+;/m.test(text)) {
    // Multi-line zsh commands continue on the next line after a trailing "\".
    entries = text
      .split(/\n(?=: \d+:\d+;)/)
      .map((entry) =>
        entry.replace(ZSH_ENTRY_HEADER, '').replace(/\\\n/g, '\n')
      );
  } else {
    // Plain lines; bash writes "#<epoch>" comment lines when timestamps are on.
    entries = text.split('\n').filter((line) => !/^#\d+$/.test(line));
  }

  return entries.map((entry) => entry.trim()).filter((entry) => entry !== '');
}

/**
 * Groups identical commands and ranks them by how often they were run, then
 * by how recently. `commands` is ordered oldest first.
 */
export function rankHistory(commands: string[]): HistoryEntry[] {
  const stats = new Map<string, { count: number; lastIndex: number }>();

  commands.forEach((command, index) => {
    const entry = stats.get(command);
    if (entry) {
      entry.count++;
      entry.lastIndex = index;
    } else {
      stats.set(command, { count: 1, lastIndex: index });
    }
  });

  return [...stats.entries()]
    .filter(([command]) => !TRIVIAL_COMMANDS.has(command))
    .sort(([, a], [, b]) => b.count - a.count || b.lastIndex - a.lastIndex)
    .map(([command, { count }]) => ({ command, count }));
}

export function defaultHistoryFiles(
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir()
): string[] {
  const dataHome = env.XDG_DATA_HOME || join(home, '.local', 'share');
  const candidates = [
    env.HISTFILE,
    join(home, '.zsh_history'),
    join(home, '.bash_history'),
    join(dataHome, 'fish', 'fish_history'),
  ];
  return [...new Set(candidates.filter((path): path is string => !!path))];
}

export interface LoadedHistory {
  commands: string[];
  sources: string[];
}

/**
 * Reads the given history files, skipping any that are missing or unreadable.
 * `sources` lists the files that were actually read.
 */
export async function loadHistory(paths: string[]): Promise<LoadedHistory> {
  const commands: string[] = [];
  const sources: string[] = [];

  for (const path of paths) {
    try {
      commands.push(...parseHistory(await readFile(path, 'utf-8')));
      sources.push(path);
    } catch {
      // Missing or unreadable history files are expected; just skip them.
    }
  }

  return { commands, sources };
}
