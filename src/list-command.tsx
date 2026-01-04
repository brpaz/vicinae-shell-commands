import {
  Action,
  ActionPanel,
  Alert,
  closeMainWindow,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@vicinae/api";
import { useEffect, useMemo, useState } from "react";
import CommandForm from "./components/command-form";
import {
  deleteCommand,
  getAllCommands,
  togglePin,
  updateLastUsed,
} from "./storage";
import type { ShellCommand } from "./types";

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "Never used";

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

function sortCommands(commands: ShellCommand[]): ShellCommand[] {
  return commands.sort((a, b) => {
    // Pinned commands first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Then by last used (most recent first)
    const aLastUsed = a.lastUsed || 0;
    const bLastUsed = b.lastUsed || 0;
    return bLastUsed - aLastUsed;
  });
}

export default function Command() {
  const [allCommands, setAllCommands] = useState<ShellCommand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const navigation = useNavigation();

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
        title: "Failed to load commands",
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
    if (selectedTag === "all") {
      return allCommands;
    }
    return allCommands.filter((cmd) => cmd.tags.includes(selectedTag));
  }, [allCommands, selectedTag]);

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
    navigation.pop();
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
      title: command.isPinned ? "Command unpinned" : "Command pinned",
    });
  };

  const handleDelete = async (command: ShellCommand) => {
    const confirmed = await confirmAlert({
      title: "Delete Command",
      message: `Are you sure you want to delete this command?`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await deleteCommand(command.id);
      await loadCommands();
      await showToast({
        style: Toast.Style.Success,
        title: "Command deleted",
      });
    }
  };

  return (
    <List
      isLoading={isLoading}
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
            title={
              selectedTag === "all"
                ? "No shell commands saved"
                : "No commands with this tag"
            }
            description={
              selectedTag === "all"
                ? "Add your first command to get started"
                : "Try selecting a different tag"
            }
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
        commands.map((command) => (
          <List.Item
            key={command.id}
            title={command.command}
            subtitle={command.description}
            icon={command.isPinned ? Icon.Pin : Icon.Terminal}
            accessories={[
              ...(command.tags.length > 0
                ? command.tags.map((tag) => ({ text: `#${tag}` }))
                : []),
              { text: formatRelativeTime(command.lastUsed) },
            ]}
            actions={
              <ActionPanel>
                <Action.Paste
                  title="Paste Command"
                  icon={Icon.Terminal}
                  content={command.command}
                  onPaste={() => handlePaste(command)}
                />
                <Action.CopyToClipboard
                  title="Copy to Clipboard"
                  icon={Icon.CopyClipboard}
                  shortcut={{ modifiers: ["ctrl"], key: "c" }}
                  content={command.command}
                />
                <Action.Push
                  title="Edit Command"
                  icon={Icon.Pencil}
                  shortcut={{ modifiers: ["ctrl"], key: "e" }}
                  target={
                    <CommandForm
                      command={command}
                      onCommandSaved={handleOnSavedCommand}
                    />
                  }
                />
                <Action
                  title={command.isPinned ? "Unpin Command" : "Pin Command"}
                  icon={Icon.Pin}
                  shortcut={{ modifiers: ["ctrl"], key: "p" }}
                  onAction={() => handleTogglePin(command)}
                />
                <Action
                  title="Delete Command"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={() => handleDelete(command)}
                />
                <ActionPanel.Section title="New">
                  <Action.Push
                    title="Add New Command"
                    icon={Icon.Plus}
                    shortcut={{ modifiers: ["ctrl"], key: "n" }}
                    target={
                      <CommandForm onCommandSaved={handleOnSavedCommand} />
                    }
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
