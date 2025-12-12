#!/usr/bin/env bun
/**
 * Sync Claude API documentation from platform.claude.com
 *
 * Claude's docs are available as raw markdown at URLs like:
 * https://platform.claude.com/docs/en/build-with-claude/overview.md
 *
 * Usage:
 *   bun run scripts/sync-docs.ts
 *   bun run scripts/sync-docs.ts --dry-run
 */

import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";

const BASE_URL = "https://platform.claude.com/docs/en";
const RESOURCES_DIR = join(dirname(import.meta.dir), "resources");
const MANIFEST_FILE = join(RESOURCES_DIR, "manifest.json");

interface DocPage {
  slug: string;
  outputPath: string;
  title: string;
  description: string;
}

// Documentation pages to fetch - organized by category
const DOC_PAGES: DocPage[] = [
  // Getting Started
  { slug: "intro", outputPath: "intro.md", title: "Introduction", description: "Introduction to Claude API" },
  { slug: "get-started", outputPath: "get-started.md", title: "Get Started", description: "Make your first API call" },

  // About Claude - Models
  { slug: "about-claude/models/overview", outputPath: "models/overview.md", title: "Models Overview", description: "Available Claude models and capabilities" },
  { slug: "about-claude/models/choosing-a-model", outputPath: "models/choosing-a-model.md", title: "Choosing a Model", description: "How to select the right model for your use case" },
  { slug: "about-claude/models/whats-new-claude-4-5", outputPath: "models/whats-new-claude-4-5.md", title: "What's New in Claude 4.5", description: "Latest features in Claude 4.5" },
  { slug: "about-claude/models/migrating-to-claude-4", outputPath: "models/migrating-to-claude-4.md", title: "Migrating to Claude 4", description: "Migration guide for Claude 4" },
  { slug: "about-claude/model-deprecations", outputPath: "models/deprecations.md", title: "Model Deprecations", description: "Deprecated models and migration paths" },
  { slug: "about-claude/pricing", outputPath: "pricing.md", title: "Pricing", description: "API pricing and token costs" },
  { slug: "about-claude/glossary", outputPath: "glossary.md", title: "Glossary", description: "Key terms and definitions" },

  // Build with Claude - Core
  { slug: "build-with-claude/overview", outputPath: "features/overview.md", title: "Features Overview", description: "All Claude API features and capabilities" },
  { slug: "build-with-claude/working-with-messages", outputPath: "features/messages.md", title: "Working with Messages", description: "Messages API basics and patterns" },
  { slug: "build-with-claude/context-windows", outputPath: "features/context-windows.md", title: "Context Windows", description: "Understanding and using context windows" },
  { slug: "build-with-claude/prompt-caching", outputPath: "features/prompt-caching.md", title: "Prompt Caching", description: "Reduce costs with prompt caching" },
  { slug: "build-with-claude/context-editing", outputPath: "features/context-editing.md", title: "Context Editing", description: "Automatic context management" },
  { slug: "build-with-claude/extended-thinking", outputPath: "features/extended-thinking.md", title: "Extended Thinking", description: "Enhanced reasoning for complex tasks" },
  { slug: "build-with-claude/effort", outputPath: "features/effort.md", title: "Effort Parameter", description: "Control response thoroughness" },
  { slug: "build-with-claude/streaming", outputPath: "features/streaming.md", title: "Streaming", description: "Stream responses in real-time" },
  { slug: "build-with-claude/batch-processing", outputPath: "features/batch-processing.md", title: "Batch Processing", description: "Process large volumes asynchronously" },
  { slug: "build-with-claude/citations", outputPath: "features/citations.md", title: "Citations", description: "Ground responses in source documents" },
  { slug: "build-with-claude/multilingual-support", outputPath: "features/multilingual.md", title: "Multilingual Support", description: "Working with multiple languages" },
  { slug: "build-with-claude/token-counting", outputPath: "features/token-counting.md", title: "Token Counting", description: "Count tokens before sending" },
  { slug: "build-with-claude/embeddings", outputPath: "features/embeddings.md", title: "Embeddings", description: "Generate text embeddings" },
  { slug: "build-with-claude/vision", outputPath: "features/vision.md", title: "Vision", description: "Process and analyze images" },
  { slug: "build-with-claude/pdf-support", outputPath: "features/pdf-support.md", title: "PDF Support", description: "Process PDF documents" },
  { slug: "build-with-claude/files", outputPath: "features/files-api.md", title: "Files API", description: "Upload and manage files" },
  { slug: "build-with-claude/search-results", outputPath: "features/search-results.md", title: "Search Results", description: "Natural citations for RAG" },
  { slug: "build-with-claude/structured-outputs", outputPath: "features/structured-outputs.md", title: "Structured Outputs", description: "Guarantee JSON schema conformance" },

  // Prompt Engineering
  { slug: "build-with-claude/prompt-engineering/overview", outputPath: "prompting/overview.md", title: "Prompt Engineering Overview", description: "Introduction to prompt engineering" },
  { slug: "build-with-claude/prompt-engineering/be-clear-and-direct", outputPath: "prompting/be-clear-and-direct.md", title: "Be Clear and Direct", description: "Writing clear prompts" },
  { slug: "build-with-claude/prompt-engineering/multishot-prompting", outputPath: "prompting/multishot-prompting.md", title: "Multi-shot Prompting", description: "Using examples in prompts" },
  { slug: "build-with-claude/prompt-engineering/chain-of-thought", outputPath: "prompting/chain-of-thought.md", title: "Chain of Thought", description: "Step-by-step reasoning" },
  { slug: "build-with-claude/prompt-engineering/use-xml-tags", outputPath: "prompting/use-xml-tags.md", title: "Use XML Tags", description: "Structure prompts with XML" },
  { slug: "build-with-claude/prompt-engineering/system-prompts", outputPath: "prompting/system-prompts.md", title: "System Prompts", description: "Setting context with system prompts" },
  { slug: "build-with-claude/prompt-engineering/prefill-claudes-response", outputPath: "prompting/prefill-response.md", title: "Prefill Response", description: "Guide output format" },
  { slug: "build-with-claude/prompt-engineering/chain-prompts", outputPath: "prompting/chain-prompts.md", title: "Chain Prompts", description: "Breaking complex tasks into steps" },
  { slug: "build-with-claude/prompt-engineering/long-context-tips", outputPath: "prompting/long-context-tips.md", title: "Long Context Tips", description: "Working with large contexts" },
  { slug: "build-with-claude/prompt-engineering/extended-thinking-tips", outputPath: "prompting/extended-thinking-tips.md", title: "Extended Thinking Tips", description: "Prompting for extended thinking" },
  { slug: "build-with-claude/prompt-engineering/claude-4-best-practices", outputPath: "prompting/claude-4-best-practices.md", title: "Claude 4 Best Practices", description: "Best practices for Claude 4 models" },

  // Tool Use
  { slug: "agents-and-tools/tool-use/overview", outputPath: "tools/overview.md", title: "Tool Use Overview", description: "Enable Claude to use external tools" },
  { slug: "agents-and-tools/tool-use/implement-tool-use", outputPath: "tools/implement-tool-use.md", title: "Implement Tool Use", description: "How to implement tool use" },
  { slug: "agents-and-tools/tool-use/fine-grained-tool-streaming", outputPath: "tools/tool-streaming.md", title: "Tool Streaming", description: "Stream tool parameters" },
  { slug: "agents-and-tools/tool-use/bash-tool", outputPath: "tools/bash-tool.md", title: "Bash Tool", description: "Execute shell commands" },
  { slug: "agents-and-tools/tool-use/code-execution-tool", outputPath: "tools/code-execution.md", title: "Code Execution", description: "Run Python in sandbox" },
  { slug: "agents-and-tools/tool-use/programmatic-tool-calling", outputPath: "tools/programmatic-tool-calling.md", title: "Programmatic Tool Calling", description: "Call tools from code execution" },
  { slug: "agents-and-tools/tool-use/computer-use-tool", outputPath: "tools/computer-use.md", title: "Computer Use", description: "Control computer interfaces" },
  { slug: "agents-and-tools/tool-use/text-editor-tool", outputPath: "tools/text-editor.md", title: "Text Editor", description: "Create and edit files" },
  { slug: "agents-and-tools/tool-use/web-fetch-tool", outputPath: "tools/web-fetch.md", title: "Web Fetch", description: "Retrieve web content" },
  { slug: "agents-and-tools/tool-use/web-search-tool", outputPath: "tools/web-search.md", title: "Web Search", description: "Search the web" },
  { slug: "agents-and-tools/tool-use/memory-tool", outputPath: "tools/memory.md", title: "Memory Tool", description: "Store and retrieve information" },
  { slug: "agents-and-tools/tool-use/tool-search-tool", outputPath: "tools/tool-search.md", title: "Tool Search", description: "Dynamic tool discovery" },

  // Agent Skills
  { slug: "agents-and-tools/agent-skills/overview", outputPath: "skills/overview.md", title: "Agent Skills Overview", description: "Extend Claude with Skills" },
  { slug: "agents-and-tools/agent-skills/quickstart", outputPath: "skills/quickstart.md", title: "Skills Quickstart", description: "Create your first Skill" },
  { slug: "agents-and-tools/agent-skills/best-practices", outputPath: "skills/best-practices.md", title: "Skills Best Practices", description: "Best practices for Skills" },

  // MCP
  { slug: "agents-and-tools/mcp-connector", outputPath: "mcp/connector.md", title: "MCP Connector", description: "Connect to MCP servers from API" },
  { slug: "agents-and-tools/remote-mcp-servers", outputPath: "mcp/remote-servers.md", title: "Remote MCP Servers", description: "Use remote MCP servers" },

  // Agent SDK
  { slug: "agent-sdk/overview", outputPath: "agent-sdk/overview.md", title: "Agent SDK Overview", description: "Build custom agents with Claude" },
  { slug: "agent-sdk/quickstart", outputPath: "agent-sdk/quickstart.md", title: "Agent SDK Quickstart", description: "Get started with Agent SDK" },
  { slug: "agent-sdk/typescript", outputPath: "agent-sdk/typescript.md", title: "TypeScript SDK", description: "Agent SDK for TypeScript" },
  { slug: "agent-sdk/python", outputPath: "agent-sdk/python.md", title: "Python SDK", description: "Agent SDK for Python" },
  { slug: "agent-sdk/streaming-vs-single-mode", outputPath: "agent-sdk/streaming-modes.md", title: "Streaming Modes", description: "Streaming vs single mode" },
  { slug: "agent-sdk/permissions", outputPath: "agent-sdk/permissions.md", title: "Permissions", description: "Agent permissions system" },
  { slug: "agent-sdk/sessions", outputPath: "agent-sdk/sessions.md", title: "Sessions", description: "Managing agent sessions" },
  { slug: "agent-sdk/structured-outputs", outputPath: "agent-sdk/structured-outputs.md", title: "Structured Outputs", description: "Structured outputs in agents" },
  { slug: "agent-sdk/hosting", outputPath: "agent-sdk/hosting.md", title: "Hosting", description: "Deploy and host agents" },
  { slug: "agent-sdk/secure-deployment", outputPath: "agent-sdk/secure-deployment.md", title: "Secure Deployment", description: "Security best practices" },
  { slug: "agent-sdk/mcp", outputPath: "agent-sdk/mcp.md", title: "MCP in Agent SDK", description: "Using MCP with agents" },
  { slug: "agent-sdk/custom-tools", outputPath: "agent-sdk/custom-tools.md", title: "Custom Tools", description: "Add custom tools to agents" },
  { slug: "agent-sdk/subagents", outputPath: "agent-sdk/subagents.md", title: "Subagents", description: "Create and manage subagents" },

  // Testing & Evaluation
  { slug: "test-and-evaluate/define-success", outputPath: "evaluation/define-success.md", title: "Define Success", description: "Define success criteria" },
  { slug: "test-and-evaluate/develop-tests", outputPath: "evaluation/develop-tests.md", title: "Develop Tests", description: "Build test suites" },
  { slug: "test-and-evaluate/eval-tool", outputPath: "evaluation/eval-tool.md", title: "Eval Tool", description: "Use the evaluation tool" },
  { slug: "test-and-evaluate/strengthen-guardrails/reduce-hallucinations", outputPath: "guardrails/reduce-hallucinations.md", title: "Reduce Hallucinations", description: "Minimize false information" },
  { slug: "test-and-evaluate/strengthen-guardrails/increase-consistency", outputPath: "guardrails/increase-consistency.md", title: "Increase Consistency", description: "Improve output consistency" },
  { slug: "test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks", outputPath: "guardrails/mitigate-jailbreaks.md", title: "Mitigate Jailbreaks", description: "Prevent prompt injection" },
  { slug: "test-and-evaluate/strengthen-guardrails/reduce-latency", outputPath: "guardrails/reduce-latency.md", title: "Reduce Latency", description: "Optimize response time" },

  // API Reference
  { slug: "api/overview", outputPath: "api/overview.md", title: "API Overview", description: "API reference overview" },
  { slug: "api/client-sdks", outputPath: "api/client-sdks.md", title: "Client SDKs", description: "Official SDK libraries" },
  { slug: "api/errors", outputPath: "api/errors.md", title: "Errors", description: "Error codes and handling" },
  { slug: "api/rate-limits", outputPath: "api/rate-limits.md", title: "Rate Limits", description: "API rate limits" },
  { slug: "api/versioning", outputPath: "api/versioning.md", title: "Versioning", description: "API versioning" },
  { slug: "api/openai-sdk", outputPath: "api/openai-sdk.md", title: "OpenAI SDK Compatibility", description: "Use OpenAI SDK with Claude" },

  // Cloud Providers
  { slug: "build-with-claude/claude-on-amazon-bedrock", outputPath: "cloud/amazon-bedrock.md", title: "Amazon Bedrock", description: "Claude on AWS Bedrock" },
  { slug: "build-with-claude/claude-on-vertex-ai", outputPath: "cloud/vertex-ai.md", title: "Google Vertex AI", description: "Claude on Google Cloud" },
  { slug: "build-with-claude/claude-in-microsoft-foundry", outputPath: "cloud/microsoft-foundry.md", title: "Microsoft Foundry", description: "Claude on Azure" },
];

