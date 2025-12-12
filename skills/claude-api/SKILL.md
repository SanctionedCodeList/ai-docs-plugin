---
name: claude-api
description: "Anthropic Claude API development patterns, tool use, Agent SDK, prompt engineering, and best practices."
---

# Claude API Development

> **Source:** https://platform.claude.com/docs

This skill provides quick reference for building with the Claude API, including the Messages API, tool use, Agent SDK, and prompt engineering best practices.

## Best Practices

### API Basics

- **Always use the official SDKs** (`anthropic` for Python, `@anthropic-ai/sdk` for TypeScript)
- **Set reasonable timeouts** - Claude can take time on complex tasks, especially with extended thinking
- **Handle rate limits gracefully** - Implement exponential backoff with jitter
- **Use streaming for long responses** - Better UX and allows early termination

### Model Selection

| Model | Use Case | Notes |
|-------|----------|-------|
| `claude-sonnet-4-20250514` | Default for most tasks | Best balance of speed/quality |
| `claude-haiku-3-5-20241022` | High-volume, simple tasks | Fastest, lowest cost |
| `claude-opus-4-20250514` | Complex reasoning, coding | Highest quality, slower |

### Prompt Engineering

- **Use XML tags** to structure inputs: `<document>`, `<instructions>`, `<examples>`
- **Put instructions at the end** when working with long documents
- **Use system prompts** for persistent context and persona
- **Prefill assistant response** to guide output format
- **Multi-shot examples** improve consistency for structured tasks

### Extended Thinking

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # Tokens for reasoning
    },
    messages=[{"role": "user", "content": prompt}]
)
```

- Enable for complex reasoning, math, coding tasks
- Set `budget_tokens` based on task complexity
- Access thinking via `response.content` blocks with `type="thinking"`

### Tool Use

```python
tools = [{
    "name": "get_weather",
    "description": "Get current weather for a location",
    "input_schema": {
        "type": "object",
        "properties": {
            "location": {"type": "string", "description": "City name"}
        },
        "required": ["location"]
    }
}]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in Boston?"}]
)
```

- **Write clear tool descriptions** - Claude uses these to decide when to call
- **Use JSON Schema** for input validation
- **Handle tool_use blocks** and return tool_result
- **Consider parallel tool calls** for independent operations

### Structured Outputs

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Analyze this text..."}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "analysis",
            "schema": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "sentiment": {"enum": ["positive", "negative", "neutral"]}
                },
                "required": ["summary", "sentiment"]
            }
        }
    }
)
```

### Prompt Caching

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": large_system_prompt,
        "cache_control": {"type": "ephemeral"}  # Cache this block
    }],
    messages=[{"role": "user", "content": query}]
)
```

- Cache large, reusable context (system prompts, documents)
- Minimum 1024 tokens for caching to activate
- 90% cost reduction on cache hits
- 5-minute TTL (or 1-hour with extended caching)

### Cost Optimization

- **Use prompt caching** for repeated context
- **Use batch API** for async workloads (50% discount)
- **Choose appropriate model** - don't use Opus for simple tasks
- **Set reasonable max_tokens** - don't over-allocate
- **Stream and cancel early** when you have enough output

## Quick Reference

### Python SDK

```python
from anthropic import Anthropic

client = Anthropic()  # Uses ANTHROPIC_API_KEY env var

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)
print(response.content[0].text)
```

### TypeScript SDK

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Hello, Claude" }
  ]
});
console.log(response.content[0].text);
```

### Streaming

