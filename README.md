# AI Docs Plugin

A Claude Code plugin providing documentation and best practices for AI/LLM libraries.

## Features

This plugin provides **Skills** that Claude can use to access up-to-date documentation and best practices for:

- **Claude Code** - CLI usage, hooks, plugins, MCP integration
- **Google Gemini** - GenAI SDK, multimodal, structured outputs, function calling

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

## Syncing Documentation

Each skill has a sync script to update documentation from official sources:

```bash
# Sync Claude Code docs
cd skills/claude-code
bun run scripts/sync-docs.ts

# Sync Gemini docs
cd skills/gemini-dev
bun run scripts/sync-docs.ts
```

## Plugin Structure

```
ai-docs-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skills/
│   ├── claude-code/
│   │   ├── SKILL.md         # Best practices + doc index
│   │   ├── scripts/
│   │   │   └── sync-docs.ts
│   │   └── resources/       # 42 synced doc files
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
