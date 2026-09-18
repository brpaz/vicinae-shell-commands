import { describe, expect, it, vi } from 'vitest';
import { buildTerminalInvocation } from './terminal';

vi.mock('@vicinae/api', () => ({ getPreferenceValues: () => ({}) }));

describe('buildTerminalInvocation', () => {
  it('runs the command in an interactive shell and keeps it open', () => {
    expect(
      buildTerminalInvocation('xdg-terminal-exec', 'git status', '/bin/zsh')
    ).toEqual({
      file: 'xdg-terminal-exec',
      args: ['/bin/zsh', '-i', '-c', 'git status\nexec "$SHELL"'],
      shell: '/bin/zsh',
    });
  });

  it('passes terminal arguments before the shell', () => {
    const { file, args } = buildTerminalInvocation(
      '  alacritty   -e ',
      'ls',
      '/bin/bash'
    );
    expect(file).toBe('alacritty');
    expect(args.slice(0, 3)).toEqual(['-e', '/bin/bash', '-i']);
  });

  it('falls back to the default terminal when the preference is blank', () => {
    expect(buildTerminalInvocation('   ', 'ls').file).toBe('xdg-terminal-exec');
  });
});
