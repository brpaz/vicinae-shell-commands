import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
} from '@vicinae/api';
import { useState } from 'react';
import { exportCommands } from '../storage';

interface ExportFormProps {
  onExportComplete: () => void | Promise<void>;
}

export default function ExportForm({ onExportComplete }: ExportFormProps) {
  const [filePathError, setFilePathError] = useState<string | undefined>();

  async function handleSubmit(values: Form.Values) {
    const filePath = values.filePath;

    if (!filePath) {
      setFilePathError('Please select a directory');
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const fileName = `vicinae-snippets-commands-${timestamp}.json`;
    const fullPath = `${filePath}/${fileName}`;

    try {
      const { writeFile } = await import('node:fs/promises');
      const jsonData = await exportCommands();
      await writeFile(fullPath, jsonData, 'utf-8');

      await showToast({
        style: Toast.Style.Success,
        title: 'Commands exported',
        message: `Saved to ${fullPath}`,
      });

      if (onExportComplete) {
        await onExportComplete();
      }
    } catch (error) {
      console.log('Error exporting commands:', error);
      await showToast({
        style: Toast.Style.Failure,
        title: 'Export failed',
        message: String(error),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Export Commands"
            icon={Icon.Upload}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="filePath"
        title="Save To"
        allowMultipleSelection={false}
        canChooseDirectories={true}
        canChooseFiles={false}
        error={filePathError}
        onChange={() => setFilePathError(undefined)}
      />
      <Form.Description text="File will be saved as: vicinae-snippets-commands-<timestamp>.json" />
    </Form>
  );
}
