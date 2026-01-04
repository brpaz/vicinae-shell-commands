export interface ShellCommand {
  id: string;
  command: string;
  description?: string;
  tags: string[];
  createdAt: number;
  lastUsed?: number;
  isPinned: boolean;
}
