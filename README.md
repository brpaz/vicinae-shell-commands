# Shell Commands Vicinae Extension

> Store, organize, and quickly access your frequently used terminal commands with powerful variable substitution

## Features

- 📋 **Quick Paste**: Paste commands directly into your active terminal (default action)
- 🔍 **Smart Search**: Search by name, command text, or tags
- 📌 **Pin Favorites**: Keep your most-used commands at the top
- 🏷️ **Free-form Tags**: Organize with custom tags
- 🔄 **Variable Substitution**: Dynamic commands with Handlebars-style variables
- 📅 **Auto-Generated Timestamps**: Built-in date/time variables
- 📁 **File & Directory Pickers**: Browse for files and folders
- ⏱️ **Smart Sorting**: Auto-sort by last used timestamp
- 💾 **Backup & Restore**: Import/export commands as JSON
- 📎 **Local Storage**: All data stored locally using Vicinae LocalStorage API

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

**Commands with variables:**
- If a command contains variables (e.g., `{{user}}`), a form will appear
- Fill in the variable values
- Submit to paste/copy the final command

The command's last used timestamp is automatically updated when you paste it.

## Variable Substitution

Commands support powerful variable substitution using Handlebars-style syntax. When you execute a command with variables, a form appears to collect values before pasting/copying.

### Basic Variable Syntax

#### 1. Simple Variable
```bash
ssh {{user}}@{{host}}
```
- Renders as text field with empty default
- User must provide value

#### 2. Variable with Default Value
```bash
ssh {{user=admin}}@{{host=localhost}} -p {{port=22}}
```
- Renders as text field pre-filled with default
- User can override or accept default

#### 3. Dropdown Options
```bash
git commit -m "{{type=feat|fix|docs|style|refactor}}: {{message}}"
```
- Renders as dropdown with selectable options
- Options are pipe-separated: `option1|option2|option3`
- First option selected by default

### Special Variable Types

#### Date/Time Variables (Auto-Generated)

**Current Timestamp** (`@now`)
```bash
backup-{{timestamp=@now}}.tar.gz
# Generates: backup-2026-01-04T17-30-45.tar.gz
# Format: ISO 8601 with colons/dots replaced by dashes
```

**Current Date** (`@today`)
```bash
log-{{date=@today}}.txt
# Generates: log-2026-01-04.txt
# Format: ISO date (YYYY-MM-DD)
```

**Compact Date** (`@date`)
```bash
report-{{date=@date}}.pdf
# Generates: report-20260104.pdf
# Format: Compact (YYYYMMDD)
```

**Current Time** (`@time`)
```bash
snapshot-{{time=@time}}.jpg
# Generates: snapshot-173045.jpg
# Format: Time only (HHMMSS)
```

#### File & Directory Pickers

**File Picker** (`@file`)
```bash
cat {{source=@file}} | grep "error"
# Opens native file picker dialog
# Returns: Selected file path
```

**Directory Picker** (`@directory`)
```bash
rsync -avz source/ {{dest=@directory}}
# Opens native directory picker dialog
# Returns: Selected directory path
```

### Variable Syntax Reference

| Syntax | Example | Description |
|--------|---------|-------------|
| `{{name}}` | `{{user}}` | Simple text input |
| `{{name=default}}` | `{{port=22}}` | Text input with default value |
| `{{name=opt1\|opt2}}` | `{{env=dev\|prod}}` | Dropdown with options |
| `{{name=@now}}` | `{{timestamp=@now}}` | Auto-generated timestamp |
| `{{name=@today}}` | `{{date=@today}}` | Auto-generated date (ISO) |
| `{{name=@date}}` | `{{date=@date}}` | Auto-generated date (compact) |
| `{{name=@time}}` | `{{time=@time}}` | Auto-generated time |
| `{{name=@file}}` | `{{source=@file}}` | File picker dialog |
| `{{name=@directory}}` | `{{dest=@directory}}` | Directory picker dialog |

