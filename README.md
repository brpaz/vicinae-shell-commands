# Shell Commands Vicinae Extension

> Store, organize, and quickly access your frequently used terminal commands with powerful variable substitution

## Features

- 📋 **Quick Paste**: Paste commands directly into your active terminal (default action)
- ▶️ **Run in Terminal**: Open a terminal and run the command right away
- 🔍 **Smart Search**: Search by description, command text, or tags
- 📌 **Pin Favorites**: Keep your most-used commands at the top
- 🏷️ **Free-form Tags**: Organize with custom tags
- 🔄 **Variable Substitution**: Dynamic commands with Handlebars-style variables
- 🧠 **Remembered Values**: Variables are prefilled with the values you used last time
- 📅 **Auto-Generated Timestamps**: Built-in date/time variables
- 📁 **File & Directory Pickers**: Browse for files and folders
- 🔀 **Dynamic Options**: Fill dropdowns from a shell command's output, e.g. your git branches
- 📎 **Clipboard & Password Variables**: Prefill from the clipboard or ask for secrets with a masked input
- ⏱️ **Smart Sorting**: Frequently and recently used commands float to the top
- 🧬 **Duplicate**: Clone a command as the starting point for a variation
- 🐚 **Shell History Import**: Pick your most used commands from bash, zsh or fish history
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

1. Open Vicinae → Type **"Add Command"**
2. Fill in the form:
   - **Command**: The actual command (e.g., `git status --short`)
   - **Description**: Optional description
   - **Tags**: Optional tags (e.g., "git, status")
   - **Pin**: Check to pin to top of list
3. Save

### Import Commands from Shell History

1. Open Vicinae → Type **"Import from Shell History"**
2. Commands you run often are listed first, with how many times each was used
3. Press **Enter** to save a command, or use **Edit and Import** to add a description and tags first

Bash, zsh (including extended history) and fish history files are detected automatically from `$HISTFILE`, `~/.zsh_history`, `~/.bash_history` and fish's default location. Set the **History File** command preference to read a different file. Use the dropdown to change the minimum number of uses (default: 2). Commands you already saved are hidden, as are bare `cd`, `ls`, `clear` and similar.

> Shell history often contains passwords and tokens typed inline. Review each command before importing it. The extension only reads the history file; nothing is uploaded.

### Use a Command

