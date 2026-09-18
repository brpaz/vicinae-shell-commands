import { spawn } from 'node:child_process';
import { getPreferenceValues } from '@vicinae/api';

const DEFAULT_TERMINAL = 'xdg-terminal-exec';
const DEFAULT_SHELL = '/bin/sh';

interface TerminalInvocation {
  file: string;
  args: string[];
  shell: string;
}

/**
 * Builds the process that opens `command` in a terminal. The command runs in
 * the user's interactive shell, as if pasted, and the terminal stays open on
 * that shell afterwards so the output remains readable.
 */
export function buildTerminalInvocation(
  terminalCommand: string,
  command: string,
  shell: string = DEFAULT_SHELL
): TerminalInvocation {
  const [file, ...terminalArgs] = terminalCommand.trim().split(/\s+/);
  // A newline (not `;`) keeps commands ending in `&` or a comment valid.
  const script = `${command}\nexec "$SHELL"`;
  return {
    file: file || DEFAULT_TERMINAL,
    args: [...terminalArgs, shell, '-i', '-c', script],
    shell,
  };
}

export async function runInTerminal(command: string): Promise<void> {
  const { terminal } = getPreferenceValues<{ terminal?: string }>();
  const { file, args, shell } = buildTerminalInvocation(
    terminal || DEFAULT_TERMINAL,
    command,
    process.env.SHELL || DEFAULT_SHELL
  );

  await new Promise<void>((resolve, reject) => {
    const child = spawn(file, args, {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, SHELL: shell },
    });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}
