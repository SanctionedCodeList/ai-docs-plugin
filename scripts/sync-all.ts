/**
 * Sync All Documentation
 *
 * Runs sync scripts for all documentation skills in parallel batches.
 *
 * Usage:
 *   bun run scripts/sync-all.ts
 *   bun run scripts/sync-all.ts --dry-run
 *   bun run scripts/sync-all.ts --skill=xai,fastmcp  # Specific skills only
 */

import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Ensure bun is in PATH
const BUN_PATH = join(homedir(), ".bun", "bin");
const PATH = `${BUN_PATH}:${process.env.PATH}`;
const ENV = { ...process.env, PATH };

const SKILLS_DIR = join(import.meta.dir, "..", "skills");

// Skills that have sync scripts (excludes skill-authoring which is a meta-guide)
const SYNCABLE_SKILLS = [
  "claude-api",
  "claude-code",
  "fastmcp",
  "gemini-cli",
  "gemini-dev",
  "gemini-imagen",
  "langchain",
  "langgraph",
  "openai-api",
  "openai-codex",
  "opencode",
  "xai",
];

interface SyncResult {
  skill: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function installDeps(skillDir: string): Promise<void> {
  const packageJson = join(skillDir, "package.json");
  if (!existsSync(packageJson)) return;

  const nodeModules = join(skillDir, "node_modules");
  if (existsSync(nodeModules)) return; // Already installed

  console.log(`  Installing dependencies...`);
  execSync("bun install", { cwd: skillDir, stdio: "pipe", env: ENV });
}

async function syncSkill(skill: string, dryRun: boolean): Promise<SyncResult> {
  const startTime = Date.now();
  const skillDir = join(SKILLS_DIR, skill);
  const syncScript = join(skillDir, "scripts", "sync-docs.ts");

  if (!existsSync(syncScript)) {
    return {
      skill,
      success: false,
      duration: 0,
      error: "No sync script found",
    };
  }

  try {
    // Install deps if needed
    await installDeps(skillDir);

    // Run sync script
    const args = ["run", "scripts/sync-docs.ts"];
    if (dryRun) args.push("--dry-run");

    return new Promise((resolve) => {
      const proc = spawn("bun", args, {
        cwd: skillDir,
        stdio: ["ignore", "pipe", "pipe"],
        env: ENV,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          resolve({ skill, success: true, duration });
        } else {
          resolve({
            skill,
            success: false,
            duration,
            error: stderr || stdout || `Exit code ${code}`,
          });
        }
      });

      proc.on("error", (err) => {
        resolve({
          skill,
          success: false,
          duration: Date.now() - startTime,
          error: err.message,
        });
      });
    });
  } catch (error) {
    return {
      skill,
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseArgs(): { dryRun: boolean; skills: string[] } {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const skillArg = args.find((a) => a.startsWith("--skill="));
  const skills = skillArg
    ? skillArg.replace("--skill=", "").split(",")
    : SYNCABLE_SKILLS;

  return { dryRun, skills };
}

async function main(): Promise<void> {
  const { dryRun, skills } = parseArgs();

  console.log("=".repeat(60));
  console.log("Documentation Sync - All Skills");
  console.log("=".repeat(60));

  if (dryRun) {
    console.log("DRY RUN MODE\n");
  }

  console.log(`Syncing ${skills.length} skills...\n`);

  const results: SyncResult[] = [];

  // Run syncs sequentially to avoid overwhelming resources
  for (const skill of skills) {
    console.log(`[${skill}] Starting sync...`);
    const result = await syncSkill(skill, dryRun);
    results.push(result);

    if (result.success) {
      console.log(`[${skill}] ✓ Complete (${(result.duration / 1000).toFixed(1)}s)\n`);
    } else {
      console.log(`[${skill}] ✗ Failed: ${result.error}\n`);
    }
  }

  // Summary
  console.log("=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\nSuccessful: ${successful.length}/${results.length}`);

  if (successful.length > 0) {
    console.log("\n  ✓ " + successful.map((r) => r.skill).join("\n  ✓ "));
  }

  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.length}`);
    for (const f of failed) {
      console.log(`\n  ✗ ${f.skill}: ${f.error}`);
    }
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\nTotal time: ${(totalDuration / 1000).toFixed(1)}s`);

  // Exit with error if any failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