interface ManifestEntry {
  slug: string;
  title: string;
  description: string;
  hash: string;
  lastUpdated: string;
  sourceUrl: string;
}

interface Manifest {
  lastSync: string;
  baseUrl: string;
  files: Record<string, ManifestEntry>;
}

async function loadManifest(): Promise<Manifest> {
  if (existsSync(MANIFEST_FILE)) {
    try {
      const content = await readFile(MANIFEST_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      console.warn("Failed to load manifest, starting fresh");
    }
  }
  return { lastSync: "", baseUrl: BASE_URL, files: {} };
}

async function saveManifest(manifest: Manifest): Promise<void> {
  manifest.lastSync = new Date().toISOString();
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function fetchDoc(slug: string): Promise<string | null> {
  const url = `${BASE_URL}/${slug}.md`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AI-Docs-Plugin/1.0",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      console.error(`  Failed to fetch ${slug}: ${response.status}`);
      return null;
    }

    const content = await response.text();

    // Validate it's markdown
    if (content.startsWith("<!DOCTYPE") || content.includes("<html")) {
      console.error(`  ${slug}: Received HTML instead of markdown`);
      return null;
    }

    if (content.length < 50) {
      console.error(`  ${slug}: Content too short`);
      return null;
    }

    return content;
  } catch (error) {
    console.error(`  Error fetching ${slug}:`, error);
    return null;
  }
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("Claude API Documentation Sync");
  console.log("=============================");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Source: ${BASE_URL}`);
  console.log(`Target: ${RESOURCES_DIR}`);
  console.log();

  // Ensure resources directory and subdirectories exist
  if (!isDryRun) {
    const subdirs = [
      "models", "features", "prompting", "tools", "skills",
      "mcp", "agent-sdk", "evaluation", "guardrails", "api", "cloud"
    ];
    await mkdir(RESOURCES_DIR, { recursive: true });
    for (const subdir of subdirs) {
      await mkdir(join(RESOURCES_DIR, subdir), { recursive: true });
    }
  }

  const manifest = await loadManifest();
  const newManifest: Manifest = {
    lastSync: "",
    baseUrl: BASE_URL,
    files: {},
  };

  let fetched = 0;
  let unchanged = 0;
  let failed = 0;

  for (const page of DOC_PAGES) {
    process.stdout.write(`Fetching ${page.slug}...`);

    const content = await fetchDoc(page.slug);

    if (!content) {
      failed++;
      continue;
    }

    const hash = hashContent(content);
    const oldEntry = manifest.files[page.outputPath];

    if (oldEntry && oldEntry.hash === hash) {
      console.log(" unchanged");
      unchanged++;
      newManifest.files[page.outputPath] = oldEntry;
    } else {
      console.log(oldEntry ? " updated" : " new");
      fetched++;

      if (!isDryRun) {
        const filePath = join(RESOURCES_DIR, page.outputPath);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, content);
      }

      newManifest.files[page.outputPath] = {
        slug: page.slug,
        title: page.title,
        description: page.description,
        hash,
        lastUpdated: new Date().toISOString(),
        sourceUrl: `${BASE_URL}/${page.slug}`,
      };
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  if (!isDryRun) {
    await saveManifest(newManifest);
  }

  console.log();
  console.log("Summary");
  console.log("-------");
  console.log(`Fetched/Updated: ${fetched}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${DOC_PAGES.length}`);
}

main().catch(console.error);
