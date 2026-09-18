export interface ShellCommand {
  id: string;
  command: string;
  description?: string;
  tags: string[];
  createdAt: number;
  lastUsed?: number;
  useCount?: number;
  isPinned: boolean;
}
