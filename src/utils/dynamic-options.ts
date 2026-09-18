import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_OPTIONS = 200;

/** Turns command output into unique, non-empty option lines. */
export function parseOptionLines(output: string): string[] {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  return [...new Set(lines)].slice(0, MAX_OPTIONS);
}

/**
 * Runs a shell command in `cwd` and returns its output lines. Uses /bin/sh so
 * results don't depend on the user's interactive shell configuration.
 */
export async function runOptionsCommand(
  command: string,
  cwd: string
): Promise<string[]> {
  const pending = execFileAsync('/bin/sh', ['-c', command], {
    cwd,
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
  });
  // Commands that read stdin would otherwise wait until the timeout.
  pending.child.stdin?.end();
  const { stdout } = await pending;
  return parseOptionLines(stdout);
}

/** First line of stderr (or the error message) for showing in the UI. */
export function describeCommandError(error: unknown): string {
  const { stderr, message } = error as { stderr?: string; message?: string };
  const text = (stderr?.trim() || message || String(error)).trim();
  return text.split('\n')[0];
}
