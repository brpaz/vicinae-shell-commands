import { List, Icon } from '@vicinae/api';
import type { ShellCommand } from '../types';
import { formatRelativeTime } from '../utils/date-format';

interface CommandPreviewProps {
  command: ShellCommand;
}

export default function CommandPreview({ command }: CommandPreviewProps) {
  const markdown = `\`\`\`bash
${command.command}
\`\`\``;

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <List.Item.Detail.Metadata>
          {command.description && (
            <>
              <List.Item.Detail.Metadata.Label
                title="Description"
                text={command.description}
              />
              <List.Item.Detail.Metadata.Separator />
            </>
          )}

          {command.tags.length > 0 && (
            <>
              <List.Item.Detail.Metadata.TagList title="Tags">
                {command.tags.map((tag) => (
                  <List.Item.Detail.Metadata.TagList.Item
                    key={tag}
                    text={tag}
                    color="#FF6F61"
                  />
                ))}
              </List.Item.Detail.Metadata.TagList>
              <List.Item.Detail.Metadata.Separator />
            </>
          )}

          <List.Item.Detail.Metadata.Label
            title="Created"
            text={formatRelativeTime(command.createdAt)}
            icon={Icon.Calendar}
          />

          {command.lastUsed && (
            <List.Item.Detail.Metadata.Label
              title="Last Used"
              text={formatRelativeTime(command.lastUsed)}
              icon={Icon.Clock}
            />
          )}

          {command.isPinned && (
            <>
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label
                title="Status"
                text="Pinned"
                icon={Icon.Pin}
              />
            </>
          )}
        </List.Item.Detail.Metadata>
      }
    />
  );
}
