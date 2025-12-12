#!/usr/bin/env bun
/**
 * Sync Gemini CLI documentation from GitHub repository
 *
 * Source: https://github.com/google-gemini/gemini-cli/tree/main/docs
 *
 * Usage:
 *   bun run scripts/sync-docs.ts
 *   bun run scripts/sync-docs.ts --dry-run
 */

import { mkdir, writeFile, readFile, readdir, cp, rm } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, relative } from "path";
import { createHash } from "crypto";
import { $ } from "bun";

const REPO_URL = "https://github.com/google-gemini/gemini-cli.git";
const RESOURCES_DIR = join(dirname(import.meta.dir), "resources");
const MANIFEST_FILE = join(RESOURCES_DIR, "manifest.json");
const TEMP_DIR = "/tmp/gemini-cli-sync";

// Docs to copy (relative to docs/ in repo)
const DOC_PATHS = [
  // Root docs
  "index.md",
  "architecture.md",
  "faq.md",
  "troubleshooting.md",
  "quota-and-pricing.md",
  "releases.md",
  "tos-privacy.md",

  // Get Started
  "get-started/index.md",
  "get-started/installation.md",
  "get-started/authentication.md",
  "get-started/configuration.md",
  "get-started/gemini-3.md",
  "get-started/examples.md",

  // CLI
  "cli/index.md",
  "cli/commands.md",
  "cli/settings.md",
  "cli/model.md",
  "cli/sandbox.md",
  "cli/custom-commands.md",
  "cli/keyboard-shortcuts.md",
  "cli/checkpointing.md",
  "cli/trusted-folders.md",
  "cli/themes.md",
  "cli/telemetry.md",
  "cli/token-caching.md",
  "cli/headless.md",
  "cli/enterprise.md",
  "cli/uninstall.md",
  "cli/gemini-md.md",

  // Core
  "core/index.md",
  "core/tools-api.md",
  "core/policy-engine.md",
  "core/memport.md",

  // Tools
  "tools/index.md",
  "tools/file-system.md",
  "tools/shell.md",
  "tools/web-fetch.md",
  "tools/web-search.md",
  "tools/memory.md",
  "tools/todos.md",
  "tools/mcp-server.md",

  // Extensions
  "extensions/index.md",
  "extensions/getting-started-extensions.md",
  "extensions/extension-releasing.md",

  // Hooks
  "hooks/index.md",
  "hooks/writing-hooks.md",
  "hooks/best-practices.md",

  // IDE Integration
  "ide-integration/index.md",
  "ide-integration/ide-companion-spec.md",
];

interface ManifestEntry {
  path: string;
  hash: string;
  lastUpdated: string;
}

interface Manifest {
  lastSync: string;
  sourceRepo: string;
  sourceCommit: string;
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
  return { lastSync: "", sourceRepo: REPO_URL, sourceCommit: "", files: {} };
}

async function saveManifest(manifest: Manifest): Promise<void> {
  manifest.lastSync = new Date().toISOString();
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function cloneOrPullRepo(): Promise<string> {
  if (existsSync(TEMP_DIR)) {
    console.log("Updating existing clone...");
    await $`cd ${TEMP_DIR} && git fetch origin main && git reset --hard origin/main`.quiet();
  } else {
    console.log("Cloning repository...");
    await $`git clone --depth 1 ${REPO_URL} ${TEMP_DIR}`.quiet();
  }

  // Get current commit hash
  const result = await $`cd ${TEMP_DIR} && git rev-parse HEAD`.quiet();
  return result.text().trim();
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("Gemini CLI Documentation Sync");
  console.log("=============================");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Source: ${REPO_URL}`);
  console.log(`Target: ${RESOURCES_DIR}`);
  console.log();

  // Clone or update repo
  let commitHash: string;
  try {
    commitHash = await cloneOrPullRepo();
    console.log(`Source commit: ${commitHash.substring(0, 8)}`);
    console.log();
  } catch (error) {
    console.error("Failed to clone/update repository:", error);
    process.exit(1);
  }

  // Ensure resources directory exists
  if (!isDryRun) {
    await mkdir(RESOURCES_DIR, { recursive: true });
  }

  const manifest = await loadManifest();
  const newManifest: Manifest = {
    lastSync: "",
    sourceRepo: REPO_URL,
    sourceCommit: commitHash,
    files: {},
  };

  let copied = 0;
  let unchanged = 0;
  let failed = 0;

  for (const docPath of DOC_PATHS) {
    const sourcePath = join(TEMP_DIR, "docs", docPath);
    const destPath = join(RESOURCES_DIR, docPath);

    process.stdout.write(`Processing ${docPath}...`);

    if (!existsSync(sourcePath)) {
      console.log(" not found");
      failed++;
      continue;
    }

    try {
      const content = await readFile(sourcePath, "utf-8");
      const hash = hashContent(content);
      const oldEntry = manifest.files[docPath];

      if (oldEntry && oldEntry.hash === hash) {
        console.log(" unchanged");
        unchanged++;
        newManifest.files[docPath] = oldEntry;
      } else {
        console.log(oldEntry ? " updated" : " new");
        copied++;

        if (!isDryRun) {
          await mkdir(dirname(destPath), { recursive: true });
          await writeFile(destPath, content);
        }

        newManifest.files[docPath] = {
          path: docPath,
          hash,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.log(` error: ${error}`);
      failed++;
    }
  }

  if (!isDryRun) {
    await saveManifest(newManifest);
  }

  console.log();
  console.log("Summary");
  console.log("-------");
  console.log(`Copied/Updated: ${copied}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Failed/Missing: ${failed}`);
  console.log(`Total: ${DOC_PATHS.length}`);
  console.log(`Source commit: ${commitHash.substring(0, 8)}`);
}

main().catch(console.error);
