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
}

/**
 * Metadata for a variable extracted from a template
 */
export interface VariableMetadata {
  name: string;
  type: VariableType;
  defaultValue?: string;
  options?: string[];
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
 */
export function extractVariablesWithMetadata(
  template: string
): VariableMetadata[] {
  const variables = new Map<string, VariableMetadata>();
  const regex = /\{\{([^}]+)\}\}/g;
  let match: RegExpExecArray | null = regex.exec(template);

  while (match !== null) {
    const content = match[1].trim();

    // Skip Handlebars helpers and special syntax
    if (
      !content.startsWith('#') &&
      !content.startsWith('/') &&
      !content.includes(' ')
    ) {
      // Parse variable name and metadata
      const metadata = parseVariableContent(content);

      // Only add if not already present (preserve first occurrence)
      if (!variables.has(metadata.name)) {
        variables.set(metadata.name, metadata);
      }
    }
    match = regex.exec(template);
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
    const compiled = Handlebars.compile(cleanedTemplate);
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
  return template.replace(/\{\{([^}=]+)=[^}]+\}\}/g, '{{$1}}');
}

/**
 * Checks if a string contains Handlebars variables
 */
export function hasVariables(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text);
}
