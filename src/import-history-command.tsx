import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
  openCommandPreferences,
  showToast,
  Toast,
  useNavigation,
} from '@vicinae/api';
import { useEffect, useMemo, useState } from 'react';
import CommandForm from './components/command-form';
import { generateId, getAllCommands, saveCommand } from './storage';
import { expandHome } from './utils/paths';
import {
  defaultHistoryFiles,
  type HistoryEntry,
  loadHistory,
  rankHistory,
} from './utils/shell-history';

const MAX_ITEMS = 500;
const MIN_USES_OPTIONS = [1, 2, 3, 5, 10];
const DEFAULT_MIN_USES = 2;

export default function Command() {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [ranked, setRanked] = useState<HistoryEntry[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [minUses, setMinUses] = useState(DEFAULT_MIN_USES);

  useEffect(() => {
    async function load() {
      try {
        const { historyFile } = getPreferenceValues<{ historyFile?: string }>();
        const paths = historyFile?.trim()
          ? [expandHome(historyFile.trim())]
          : defaultHistoryFiles();

        const [history, existing] = await Promise.all([
          loadHistory(paths),
          getAllCommands(),
        ]);
        setRanked(rankHistory(history.commands));
        setSources(history.sources);
        setSaved(new Set(existing.map((c) => c.command.trim())));
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'Failed to read shell history',
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const entries = useMemo(
    () =>
      ranked
        .filter((e) => e.count >= minUses && !saved.has(e.command))
        .slice(0, MAX_ITEMS),
    [ranked, minUses, saved]
  );

  const markSaved = (command: string) =>
    setSaved((current) => new Set(current).add(command));

  const handleImport = async (entry: HistoryEntry) => {
    try {
      await saveCommand({
        id: generateId(),
        command: entry.command,
        tags: ['history'],
        createdAt: Date.now(),
        isPinned: false,
      });
      markSaved(entry.command);
      await showToast({
        style: Toast.Style.Success,
        title: 'Command imported',
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to import command',
        message: String(error),
      });
    }
  };

  const noHistoryFound = !isLoading && sources.length === 0;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search shell history..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Minimum Uses"
          value={String(minUses)}
          onChange={(value) => setMinUses(Number(value))}
        >
          {MIN_USES_OPTIONS.map((uses) => (
            <List.Dropdown.Item
              key={uses}
              title={`Used ${uses}+ times`}
              value={String(uses)}
            />
          ))}
        </List.Dropdown>
      }
    >
      {entries.length === 0 && !isLoading ? (
        <List.EmptyView
          title={
            noHistoryFound ? 'No shell history found' : 'Nothing to import'
          }
          description={
            noHistoryFound
              ? 'Set the History File preference to your bash, zsh or fish history file'
              : 'Lower the minimum uses filter to see more commands'
          }
          actions={
            noHistoryFound ? (
              <ActionPanel>
                <Action
                  title="Open Preferences"
                  icon={Icon.Cog}
                  onAction={openCommandPreferences}
                />
              </ActionPanel>
            ) : undefined
          }
        />
      ) : (
        entries.map((entry) => (
          <List.Item
            key={entry.command}
            title={entry.command}
            icon={Icon.Terminal}
            accessories={[{ text: `${entry.count}×` }]}
            actions={
              <ActionPanel>
                <Action
                  title="Import Command"
                  icon={Icon.Download}
                  onAction={() => handleImport(entry)}
                />
                <Action.Push
                  title="Edit and Import"
                  icon={Icon.Pencil}
                  target={
                    <CommandForm
                      initialCommand={entry.command}
                      onCommandSaved={() => {
                        markSaved(entry.command);
                        pop();
                      }}
                    />
                  }
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
