---
name: gemini-cli
description: "Gemini CLI usage patterns, tools, hooks, extensions, and best practices for AI-assisted development."
---

# Gemini CLI Development

Gemini CLI is Google's AI-powered command-line assistant built on Gemini models. This skill provides quick reference for effective usage, customization, and integration.

## Best Practices

### Getting Started

- **Install via npm**: `npm install -g @google/gemini-cli`
- **Authenticate with Google account** for personal use, or configure a GCP project for enterprise
- **Create a GEMINI.md** in project roots with project-specific context (similar to CLAUDE.md)
- **Use trusted folders** to grant file system access to specific directories

### Effective Usage

- **Be specific with requests** - "Fix the login bug in auth.ts" beats "fix bugs"
- **Use context files** - Reference files with `@filename` or drag-and-drop
- **Leverage checkpoints** - Save conversation state for complex multi-step tasks
- **Use headless mode** for scripting and CI/CD integration

### Model Selection

```bash
# Use Gemini 2.5 Pro (default)
gemini

# Use Gemini 2.5 Flash for faster responses
gemini --model gemini-2.5-flash

# Use Gemini 3 Pro Preview for best quality
gemini --model gemini-3-pro-preview
```

### Custom Commands

Create reusable commands in `.gemini/commands/`:

```markdown
<!-- .gemini/commands/review.md -->
---
description: Review code for best practices
---

Review the provided code for:
- Security vulnerabilities
- Performance issues
- Code style and readability

Provide specific, actionable feedback.
```

Use with: `/review @src/auth.ts`

### Hooks

Automate workflows with hooks in `.gemini/hooks.json`:

```json
{
  "hooks": [
    {
      "event": "after-tool",
      "tool": "write_file",
      "command": "prettier --write $FILE"
    }
  ]
}
```

**Hook events:**
- `before-agent` / `after-agent`
- `before-model` / `after-model`
- `before-tool` / `after-tool`
- `session-start` / `session-end`

### Tools

Gemini CLI has built-in tools:

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Create or overwrite files |
| `edit_file` | Make targeted edits |
| `list_directory` | List files in a directory |
| `run_shell_command` | Execute shell commands |
| `web_search` | Search the web |
| `web_fetch` | Fetch URL content |
| `save_memory` | Persist information |
| `get_memory` | Retrieve saved info |

### MCP Integration

Add MCP servers in settings:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./mcp-server.js"]
    }
  }
}
```

### Sandboxing

- **Enable sandbox** for untrusted code execution
- Sandbox restricts file system access to current directory
- Network access is blocked in sandbox mode
- Use `--sandbox` flag or configure in settings

### Cost Management

- **Free tier**: Google AI Studio authentication (rate limited)
- **Paid tier**: GCP project with Vertex AI
- **Token caching** reduces costs for repeated queries
- Monitor usage in Google Cloud Console

## Quick Reference

### Common Commands

```bash
# Start interactive session
gemini

# Start with initial prompt
gemini "explain this codebase"

# Headless mode
gemini -p "fix the typo in README.md"

# Continue previous session
gemini --continue

# Use specific model
gemini --model gemini-2.5-flash

# JSON output mode
gemini --json -p "list files in src/"
```

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/help` | Show available commands |
| `/clear` | Clear conversation |
| `/save` | Save checkpoint |
| `/load` | Load checkpoint |
| `/stats` | Show token usage |
| `/settings` | Open settings |
| `/memory` | Manage saved memories |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current operation |
| `Ctrl+D` | Exit CLI |
| `Ctrl+L` | Clear screen |
| `Up/Down` | Navigate history |
| `Tab` | Autocomplete |

### Environment Variables

```bash
GOOGLE_CLOUD_PROJECT    # GCP project ID
GOOGLE_APPLICATION_CREDENTIALS  # Service account key path
GEMINI_MODEL           # Default model
GEMINI_SANDBOX         # Enable sandbox (true/false)
```

## Documentation Index

Detailed official documentation is synced to `resources/`. Consult these for specifics.

### Getting Started

