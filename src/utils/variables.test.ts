import { describe, expect, it } from 'vitest';
import {
  extractVariablesWithMetadata,
  hasVariables,
  isRememberable,
  replaceVariables,
  resolveDefaults,
  VariableType,
} from './variables';

describe('extractVariablesWithMetadata', () => {
  it('parses @clipboard and @password variables', () => {
    expect(
      extractVariablesWithMetadata(
        'curl -u {{user}}:{{pass=@password}} {{url=@clipboard}}'
      )
    ).toEqual([
      { name: 'user', type: VariableType.TEXT },
      { name: 'pass', type: VariableType.PASSWORD },
      { name: 'url', type: VariableType.CLIPBOARD },
    ]);
  });

  it('parses command placeholders', () => {
    expect(
      extractVariablesWithMetadata(
        "git checkout {{branch=$(git branch --format='%(refname:short)')}}"
      )
    ).toEqual([
      {
        name: 'branch',
        type: VariableType.COMMAND,
        shellCommand: "git branch --format='%(refname:short)'",
      },
    ]);
  });

  it('keeps pipes, nested parens and braces inside command placeholders', () => {
    const template =
      "{{a=$(ls | grep -v x)}} {{b=$(echo $(date))}} {{c=$(docker ps --format '{{.Names}}')}} {{d=$(awk '{print $1}' f)}}";
    expect(extractVariablesWithMetadata(template)).toEqual([
      { name: 'a', type: VariableType.COMMAND, shellCommand: 'ls | grep -v x' },
      { name: 'b', type: VariableType.COMMAND, shellCommand: 'echo $(date)' },
      {
        name: 'c',
        type: VariableType.COMMAND,
        shellCommand: "docker ps --format '{{.Names}}'",
      },
      {
        name: 'd',
        type: VariableType.COMMAND,
        shellCommand: "awk '{print $1}' f",
      },
    ]);
  });

  it('ignores parentheses inside quotes when matching the command end', () => {
    const [variable] = extractVariablesWithMetadata(
      `{{x=$(echo ")" ')' \\) done)}}`
    );
    expect(variable.shellCommand).toBe(`echo ")" ')' \\) done`);
  });

  it('still parses plain variables next to command placeholders', () => {
    const variables = extractVariablesWithMetadata(
      '{{env=dev|prod}} {{x=$(echo a b)}} {{port=22}}'
    );
    expect(variables.map((v) => [v.name, v.type])).toEqual([
      ['env', VariableType.DROPDOWN],
      ['x', VariableType.COMMAND],
      ['port', VariableType.TEXT],
    ]);
  });

  it('never treats an unterminated command placeholder as a command', () => {
    const variables = extractVariablesWithMetadata('{{x=$(echo a}}');
    expect(variables.map((v) => v.type)).not.toContain(VariableType.COMMAND);
  });
});

describe('hasVariables', () => {
  it('detects placeholders but not single braces', () => {
    expect(hasVariables('echo {{a}}')).toBe(true);
    expect(hasVariables("awk '{print $1}'")).toBe(false);
    expect(hasVariables('{{x=$(echo {{y}})}}')).toBe(true);
  });
});

describe('replaceVariables', () => {
  it('does not HTML-escape values', () => {
    const result = replaceVariables('echo {{msg}}', {
      msg: `a && b > "c" 'd' \`e\` =f`,
    });
    expect(result).toBe(`echo a && b > "c" 'd' \`e\` =f`);
  });

  it('replaces command placeholders with the chosen value', () => {
    expect(
      replaceVariables(
        "git checkout {{branch=$(git branch --format='%(refname:short)')}} # {{branch}}",
        { branch: 'main' }
      )
    ).toBe('git checkout main # main');
  });

  it('strips metadata from the template', () => {
    expect(
      replaceVariables('ssh {{user=root}}@{{host}}', { user: 'me', host: 'h' })
    ).toBe('ssh me@h');
  });
});

describe('resolveDefaults', () => {
  const variables = extractVariablesWithMetadata(
    '{{host}} {{port=22}} {{env=dev|prod}} {{secret=@password}} {{src=@clipboard}} {{day=@today}}'
  );

  it('falls back to template defaults without history', () => {
    const defaults = resolveDefaults(variables, {}, 'from-clipboard');
    expect(defaults).toMatchObject({
      host: '',
      port: '22',
      env: 'dev',
      secret: '',
      src: 'from-clipboard',
    });
    expect(defaults.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('prefers remembered values over template defaults', () => {
    const defaults = resolveDefaults(
      variables,
      { host: 'example.com', port: '2222', env: 'prod' },
      ''
    );
    expect(defaults).toMatchObject({
      host: 'example.com',
      port: '2222',
      env: 'prod',
    });
  });

  it('ignores remembered dropdown values that are no longer options', () => {
    expect(resolveDefaults(variables, { env: 'staging' }, '').env).toBe('dev');
  });

  it('never restores passwords, clipboard or generated values from history', () => {
    const defaults = resolveDefaults(
      variables,
      { secret: 'hunter2', src: 'old', day: 'yesterday' },
      'now'
    );
    expect(defaults.secret).toBe('');
    expect(defaults.src).toBe('now');
    expect(defaults.day).not.toBe('yesterday');
  });
});

describe('isRememberable', () => {
  it('only remembers text and dropdown variables', () => {
    const cases = [
      [VariableType.TEXT, true],
      [VariableType.DROPDOWN, true],
      [VariableType.PASSWORD, false],
      [VariableType.CLIPBOARD, false],
      [VariableType.FILE, false],
      [VariableType.DATE_NOW, false],
    ] as const;
    for (const [type, expected] of cases) {
      expect(isRememberable({ name: 'x', type })).toBe(expected);
    }
  });
});