1. Open Vicinae → Type **"Shell Commands"**
2. Search or browse your commands
3. Press **Enter** to paste command into the active application
4. Or press **Ctrl+C** to copy to clipboard only
5. Or press **Ctrl+R** to run it in a terminal (see [Preferences](#preferences))

**Commands with variables:**
- If a command contains variables (e.g., `{{user}}`), a form will appear
- Fill in the variable values
- Values you used last time are prefilled
- Submit to paste/copy/run the final command

Pasting, copying or running a command updates its last used time and use count, which drive the sort order.

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

#### Clipboard

**Clipboard** (`@clipboard`)
```bash
curl -I {{url=@clipboard}}
# Field is prefilled with the current clipboard text (editable)
```

#### Password

**Masked input** (`@password`)
```bash
mysql -u {{user=root}} -p{{password=@password}} {{database}}
# Shows a masked field; the value is never remembered
```

#### Dynamic Options

**Command output** (`$(command)`)
```bash
git checkout {{branch=$(git branch --format='%(refname:short)')}}
# Shows a dropdown with one option per output line
```

The command runs when the form opens, using `/bin/sh`, and each non-empty output line becomes a dropdown option (first one selected). Options are not remembered between runs.

- **Where it runs**: in the directory of a `{{cwd=@directory}}` variable if the command has one (options load once a directory is selected and reload when it changes), otherwise in the **Working Directory** preference, otherwise your home directory.
- **Pipes, quotes and braces** work inside the parentheses, e.g. `{{c=$(docker ps --format '{{.Names}}')}}` or `{{f=$(ls | grep .log)}}`.
- **Failures**: if the command fails, prints nothing or takes longer than 5 seconds, the field falls back to a plain text input with the reason shown. At most 200 options are shown.
- **Confirmation**: the first time a command with a given `$(...)` is used, you are asked to confirm before it runs, since imported commands could otherwise run code just by opening their form. Approval is remembered per exact command text; editing the command asks again.

```bash
cd {{cwd=@directory}} && git checkout {{branch=$(git branch --format='%(refname:short)')}}
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
| `{{name=@clipboard}}` | `{{url=@clipboard}}` | Text prefilled from the clipboard |
| `{{name=@password}}` | `{{token=@password}}` | Masked input, never remembered |
| `{{name=$(cmd)}}` | `{{branch=$(git branch --format='%(refname:short)')}}` | Dropdown from command output |

### Remembered Values

Text and dropdown variables are prefilled with the last value you submitted for a variable with the same name, across all commands. If you used `{{host}}` in one command, `{{host}}` in another starts with that host. A remembered value takes priority over the template default, and a remembered dropdown value is ignored if it is no longer one of the options.

File/directory pickers, date and time variables, `@clipboard`, `@password` and `$(...)` options are never remembered. Remembered values are stored unencrypted in local storage, so use `@password` for secrets.
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
mysqldump -u {{user=root}} -p{{password=@password}} {{database}} > backup-{{database}}-{{date=@today}}.sql
```
Form shows:
- `user`: Text field (default: "root")
- `password`: Masked field (never remembered)
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
7. **Use `@password` for secrets**: Text fields are remembered, masked fields are not
8. **Pair `$(...)` with `{{cwd=@directory}}`**: Lets one command work across repositories

### Organize Commands

- **Pin frequently used commands** (Ctrl+P) to keep them at the top
- **Add tags** to categorize commands (e.g., "docker", "git", "backup")
- **Duplicate a command** (Ctrl+Shift+D) to create a variation without retyping it
- Commands are automatically sorted:
  1. Pinned commands first
  2. Then by frecency: use count, discounted by time since last use (the score halves every 14 days)
  3. Never used commands at the end, newest first

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Paste command into active window (or show variable form if needed) |
| `Ctrl+C` | Copy command to clipboard (or show variable form if needed) |
| `Ctrl+R` | Run command in a terminal (or show variable form if needed) |
| `Ctrl+E` | Edit command |
| `Ctrl+Shift+D` | Duplicate command |
| `Ctrl+P` | Pin/unpin command |
| `Ctrl+D` | Delete command (with confirmation) |
| `Ctrl+N` | Add new command (from list view) |

## Commands

The extension provides 5 commands accessible from Vicinae:

| Command | Description |
|---------|-------------|
| **Commands** | List and manage all saved commands |
| **Add Command** | Create a new command |
| **Import Commands** | Import commands from JSON file |
| **Import from Shell History** | Pick frequently used commands from your shell history |
| **Export Commands** | Export commands to JSON file |

## Preferences

| Preference | Scope | Description |
|------------|-------|-------------|
| **Terminal Command** | Extension | Terminal used by **Run in Terminal**, plus any arguments it needs to execute a command. Default: `xdg-terminal-exec`. Examples: `kitty`, `alacritty -e`, `gnome-terminal --`, `foot`. Arguments are split on whitespace, so paths with spaces are not supported. |
| **Working Directory** | Extension | Directory where `{{name=$(command)}}` placeholders run when the command has no `{{cwd=@directory}}` variable. Default: your home directory. |
| **History File** | Import from Shell History | History file to read instead of the auto-detected ones, e.g. `~/.local/share/zsh/history`. |

Run in Terminal starts your `$SHELL` interactively, runs the command as if you had pasted it, then leaves you in that shell so the output stays visible.

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

# Run unit tests
npm test

# Run all checks and auto-fix
npm run check
```

## Data Storage

All commands are stored locally using Vicinae's LocalStorage API in JSON format under the key `shell-commands`. Remembered variable values are stored under `variable-history` and approved `$(...)` commands under `approved-option-commands`.

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
    "useCount": 12,
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
