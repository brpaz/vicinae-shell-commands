# Shell Commands Vicinae Extension

> Store, organize, and quickly access your frequently used terminal commands

## Features

- 📋 **Quick Paste**: Paste commands directly into your active terminal (default action)
- 🔍 **Smart Search**: Search by name, command text, or tags
- 📌 **Pin Favorites**: Keep your most-used commands at the top
- 🏷️ **Free-form Tags**: Organize with custom tags
- ⏱️ **Smart Sorting**: Auto-sort by last used timestamp
- 📎 **Clipboard Import**: Create commands from clipboard content
- 💾 **JSON Storage**: All data stored locally using Vicinae LocalStorage API

## Installation

### Prerequisites

- [NodeJS](https://nodejs.org/) 24+
- [Vicinae](https://github.com/vicinaehq/vicinae) 0.16+

### Install

```bash
git clone https://github.com/brpaz/vicinae-shell-commands.git
cd vicinae-shell-commands
npm install
npm run build
```

The extension will be installed in Vicinae's extension directory.

## Usage

### Add a Command Manually

1. Open Vicinae → Type **"New Shell Command"**
2. Fill in the form:
   - **Name**: Display name (e.g., "Git Status")
   - **Command**: The actual command (e.g., `git status --short`)
   - **Description**: Optional description
   - **Tags**: Optional tags (e.g., "git, status")
   - **Pin**: Check to pin to top of list
3. Save

### Add a Command from Clipboard

1. Copy a command in your terminal (e.g., `Ctrl+Shift+C`)
2. Open Vicinae → Type **"New Command from Clipboard"**
3. The form opens with the command field pre-filled
4. Fill in the name, tags, and other details
5. Save

### Use a Command

1. Open Vicinae → Type **"Shell Commands"**
2. Search or browse your commands
3. Press **Enter** to paste command into the active application
4. Or press **Ctrl+C** to copy to clipboard only

The command's last used timestamp is automatically updated when you paste it.

### Organize Commands

- **Pin frequently used commands** (Ctrl+P) to keep them at the top
- **Add tags** to categorize commands (e.g., "docker", "git", "backup")
- Commands are automatically sorted:
  1. Pinned commands first
  2. Then by last used (most recent first)
  3. Never used commands at the end

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Paste command into active window |
| `Ctrl+C` | Copy command to clipboard |
| `Ctrl+E` | Edit command |
| `Ctrl+P` | Pin/unpin command |
| `Ctrl+X` | Delete command (with confirmation) |
| `Ctrl+N` | Add new command (from list view) |

## Examples

### Example Commands

Here are some useful commands you might want to store:

**Git Commands**
- Name: "Git Status Short"
  - Command: `git status --short`
  - Tags: git, status

- Name: "Git Log Pretty"
  - Command: `git log --oneline --graph --decorate --all`
  - Tags: git, log, history

**Docker Commands**
- Name: "Docker List All Containers"
  - Command: `docker ps -a`
  - Tags: docker, containers

- Name: "Docker Clean Images"
  - Command: `docker image prune -a`
  - Tags: docker, cleanup

**System Commands**
- Name: "Check Disk Space"
  - Command: `df -h`
  - Tags: system, disk

- Name: "Find Large Files"
  - Command: `find . -type f -size +100M -exec ls -lh {} \\;`
  - Tags: system, files, search

## Development

### Setup

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This will start the extension in development mode. Make changes to the source code and they'll be reflected immediately in Vicinae.

### Build for Production

```bash
npm run build
```

### Lint and Format

```bash
# Check formatting
npm run format:check

# Format code
npm run format

# Run linter
npm run lint

# Type check
npm run typecheck

# Run all checks and auto-fix
npm run check
```

## Data Storage

All commands are stored locally using Vicinae's LocalStorage API in JSON format under the key `shell-commands`.

The storage location is managed by Vicinae and persists across sessions.

### Data Structure

```json
[
  {
    "id": "1704446400000-abc123",
    "name": "Git Status",
    "command": "git status --short",
    "description": "Show git status in short format",
    "tags": ["git", "status"],
    "createdAt": 1704446400000,
    "lastUsed": 1704532800000,
    "isPinned": true
  }
]
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgements

Built with:
- [Vicinae](https://github.com/vicinaehq/vicinae) - The launcher framework
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Biome](https://biomejs.dev/) - Linting and formatting

<a href="https://www.flaticon.com/free-icons/terminal" title="terminal icons">Terminal icons created by Royyan Wijaya - Flaticon</a>
