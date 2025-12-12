#!/usr/bin/env bun
/**
 * Sync OpenAI API documentation from GitHub repositories
 *
 * Sources:
 * - https://github.com/openai/openai-python (SDK reference)
 * - https://github.com/openai/openai-cookbook (examples)
 *
 * Note: platform.openai.com has bot protection, so we use GitHub sources instead.
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

const PYTHON_SDK_URL = "https://github.com/openai/openai-python.git";
const COOKBOOK_URL = "https://github.com/openai/openai-cookbook.git";
const RESOURCES_DIR = join(dirname(import.meta.dir), "resources");
const MANIFEST_FILE = join(RESOURCES_DIR, "manifest.json");
const SDK_TEMP = "/tmp/openai-python-sync";
const COOKBOOK_TEMP = "/tmp/openai-cookbook-sync";

// Docs to copy
const SDK_DOCS = [
  { src: "README.md", dest: "sdk/python-readme.md" },
  { src: "api.md", dest: "sdk/python-api.md" },
];

// Key cookbook articles (notebooks converted to markdown summaries would be ideal,
// but for now we grab the main guides)
const COOKBOOK_DOCS = [
  { src: "README.md", dest: "cookbook/readme.md" },
  { src: "AGENTS.md", dest: "cookbook/agents.md" },
];

interface ManifestEntry {
  src: string;
  dest: string;
  hash: string;
  lastUpdated: string;
  source: string;
}

interface Manifest {
  lastSync: string;
  sources: { sdk: string; cookbook: string };
  commits: { sdk: string; cookbook: string };
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
  return {
    lastSync: "",
    sources: { sdk: PYTHON_SDK_URL, cookbook: COOKBOOK_URL },
    commits: { sdk: "", cookbook: "" },
    files: {},
  };
}

async function saveManifest(manifest: Manifest): Promise<void> {
  manifest.lastSync = new Date().toISOString();
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function cloneOrPull(url: string, dir: string): Promise<string> {
  if (existsSync(dir)) {
    await $`cd ${dir} && git fetch origin main && git reset --hard origin/main`.quiet();
  } else {
    await $`git clone --depth 1 ${url} ${dir}`.quiet();
  }
  const result = await $`cd ${dir} && git rev-parse HEAD`.quiet();
  return result.text().trim();
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("OpenAI API Documentation Sync");
  console.log("=============================");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Target: ${RESOURCES_DIR}`);
  console.log();

  // Clone/update repos
  console.log("Syncing openai-python SDK...");
  let sdkCommit: string;
  try {
    sdkCommit = await cloneOrPull(PYTHON_SDK_URL, SDK_TEMP);
    console.log(`SDK commit: ${sdkCommit.substring(0, 8)}`);
  } catch (error) {
    console.error("Failed to sync SDK:", error);
    process.exit(1);
  }

  console.log("\nSyncing openai-cookbook...");
  let cookbookCommit: string;
  try {
    cookbookCommit = await cloneOrPull(COOKBOOK_URL, COOKBOOK_TEMP);
    console.log(`Cookbook commit: ${cookbookCommit.substring(0, 8)}`);
  } catch (error) {
    console.error("Failed to sync cookbook:", error);
    process.exit(1);
  }

  console.log();

  if (!isDryRun) {
    await mkdir(RESOURCES_DIR, { recursive: true });
    await mkdir(join(RESOURCES_DIR, "sdk"), { recursive: true });
    await mkdir(join(RESOURCES_DIR, "cookbook"), { recursive: true });
  }

  const manifest = await loadManifest();
  const newManifest: Manifest = {
    lastSync: "",
    sources: { sdk: PYTHON_SDK_URL, cookbook: COOKBOOK_URL },
    commits: { sdk: sdkCommit, cookbook: cookbookCommit },
    files: {},
  };

  let copied = 0;
  let unchanged = 0;
  let failed = 0;

  // Process SDK docs
  for (const doc of SDK_DOCS) {
    const sourcePath = join(SDK_TEMP, doc.src);
    const destPath = join(RESOURCES_DIR, doc.dest);

    process.stdout.write(`Processing SDK/${doc.src}...`);

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
          source: "openai-python",
        };
      }
    } catch (error) {
      console.log(` error: ${error}`);
      failed++;
    }
  }

  // Process cookbook docs
  for (const doc of COOKBOOK_DOCS) {
    const sourcePath = join(COOKBOOK_TEMP, doc.src);
    const destPath = join(RESOURCES_DIR, doc.dest);

    process.stdout.write(`Processing cookbook/${doc.src}...`);

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
          source: "openai-cookbook",
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
  console.log(`Total: ${SDK_DOCS.length + COOKBOOK_DOCS.length}`);
}

main().catch(console.error);
