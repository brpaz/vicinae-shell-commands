import {
  Action,
  ActionPanel,
  Alert,
  Icon,
  List,
  Toast,
  showToast,
  open,
  closeMainWindow,
  confirmAlert,
} from '@vicinae/api';
import { useEffect, useMemo, useState } from 'react';
import CommandForm from './components/command-form';
import VariableForm from './components/variable-form';
import CommandPreview from './components/command-preview';
import {
  deleteCommand,
  getAllCommands,
  togglePin,
  updateLastUsed,
} from './storage';
import type { ShellCommand } from './types';
import { gotoList } from './navigation';
import { hasVariables } from './utils/variables';

function sortCommands(commands: ShellCommand[]): ShellCommand[] {
  return commands.sort((a, b) => {
    // Sort by last used (most recent first)
    const aLastUsed = a.lastUsed || 0;
    const bLastUsed = b.lastUsed || 0;
    return bLastUsed - aLastUsed;
  });
}

export default function Command() {
  const [allCommands, setAllCommands] = useState<ShellCommand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Load all commands from storage
  const loadCommands = async () => {
    try {
      setIsLoading(true);
      const fetchedCommands = await getAllCommands();
      const sortedCommands = sortCommands(fetchedCommands);
      setAllCommands(sortedCommands);
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to load commands',
      });
      setAllCommands([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load commands on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    loadCommands();
  }, []);

  // Filter commands based on selected tag
  const commands = useMemo(() => {
    if (selectedTag === 'all') {
      return allCommands;
    }
    return allCommands.filter((cmd) => cmd.tags.includes(selectedTag));
  }, [allCommands, selectedTag]);

  // Separate pinned and unpinned commands
  const pinnedCommands = useMemo(() => {
    return commands.filter((cmd) => cmd.isPinned);
  }, [commands]);

  const unpinnedCommands = useMemo(() => {
    return commands.filter((cmd) => !cmd.isPinned);
  }, [commands]);

  // Get all unique tags from all commands (not filtered)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allCommands.forEach((cmd) => {
      cmd.tags.forEach((tag) => {
        tagsSet.add(tag);
      });
    });
    return Array.from(tagsSet).sort();
  }, [allCommands]);

  const handleOnSavedCommand = () => {
    gotoList();
  };

  const handlePaste = async (command: ShellCommand) => {
    await updateLastUsed(command.id);
    await closeMainWindow();
  };

  const handleTogglePin = async (command: ShellCommand) => {
    await togglePin(command.id);
    await loadCommands();
    await showToast({
      style: Toast.Style.Success,
      title: command.isPinned ? 'Command unpinned' : 'Command pinned',
    });
  };

  const handleDelete = async (command: ShellCommand) => {
    const confirmed = await confirmAlert({
      title: 'Delete Command',
      message: `Are you sure you want to delete this command?`,
      primaryAction: {
        title: 'Delete',
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await deleteCommand(command.id);
      await loadCommands();
      await showToast({
        style: Toast.Style.Success,
        title: 'Command deleted',
      });
    }
  };

  const renderCommand = (command: ShellCommand) => (
    <List.Item
      key={command.id}
      title={command.description || 'No description'}
      subtitle={command.command}
      keywords={[command.command]}
      icon={command.isPinned ? Icon.Pin : Icon.Terminal}
      detail={<CommandPreview command={command} />}
      actions={
        <ActionPanel>
          {hasVariables(command.command) ? (
            <>
              <Action.Push
                title="Paste Command"
                icon={Icon.Terminal}
                target={
                  <VariableForm
                    command={command}
                    action="paste"
                    onComplete={async () => {
                      await updateLastUsed(command.id);
                    }}
                  />
                }
              />
              <Action.Push
                title="Copy to Clipboard"
                icon={Icon.CopyClipboard}
                shortcut={{ modifiers: ['ctrl'], key: 'c' }}
                target={<VariableForm command={command} action="copy" />}
              />
            </>
          ) : (
            <>
              <Action.Paste
                title="Paste Command"
                icon={Icon.Terminal}
                content={command.command}
                onPaste={() => handlePaste(command)}
              />
              <Action.CopyToClipboard
                title="Copy to Clipboard"
                icon={Icon.CopyClipboard}
                shortcut={{ modifiers: ['ctrl'], key: 'c' }}
                content={command.command}
              />
            </>
          )}
          <Action.Push
            title="Edit Command"
            icon={Icon.Pencil}
            shortcut={{ modifiers: ['ctrl'], key: 'e' }}
            target={
              <CommandForm
                command={command}
                onCommandSaved={handleOnSavedCommand}
              />
            }
          />
          <Action
            title={command.isPinned ? 'Unpin Command' : 'Pin Command'}
            icon={Icon.Pin}
            shortcut={{ modifiers: ['ctrl'], key: 'p' }}
            onAction={() => handleTogglePin(command)}
          />
          <Action
            title="Delete Command"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            shortcut={{ modifiers: ['ctrl'], key: 'd' }}
            onAction={() => handleDelete(command)}
          />
          <ActionPanel.Section title="New">
            <Action.Push
              title="Add New Command"
              icon={Icon.Plus}
              shortcut={{ modifiers: ['ctrl'], key: 'n' }}
              target={<CommandForm onCommandSaved={handleOnSavedCommand} />}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={true}
      searchBarPlaceholder="Search commands..."
      searchBarAccessory={
        allTags.length > 0 ? (
          <List.Dropdown
            tooltip="Filter by Tag"
            value={selectedTag}
            onChange={setSelectedTag}
          >
            <List.Dropdown.Item
              key="all"
              icon={Icon.Tag}
              title="All Tags"
              value="all"
            />
            {allTags.map((tag) => (
              <List.Dropdown.Item
                key={tag}
                icon={Icon.Tag}
                title={tag}
                value={tag}
              />
            ))}
          </List.Dropdown>
        ) : undefined
      }
    >
      {commands.length === 0 ? (
        !isLoading ? (
          <List.EmptyView
            title="No Commands found"
            description="Add your first command to get started"
            actions={
              <ActionPanel>
                <Action.Push
                  title="Add New Command"
                  icon={Icon.Plus}
                  target={<CommandForm onCommandSaved={handleOnSavedCommand} />}
                />
              </ActionPanel>
            }
          />
        ) : null
      ) : (
        <>
          {pinnedCommands.length > 0 && (
            <List.Section title="Pinned">
              {pinnedCommands.map(renderCommand)}
            </List.Section>
          )}
          {unpinnedCommands.length > 0 && (
            <List.Section
              title={pinnedCommands.length > 0 ? 'Commands' : undefined}
            >
              {unpinnedCommands.map(renderCommand)}
            </List.Section>
          )}
        </>
      )}
    </List>
  );
}
