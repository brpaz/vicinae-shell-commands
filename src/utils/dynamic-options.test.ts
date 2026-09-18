import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  describeCommandError,
  parseOptionLines,
  runOptionsCommand,
} from './dynamic-options';
import { extractVariablesWithMetadata } from './variables';

describe('parseOptionLines', () => {
  it('trims lines and drops blanks and duplicates', () => {
    expect(parseOptionLines(' main \n\ndev\nmain\n  \nfeature/x\n')).toEqual([
      'main',
      'dev',
      'feature/x',
    ]);
  });

  it('caps the number of options', () => {
    const output = Array.from({ length: 500 }, (_, i) => `opt${i}`).join('\n');
    expect(parseOptionLines(output)).toHaveLength(200);
  });
});

describe('runOptionsCommand', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'shell-commands-')));

  it('returns the output lines of the command', async () => {
    expect(await runOptionsCommand("printf 'a\\nb\\n'", cwd)).toEqual([
      'a',
      'b',
    ]);
  });

  it('supports pipes', async () => {
    expect(
      await runOptionsCommand("printf 'a\\nb\\nab\\n' | grep b", cwd)
    ).toEqual(['b', 'ab']);
  });

  it('runs in the given directory', async () => {
    expect(await runOptionsCommand('pwd', cwd)).toEqual([cwd]);
  });

  it('rejects with stderr when the command fails', async () => {
    const error = await runOptionsCommand('echo boom >&2; exit 3', cwd).catch(
      (e) => e
    );
    expect(describeCommandError(error)).toBe('boom');
  });

  it('does not hang on commands that read stdin', async () => {
    expect(await runOptionsCommand('cat; echo done', cwd)).toEqual(['done']);
  });

  it('fails for a missing working directory', async () => {
    await expect(
      runOptionsCommand('true', join(cwd, 'does-not-exist'))
    ).rejects.toThrow();
  });
});

describe('git branch placeholder', () => {
  it('lists the branches of the working directory repository', async () => {
    const repo = realpathSync(mkdtempSync(join(tmpdir(), 'shell-commands-')));
    const git = (...args: string[]) =>
      execFileSync(
        'git',
        ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args],
        { cwd: repo, stdio: 'ignore' }
      );
    git('init', '-q', '-b', 'main');
    git('commit', '-q', '--allow-empty', '-m', 'init');
    git('branch', 'feature/x');

    const [variable] = extractVariablesWithMetadata(
      "git checkout {{branch=$(git branch --format='%(refname:short)')}}"
    );
    const options = await runOptionsCommand(variable.shellCommand ?? '', repo);
    expect(options.sort()).toEqual(['feature/x', 'main']);
  });
});
