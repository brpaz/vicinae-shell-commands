import Handlebars from 'handlebars';

/**
 * Types of variables supported
 */
export enum VariableType {
  TEXT = 'text', // Simple text input
  DROPDOWN = 'dropdown', // Dropdown with options
  FILE = 'file', // File picker
  DIRECTORY = 'directory', // Directory picker
  DATE_NOW = 'date_now', // ISO timestamp with time
  DATE_TODAY = 'date_today', // ISO date (YYYY-MM-DD)
  DATE_COMPACT = 'date_compact', // Compact date (YYYYMMDD)
  TIME = 'time', // Time only (HHMMSS)
  CLIPBOARD = 'clipboard', // Prefilled from the clipboard
  PASSWORD = 'password', // Masked input, never remembered
  COMMAND = 'command', // Dropdown filled from a shell command's output
}

/**
 * Metadata for a variable extracted from a template
 */
export interface VariableMetadata {
  name: string;
  type: VariableType;
  defaultValue?: string;
  options?: string[];
  shellCommand?: string;
}

/** Name of the directory picker variable dynamic options run in. */
export const CWD_VARIABLE = 'cwd';

// `name=$(` at the start of a placeholder body.
const COMMAND_PLACEHOLDER = /^[^\s=}]+=\$\(/;

interface Placeholder {
  start: number;
  end: number;
  content: string;
}

/**
 * Returns the index of the ")" closing a command substitution whose body
 * starts at `from`, ignoring parentheses inside quotes.
 */
function findClosingParen(text: string, from: number): number {
  let depth = 1;
  let quote: string | undefined;

  for (let i = from; i < text.length; i++) {
    const char = text[i];
    if (char === '\\' && quote !== "'") {
      i++;
    } else if (quote) {
      if (char === quote) {
        quote = undefined;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === '(') {
      depth++;
    } else if (char === ')' && --depth === 0) {
      return i;
    }
  }
  return -1;
}

/** Returns the index just past the "}}" closing a placeholder, or -1. */
function findPlaceholderEnd(template: string, bodyStart: number): number {
  const body = template.slice(bodyStart);
  const command = COMMAND_PLACEHOLDER.exec(body.trimStart());

  if (command) {
    // Command bodies may contain braces (e.g. docker's "{{.Names}}").
    const openLength =
      body.length - body.trimStart().length + command[0].length;
    const close = findClosingParen(template, bodyStart + openLength);
    if (close !== -1) {
      const tail = /^\s*\}\}/.exec(template.slice(close + 1));
      if (tail) {
        return close + 1 + tail[0].length;
      }
    }
  }

  const plain = /^[^}]+\}\}/.exec(body);
  return plain ? bodyStart + plain[0].length : -1;
}

function findPlaceholders(template: string): Placeholder[] {
  const placeholders: Placeholder[] = [];
  let start = template.indexOf('{{');

  while (start !== -1) {
    const bodyStart = start + 2;
    const end = findPlaceholderEnd(template, bodyStart);
    if (end === -1) {
      start = template.indexOf('{{', bodyStart);
    } else {
      placeholders.push({
        start,
        end,
        content: template.slice(bodyStart, end - 2),
      });
      start = template.indexOf('{{', end);
    }
  }

  return placeholders;
}

/**
 * Formats current date/time based on type
 */
function formatDateTime(type: VariableType): string {
  const now = new Date();

  switch (type) {
    case VariableType.DATE_NOW:
      // ISO 8601 with colons/dots replaced by dashes: 2026-01-04T17-30-45
      return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    case VariableType.DATE_TODAY:
      // ISO date: 2026-01-04
      return now.toISOString().slice(0, 10);
    case VariableType.DATE_COMPACT:
      // Compact: 20260104
      return now.toISOString().slice(0, 10).replace(/-/g, '');
    case VariableType.TIME:
      // Time only: 173045
      return now.toTimeString().slice(0, 8).replace(/:/g, '');
    default:
      return '';
  }
}

/**
 * Extracts variable names from a Handlebars template string
 * Example: "docker exec {{container}} {{command}}" -> ["container", "command"]
 * @deprecated Use extractVariablesWithMetadata instead
 */
export function extractVariables(template: string): string[] {
  const metadata = extractVariablesWithMetadata(template);
  return metadata.map((v) => v.name);
}

/**
 * Extracts variables with their metadata (default values, options, special types)
 * Supported formats:
 * - {{variable}} - Simple text variable
 * - {{variable=default}} - Variable with default value
 * - {{variable=option1|option2|option3}} - Variable with dropdown options
 * - {{variable=@now}} - Current timestamp (2026-01-04T17-30-45)
 * - {{variable=@today}} - Current date (2026-01-04)
 * - {{variable=@date}} - Compact date (20260104)
 * - {{variable=@time}} - Current time (173045)
 * - {{variable=@file}} - File picker
 * - {{variable=@directory}} - Directory picker
 * - {{variable=@clipboard}} - Text prefilled with the clipboard content
 * - {{variable=@password}} - Masked input
 * - {{variable=$(command)}} - Dropdown filled with the command's output lines
 */
