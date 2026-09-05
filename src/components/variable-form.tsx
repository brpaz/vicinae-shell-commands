import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  Form,
  Icon,
} from '@vicinae/api';
import type { ShellCommand } from '../types';
import {
  extractVariablesWithMetadata,
  replaceVariables,
  VariableType,
} from '../utils/variables';

interface VariableFormProps {
  command: ShellCommand;
  action: 'paste' | 'copy';
  onComplete?: () => void | Promise<void>;
}

export default function VariableForm({
  command,
  action,
  onComplete,
}: VariableFormProps) {
  const variables = extractVariablesWithMetadata(command.command);

  async function handleSubmit(formValues: Form.Values) {
    // Build the values object from form data
    const variableValues: Record<string, string> = {};
    for (const variable of variables) {
      let value = formValues[variable.name] as string | string[];

      // Handle file/directory pickers which return arrays
      if (Array.isArray(value)) {
        value = value.length > 0 ? value[0] : '';
      }

      // Use the submitted value, or fall back to default value if provided
      variableValues[variable.name] = value || variable.defaultValue || '';
    }

    // Replace variables in the command
    const finalCommand = replaceVariables(command.command, variableValues);

    if (action === 'paste') {
      // Paste to clipboard and close
      await Clipboard.paste(finalCommand);
      await closeMainWindow();
    } else {
      // Copy to clipboard
      await Clipboard.copy(finalCommand);
      await closeMainWindow();
    }

    if (onComplete) {
      await onComplete();
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={action === 'paste' ? 'Paste Command' : 'Copy to Clipboard'}
            icon={action === 'paste' ? Icon.Terminal : Icon.CopyClipboard}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Command Template" text={command.command} />
      <Form.Separator />
      {variables.map((variable, index) => {
        // File picker
        if (variable.type === VariableType.FILE) {
          return (
            <Form.FilePicker
              key={variable.name}
              id={variable.name}
              title={variable.name}
              allowMultipleSelection={false}
              canChooseDirectories={false}
              canChooseFiles={true}
              autoFocus={index === 0}
            />
          );
        }

        // Directory picker
        if (variable.type === VariableType.DIRECTORY) {
          return (
            <Form.FilePicker
              key={variable.name}
              id={variable.name}
              title={variable.name}
              allowMultipleSelection={false}
              canChooseDirectories={true}
              canChooseFiles={false}
              autoFocus={index === 0}
            />
          );
        }

        // Dropdown with options
        if (variable.type === VariableType.DROPDOWN && variable.options) {
          return (
            <Form.Dropdown
              key={variable.name}
              id={variable.name}
              title={variable.name}
              defaultValue={variable.options[0]}
              autoFocus={index === 0}
            >
              {variable.options.map((option) => (
                <Form.Dropdown.Item
                  key={option}
                  value={option}
                  title={option}
                />
              ))}
            </Form.Dropdown>
          );
        }

        // Text field (includes date/time fields which have auto-generated defaults)
        return (
          <Form.TextField
            key={variable.name}
            id={variable.name}
            title={variable.name}
            defaultValue={variable.defaultValue || ''}
            autoFocus={index === 0}
          />
        );
      })}
    </Form>
  );
}
