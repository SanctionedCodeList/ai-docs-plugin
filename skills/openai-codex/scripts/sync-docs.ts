#!/usr/bin/env bun
/**
 * Sync OpenAI Codex CLI documentation from GitHub repository
 *
 * Source: https://github.com/openai/codex
 *
 * Usage:
 *   bun run scripts/sync-docs.ts
 *   bun run scripts/sync-docs.ts --dry-run
 */

import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { $ } from "bun";

const REPO_URL = "https://github.com/openai/codex.git";
const RESOURCES_DIR = join(dirname(import.meta.dir), "resources");
const MANIFEST_FILE = join(RESOURCES_DIR, "manifest.json");
const TEMP_DIR = "/tmp/openai-codex-sync";

// Docs to copy from the repo
const DOC_PATHS = [
  // Root docs
  { src: "README.md", dest: "readme.md" },
  { src: "AGENTS.md", dest: "agents-md.md" },
  { src: "CHANGELOG.md", dest: "changelog.md" },

  // Main docs
  { src: "docs/getting-started.md", dest: "getting-started.md" },
  { src: "docs/install.md", dest: "install.md" },
  { src: "docs/authentication.md", dest: "authentication.md" },
  { src: "docs/config.md", dest: "config.md" },
  { src: "docs/example-config.md", dest: "example-config.md" },
  { src: "docs/sandbox.md", dest: "sandbox.md" },
  { src: "docs/execpolicy.md", dest: "execpolicy.md" },
  { src: "docs/exec.md", dest: "exec.md" },
  { src: "docs/advanced.md", dest: "advanced.md" },
  { src: "docs/prompts.md", dest: "prompts.md" },
  { src: "docs/skills.md", dest: "skills.md" },
  { src: "docs/slash_commands.md", dest: "slash-commands.md" },
  { src: "docs/agents_md.md", dest: "agents-md-guide.md" },
  { src: "docs/faq.md", dest: "faq.md" },
  { src: "docs/contributing.md", dest: "contributing.md" },
  { src: "docs/experimental.md", dest: "experimental.md" },
  { src: "docs/platform-sandboxing.md", dest: "platform-sandboxing.md" },
  { src: "docs/windows_sandbox_security.md", dest: "windows-sandbox.md" },
  { src: "docs/zdr.md", dest: "zero-data-retention.md" },

  // SDK docs
  { src: "sdk/typescript/README.md", dest: "sdk/typescript.md" },
];

interface ManifestEntry {
  src: string;
  dest: string;
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

  const result = await $`cd ${TEMP_DIR} && git rev-parse HEAD`.quiet();
  return result.text().trim();
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("OpenAI Codex CLI Documentation Sync");
  console.log("====================================");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Source: ${REPO_URL}`);
  console.log(`Target: ${RESOURCES_DIR}`);
  console.log();

  let commitHash: string;
  try {
    commitHash = await cloneOrPullRepo();
    console.log(`Source commit: ${commitHash.substring(0, 8)}`);
    console.log();
  } catch (error) {
    console.error("Failed to clone/update repository:", error);
    process.exit(1);
  }

  if (!isDryRun) {
    await mkdir(RESOURCES_DIR, { recursive: true });
    await mkdir(join(RESOURCES_DIR, "sdk"), { recursive: true });
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

  for (const doc of DOC_PATHS) {
    const sourcePath = join(TEMP_DIR, doc.src);
    const destPath = join(RESOURCES_DIR, doc.dest);

    process.stdout.write(`Processing ${doc.src}...`);

    if (!existsSync(sourcePath)) {
      console.log(" not found");
      failed++;
      continue;
    }

    try {
      const content = await readFile(sourcePath, "utf-8");
      const hash = hashContent(content);
      const oldEntry = manifest.files[doc.dest];

      if (oldEntry && oldEntry.hash === hash) {
        console.log(" unchanged");
        unchanged++;
        newManifest.files[doc.dest] = oldEntry;
      } else {
        console.log(oldEntry ? " updated" : " new");
        copied++;

        if (!isDryRun) {
          await mkdir(dirname(destPath), { recursive: true });
          await writeFile(destPath, content);
        }

        newManifest.files[doc.dest] = {
          src: doc.src,
          dest: doc.dest,
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
