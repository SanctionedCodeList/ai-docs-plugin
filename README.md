# AI Docs Plugin

A Claude Code plugin providing documentation and best practices for AI/LLM libraries.

## Features

This plugin provides **Skills** that Claude can use to access up-to-date documentation and best practices for:

- **Claude API** - Messages API, tool use, Agent SDK, prompt engineering
- **Claude Code** - CLI usage, hooks, plugins, MCP integration
- **Gemini API** - google-genai SDK, multimodal, structured outputs, function calling
- **Gemini CLI** - Google's AI CLI, tools, hooks, extensions, MCP integration

## Installation

### From Local Marketplace (Development)

1. Create a test marketplace directory:
   ```bash
   mkdir -p ~/test-marketplace/.claude-plugin
   ```

2. Create `~/test-marketplace/.claude-plugin/marketplace.json`:
   ```json
   {
     "name": "local-marketplace",
     "owner": { "name": "Local" },
     "plugins": [
       {
         "name": "ai-docs",
         "source": "/path/to/ai-docs-plugin",
         "description": "AI documentation and best practices"
       }
     ]
   }
   ```

3. In Claude Code:
   ```
   /plugin marketplace add ~/test-marketplace
   /plugin install ai-docs@local-marketplace
   ```

### From GitHub (Once Published)

```
/plugin marketplace add parkerhancock/ai-docs-plugin
/plugin install ai-docs@parkerhancock
```

## Skills Included

### claude-api

Documentation for Claude/Anthropic API:
- Messages API and streaming
- Tool use and function calling
- Agent SDK (Python & TypeScript)
- Prompt engineering techniques
- Extended thinking and structured outputs
- MCP connector integration

### claude-code

Documentation for Claude Code CLI:
- Setup and configuration
- Hooks and automation
- MCP server integration
- Plugin development
- CI/CD workflows

### gemini-dev

Documentation for Google Gemini API:
- google-genai SDK patterns
- Multimodal inputs (images, PDFs, audio, video)
- Structured outputs with JSON schemas
- Function calling and tool use
- Context caching and optimization

### gemini-cli

Documentation for Gemini CLI:
- Installation and authentication
- CLI commands and settings
- Built-in tools (file system, shell, web, memory)
- Hooks and extensions
- MCP server integration
- Sandboxing and enterprise setup

## Syncing Documentation

Each skill has a sync script to update documentation from official sources:

```bash
# Sync Claude API docs (platform.claude.com)
cd skills/claude-api
bun run scripts/sync-docs.ts

# Sync Claude Code docs (code.claude.com)
cd skills/claude-code
bun run scripts/sync-docs.ts

# Sync Gemini API docs (ai.google.dev)
cd skills/gemini-dev
bun run scripts/sync-docs.ts

# Sync Gemini CLI docs (github.com/google-gemini/gemini-cli)
cd skills/gemini-cli
bun run scripts/sync-docs.ts
```

## Plugin Structure

```
ai-docs-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skills/
│   ├── claude-api/
│   │   ├── SKILL.md         # Best practices + doc index
│   │   ├── scripts/
│   │   │   └── sync-docs.ts
│   │   └── resources/       # 84 synced doc files
│   ├── claude-code/
│   │   ├── SKILL.md         # Best practices + doc index
│   │   ├── scripts/
│   │   │   └── sync-docs.ts
│   │   └── resources/       # 42 synced doc files
│   ├── gemini-cli/
│   │   ├── SKILL.md         # Best practices + doc index
│   │   ├── scripts/
│   │   │   └── sync-docs.ts
│   │   └── resources/       # 49 synced doc files
│   └── gemini-dev/
│       ├── SKILL.md         # Best practices + doc index
│       ├── scripts/
│       │   └── sync-docs.ts
│       └── resources/       # 15 synced doc files
├── .gitignore
└── README.md
```

## License

MIT
