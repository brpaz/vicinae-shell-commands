import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
} from '@vicinae/api';
import { useState } from 'react';
import { importCommands } from '../storage';

interface ImportFormProps {
  onImportComplete: () => void | Promise<void>;
}

export default function ImportForm({ onImportComplete }: ImportFormProps) {
  const [filePathError, setFilePathError] = useState<string | undefined>();

  async function handleSubmit(values: Form.Values) {
    const filePath = values.filePath as string;
    const mode = values.mode as 'merge' | 'replace';

    if (!filePath) {
      setFilePathError('Please select a file');
      return;
    }

    try {
      const { readFile } = await import('node:fs/promises');
      const jsonData = await readFile(filePath, 'utf-8');

      const result = await importCommands(jsonData, mode);

      await showToast({
        style: Toast.Style.Success,
        title: 'Import complete',
        message: `Imported: ${result.imported}, Skipped: ${result.skipped}`,
      });

      if (onImportComplete) {
        await onImportComplete();
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Import failed',
        message: String(error),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Import Commands"
            icon={Icon.Download}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="filePath"
        title="Select File"
        allowMultipleSelection={false}
        canChooseDirectories={false}
        canChooseFiles={true}
        error={filePathError}
        onChange={() => setFilePathError(undefined)}
      />
      <Form.Dropdown id="mode" title="Import Mode" defaultValue="merge">
        <Form.Dropdown.Item
          value="merge"
          title="Merge (Add new, skip duplicates)"
        />
        <Form.Dropdown.Item
          value="replace"
          title="Replace (Delete all existing)"
        />
      </Form.Dropdown>
      <Form.Description text="Choose a JSON file to import your shell commands from" />
    </Form>
  );
}
