#!/usr/bin/env bun
/**
 * Sync Claude Code documentation from code.claude.com
 *
 * Claude's docs are available as raw markdown at URLs like:
 * https://code.claude.com/docs/en/overview.md
 *
 * Usage:
 *   bun run scripts/sync-docs.ts
 *   bun run scripts/sync-docs.ts --dry-run
 */

import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";

const BASE_URL = "https://code.claude.com/docs/en";
const RESOURCES_DIR = join(dirname(import.meta.dir), "resources");
const MANIFEST_FILE = join(RESOURCES_DIR, "manifest.json");

interface DocPage {
  slug: string;
  title: string;
  description: string;
}

// Documentation pages to fetch - organized by category
const DOC_PAGES: DocPage[] = [
  // Getting Started
  { slug: "overview", title: "Overview", description: "What Claude Code is and key capabilities" },
  { slug: "quickstart", title: "Quickstart", description: "Getting started in 5 minutes" },
  { slug: "setup", title: "Setup", description: "Installation and initial configuration" },

  // Core Features
  { slug: "memory", title: "Memory & CLAUDE.md", description: "Project memory, CLAUDE.md files, and context management" },
  { slug: "common-workflows", title: "Common Workflows", description: "Typical usage patterns and workflows" },
  { slug: "interactive-mode", title: "Interactive Mode", description: "Using Claude Code interactively" },
  { slug: "headless", title: "Headless Mode", description: "Running Claude Code in CI/CD and automation" },

  // Configuration
  { slug: "settings", title: "Settings", description: "All configuration options and settings" },
  { slug: "model-config", title: "Model Configuration", description: "Selecting and configuring models" },
  { slug: "terminal-config", title: "Terminal Configuration", description: "Terminal and shell setup" },
  { slug: "network-config", title: "Network Configuration", description: "Proxy and network settings" },

  // Extensions & Customization
  { slug: "hooks", title: "Hooks", description: "Lifecycle hooks for customization" },
  { slug: "hooks-guide", title: "Hooks Guide", description: "Detailed guide to implementing hooks" },
  { slug: "mcp", title: "MCP Servers", description: "Model Context Protocol server integration" },
  { slug: "skills", title: "Skills", description: "Creating and using skills" },
  { slug: "slash-commands", title: "Slash Commands", description: "Custom slash commands" },
  { slug: "plugins", title: "Plugins", description: "Plugin system overview" },
  { slug: "plugins-reference", title: "Plugins Reference", description: "Plugin API reference" },
  { slug: "plugin-marketplaces", title: "Plugin Marketplaces", description: "Discovering and installing plugins" },

  // IDE Integration
  { slug: "vs-code", title: "VS Code", description: "VS Code integration" },
  { slug: "jetbrains", title: "JetBrains", description: "JetBrains IDE integration" },
  { slug: "desktop", title: "Desktop App", description: "Claude Desktop integration" },

  // CI/CD & Automation
  { slug: "github-actions", title: "GitHub Actions", description: "Using Claude Code in GitHub Actions" },
  { slug: "gitlab-ci-cd", title: "GitLab CI/CD", description: "Using Claude Code in GitLab pipelines" },
  { slug: "sub-agents", title: "Sub-agents", description: "Spawning and managing sub-agents" },

  // Cloud Providers
  { slug: "amazon-bedrock", title: "Amazon Bedrock", description: "Using Claude via AWS Bedrock" },
  { slug: "google-vertex-ai", title: "Google Vertex AI", description: "Using Claude via Google Cloud" },
  { slug: "microsoft-foundry", title: "Microsoft Foundry", description: "Using Claude via Azure" },

  // Operations
  { slug: "costs", title: "Costs", description: "Understanding and managing costs" },
  { slug: "monitoring-usage", title: "Monitoring Usage", description: "Tracking usage and analytics" },
  { slug: "analytics", title: "Analytics", description: "Analytics and telemetry" },
  { slug: "troubleshooting", title: "Troubleshooting", description: "Common issues and solutions" },

  // Security & Compliance
  { slug: "security", title: "Security", description: "Security model and best practices" },
  { slug: "sandboxing", title: "Sandboxing", description: "Command sandboxing and safety" },
  { slug: "data-usage", title: "Data Usage", description: "How your data is handled" },
  { slug: "iam", title: "IAM", description: "Identity and access management" },
  { slug: "legal-and-compliance", title: "Legal & Compliance", description: "Compliance and legal information" },

  // Reference
  { slug: "cli-reference", title: "CLI Reference", description: "Complete CLI command reference" },
  { slug: "output-styles", title: "Output Styles", description: "Controlling output formatting" },
  { slug: "statusline", title: "Status Line", description: "Status line configuration" },
  { slug: "checkpointing", title: "Checkpointing", description: "Conversation checkpoints and recovery" },
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

  console.log("Claude Code Documentation Sync");
  console.log("==============================");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Source: ${BASE_URL}`);
  console.log(`Target: ${RESOURCES_DIR}`);
  console.log();

  // Ensure resources directory exists
  if (!isDryRun) {
    await mkdir(RESOURCES_DIR, { recursive: true });
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
    const oldEntry = manifest.files[page.slug];

    if (oldEntry && oldEntry.hash === hash) {
      console.log(" unchanged");
      unchanged++;
      newManifest.files[page.slug] = oldEntry;
    } else {
      console.log(oldEntry ? " updated" : " new");
      fetched++;

      if (!isDryRun) {
        const filePath = join(RESOURCES_DIR, `${page.slug}.md`);
        await writeFile(filePath, content);
      }

      newManifest.files[page.slug] = {
        slug: page.slug,
        title: page.title,
        description: page.description,
        hash,
        lastUpdated: new Date().toISOString(),
        sourceUrl: `${BASE_URL}/${page.slug}`,
      };
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Fetch changelog from GitHub
  process.stdout.write("Fetching changelog...");
  try {
    const changelogUrl = "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md";
    const response = await fetch(changelogUrl);
    if (response.ok) {
      const content = await response.text();
      const hash = hashContent(content);
      const oldEntry = manifest.files["changelog"];

      if (oldEntry && oldEntry.hash === hash) {
        console.log(" unchanged");
        unchanged++;
        newManifest.files["changelog"] = oldEntry;
      } else {
        console.log(oldEntry ? " updated" : " new");
        fetched++;

        if (!isDryRun) {
          await writeFile(join(RESOURCES_DIR, "changelog.md"), content);
        }

        newManifest.files["changelog"] = {
          slug: "changelog",
          title: "Changelog",
          description: "Release notes and version history",
          hash,
          lastUpdated: new Date().toISOString(),
          sourceUrl: changelogUrl,
        };
      }
    }
  } catch (error) {
    console.log(" failed");
    failed++;
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
  console.log(`Total: ${DOC_PAGES.length + 1}`);
}

main().catch(console.error);