| Resource | When to Consult |
|----------|-----------------|
| [get-started/index.md](resources/get-started/index.md) | Quick start guide |
| [get-started/installation.md](resources/get-started/installation.md) | Installation options |
| [get-started/authentication.md](resources/get-started/authentication.md) | Auth setup methods |
| [get-started/configuration.md](resources/get-started/configuration.md) | Configuration options |
| [get-started/gemini-3.md](resources/get-started/gemini-3.md) | Gemini 3 Pro setup |
| [get-started/examples.md](resources/get-started/examples.md) | Usage examples |

### CLI Reference

| Resource | When to Consult |
|----------|-----------------|
| [cli/index.md](resources/cli/index.md) | CLI overview |
| [cli/commands.md](resources/cli/commands.md) | Command reference |
| [cli/settings.md](resources/cli/settings.md) | Settings configuration |
| [cli/model.md](resources/cli/model.md) | Model selection |
| [cli/sandbox.md](resources/cli/sandbox.md) | Sandbox mode |
| [cli/custom-commands.md](resources/cli/custom-commands.md) | Creating custom commands |
| [cli/keyboard-shortcuts.md](resources/cli/keyboard-shortcuts.md) | Keyboard shortcuts |
| [cli/checkpointing.md](resources/cli/checkpointing.md) | Saving/loading state |
| [cli/headless.md](resources/cli/headless.md) | Non-interactive mode |
| [cli/enterprise.md](resources/cli/enterprise.md) | Enterprise setup |
| [cli/gemini-md.md](resources/cli/gemini-md.md) | GEMINI.md files |

### Tools

| Resource | When to Consult |
|----------|-----------------|
| [tools/index.md](resources/tools/index.md) | Tools overview |
| [tools/file-system.md](resources/tools/file-system.md) | File operations |
| [tools/shell.md](resources/tools/shell.md) | Shell commands |
| [tools/web-fetch.md](resources/tools/web-fetch.md) | Fetching URLs |
| [tools/web-search.md](resources/tools/web-search.md) | Web search |
| [tools/memory.md](resources/tools/memory.md) | Memory persistence |
| [tools/todos.md](resources/tools/todos.md) | Task tracking |
| [tools/mcp-server.md](resources/tools/mcp-server.md) | MCP server integration |

### Core Architecture

| Resource | When to Consult |
|----------|-----------------|
| [architecture.md](resources/architecture.md) | System architecture |
| [core/index.md](resources/core/index.md) | Core overview |
| [core/tools-api.md](resources/core/tools-api.md) | Tools API reference |
| [core/policy-engine.md](resources/core/policy-engine.md) | Policy engine |
| [core/memport.md](resources/core/memport.md) | Memory import/export |

### Extensions

| Resource | When to Consult |
|----------|-----------------|
| [extensions/index.md](resources/extensions/index.md) | Extensions overview |
| [extensions/getting-started-extensions.md](resources/extensions/getting-started-extensions.md) | Creating extensions |
| [extensions/extension-releasing.md](resources/extensions/extension-releasing.md) | Publishing extensions |

### Hooks

| Resource | When to Consult |
|----------|-----------------|
| [hooks/index.md](resources/hooks/index.md) | Hooks overview |
| [hooks/writing-hooks.md](resources/hooks/writing-hooks.md) | Writing hooks |
| [hooks/best-practices.md](resources/hooks/best-practices.md) | Hook best practices |

### IDE Integration

| Resource | When to Consult |
|----------|-----------------|
| [ide-integration/index.md](resources/ide-integration/index.md) | IDE integration overview |
| [ide-integration/ide-companion-spec.md](resources/ide-integration/ide-companion-spec.md) | IDE companion protocol |

### Reference

| Resource | When to Consult |
|----------|-----------------|
| [faq.md](resources/faq.md) | Frequently asked questions |
| [troubleshooting.md](resources/troubleshooting.md) | Common issues |
| [quota-and-pricing.md](resources/quota-and-pricing.md) | Pricing and limits |
| [releases.md](resources/releases.md) | Release notes |

## Syncing Documentation

Resources are synced from the official Gemini CLI GitHub repository. To update:

```bash
cd skills/gemini-cli
bun run scripts/sync-docs.ts
```