export function extractVariablesWithMetadata(
  template: string
): VariableMetadata[] {
  const variables = new Map<string, VariableMetadata>();

  for (const placeholder of findPlaceholders(template)) {
    const content = placeholder.content.trim();

    // Skip Handlebars helpers and special syntax
    if (
      !content.startsWith('#') &&
      !content.startsWith('/') &&
      (!content.includes(' ') || COMMAND_PLACEHOLDER.test(content))
    ) {
      // Parse variable name and metadata
      const metadata = parseVariableContent(content);

      // Only add if not already present (preserve first occurrence)
      if (!variables.has(metadata.name)) {
        variables.set(metadata.name, metadata);
      }
    }
  }

  return Array.from(variables.values());
}

/**
 * Parses variable content to extract name, type, default value, and options
 * Examples:
 * - "variable" -> { name: "variable", type: TEXT }
 * - "variable=default" -> { name: "variable", type: TEXT, defaultValue: "default" }
 * - "variable=opt1|opt2" -> { name: "variable", type: DROPDOWN, options: [...] }
 * - "variable=@now" -> { name: "variable", type: DATE_NOW }
 * - "variable=@file" -> { name: "variable", type: FILE }
 */
function parseVariableContent(content: string): VariableMetadata {
  const equalIndex = content.indexOf('=');

  if (equalIndex === -1) {
    // Simple variable without default or options
    return { name: content, type: VariableType.TEXT };
  }

  const name = content.slice(0, equalIndex).trim();
  const valuesPart = content.slice(equalIndex + 1).trim();

  if (valuesPart.startsWith('$(') && valuesPart.endsWith(')')) {
    return {
      name,
      type: VariableType.COMMAND,
      shellCommand: valuesPart.slice(2, -1).trim(),
    };
  }

  // Check for special type markers starting with @
  if (valuesPart.startsWith('@')) {
    const specialType = valuesPart.slice(1).toLowerCase();

    switch (specialType) {
      case 'now':
        return {
          name,
          type: VariableType.DATE_NOW,
          defaultValue: formatDateTime(VariableType.DATE_NOW),
        };
      case 'today':
        return {
          name,
          type: VariableType.DATE_TODAY,
          defaultValue: formatDateTime(VariableType.DATE_TODAY),
        };
      case 'date':
        return {
          name,
          type: VariableType.DATE_COMPACT,
          defaultValue: formatDateTime(VariableType.DATE_COMPACT),
        };
      case 'time':
        return {
          name,
          type: VariableType.TIME,
          defaultValue: formatDateTime(VariableType.TIME),
        };
      case 'file':
        return { name, type: VariableType.FILE };
      case 'directory':
        return { name, type: VariableType.DIRECTORY };
      case 'clipboard':
        return { name, type: VariableType.CLIPBOARD };
      case 'password':
        return { name, type: VariableType.PASSWORD };
      default:
        // Unknown special type, treat as text with default
        return { name, type: VariableType.TEXT, defaultValue: valuesPart };
    }
  }

  // Check if it contains pipe character (options list)
  if (valuesPart.includes('|')) {
    const options = valuesPart.split('|').map((opt) => opt.trim());
    return { name, type: VariableType.DROPDOWN, options };
  }

  // Single default value
  return { name, type: VariableType.TEXT, defaultValue: valuesPart };
}

/**
 * Replaces variables in a template using Handlebars
 * Cleans the template first to remove metadata (default values, options)
 */
export function replaceVariables(
  template: string,
  values: Record<string, string>
): string {
  try {
    // Clean the template by removing metadata
    const cleanedTemplate = cleanTemplate(template);
    // Values go to a shell, not HTML: HTML escaping would mangle & < > quotes.
    const compiled = Handlebars.compile(cleanedTemplate, { noEscape: true });
    return compiled(values);
  } catch (error) {
    console.error('Failed to replace variables:', error);
    return template;
  }
}

/**
 * Removes metadata from template variables
 * Example: "{{var=default}}" -> "{{var}}"
 */
function cleanTemplate(template: string): string {
  let result = '';
  let last = 0;

  for (const { start, end, content } of findPlaceholders(template)) {
    const equalIndex = content.indexOf('=');
    if (equalIndex !== -1) {
      result += `${template.slice(last, start)}{{${content.slice(0, equalIndex)}}}`;
      last = end;
    }
  }

  return result + template.slice(last);
}

/**
 * Checks if a string contains Handlebars variables
 */
export function hasVariables(text: string): boolean {
  return findPlaceholders(text).length > 0;
}

/**
 * Only free-form and dropdown values are remembered between runs. Pickers,
 * generated values and the clipboard change every time; passwords must not be
 * persisted.
 */
export function isRememberable(variable: VariableMetadata): boolean {
  return (
    variable.type === VariableType.TEXT ||
    variable.type === VariableType.DROPDOWN
  );
}

/**
 * Initial form value for each variable: last used value, then the template
 * default. Remembered dropdown values that are no longer valid options are
 * ignored.
 */
export function resolveDefaults(
  variables: VariableMetadata[],
  history: Record<string, string>,
  clipboardText: string
): Record<string, string> {
  const defaults: Record<string, string> = {};

  for (const variable of variables) {
    const remembered = isRememberable(variable)
      ? history[variable.name]
      : undefined;

    switch (variable.type) {
      case VariableType.CLIPBOARD:
        defaults[variable.name] = clipboardText;
        break;
      case VariableType.DROPDOWN:
        defaults[variable.name] =
          remembered && variable.options?.includes(remembered)
            ? remembered
            : (variable.options?.[0] ?? '');
        break;
      default:
        defaults[variable.name] = remembered ?? variable.defaultValue ?? '';
    }
  }

  return defaults;
}
