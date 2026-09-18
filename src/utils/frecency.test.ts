import { describe, expect, it } from 'vitest';
import type { ShellCommand } from '../types';
import { frecencyScore, sortByFrecency } from './frecency';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 31);

function makeCommand(
  id: string,
  overrides: Partial<ShellCommand> = {}
): ShellCommand {
  return {
    id,
    command: id,
    tags: [],
    createdAt: 0,
    isPinned: false,
    ...overrides,
  };
}

describe('frecencyScore', () => {
  it('scores never-used commands as zero', () => {
    expect(frecencyScore(makeCommand('a'), NOW)).toBe(0);
  });

  it('halves the score every 14 days', () => {
    const fresh = makeCommand('a', { lastUsed: NOW, useCount: 4 });
    const old = makeCommand('a', { lastUsed: NOW - 14 * DAY_MS, useCount: 4 });
    expect(frecencyScore(fresh, NOW)).toBe(4);
    expect(frecencyScore(old, NOW)).toBeCloseTo(2);
  });

  it('counts commands without a use count as a single use', () => {
    const legacy = makeCommand('a', { lastUsed: NOW });
    expect(frecencyScore(legacy, NOW)).toBe(1);
  });
});

describe('sortByFrecency', () => {
  it('ranks frequent recent commands above rarely used ones', () => {
    const rare = makeCommand('rare', { lastUsed: NOW, useCount: 1 });
    const frequent = makeCommand('frequent', {
      lastUsed: NOW - DAY_MS,
      useCount: 20,
    });
    const sorted = sortByFrecency([rare, frequent], NOW);
    expect(sorted.map((c) => c.id)).toEqual(['frequent', 'rare']);
  });

  it('lets a recent command overtake a stale favorite', () => {
    const stale = makeCommand('stale', {
      lastUsed: NOW - 120 * DAY_MS,
      useCount: 50,
    });
    const recent = makeCommand('recent', { lastUsed: NOW, useCount: 2 });
    const sorted = sortByFrecency([stale, recent], NOW);
    expect(sorted.map((c) => c.id)).toEqual(['recent', 'stale']);
  });

  it('puts never-used commands last, newest first, without mutating input', () => {
    const used = makeCommand('used', { lastUsed: NOW, useCount: 1 });
    const older = makeCommand('older', { createdAt: 1 });
    const newer = makeCommand('newer', { createdAt: 2 });
    const input = [older, newer, used];
    const sorted = sortByFrecency(input, NOW);
    expect(sorted.map((c) => c.id)).toEqual(['used', 'newer', 'older']);
    expect(input.map((c) => c.id)).toEqual(['older', 'newer', 'used']);
  });
});
