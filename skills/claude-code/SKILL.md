---
name: claude-code
description: "Claude Code CLI development patterns, hooks, plugins, MCP integration, and agentic workflows."
---

# Claude Code Development

Claude Code is Anthropic's official CLI for agentic coding. This skill provides quick reference for effective usage patterns, customization, and integration.

## Best Practices

### Project Setup

- **Always create a CLAUDE.md** in project roots with project-specific context, commands, and conventions. Claude reads this automatically.
- **Use `.claude/` directory** for project-specific settings, commands, and hooks that should be version controlled.
- **Prefer `~/.claude/` for personal settings** that apply across all projects (API keys, default model, personal preferences).

### Effective Prompting

- **Be specific about scope**: "Fix the login bug in auth.ts" beats "fix the bug"
- **Provide context upfront**: Reference files, error messages, or expected behavior
- **Use multi-turn for complex tasks**: Break large changes into reviewable steps
- **Let Claude explore first**: For unfamiliar codebases, ask Claude to understand before changing

### Hooks & Automation

- **Use hooks for guardrails**, not business logic. Keep them fast and focused.
- **Common hook patterns**:
  - `PreToolUse`: Validate file paths, prevent writes to protected directories
  - `PostToolUse`: Auto-format code, run linters after edits
  - `SessionStart`: Load project context, check environment
- **Test hooks in isolation** before deploying - a broken hook blocks all operations.

### MCP Servers

- **Prefer project-scoped MCP configs** in `.mcp.json` for reproducibility
- **Use `mcpServers` in settings.json** for personal tools that span projects
- **Always test MCP tools manually** before relying on them in workflows

### Sub-agents & Parallelism

- **Spawn sub-agents for independent tasks**: Research, test runs, parallel file processing
- **Use the Task tool** with appropriate agent types (Explore, Plan, etc.)
- **Keep sub-agent prompts self-contained** - they don't see parent context

### Cost Management

- **Use haiku for quick lookups** and simple tasks
- **Reserve opus for complex reasoning** and multi-step planning
- **Monitor usage** with `/cost` and set spending limits in settings

## Quick Reference

### Common Commands

```bash
# Start interactive session
claude

# Run with initial prompt
claude "explain this codebase"

# Headless mode (non-interactive)
claude -p "fix the typo in README.md" --allowedTools Edit,Read

# Continue previous session
claude --continue

# Use specific model
claude --model opus
```

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/help` | Show available commands |
| `/clear` | Clear conversation history |
| `/cost` | Show token usage and costs |
| `/model` | Switch models mid-session |
| `/memory` | Edit CLAUDE.md files |
| `/config` | Open settings |

### Environment Variables

```bash
ANTHROPIC_API_KEY      # API key (required unless using cloud provider)
CLAUDE_MODEL           # Default model (claude-sonnet-4-20250514, etc.)
CLAUDE_CODE_USE_BEDROCK=1    # Use AWS Bedrock
CLAUDE_CODE_USE_VERTEX=1     # Use Google Vertex AI
```

## Documentation Index

Detailed official documentation is synced to `resources/`. Consult these for specifics beyond this quick reference.

### Getting Started

| Resource | When to Consult |
|----------|-----------------|
| [overview.md](resources/overview.md) | Understanding Claude Code capabilities and architecture |
| [quickstart.md](resources/quickstart.md) | First-time setup, getting running in 5 minutes |
| [setup.md](resources/setup.md) | Detailed installation, authentication, initial configuration |

### Core Features

| Resource | When to Consult |
|----------|-----------------|
| [memory.md](resources/memory.md) | CLAUDE.md files, project memory, context management |
| [common-workflows.md](resources/common-workflows.md) | Typical usage patterns, best practices |
| [interactive-mode.md](resources/interactive-mode.md) | Interactive session features, keybindings |
| [headless.md](resources/headless.md) | Non-interactive mode, scripting, CI/CD usage |

### Configuration

| Resource | When to Consult |
|----------|-----------------|
| [settings.md](resources/settings.md) | All configuration options, settings.json structure |
| [model-config.md](resources/model-config.md) | Model selection, parameters, switching providers |
| [terminal-config.md](resources/terminal-config.md) | Terminal setup, shell integration |
| [network-config.md](resources/network-config.md) | Proxy settings, network configuration |

### Extensions & Customization

| Resource | When to Consult |
|----------|-----------------|
| [hooks.md](resources/hooks.md) | Hook system overview, available lifecycle events |
| [hooks-guide.md](resources/hooks-guide.md) | Implementing hooks, examples, best practices |
| [mcp.md](resources/mcp.md) | MCP server integration, configuration |
| [skills.md](resources/skills.md) | Creating and using skills |
| [slash-commands.md](resources/slash-commands.md) | Custom slash commands |
| [plugins.md](resources/plugins.md) | Plugin system overview |
| [plugins-reference.md](resources/plugins-reference.md) | Plugin API reference, structure |
| [plugin-marketplaces.md](resources/plugin-marketplaces.md) | Discovering and installing plugins |

### IDE Integration

| Resource | When to Consult |
|----------|-----------------|
| [vs-code.md](resources/vs-code.md) | VS Code extension setup and features |
| [jetbrains.md](resources/jetbrains.md) | JetBrains IDE integration |
| [desktop.md](resources/desktop.md) | Claude Desktop app integration |

### CI/CD & Automation

| Resource | When to Consult |
|----------|-----------------|
| [github-actions.md](resources/github-actions.md) | GitHub Actions integration, workflows |
| [gitlab-ci-cd.md](resources/gitlab-ci-cd.md) | GitLab CI/CD pipelines |
| [sub-agents.md](resources/sub-agents.md) | Spawning sub-agents, parallel execution |

### Cloud Providers

| Resource | When to Consult |
|----------|-----------------|
| [amazon-bedrock.md](resources/amazon-bedrock.md) | Using Claude via AWS Bedrock |
| [google-vertex-ai.md](resources/google-vertex-ai.md) | Using Claude via Google Cloud Vertex AI |
| [microsoft-foundry.md](resources/microsoft-foundry.md) | Using Claude via Azure/Microsoft |

### Operations & Monitoring

| Resource | When to Consult |
|----------|-----------------|
| [costs.md](resources/costs.md) | Understanding and managing costs |
| [monitoring-usage.md](resources/monitoring-usage.md) | Usage tracking, analytics |
| [analytics.md](resources/analytics.md) | Telemetry and analytics configuration |
| [troubleshooting.md](resources/troubleshooting.md) | Common issues and solutions |

### Security & Compliance

| Resource | When to Consult |
|----------|-----------------|
| [security.md](resources/security.md) | Security model, best practices |
| [sandboxing.md](resources/sandboxing.md) | Command sandboxing, safety controls |
| [data-usage.md](resources/data-usage.md) | Data handling, privacy |
| [iam.md](resources/iam.md) | Identity and access management |
| [legal-and-compliance.md](resources/legal-and-compliance.md) | Compliance information |

### Reference

| Resource | When to Consult |
|----------|-----------------|
| [cli-reference.md](resources/cli-reference.md) | Complete CLI command reference |
| [output-styles.md](resources/output-styles.md) | Output formatting options |
| [statusline.md](resources/statusline.md) | Status line configuration |
| [checkpointing.md](resources/checkpointing.md) | Conversation checkpoints, recovery |
| [changelog.md](resources/changelog.md) | Release notes, version history |

## Syncing Documentation

Resources are synced from official Claude Code documentation. To update:

```bash
cd skills/claude-code
bun run scripts/sync-docs.ts
```
