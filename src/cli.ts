#!/usr/bin/env node

import minimist from "minimist";
import * as path from "path";
import { MarkrealmServer } from "./server";
import { buildContentIndex } from "./content/loader";
import { checkInternalLinks, checkExternalLinks } from "./content/links";
import { loadConfig } from "./config";
import { printLinkCheckSummary } from "./content/links";
import { buildStaticSite } from "./build";

interface CliArgs {
  _: string[];
  dir?: string;
  port?: number;
  out?: string;
  "no-strict"?: boolean;
  help?: boolean;
  version?: boolean;
  h?: boolean;
  v?: boolean;
}

const DEFAULT_PORT = 5173;
const DEFAULT_DIR = "./docs";

function printHelp(): void {
  console.log(`
markrealm - A Realm competitor prototype

USAGE:
  markrealm <command> [options]

COMMANDS:
  dev                 Start development server with live reload
  build               Build static site
  check               Check links in documentation

OPTIONS:
  --dir <path>        Documentation directory (default: ./docs)
  --port <number>     Port for dev server (default: 5173)
  --out <path>        Output directory for build (default: dist)
  --no-strict         Don't fail on broken links
  --help, -h          Show this help message
  --version, -v       Show version

EXAMPLES:
  markrealm dev --dir ./docs --port 3000
  markrealm build --dir ./docs --out ./build
  markrealm check --dir ./docs
`);
}

function printVersion(): void {
  const packageJson = require("../package.json");
  console.log(`markrealm v${packageJson.version}`);
}

async function devCommand(args: CliArgs): Promise<void> {
  const docsDir = args.dir || process.env.DOCS_DIR || DEFAULT_DIR;
  const port = args.port || DEFAULT_PORT;

  console.log("Starting markrealm development server...");
  console.log(`Docs directory: ${path.resolve(docsDir)}`);
  console.log(`Port: ${port}`);

  // Initialize dev server with resolved configuration
  const server = new MarkrealmServer({
    port,
    docsDir: path.resolve(docsDir),
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down server...");
    server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down server...");
    server.stop();
    process.exit(0);
  });

  await server.start();
}

async function buildCommand(args: CliArgs): Promise<void> {
  const docsDir = args.dir || process.env.DOCS_DIR || DEFAULT_DIR;
  const outDir = args.out || "dist";
  const strict = !args["no-strict"];

  console.log("Building static site...");
  console.log(`Source: ${path.resolve(docsDir)}`);
  console.log(`Output: ${path.resolve(outDir)}`);

  try {
    await buildStaticSite({
      dir: path.resolve(docsDir),
      out: path.resolve(outDir),
      strict,
    });
    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

async function checkCommand(args: CliArgs): Promise<void> {
  const docsDir = args.dir || process.env.DOCS_DIR || DEFAULT_DIR;
  const strict = !args["no-strict"];

  console.log("Checking links...");
  console.log(`Docs directory: ${path.resolve(docsDir)}`);

  try {
    const config = loadConfig(docsDir);
    const contentIndex = await buildContentIndex(docsDir, config.ignore);

    const result = await checkInternalLinks(contentIndex);
    printLinkCheckSummary(result);

    if (config.linkcheck.enabled && result.external.length > 0) {
      console.log("\n🔗 Checking external links...");
      const externalUrls = result.external.map((link: any) => link.href);

      // Check external URLs with timeout to prevent hanging
      const externalResult = await checkExternalLinks(
        externalUrls,
        config.linkcheck.externalTimeoutMs
      );

      console.log(`Valid external links: ${externalResult.valid.length}`);
      console.log(`Broken external links: ${externalResult.broken.length}`);

      if (externalResult.broken.length > 0) {
        console.log("\nBroken External Links:");
        externalResult.broken.forEach((url: any) => {
          console.log(`  - ${url}`);
        });
      }
    }
    // Handle strict mode: fail on broken links or just warn
    const totalBroken = result.broken.length;
    if (totalBroken > 0 && strict) {
      console.log(
        `\nFound ${totalBroken} broken links. Use --no-strict to ignore.`
      );
      process.exit(1);
    } else if (totalBroken > 0) {
      console.log(
        `\nFound ${totalBroken} broken links (ignored due to --no-strict).`
      );
    } else {
      console.log("\nAll links are valid!");
    }
  } catch (error) {
    console.error("Link check failed:", error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = minimist(process.argv.slice(2)) as CliArgs;
  const command = args._[0];

  // Handle help flags
  if (args.help || args.h) {
    printHelp();
    return;
  }

  // Handle version flags
  if (args.version || args.v) {
    printVersion();
    return;
  }

  // Handle no command specified
  if (!command) {
    console.error("❌ No command specified");
    printHelp();
    process.exit(1);
  }

  // Route to appropriate command handler
  switch (command) {
    case "dev":
      await devCommand(args);
      break;
    case "build":
      await buildCommand(args);
      break;
    case "check":
      await checkCommand(args);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

// Handle uncaught synchronous exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled Promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run main() only if this file is executed directly with `node file.js`.
// This prevents auto-execution when the file is imported (e.g. in tests),
// which is the standard Node.js idiom for building CLI tools.
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