### Real-World Examples

**SSH with Defaults**
```bash
ssh {{user=root}}@{{host}} -p {{port=22}}
```
Form shows:
- `user`: Text field (default: "root")
- `host`: Text field (empty - required)
- `port`: Text field (default: "22")

**Docker with Environment Selection**
```bash
docker run -e ENV={{env=development|staging|production}} {{image}}
```
Form shows:
- `env`: Dropdown (development, staging, production)
- `image`: Text field (empty - required)

**Timestamped Backup**
```bash
tar -czf backup-{{name}}-{{date=@now}}.tar.gz {{source=@directory}}
```
Form shows:
- `name`: Text field (empty)
- `date`: Text field (pre-filled with current timestamp, editable)
- `source`: Directory picker

**Git Commit Template**
```bash
git commit -m "{{type=feat|fix|docs|style|refactor|test|chore}}: {{message}}"
```
Form shows:
- `type`: Dropdown (feat, fix, docs, style, refactor, test, chore)
- `message`: Text field (empty - required)

**File Processing Pipeline**
```bash
convert {{input=@file}} -resize 800x600 {{output=@directory}}/thumb-{{date=@date}}.jpg
```
Form shows:
- `input`: File picker
- `output`: Directory picker
- `date`: Text field (pre-filled with compact date, editable)

