import type { ShellCommand } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_LIFE_DAYS = 14;

/**
 * Use count discounted by how long ago the command was last used, so recent
 * habits outrank old favorites. Commands never used score 0.
 */
export function frecencyScore(
  command: ShellCommand,
  now: number = Date.now()
): number {
  if (!command.lastUsed) {
    return 0;
  }
  const ageDays = Math.max(0, now - command.lastUsed) / DAY_MS;
  // Commands used before use counts were tracked count as a single use.
  const uses = command.useCount ?? 1;
  return uses * 0.5 ** (ageDays / HALF_LIFE_DAYS);
}

export function sortByFrecency(
  commands: ShellCommand[],
  now: number = Date.now()
): ShellCommand[] {
  return [...commands].sort(
    (a, b) =>
      frecencyScore(b, now) - frecencyScore(a, now) ||
      (b.lastUsed ?? 0) - (a.lastUsed ?? 0) ||
      b.createdAt - a.createdAt
  );
}
