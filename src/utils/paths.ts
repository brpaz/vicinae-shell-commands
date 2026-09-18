import { homedir } from 'node:os';
import { join } from 'node:path';

export function expandHome(path: string, home: string = homedir()): string {
  if (path === '~') {
    return home;
  }
  return path.startsWith('~/') ? join(home, path.slice(2)) : path;
}
