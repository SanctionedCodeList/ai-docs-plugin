---
name: openai-api
description: "OpenAI API development patterns, SDK usage, chat completions, tool use, and best practices."
---

# OpenAI API Development

> **Sources:**
> - https://github.com/openai/openai-python (Python SDK)
> - https://github.com/openai/openai-cookbook (Examples)
> - https://platform.openai.com/docs (Official docs - requires browser access)

This skill provides quick reference for building with the OpenAI API, including the Chat Completions API, Responses API, tool use, and best practices.

## Best Practices

### API Basics

- **Use the official SDKs** (`openai` for Python, `openai` for Node.js)
- **Set reasonable timeouts** - Complex tasks may take time
- **Handle rate limits** - Implement exponential backoff
- **Use streaming** for better UX on long responses

### Model Selection

| Model | Use Case | Notes |
|-------|----------|-------|
| `gpt-4o` | Default for most tasks | Best balance of speed/quality |
| `gpt-4o-mini` | High-volume, simple tasks | Fastest, lowest cost |
| `o1` / `o1-mini` | Complex reasoning | Extended thinking |
| `gpt-4-turbo` | Legacy, large context | 128K context |

### Chat Completions API

```python
from openai import OpenAI

client = OpenAI()  # Uses OPENAI_API_KEY env var

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ]
)
print(response.choices[0].message.content)
```

### Responses API (New)

The newer Responses API simplifies common patterns:

```python
response = client.responses.create(
    model="gpt-4o",
    instructions="You are a coding assistant.",
    input="How do I reverse a string in Python?"
)
print(response.output_text)
```

### Streaming

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### Tool Use (Function Calling)

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            },
            "required": ["location"]
        }
    }
}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What's the weather in NYC?"}],
    tools=tools
)

# Handle tool calls
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    # Execute function and return result...
```

### Vision

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": image_url}}
        ]
    }]
)
```

### Structured Outputs

```python
from pydantic import BaseModel

class Analysis(BaseModel):
    summary: str
    sentiment: str
    confidence: float

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze: Great product!"}],
    response_format=Analysis
)
result = response.choices[0].message.parsed
```

### Embeddings

```python
response = client.embeddings.create(
    model="text-embedding-3-small",
    input="Hello world"
)
embedding = response.data[0].embedding
```

### Audio APIs

#### Text-to-Speech

```python
response = client.audio.speech.create(
    model="tts-1",  # or "tts-1-hd" for higher quality
    voice="alloy",  # alloy, echo, fable, onyx, nova, shimmer
    input="Hello world!"
)
response.stream_to_file("speech.mp3")
```

#### Speech-to-Text

```python
with open("audio.mp3", "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )
print(transcript.text)
```

### Realtime API

For full-duplex text/audio conversations:

```python
from openai import OpenAI

client = OpenAI()

# Realtime sessions use WebSocket connections
# See platform.openai.com/docs/guides/realtime for setup
```

**Models:** `gpt-4o-realtime-preview`, `gpt-4o-mini-realtime-preview`

## Quick Reference

### Python SDK

```python
from openai import OpenAI

client = OpenAI()  # Uses OPENAI_API_KEY

# Sync
response = client.chat.completions.create(...)

# Async
from openai import AsyncOpenAI
client = AsyncOpenAI()
response = await client.chat.completions.create(...)
```

### TypeScript SDK

```typescript
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }]
});
```

### Common Parameters

| Parameter | Description |
|-----------|-------------|
| `model` | Model ID (gpt-4o, gpt-4o-mini, etc.) |
| `messages` | Conversation history |
| `temperature` | Randomness (0-2, default 1) |
| `max_tokens` | Max output tokens |
| `stream` | Enable streaming |
| `tools` | Function definitions |
| `response_format` | JSON mode or schema |

### Environment Variables

```bash
OPENAI_API_KEY         # Required API key
OPENAI_ORG_ID          # Organization ID (optional)
OPENAI_BASE_URL        # Custom endpoint (optional)
```

### Error Handling

```python
from openai import APIError, RateLimitError

try:
    response = client.chat.completions.create(...)
except RateLimitError:
    # Implement backoff
    time.sleep(60)
except APIError as e:
    print(f"API error: {e}")
```

## Cost Optimization

- **Use gpt-4o-mini** for simple tasks (10x cheaper than gpt-4o)
- **Set max_tokens** appropriately - don't over-allocate
- **Use streaming** to cancel early when you have enough
- **Cache responses** for repeated queries
- **Batch requests** when possible

## Documentation Index

Resources synced from official GitHub repositories. Note: platform.openai.com requires browser access.

### SDK Reference

| Resource | When to Consult |
|----------|-----------------|
| [sdk/python-readme.md](resources/sdk/python-readme.md) | Python SDK overview, installation, basic usage |
| [sdk/python-api.md](resources/sdk/python-api.md) | Complete Python API reference |

### Examples & Guides

| Resource | When to Consult |
|----------|-----------------|
| [cookbook/readme.md](resources/cookbook/readme.md) | Cookbook overview, available examples |
| [cookbook/agents.md](resources/cookbook/agents.md) | Agent development patterns |

### Official Documentation

For comprehensive API documentation, visit:
- **API Reference**: https://platform.openai.com/docs/api-reference
- **Guides**: https://platform.openai.com/docs/guides
- **Cookbook**: https://cookbook.openai.com

## Syncing Documentation

Resources are synced from official OpenAI GitHub repositories:

```bash
cd skills/openai-api
bun run scripts/sync-docs.ts
```
