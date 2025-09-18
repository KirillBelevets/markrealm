import * as fs from "fs";
import * as path from "path";
import ejs from "ejs";
import { ContentIndex, DocMeta, BuildOptions } from "./content/types";
import { buildContentIndex } from "./content/loader";
import { generateSidebar } from "./content/sidebar";
import {
  checkInternalLinks,
  checkExternalLinks,
  printLinkCheckSummary,
} from "./content/links";
import { loadConfig } from "./config";

export async function buildStaticSite(options: BuildOptions): Promise<void> {
  const { dir, out, strict = true } = options;

  console.log("Loading configuration...");
  const config = loadConfig(dir);

  console.log("Building content index...");
  const contentIndex = await buildContentIndex(dir, config.ignore);
  console.log(`Indexed ${contentIndex.byRoute.size} documents`);

  console.log("Checking links...");
  const linkResult = await checkInternalLinks(contentIndex);
  printLinkCheckSummary(linkResult);

  if (config.linkcheck.enabled && linkResult.external.length > 0) {
    console.log("Checking external links...");
    const externalUrls = linkResult.external.map((link) => link.href);
    const externalResult = await checkExternalLinks(
      externalUrls,
      config.linkcheck.externalTimeoutMs
    );

    console.log(`Valid external links: ${externalResult.valid.length}`);
    console.log(`Broken external links: ${externalResult.broken.length}`);

    if (externalResult.broken.length > 0) {
      console.log("\nBroken External Links:");
      externalResult.broken.forEach((url) => {
        console.log(`  - ${url}`);
      });
    }
  }

  const totalBroken = linkResult.broken.length;
  if (totalBroken > 0 && strict) {
    console.log(`\nFound ${totalBroken} broken links. Build failed.`);
    process.exit(1);
  } else if (totalBroken > 0) {
    console.log(
      `\nFound ${totalBroken} broken links (ignored due to --no-strict).`
    );
  }

  console.log("Building static files...");

  // Create output directory
  if (fs.existsSync(out)) {
    fs.rmSync(out, { recursive: true });
  }
  fs.mkdirSync(out, { recursive: true });

  // Copy static assets
  await copyStaticAssets(out);

  // Generate sidebar
  const sidebar = generateSidebar(contentIndex, config.sidebar.order);
  const sidebarHtml = renderSidebar(sidebar);

  // Render each page
  for (const [route, doc] of contentIndex.byRoute) {
    await renderPage(doc, sidebarHtml, config, out);
  }

  // Generate 404 page
  await generate404Page(config, sidebarHtml, out);

  console.log("Static site built successfully!");
  console.log(`Output directory: ${out}`);
}

async function copyStaticAssets(outDir: string): Promise<void> {
  const publicDir = path.join(__dirname, "web", "public");
  const outPublicDir = path.join(outDir);

  // Copy CSS
  const cssSource = path.join(publicDir, "styles.css");
  const cssDest = path.join(outPublicDir, "styles.css");
  fs.copyFileSync(cssSource, cssDest);

  console.log("Copied static assets");
}

async function renderPage(
  doc: DocMeta,
  sidebarHtml: string,
  config: any,
  outDir: string
): Promise<void> {
  const html = await renderPageTemplate(doc, sidebarHtml, config, false);

  // Determine output path
  let outputPath: string;
  if (doc.route === "/") {
    outputPath = path.join(outDir, "index.html");
  } else {
    const routePath = doc.route.substring(1); // Remove leading slash
    outputPath = path.join(outDir, routePath, "index.html");
  }

  // Create directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  // Write file
  fs.writeFileSync(outputPath, html);
  console.log(`Generated: ${path.relative(outDir, outputPath)}`);
}

async function renderPageTemplate(
  doc: DocMeta,
  sidebarHtml: string,
  config: any,
  isDev: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "web", "template", "page.ejs"),
      {
        siteTitle: config.site.title,
        pageTitle: doc.title,
        sidebar: sidebarHtml,
        html: doc.html,
        isDev,
      },
      (err, html) => {
        if (err) {
          reject(err);
        } else {
          resolve(html);
        }
      }
    );
  });
}

function renderSidebar(sidebarItems: any[]): string {
  return renderSidebarItems(sidebarItems, 0);
}

function renderSidebarItems(items: any[], depth: number): string {
  if (items.length === 0) return "";

  // Calculate indentation for clean HTML output
  const indent = "  ".repeat(depth);
  let html = `${indent}<ul>\n`;

  for (const item of items) {
    html += `${indent}  <li>\n`;

    // Create link for each item
    html += `${indent}    <a href="${item.route}" class="sidebar-link">${item.title}</a>\n`;

    // Handle nested children recursively
    if (item.children && item.children.length > 0) {
      html += `${indent}    <div class="children">\n`;
      html += renderSidebarItems(item.children, depth + 2); // Recurse with increased depth
      html += `${indent}    </div>\n`;
    }

    html += `${indent}  </li>\n`;
  }

  html += `${indent}</ul>\n`;
  return html;
}

async function generate404Page(
  config: any,
  sidebarHtml: string,
  outDir: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Page Not Found - ${config.site.title}</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="container">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h1>${config.site.title}</h1>
          </div>
          <nav class="sidebar-nav">
            ${sidebarHtml}
          </nav>
        </aside>
        
        <main class="content">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for could not be found.</p>
          <p><a href="/">← Back to Home</a></p>
        </main>
      </div>
    </body>
    </html>
  `;

  // Write 404.html file - hosting platforms look for this name
  const outputPath = path.join(outDir, "404.html");
  fs.writeFileSync(outputPath, html);
  console.log("📄 Generated: 404.html");
}
