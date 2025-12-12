#!/usr/bin/env bun
/**
 * Sync Gemini API documentation to local markdown files.
 *
 * Usage:
 *   bun run sync          # Sync all docs
 *   bun run sync:dry      # Preview without writing
 *
 * Fetches official Google Gemini API documentation and converts to markdown
 * for use as skill resources.
 */

import { parseArgs } from "util";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import TurndownService from "turndown";
import { parseHTML } from "linkedom";

interface DocPage {
  url: string;
  outputPath: string;
  title: string;
}

// Documentation pages to sync (excluding generation capabilities)
const DOC_PAGES: DocPage[] = [
  // Core capabilities
  {
    url: "https://ai.google.dev/gemini-api/docs/models",
    outputPath: "models.md",
    title: "Gemini Models Overview",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/text-generation",
    outputPath: "text-generation.md",
    title: "Text Generation",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/structured-output",
    outputPath: "structured-outputs.md",
    title: "Structured Outputs",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/function-calling",
    outputPath: "function-calling.md",
    title: "Function Calling",
  },
  // Multimodal inputs
  {
    url: "https://ai.google.dev/gemini-api/docs/image-understanding",
    outputPath: "multimodal/images.md",
    title: "Image Understanding",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/document-processing",
    outputPath: "multimodal/documents.md",
    title: "Document Processing",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/audio",
    outputPath: "multimodal/audio.md",
    title: "Audio Understanding",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/video-understanding",
    outputPath: "multimodal/video.md",
    title: "Video Understanding",
  },
  // Infrastructure
  {
    url: "https://ai.google.dev/gemini-api/docs/files",
    outputPath: "files-api.md",
    title: "Files API",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/caching",
    outputPath: "context-caching.md",
    title: "Context Caching",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/tokens",
    outputPath: "token-counting.md",
    title: "Token Counting",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/long-context",
    outputPath: "long-context.md",
    title: "Long Context",
  },
  // Tools and agents
  {
    url: "https://ai.google.dev/gemini-api/docs/code-execution",
    outputPath: "code-execution.md",
    title: "Code Execution",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/url-context",
    outputPath: "url-context.md",
    title: "URL Context",
  },
  {
    url: "https://ai.google.dev/gemini-api/docs/grounding",
    outputPath: "search-grounding.md",
    title: "Google Search Grounding",
  },
];

function extractMainContent(html: string): string {
  const { document } = parseHTML(html);

  // Try to find the main content area
  const selectors = [
    "article",
    "main",
    '[role="main"]',
    ".devsite-article-body",
    ".devsite-content",
  ];

  let mainContent: Element | null = null;
  for (const selector of selectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) break;
  }

  if (!mainContent) {
    mainContent = document.body;
  }

  // Remove unwanted elements
  const removeSelectors = [
    "nav",
    "header",
    "footer",
    "script",
    "style",
    ".devsite-nav",
    ".devsite-header",
    ".devsite-footer",
    ".devsite-toc",
    ".devsite-feedback",
    ".devsite-banner",
    "aside",
    '[role="navigation"]',
    ".nocontent",
    ".hide-from-toc",
  ];

  for (const selector of removeSelectors) {
    mainContent.querySelectorAll(selector).forEach((el) => el.remove());
  }

  return mainContent.innerHTML;
}

function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Custom rule for code blocks with language
  turndown.addRule("fencedCodeBlock", {
    filter: (node) => {
      return (
        node.nodeName === "PRE" &&
        node.firstChild &&
        node.firstChild.nodeName === "CODE"
      );
    },
    replacement: (_content, node) => {
      const codeNode = node.firstChild as Element;
      const className = codeNode.getAttribute("class") || "";
      const langMatch = className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : "python";
      const code = codeNode.textContent || "";
      return `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    },
  });

  return turndown;
}

function cleanMarkdown(markdown: string, title: string, url: string): string {
  // Collapse multiple blank lines
  let cleaned = markdown.replace(/\n{3,}/g, "\n\n");

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Add frontmatter
  const now = new Date().toISOString().split("T")[0];
  const frontmatter = `---
title: "${title}"
source: "${url}"
synced: "${now}"
---

`;

  return frontmatter + cleaned;
}

async function fetchPage(page: DocPage): Promise<{ page: DocPage; html: string | null }> {
  try {
    const response = await fetch(page.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GeminiDocSync/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`  ✗ Failed to fetch ${page.url}: ${response.status}`);
      return { page, html: null };
    }

    const html = await response.text();
    return { page, html };
  } catch (error) {
    console.error(`  ✗ Failed to fetch ${page.url}: ${error}`);
    return { page, html: null };
  }
}

async function syncDocs(outputDir: string, dryRun: boolean): Promise<void> {
  console.log(`Syncing ${DOC_PAGES.length} documentation pages to ${outputDir}\n`);

  if (dryRun) {
    console.log("(dry run - no files will be written)\n");
  }

  // Create output directories
  if (!dryRun) {
    await mkdir(outputDir, { recursive: true });
    await mkdir(join(outputDir, "multimodal"), { recursive: true });
  }

  const turndown = createTurndownService();
  let successCount = 0;

  // Fetch pages with concurrency limit
  const concurrency = 5;
  const results: { page: DocPage; html: string | null }[] = [];

  for (let i = 0; i < DOC_PAGES.length; i += concurrency) {
    const batch = DOC_PAGES.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fetchPage));
    results.push(...batchResults);
  }

  // Process results
  for (const { page, html } of results) {
    if (!html) continue;

    try {
      // Extract main content
      const contentHtml = extractMainContent(html);

      // Convert to markdown
      const markdown = turndown.turndown(contentHtml);

      // Clean up
      const cleaned = cleanMarkdown(markdown, page.title, page.url);

      // Write to file
      const outputPath = join(outputDir, page.outputPath);

      if (dryRun) {
        console.log(`  ✓ ${page.outputPath} (${cleaned.length} bytes)`);
      } else {
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, cleaned);
        console.log(`  ✓ ${page.outputPath}`);
      }

      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to process ${page.url}: ${error}`);
    }
  }

  console.log(`\nSynced ${successCount}/${DOC_PAGES.length} pages`);
}

// Main
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    "output-dir": {
      type: "string",
      default: join(import.meta.dir, "..", "resources"),
    },
    "dry-run": {
      type: "boolean",
      default: false,
    },
  },
});

await syncDocs(values["output-dir"]!, values["dry-run"]!);
