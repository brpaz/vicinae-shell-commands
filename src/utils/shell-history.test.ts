import { describe, expect, it } from 'vitest';
import { expandHome } from './paths';
import {
  defaultHistoryFiles,
  parseHistory,
  rankHistory,
} from './shell-history';

describe('parseHistory', () => {
  it('reads plain bash history and skips timestamp comments', () => {
    const content = '#1700000000\ngit status\n#1700000001\ndocker ps\n\n';
    expect(parseHistory(content)).toEqual(['git status', 'docker ps']);
  });

  it('reads zsh extended history', () => {
    const content = ': 1700000000:0;git status\n: 1700000005:2;make build\n';
    expect(parseHistory(content)).toEqual(['git status', 'make build']);
  });

  it('joins multi-line zsh commands', () => {
    const content = ': 1700000000:0;echo one \\\ntwo\n: 1700000005:0;ls -la\n';
    expect(parseHistory(content)).toEqual(['echo one \ntwo', 'ls -la']);
  });

  it('reads fish history and unescapes newlines and backslashes', () => {
    const content = [
      '- cmd: git status',
      '  when: 1700000000',
      '- cmd: echo a\\nb \\\\ c',
      '  when: 1700000001',
      '  paths:',
      '    - /tmp/file',
      '',
    ].join('\n');
    expect(parseHistory(content)).toEqual(['git status', 'echo a\nb \\ c']);
  });

  it('handles CRLF line endings', () => {
    expect(parseHistory('ls -la\r\npwd -P\r\n')).toEqual(['ls -la', 'pwd -P']);
  });

  it('returns nothing for an empty file', () => {
    expect(parseHistory('')).toEqual([]);
  });
});

describe('rankHistory', () => {
  it('orders by count, then recency', () => {
    const ranked = rankHistory([
      'git status',
      'docker ps',
      'git status',
      'make test',
      'docker ps',
      'git status',
    ]);
    expect(ranked).toEqual([
      { command: 'git status', count: 3 },
      { command: 'docker ps', count: 2 },
      { command: 'make test', count: 1 },
    ]);
  });

  it('breaks ties in favor of the most recent command', () => {
    const ranked = rankHistory(['a b', 'c d']);
    expect(ranked.map((e) => e.command)).toEqual(['c d', 'a b']);
  });

  it('drops trivial bare commands but keeps them with arguments', () => {
    const ranked = rankHistory(['ls', 'cd', 'clear', 'ls -la', 'htop']);
    expect(ranked.map((e) => e.command).sort()).toEqual(['htop', 'ls -la']);
  });
});

describe('paths', () => {
  it('expands a leading tilde', () => {
    expect(expandHome('~/.zsh_history', '/home/u')).toBe(
      '/home/u/.zsh_history'
    );
    expect(expandHome('~', '/home/u')).toBe('/home/u');
    expect(expandHome('/etc/hist', '/home/u')).toBe('/etc/hist');
  });

  it('lists default history files, honoring HISTFILE and XDG_DATA_HOME', () => {
    const files = defaultHistoryFiles(
      { HISTFILE: '/custom/hist', XDG_DATA_HOME: '/data' },
      '/home/u'
    );
    expect(files).toEqual([
      '/custom/hist',
      '/home/u/.zsh_history',
      '/home/u/.bash_history',
      '/data/fish/fish_history',
    ]);
  });

  it('does not duplicate HISTFILE when it points at a default file', () => {
    const files = defaultHistoryFiles(
      { HISTFILE: '/home/u/.zsh_history' },
      '/home/u'
    );
    expect(files.filter((f) => f === '/home/u/.zsh_history')).toHaveLength(1);
  });
});
