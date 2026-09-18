import { homedir } from 'node:os';
import {
  Action,
  ActionPanel,
  Alert,
  Clipboard,
  closeMainWindow,
  confirmAlert,
  Form,
  getPreferenceValues,
  Icon,
  showToast,
  Toast,
} from '@vicinae/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  approveOptionCommands,
  getApprovedOptionCommands,
  getVariableHistory,
  saveVariableHistory,
} from '../storage';
import type { ShellCommand } from '../types';
import {
  describeCommandError,
  runOptionsCommand,
} from '../utils/dynamic-options';
import { expandHome } from '../utils/paths';
import { runInTerminal } from '../utils/terminal';
import {
  CWD_VARIABLE,
  extractVariablesWithMetadata,
  isRememberable,
  replaceVariables,
  resolveDefaults,
  type VariableMetadata,
  VariableType,
} from '../utils/variables';

type VariableAction = 'paste' | 'copy' | 'run';

const ACTION_LABELS: Record<VariableAction, { title: string; icon: Icon }> = {
  paste: { title: 'Paste Command', icon: Icon.Terminal },
  copy: { title: 'Copy to Clipboard', icon: Icon.CopyClipboard },
  run: { title: 'Run in Terminal', icon: Icon.Play },
};

/** Options for a command variable, or why there are none. */
interface DynamicState {
  options?: string[];
  hint?: string;
}

interface VariableFormProps {
  command: ShellCommand;
  action: VariableAction;
  onComplete?: () => void | Promise<void>;
}

function defaultWorkingDirectory(): string {
  const { workingDirectory } = getPreferenceValues<{
    workingDirectory?: string;
  }>();
  return expandHome(workingDirectory?.trim() || homedir());
}

function hintForAll(
  variables: VariableMetadata[],
  hint: string
): Record<string, DynamicState> {
  return Object.fromEntries(variables.map((v) => [v.name, { hint }]));
}

/** Asks before running shell commands the user hasn't approved yet. */
async function confirmOptionCommands(
  variables: VariableMetadata[],
  cwd: string
): Promise<boolean> {
  const approved = await getApprovedOptionCommands();
  const pending = variables
    .flatMap((v) => v.shellCommand ?? [])
    .filter((shellCommand) => !approved.has(shellCommand));
  if (pending.length === 0) {
    return true;
  }

  const confirmed = await confirmAlert({
    title: 'Run shell commands?',
    message: `This command fills in options by running:\n\n${pending
      .map((shellCommand) => `$ ${shellCommand}`)
      .join('\n')}\n\nin ${cwd}. Only continue if you trust it.`,
    primaryAction: { title: 'Run', style: Alert.ActionStyle.Default },
  });
  if (confirmed) {
    await approveOptionCommands(pending);
  }
  return confirmed;
}

async function loadOptions(
  variable: VariableMetadata,
  cwd: string
): Promise<DynamicState> {
  try {
    const options = await runOptionsCommand(variable.shellCommand ?? '', cwd);
    return options.length > 0
      ? { options }
      : { hint: 'The command printed nothing' };
  } catch (error) {
    return { hint: `Command failed: ${describeCommandError(error)}` };
  }
}