```python
with client.messages.stream(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

## Documentation Index

Detailed official documentation is synced to `resources/`. Consult these for specifics beyond this quick reference.

### Getting Started

| Resource | When to Consult |
|----------|-----------------|
| [intro.md](resources/intro.md) | Introduction to Claude API |
| [get-started.md](resources/get-started.md) | Making your first API call |

### Models

| Resource | When to Consult |
|----------|-----------------|
| [models/overview.md](resources/models/overview.md) | Available models and capabilities |
| [models/choosing-a-model.md](resources/models/choosing-a-model.md) | Selecting the right model |
| [models/whats-new-claude-4-5.md](resources/models/whats-new-claude-4-5.md) | Claude 4.5 features |
| [models/migrating-to-claude-4.md](resources/models/migrating-to-claude-4.md) | Migration from older versions |
| [pricing.md](resources/pricing.md) | Token costs and pricing |

### Core Features

| Resource | When to Consult |
|----------|-----------------|
| [features/overview.md](resources/features/overview.md) | All API features at a glance |
| [features/messages.md](resources/features/messages.md) | Messages API fundamentals |
| [features/context-windows.md](resources/features/context-windows.md) | Context limits and management |
| [features/streaming.md](resources/features/streaming.md) | Real-time response streaming |
| [features/extended-thinking.md](resources/features/extended-thinking.md) | Enhanced reasoning mode |
| [features/structured-outputs.md](resources/features/structured-outputs.md) | Guaranteed JSON schema output |
| [features/citations.md](resources/features/citations.md) | Source attribution |

### Multimodal

| Resource | When to Consult |
|----------|-----------------|
| [features/vision.md](resources/features/vision.md) | Image processing and analysis |
| [features/pdf-support.md](resources/features/pdf-support.md) | PDF document handling |
| [features/files-api.md](resources/features/files-api.md) | File upload and management |

### Cost Optimization

| Resource | When to Consult |
|----------|-----------------|
| [features/prompt-caching.md](resources/features/prompt-caching.md) | Reduce costs with caching |
| [features/batch-processing.md](resources/features/batch-processing.md) | Async batch API (50% off) |
| [features/token-counting.md](resources/features/token-counting.md) | Pre-flight token counts |

### Prompt Engineering

| Resource | When to Consult |
|----------|-----------------|
| [prompting/overview.md](resources/prompting/overview.md) | Prompt engineering fundamentals |
| [prompting/be-clear-and-direct.md](resources/prompting/be-clear-and-direct.md) | Writing clear prompts |
| [prompting/multishot-prompting.md](resources/prompting/multishot-prompting.md) | Using examples |
| [prompting/chain-of-thought.md](resources/prompting/chain-of-thought.md) | Step-by-step reasoning |
| [prompting/use-xml-tags.md](resources/prompting/use-xml-tags.md) | Structuring with XML |
| [prompting/system-prompts.md](resources/prompting/system-prompts.md) | System prompt patterns |
| [prompting/prefill-response.md](resources/prompting/prefill-response.md) | Guiding output format |
| [prompting/long-context-tips.md](resources/prompting/long-context-tips.md) | Working with large contexts |
| [prompting/claude-4-best-practices.md](resources/prompting/claude-4-best-practices.md) | Claude 4 specific tips |

### Tool Use

| Resource | When to Consult |
|----------|-----------------|
| [tools/overview.md](resources/tools/overview.md) | Tool use fundamentals |
| [tools/implement-tool-use.md](resources/tools/implement-tool-use.md) | Implementation guide |
| [tools/tool-streaming.md](resources/tools/tool-streaming.md) | Streaming tool parameters |
| [tools/bash-tool.md](resources/tools/bash-tool.md) | Shell command execution |
| [tools/code-execution.md](resources/tools/code-execution.md) | Sandboxed Python execution |
| [tools/computer-use.md](resources/tools/computer-use.md) | Computer control interface |
| [tools/web-search.md](resources/tools/web-search.md) | Web search integration |
| [tools/memory.md](resources/tools/memory.md) | Persistent memory tool |

### Agent Skills

| Resource | When to Consult |
|----------|-----------------|
| [skills/overview.md](resources/skills/overview.md) | What are Agent Skills |
| [skills/quickstart.md](resources/skills/quickstart.md) | Create your first Skill |
| [skills/best-practices.md](resources/skills/best-practices.md) | Skill design patterns |

### MCP Integration

| Resource | When to Consult |
|----------|-----------------|
| [mcp/connector.md](resources/mcp/connector.md) | Connect to MCP servers from API |
| [mcp/remote-servers.md](resources/mcp/remote-servers.md) | Remote MCP server setup |

### Agent SDK

| Resource | When to Consult |
|----------|-----------------|
| [agent-sdk/overview.md](resources/agent-sdk/overview.md) | Agent SDK introduction |
| [agent-sdk/quickstart.md](resources/agent-sdk/quickstart.md) | Get started building agents |
| [agent-sdk/typescript.md](resources/agent-sdk/typescript.md) | TypeScript implementation |
| [agent-sdk/python.md](resources/agent-sdk/python.md) | Python implementation |
| [agent-sdk/permissions.md](resources/agent-sdk/permissions.md) | Permission system |
| [agent-sdk/custom-tools.md](resources/agent-sdk/custom-tools.md) | Adding custom tools |
| [agent-sdk/subagents.md](resources/agent-sdk/subagents.md) | Multi-agent patterns |
| [agent-sdk/hosting.md](resources/agent-sdk/hosting.md) | Deployment options |

### Testing & Guardrails

| Resource | When to Consult |
|----------|-----------------|
| [evaluation/define-success.md](resources/evaluation/define-success.md) | Success criteria |
| [evaluation/develop-tests.md](resources/evaluation/develop-tests.md) | Building test suites |
| [guardrails/reduce-hallucinations.md](resources/guardrails/reduce-hallucinations.md) | Minimize false info |
| [guardrails/mitigate-jailbreaks.md](resources/guardrails/mitigate-jailbreaks.md) | Prevent injection |

### API Reference

| Resource | When to Consult |
|----------|-----------------|
| [api/overview.md](resources/api/overview.md) | API reference intro |
| [api/client-sdks.md](resources/api/client-sdks.md) | Official SDK libraries |
| [api/errors.md](resources/api/errors.md) | Error codes and handling |
| [api/rate-limits.md](resources/api/rate-limits.md) | Rate limit details |
| [api/openai-sdk.md](resources/api/openai-sdk.md) | OpenAI SDK compatibility |

### Cloud Providers

| Resource | When to Consult |
|----------|-----------------|
| [cloud/amazon-bedrock.md](resources/cloud/amazon-bedrock.md) | Claude on AWS |
| [cloud/vertex-ai.md](resources/cloud/vertex-ai.md) | Claude on Google Cloud |
| [cloud/microsoft-foundry.md](resources/cloud/microsoft-foundry.md) | Claude on Azure |

## Syncing Documentation

Resources are synced from official Claude API documentation. To update:

```bash
cd skills/claude-api
bun run scripts/sync-docs.ts
```
