import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
} from '@vicinae/api';
import { useState } from 'react';
import { generateId, saveCommand } from '../storage';
import type { ShellCommand } from '../types';

interface CommandFormProps {
  command?: ShellCommand;
  initialCommand?: string;
  onCommandSaved?: () => void | Promise<void>;
}

export default function CommandForm({
  command,
  initialCommand,
  onCommandSaved,
}: CommandFormProps = {}) {
  const [commandError, setCommandError] = useState<string | undefined>();

  const isEditing = !!command;

  async function handleSubmit(values: Form.Values) {
    // Validate
    const commandText = values.command as string;

    if (!commandText || commandText.trim() === '') {
      setCommandError('Command is required');
      return;
    }

    // Parse tags
    const tagsString = values.tags as string | undefined;
    const tags = tagsString
      ? tagsString
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    const shellCommand: ShellCommand = {
      id: command?.id || generateId(),
      command: commandText.trim(),
      description:
        (values.description as string | undefined)?.trim() || undefined,
      tags,
      createdAt: command?.createdAt || Date.now(),
      lastUsed: command?.lastUsed,
      isPinned: (values.isPinned as boolean) ?? false,
    };

    try {
      await saveCommand(shellCommand);

      await showToast({
        style: Toast.Style.Success,
        title: isEditing ? 'Command updated' : 'Command saved',
      });

      // Let the callback handle navigation/closing
      if (onCommandSaved) {
        await onCommandSaved();
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: isEditing
          ? 'Failed to update command'
          : 'Failed to save command',
        message: String(error),
      });
      console.error('Failed to save command:', error);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isEditing ? 'Update Command' : 'Save Command'}
            icon={Icon.Check}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="command"
        title="Command"
        defaultValue={command?.command || initialCommand}
        error={commandError}
        onChange={() => setCommandError(undefined)}
        autoFocus
      />
      <Form.TextArea
        id="description"
        title="Description"
        defaultValue={command?.description}
      />
      <Form.TextField
        id="tags"
        title="Tags"
        defaultValue={command?.tags.join(', ')}
      />
      <Form.Checkbox
        id="isPinned"
        label="Pin this command"
        defaultValue={command?.isPinned || false}
      />
    </Form>
  );
}