**Database Backup**
```bash
mysqldump -u {{user=root}} -p{{password}} {{database}} > backup-{{database}}-{{date=@today}}.sql
```
Form shows:
- `user`: Text field (default: "root")
- `password`: Text field (empty - consider this example only, passwords in commands are not recommended)
- `database`: Text field (empty - used twice in command)
- `date`: Text field (pre-filled with today's date)

**Kubernetes Context Operations**
```bash
kubectl {{action=get|describe|logs|delete}} {{resource=pod|deployment|service|configmap}} {{name}} -n {{namespace=default}}
```
Form shows:
- `action`: Dropdown (get, describe, logs, delete)
- `resource`: Dropdown (pod, deployment, service, configmap)
- `name`: Text field (empty - required)
- `namespace`: Text field (default: "default")

### Tips for Using Variables

1. **Use descriptive variable names**: `{{username}}` is clearer than `{{u}}`
2. **Provide sensible defaults**: Speeds up common use cases
3. **Use dropdowns for fixed options**: Prevents typos and makes commands discoverable
4. **Combine variable types**: Mix text inputs, dropdowns, and auto-generated values
5. **Date/time variables are editable**: Override if you need a specific timestamp
6. **File pickers save typing**: Better than manually typing long paths

### Organize Commands

- **Pin frequently used commands** (Ctrl+P) to keep them at the top
- **Add tags** to categorize commands (e.g., "docker", "git", "backup")
- Commands are automatically sorted:
  1. Pinned commands first
  2. Then by last used (most recent first)
  3. Never used commands at the end

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Paste command into active window (or show variable form if needed) |
| `Ctrl+C` | Copy command to clipboard (or show variable form if needed) |
| `Ctrl+E` | Edit command |
| `Ctrl+P` | Pin/unpin command |
| `Ctrl+X` | Delete command (with confirmation) |
| `Ctrl+N` | Add new command (from list view) |

## Commands

The extension provides 4 commands accessible from Vicinae:

| Command | Description |
|---------|-------------|
| **Shell Commands** | List and manage all saved commands |
| **New Shell Command** | Create a new command |
| **Import Shell Commands** | Import commands from JSON file |
| **Export Shell Commands** | Export commands to JSON file |

## Examples

### Simple Commands (No Variables)

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

### Commands with Variables

**SSH Connection Templates**
```bash
# Basic SSH
ssh {{user}}@{{host}}

# SSH with port and key
ssh -i ~/.ssh/{{key=id_rsa}} {{user}}@{{host}} -p {{port=22}}

# SSH tunnel
ssh -L {{local_port=8080}}:localhost:{{remote_port=80}} {{user}}@{{host}}
```

**Docker Operations**
```bash
# Run container with environment
docker run -d --name {{name}} -e ENV={{env=dev|staging|prod}} -p {{port=8080}}:8080 {{image}}

# Execute in container
docker exec -it {{container}} {{command=bash|sh|/bin/bash}}

# Inspect with format
docker inspect --format='{{format=.State.Status|.NetworkSettings.IPAddress}}' {{container}}
```

**Git Workflows**
```bash
# Commit with type
git commit -m "{{type=feat|fix|docs|style|refactor|test|chore}}: {{message}}"

# Create and checkout branch
git checkout -b {{prefix=feature|bugfix|hotfix}}/{{branch_name}}

# Tag release
git tag -a v{{version}} -m "Release {{version}} - {{date=@today}}"
```

**File Operations**
```bash
# Timestamped backup
tar -czf backup-{{name}}-{{date=@now}}.tar.gz {{source=@directory}}

# Copy with date
cp {{source=@file}} {{dest=@directory}}/{{filename}}-{{date=@date}}.bak

# Sync directories
rsync -avz --progress {{source=@directory}} {{user=deploy}}@{{host}}:{{dest=/var/www}}
```

**Database Operations**
```bash
# Backup database
mysqldump -u {{user=root}} {{database}} > backup-{{database}}-{{date=@today}}.sql

# Restore database
mysql -u {{user=root}} {{database}} < {{backup_file=@file}}

# PostgreSQL dump
pg_dump -U {{user=postgres}} {{database}} -f backup-{{date=@now}}.sql
```

**Kubernetes Commands**
```bash
# Get resources
kubectl {{action=get|describe}} {{resource=pods|deployments|services}} -n {{namespace=default}}

# Scale deployment
kubectl scale deployment {{deployment}} --replicas={{replicas=3}} -n {{namespace=default}}

# Port forward
kubectl port-forward {{pod}} {{local_port=8080}}:{{remote_port=8080}} -n {{namespace=default}}
```

**Image Processing**
```bash
# Resize image
convert {{input=@file}} -resize {{size=800x600}} {{output=@directory}}/resized-{{date=@time}}.jpg

# Batch convert
for file in {{source=@directory}}/*.jpg; do convert "$file" -quality {{quality=85}} "{{dest=@directory}}/$(basename "$file")"; done
```

**Log Analysis**
```bash
# Search logs
grep -r "{{search_term}}" {{log_dir=@directory}} | grep "{{date=@today}}"

# Tail with filter
tail -f {{log_file=@file}} | grep "{{level=ERROR|WARN|INFO}}"

# Count errors by date
grep "{{date=@today}}" {{log_file=@file}} | grep -c "ERROR"
```

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
    "command": "git commit -m \"{{type=feat|fix|docs}}: {{message}}\"",
    "description": "Commit with conventional commit type",
    "tags": ["git", "commit"],
    "createdAt": 1704446400000,
    "lastUsed": 1704532800000,
    "isPinned": true
  }
]
```

### Export/Import

Export your commands to back them up or share with others:

1. Open Vicinae → Type **"Export Shell Commands"**
2. Select destination directory
3. File is saved as `vicinae-snippets-commands-<timestamp>.json`

Import commands from a JSON file:

1. Open Vicinae → Type **"Import Shell Commands"**
2. Select JSON file
3. Choose mode:
   - **Merge**: Adds new commands, skips duplicates (by ID)
   - **Replace**: Deletes all existing commands, imports from file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgements

Built with:
- [Vicinae](https://github.com/vicinaehq/vicinae) - The launcher framework
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Handlebars](https://handlebarsjs.com/) - Template engine for variables
- [Biome](https://biomejs.dev/) - Linting and formatting

<a href="https://www.flaticon.com/free-icons/terminal" title="terminal icons">Terminal icons created by Royyan Wijaya - Flaticon</a>