export default function VariableForm({
  command,
  action,
  onComplete,
}: VariableFormProps) {
  const variables = useMemo(
    () => extractVariablesWithMetadata(command.command),
    [command.command]
  );
  const commandVariables = useMemo(
    () => variables.filter((v) => v.type === VariableType.COMMAND),
    [variables]
  );
  const hasCwdPicker = variables.some(
    (v) => v.name === CWD_VARIABLE && v.type === VariableType.DIRECTORY
  );

  const [defaults, setDefaults] = useState<Record<string, string>>();
  const [cwd, setCwd] = useState<string>();
  const [dynamic, setDynamic] = useState<Record<string, DynamicState>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(
    commandVariables.length > 0
  );
  // Kept so the confirmation is shown once per form, not on every directory change.
  const approval = useRef<Promise<boolean>>(undefined);

  useEffect(() => {
    async function loadDefaults() {
      const needsClipboard = variables.some(
        (variable) => variable.type === VariableType.CLIPBOARD
      );
      const [history, clipboardText] = await Promise.all([
        getVariableHistory(),
        needsClipboard ? Clipboard.readText() : '',
      ]);
      setDefaults(resolveDefaults(variables, history, clipboardText.trimEnd()));
    }
    loadDefaults();
  }, [variables]);

  useEffect(() => {
    if (commandVariables.length === 0) {
      return;
    }
    let cancelled = false;

    async function loadDynamicOptions() {
      if (hasCwdPicker && !cwd) {
        setDynamic(hintForAll(commandVariables, 'Select a directory first'));
        setIsLoadingOptions(false);
        return;
      }

      setIsLoadingOptions(true);
      const workingDirectory = cwd ?? defaultWorkingDirectory();
      approval.current ??= confirmOptionCommands(
        commandVariables,
        workingDirectory
      );
      const isApproved = await approval.current;
      const loaded = isApproved
        ? Object.fromEntries(
            await Promise.all(
              commandVariables.map(async (v) => [
                v.name,
                await loadOptions(v, workingDirectory),
              ])
            )
          )
        : hintForAll(commandVariables, 'Running shell commands was declined');

      if (!cancelled) {
        setDynamic(loaded);
        setIsLoadingOptions(false);
      }
    }
    loadDynamicOptions();

    return () => {
      cancelled = true;
    };
  }, [commandVariables, hasCwdPicker, cwd]);

  async function handleSubmit(formValues: Form.Values) {
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

    const finalCommand = replaceVariables(command.command, variableValues);

    try {
      if (action === 'paste') {
        await Clipboard.paste(finalCommand);
      } else if (action === 'copy') {
        await Clipboard.copy(finalCommand);
      } else {
        await runInTerminal(finalCommand);
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: `${ACTION_LABELS[action].title} failed`,
        message: String(error),
      });
      return;
    }

    const rememberedValues: Record<string, string> = {};
    for (const variable of variables) {
      if (isRememberable(variable) && variableValues[variable.name]) {
        rememberedValues[variable.name] = variableValues[variable.name];
      }
    }
    await saveVariableHistory(rememberedValues);

    if (onComplete) {
      await onComplete();
    }
    await closeMainWindow();
  }

  return (
    <Form
      isLoading={defaults === undefined || isLoadingOptions}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={ACTION_LABELS[action].title}
            icon={ACTION_LABELS[action].icon}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      {defaults && (
        <>
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

            // Directory picker; the "cwd" one also sets where options run.
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
                  onChange={
                    variable.name === CWD_VARIABLE
                      ? (paths) => setCwd(paths[0])
                      : undefined
                  }
                />
              );
            }

            // Masked input
            if (variable.type === VariableType.PASSWORD) {
              return (
                <Form.PasswordField
                  key={variable.name}
                  id={variable.name}
                  title={variable.name}
                  autoFocus={index === 0}
                />
              );
            }

            // Options from a shell command, or a free text field if there are none
            if (variable.type === VariableType.COMMAND) {
              const state = dynamic[variable.name];
              if (state?.options) {
                return (
                  <Form.Dropdown
                    key={`${variable.name}:${state.options.join('\n')}`}
                    id={variable.name}
                    title={variable.name}
                    defaultValue={state.options[0]}
                    autoFocus={index === 0}
                  >
                    {state.options.map((option) => (
                      <Form.Dropdown.Item
                        key={option}
                        value={option}
                        title={option}
                      />
                    ))}
                  </Form.Dropdown>
                );
              }
              return (
                <Form.TextField
                  key={variable.name}
                  id={variable.name}
                  title={variable.name}
                  info={state?.hint}
                  placeholder={state?.hint}
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
                  defaultValue={defaults[variable.name]}
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

            // Text field (includes date/time and clipboard fields, which have
            // generated defaults)
            return (
              <Form.TextField
                key={variable.name}
                id={variable.name}
                title={variable.name}
                defaultValue={defaults[variable.name]}
                autoFocus={index === 0}
              />
            );
          })}
        </>
      )}
    </Form>
  );
}
